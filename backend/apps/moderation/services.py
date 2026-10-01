import base64
import hashlib
import os
import re
import unicodedata
from dataclasses import asdict, dataclass, field
from typing import Any

from django.conf import settings
from django.utils import timezone

from .models import ModerationAudit


@dataclass
class ModerationResult:
    allowed: bool
    decision: str = "approved"
    severity: str = "none"
    reasons: list[dict[str, Any]] = field(default_factory=list)
    blocked_fields: list[str] = field(default_factory=list)
    provider: str = "rule"
    confidence: float = 1.0
    audit_id: int | None = None
    content_hash: str = ""

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


@dataclass
class DomainPolicyResult:
    is_it: bool
    confidence: float
    matched_it_signals: list[str] = field(default_factory=list)
    non_it_signals: list[str] = field(default_factory=list)
    required_changes: list[dict[str, Any]] = field(default_factory=list)

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


class ModerationBlocked(ValueError):
    def __init__(self, result: ModerationResult, detail: str | None = None):
        self.result = result
        super().__init__(detail or _first_reason_message(result.reasons))

    def as_response(self) -> dict[str, Any]:
        return {
            "detail": str(self),
            "code": "unsafe_content",
            "moderation": self.result.to_dict(),
        }


class JobPublishBlocked(ValueError):
    def __init__(
        self,
        errors: list[dict[str, Any]],
        domain_result: DomainPolicyResult,
        moderation_result: ModerationResult,
    ):
        self.errors = errors
        self.domain_result = domain_result
        self.moderation_result = moderation_result
        super().__init__("Tin tuyển dụng chưa đủ điều kiện xuất bản.")

    def as_response(self) -> dict[str, Any]:
        return {
            "detail": str(self),
            "code": "job_policy_blocked",
            "allowed": False,
            "errors": self.errors,
            "domain_policy": self.domain_result.to_dict(),
            "moderation": self.moderation_result.to_dict(),
        }


IT_TERMS = {
    "ai",
    "android",
    "angular",
    "api",
    "backend",
    "ba",
    "business analyst",
    "cloud",
    "cntt",
    "cybersecurity",
    "data analyst",
    "data engineer",
    "data scientist",
    "database",
    "developer",
    "devops",
    "django",
    "docker",
    "engineer",
    "frontend",
    "full stack",
    "fullstack",
    "golang",
    "helpdesk",
    "ios",
    "it support",
    "java",
    "javascript",
    "kubernetes",
    "machine learning",
    "mobile",
    "network",
    "nodejs",
    "php",
    "product owner",
    "python",
    "qa",
    "react",
    "security",
    "software",
    "sre",
    "system admin",
    "tester",
    "typescript",
    "ui ux",
    "ux ui",
    "vue",
}

NON_IT_TERMS = {
    "accountant",
    "accounting",
    "ban hang",
    "bao ve",
    "cashier",
    "cham soc khach hang",
    "customer service",
    "giao vien",
    "hanh chinh",
    "human resources",
    "ke toan",
    "kinh doanh",
    "lai xe",
    "le tan",
    "marketing",
    "nhan su",
    "sales",
    "shipper",
    "tai chinh",
    "telesales",
    "thu ngan",
}

TEXT_POLICY_PATTERNS = [
    (
        "sexual_content",
        "high",
        r"\b(sex|porn|porno|xxx|nude|naked|khi[eê]u d[aâ]m|clip n[oó]ng|m[aạ]i d[aâ]m)\b",
        "Nội dung có yếu tố tình dục/không phù hợp.",
    ),
    (
        "hate_violence",
        "high",
        r"\b(kill|murder|terrorist|kh[uủ]ng b[oố]|gi[eế]t|b[aạ]o l[uự]c|th[aả]m s[aá]t)\b",
        "Nội dung có yếu tố bạo lực hoặc thù ghét.",
    ),
    (
        "self_harm",
        "high",
        r"\b(suicide|self harm|t[uự] s[aá]t|t[uự] h[aạ]i)\b",
        "Nội dung có yếu tố tự hại.",
    ),
    (
        "prompt_injection",
        "medium",
        r"\b(ignore previous|system prompt|developer message|jailbreak|b[oỏ] qua h[uư][oơ]ng d[aẫ]n|l[eệ]nh h[eệ] th[oố]ng)\b",
        "Nội dung có dấu hiệu prompt injection.",
    ),
    (
        "scam_or_fee",
        "high",
        r"\b(ph[ií] tuy[eể]n d[uụ]ng|[dđ][aặ]t c[oọ]c|chuy[eể]n kho[aả]n tr[uư][oớ]c|deposit required|recruitment fee)\b",
        "Nội dung có dấu hiệu thu phí/lừa đảo tuyển dụng.",
    ),
    (
        "spam_contact_bypass",
        "medium",
        r"\b(telegram|zalo|whatsapp|inbox ri[eê]ng|li[eê]n h[eệ] ri[eê]ng)\b",
        "Nội dung có dấu hiệu điều hướng liên hệ ngoài nền tảng.",
    ),
]

UNSAFE_FILE_NAME_PATTERNS = re.compile(
    r"(sex|porn|xxx|nude|nsfw|adult|khi[eê]u[-_ ]?d[aâ]m|clip[-_ ]?n[oó]ng)",
    re.IGNORECASE,
)

IMAGE_MIME_BY_SIGNATURE = {
    "image/jpeg": [b"\xff\xd8\xff"],
    "image/png": [b"\x89PNG\r\n\x1a\n"],
    "image/gif": [b"GIF87a", b"GIF89a"],
    "image/webp": [b"RIFF"],
}
ALLOWED_PUBLIC_IMAGE_MIMES = {"image/jpeg", "image/png", "image/gif", "image/webp"}
ALLOWED_IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".gif", ".webp"}
ALLOWED_GENERIC_EXTENSIONS = {
    ".csv",
    ".doc",
    ".docx",
    ".jpeg",
    ".jpg",
    ".mov",
    ".mp4",
    ".pdf",
    ".png",
    ".txt",
    ".webm",
    ".webp",
    ".xlsx",
}


def validate_job_for_publish(job, user=None, persist: bool = True) -> dict[str, Any]:
    content_hash = job_policy_hash(job)
    cached = _latest_approved_audit("job", job.id, "job_publish", content_hash)
    if cached:
        domain_result = DomainPolicyResult(
            is_it=True,
            confidence=1.0,
            matched_it_signals=["cached_approved"],
        )
        moderation_result = ModerationResult(
            allowed=True,
            decision="approved",
            provider=cached.provider,
            confidence=cached.confidence,
            audit_id=cached.id,
            content_hash=content_hash,
        )
        if persist:
            _set_job_policy_state(job, domain_result, moderation_result, [])
        return {
            "allowed": True,
            "errors": [],
            "domain_policy": domain_result.to_dict(),
            "moderation": moderation_result.to_dict(),
        }

    domain_result = evaluate_job_domain(job)
    moderation_result = moderate_job_text(job, user=user, content_hash=content_hash)
    domain_result.required_changes = _with_policy_suggestions(
        domain_result.required_changes
    )
    moderation_result.reasons = _with_policy_suggestions(moderation_result.reasons)
    errors = [*domain_result.required_changes, *moderation_result.reasons]
    allowed = domain_result.is_it and moderation_result.allowed

    if persist:
        _set_job_policy_state(job, domain_result, moderation_result, errors)

    audit = create_audit(
        entity_type="job",
        entity_id=job.id,
        purpose="job_publish",
        result=ModerationResult(
            allowed=allowed,
            decision="approved" if allowed else "rejected",
            severity=moderation_result.severity
            if moderation_result.severity != "none"
            else ("none" if allowed else "high"),
            reasons=errors,
            blocked_fields=_blocked_fields(errors),
            provider=moderation_result.provider,
            confidence=min(domain_result.confidence, moderation_result.confidence),
            content_hash=content_hash,
        ),
        user=user,
        metadata={
            "domain_policy": domain_result.to_dict(),
            "text_moderation": moderation_result.to_dict(),
        },
    )
    moderation_result.audit_id = audit.id

    return {
        "allowed": allowed,
        "errors": errors,
        "domain_policy": domain_result.to_dict(),
        "moderation": moderation_result.to_dict(),
    }


def ensure_job_can_publish(job, user=None) -> dict[str, Any]:
    readiness = validate_job_for_publish(job, user=user, persist=True)
    if readiness["allowed"]:
        return readiness
    raise JobPublishBlocked(
        readiness["errors"],
        DomainPolicyResult(**readiness["domain_policy"]),
        ModerationResult(**readiness["moderation"]),
    )


def evaluate_job_domain(job) -> DomainPolicyResult:
    category = getattr(job, "category", None)
    category_ok = bool(
        category
        and getattr(category, "is_active", True)
        and getattr(category, "domain", "it") == "it"
        and getattr(category, "is_publishable", True)
    )

    job_skills = list(job.required_skills.select_related("skill").all())
    approved_skills = []
    unapproved_skills = []
    for job_skill in job_skills:
        skill = getattr(job_skill, "skill", None)
        if not skill:
            continue
        skill_ok = (
            getattr(skill, "is_active", True)
            and getattr(skill, "is_verified", False)
            and getattr(skill, "domain", "it") == "it"
            and getattr(skill, "is_publishable", True)
        )
        if skill_ok:
            approved_skills.append(skill.name)
        else:
            unapproved_skills.append(skill.name)

    text_fields = {
        "title": job.title,
        "description": job.description,
        "requirements": job.requirements,
        "benefits": job.benefits,
        "category": getattr(category, "name", ""),
        "skills": " ".join(
            job_skill.skill.name
            for job_skill in job_skills
            if getattr(job_skill, "skill", None)
        ),
    }
    normalized_text = normalize_text(
        " ".join(str(value or "") for value in text_fields.values())
    )
    matched_it = _matched_terms(normalized_text, IT_TERMS)
    matched_non_it = _matched_terms(normalized_text, NON_IT_TERMS)

    required_changes = []
    if not category_ok:
        required_changes.append(
            {
                "code": "non_it_category",
                "field": "category_id",
                "message": "Danh mục phải thuộc taxonomy việc làm công nghệ thông tin và đang được phép đăng.",
            }
        )
    if not approved_skills:
        required_changes.append(
            {
                "code": "missing_verified_it_skill",
                "field": "skills",
                "message": "Tin tuyển dụng cần ít nhất một kỹ năng IT đã được duyệt.",
            }
        )
    if unapproved_skills:
        required_changes.append(
            {
                "code": "unapproved_skill",
                "field": "skills",
                "message": "Kỹ năng chưa duyệt hoặc ngoài IT chưa được dùng để xuất bản.",
                "skills": sorted(set(unapproved_skills)),
            }
        )
    if matched_non_it:
        required_changes.append(
            {
                "code": "non_it_job",
                "field": "title",
                "message": "JOBIO chỉ cho phép tuyển dụng việc làm công nghệ thông tin.",
                "signals": matched_non_it,
            }
        )
    if not matched_it and category_ok and approved_skills:
        required_changes.append(
            {
                "code": "weak_it_signal",
                "field": "description",
                "message": "Mô tả cần thể hiện rõ vai trò/kỹ năng công nghệ thông tin.",
            }
        )

    is_it = not required_changes
    confidence = 0.95 if is_it else 0.9
    return DomainPolicyResult(
        is_it=is_it,
        confidence=confidence,
        matched_it_signals=matched_it,
        non_it_signals=matched_non_it,
        required_changes=required_changes,
    )


def moderate_job_text(job, user=None, content_hash: str = "") -> ModerationResult:
    fields = {
        "title": job.title,
        "description": job.description,
        "requirements": job.requirements,
        "benefits": job.benefits,
    }
    return moderate_text_fields(
        fields=fields,
        purpose="job_publish",
        entity_type="job",
        entity_id=job.id,
        user=user,
        content_hash=content_hash,
        fail_closed=True,
    )


def moderate_text_fields(
    fields: dict[str, Any],
    purpose: str,
    entity_type: str,
    entity_id: int | None = None,
    user=None,
    content_hash: str = "",
    fail_closed: bool = False,
) -> ModerationResult:
    if not content_hash:
        content_hash = hash_text(
            "\n".join(f"{key}:{value or ''}" for key, value in sorted(fields.items()))
        )

    if not getattr(settings, "MODERATION_ENABLED", True):
        return ModerationResult(
            allowed=True,
            decision="skipped",
            provider="disabled",
            confidence=1.0,
            content_hash=content_hash,
        )

    rule_result = RuleModerationProvider().moderate_text(fields, content_hash)
    provider = getattr(settings, "MODERATION_PROVIDER", "rule")
    if provider == "openai":
        openai_result = OpenAIModerationProvider().moderate_text(fields, content_hash)
        result = _merge_moderation_results(rule_result, openai_result, fail_closed)
    else:
        result = rule_result

    if result.decision == "error" and fail_closed:
        result.allowed = False
        result.decision = "rejected"
        result.severity = "high"
        result.reasons.append(
            {
                "code": "moderation_provider_error",
                "field": None,
                "message": "Không thể kiểm duyệt nội dung. Vui lòng thử lại sau.",
            }
        )

    audit = create_audit(
        entity_type=entity_type,
        entity_id=entity_id,
        purpose=purpose,
        result=result,
        user=user,
        metadata={"fields": list(fields.keys())},
    )
    result.audit_id = audit.id
    return result


def validate_upload_file(
    file,
    purpose: str = "file_upload",
    max_size_mb: int = 10,
    entity_type: str | None = None,
    entity_id: int | None = None,
    user=None,
    is_public: bool = False,
) -> ModerationResult:
    if not file:
        raise ModerationBlocked(
            ModerationResult(
                allowed=False,
                decision="rejected",
                severity="high",
                reasons=[
                    {
                        "code": "missing_file",
                        "field": "file",
                        "message": "File is not provided",
                    }
                ],
                blocked_fields=["file"],
            )
        )

    result = _validate_file_rules(file, purpose, max_size_mb, is_public)
    if result.allowed and _is_image_purpose(purpose):
        result = _merge_moderation_results(
            result,
            OpenAIModerationProvider().moderate_image(file, purpose),
            fail_closed=getattr(settings, "MODERATION_PROVIDER", "rule") == "openai",
        )

    audit = create_audit(
        entity_type=entity_type or "file",
        entity_id=entity_id,
        purpose=purpose,
        result=result,
        user=user,
        metadata={
            "filename": getattr(file, "name", ""),
            "content_type": getattr(file, "content_type", ""),
            "size": getattr(file, "size", None),
            "is_public": is_public,
        },
    )
    result.audit_id = audit.id
    if not result.allowed:
        raise ModerationBlocked(result)
    return result


class RuleModerationProvider:
    provider = "rule"

    def moderate_text(
        self, fields: dict[str, Any], content_hash: str = ""
    ) -> ModerationResult:
        reasons = []
        blocked_fields = set()
        highest_severity = "none"

        for field_name, value in fields.items():
            text = str(value or "")
            normalized = normalize_text(text)
            for code, severity, pattern, message in TEXT_POLICY_PATTERNS:
                if re.search(pattern, normalized, flags=re.IGNORECASE):
                    blocked_fields.add(field_name)
                    highest_severity = _max_severity(highest_severity, severity)
                    reasons.append(
                        {
                            "code": code,
                            "field": field_name,
                            "message": message,
                        }
                    )

        allowed = not reasons
        decision = (
            "approved"
            if allowed
            else (
                "rejected"
                if highest_severity in {"high", "critical"}
                else "needs_review"
            )
        )
        return ModerationResult(
            allowed=allowed,
            decision=decision,
            severity=highest_severity,
            reasons=reasons,
            blocked_fields=sorted(blocked_fields),
            provider=self.provider,
            confidence=0.94 if reasons else 0.99,
            content_hash=content_hash,
        )


class OpenAIModerationProvider:
    provider = "openai"

    def enabled(self) -> bool:
        return (
            getattr(settings, "MODERATION_ENABLED", True)
            and getattr(settings, "MODERATION_PROVIDER", "rule") == "openai"
            and bool(getattr(settings, "OPENAI_API_KEY", "") or "")
        )

    def moderate_text(
        self, fields: dict[str, Any], content_hash: str = ""
    ) -> ModerationResult:
        if not self.enabled():
            return ModerationResult(
                allowed=True,
                decision="skipped",
                provider=self.provider,
                confidence=0.0,
                content_hash=content_hash,
            )
        try:
            from openai import OpenAI

            client = OpenAI(api_key=getattr(settings, "OPENAI_API_KEY"))
            text = "\n".join(
                f"{key}: {strip_html(str(value or ''))}"
                for key, value in fields.items()
            )[:12000]
            response = client.moderations.create(
                model=getattr(
                    settings, "MODERATION_TEXT_MODEL", "omni-moderation-latest"
                ),
                input=text,
            )
            item = response.results[0]
            flagged = bool(getattr(item, "flagged", False))
            reasons = []
            if flagged:
                categories = getattr(item, "categories", None)
                if categories and hasattr(categories, "model_dump"):
                    flagged_categories = [
                        key for key, value in categories.model_dump().items() if value
                    ]
                else:
                    flagged_categories = ["openai_flagged"]
                reasons.append(
                    {
                        "code": "openai_moderation_flag",
                        "field": None,
                        "message": "Nội dung bị hệ thống kiểm duyệt đánh dấu không an toàn.",
                        "categories": flagged_categories,
                    }
                )
            return ModerationResult(
                allowed=not flagged,
                decision="rejected" if flagged else "approved",
                severity="high" if flagged else "none",
                reasons=reasons,
                blocked_fields=[],
                provider=self.provider,
                confidence=0.95 if flagged else 0.9,
                content_hash=content_hash,
            )
        except Exception as exc:
            return ModerationResult(
                allowed=False,
                decision="error",
                severity="medium",
                reasons=[
                    {
                        "code": "moderation_provider_error",
                        "field": None,
                        "message": str(exc)[:200],
                    }
                ],
                provider=self.provider,
                confidence=0.0,
                content_hash=content_hash,
            )

    def moderate_image(self, file, purpose: str = "image_upload") -> ModerationResult:
        if not self.enabled():
            return ModerationResult(
                allowed=True,
                decision="skipped",
                provider=self.provider,
                confidence=0.0,
            )
        try:
            from openai import OpenAI

            content = _read_file_bytes(file)
            mime = getattr(file, "content_type", "") or _detect_mime(content)
            data_url = f"data:{mime};base64,{base64.b64encode(content).decode('ascii')}"
            client = OpenAI(api_key=getattr(settings, "OPENAI_API_KEY"))
            response = client.moderations.create(
                model=getattr(
                    settings, "MODERATION_IMAGE_MODEL", "omni-moderation-latest"
                ),
                input=[{"type": "image_url", "image_url": {"url": data_url}}],
            )
            item = response.results[0]
            flagged = bool(getattr(item, "flagged", False))
            return ModerationResult(
                allowed=not flagged,
                decision="rejected" if flagged else "approved",
                severity="high" if flagged else "none",
                reasons=[
                    {
                        "code": "unsafe_image",
                        "field": "file",
                        "message": "Ảnh upload không đạt chính sách an toàn.",
                    }
                ]
                if flagged
                else [],
                blocked_fields=["file"] if flagged else [],
                provider=self.provider,
                confidence=0.95 if flagged else 0.9,
            )
        except Exception as exc:
            return ModerationResult(
                allowed=False,
                decision="error",
                severity="medium",
                reasons=[
                    {
                        "code": "moderation_provider_error",
                        "field": "file",
                        "message": str(exc)[:200],
                    }
                ],
                blocked_fields=["file"],
                provider=self.provider,
                confidence=0.0,
            )


def create_audit(
    entity_type: str,
    entity_id: int | None,
    purpose: str,
    result: ModerationResult,
    user=None,
    metadata: dict[str, Any] | None = None,
) -> ModerationAudit:
    return ModerationAudit.objects.create(
        entity_type=entity_type,
        entity_id=entity_id,
        purpose=purpose,
        decision=result.decision,
        severity=result.severity,
        reasons=result.reasons,
        blocked_fields=result.blocked_fields,
        provider=result.provider,
        confidence=result.confidence,
        content_hash=result.content_hash,
        metadata=metadata or {},
        created_by=user if getattr(user, "is_authenticated", False) else None,
    )


def job_policy_hash(job) -> str:
    skill_parts = []
    for job_skill in job.required_skills.select_related("skill").all():
        skill = getattr(job_skill, "skill", None)
        if not skill:
            continue
        skill_parts.append(
            ":".join(
                [
                    str(skill.id),
                    str(skill.name),
                    str(getattr(skill, "domain", "it")),
                    str(getattr(skill, "is_verified", False)),
                    str(getattr(skill, "is_publishable", True)),
                ]
            )
        )
    parts = [
        str(job.title or ""),
        str(job.description or ""),
        str(job.requirements or ""),
        str(job.benefits or ""),
        str(job.category_id or ""),
        str(getattr(job.category, "domain", ""))
        if getattr(job, "category", None)
        else "",
        str(getattr(job.category, "is_active", ""))
        if getattr(job, "category", None)
        else "",
        str(getattr(job.category, "is_publishable", ""))
        if getattr(job, "category", None)
        else "",
        "|".join(sorted(skill_parts)),
    ]
    return hash_text("\n".join(parts))


def hash_text(text: str) -> str:
    return hashlib.sha256(str(text or "").encode("utf-8")).hexdigest()


def normalize_text(value: str) -> str:
    text = str(value or "").lower()
    text = unicodedata.normalize("NFKD", text)
    text = "".join(ch for ch in text if not unicodedata.combining(ch))
    return re.sub(r"\s+", " ", text)


def strip_html(value: str) -> str:
    return re.sub(r"<[^>]+>", " ", value or "")


def _validate_file_rules(
    file, purpose: str, max_size_mb: int, is_public: bool
) -> ModerationResult:
    reasons = []
    blocked_fields = set()
    content = _read_file_bytes(file, limit=512 * 1024)
    full_hash = hash_text(content.hex())
    filename = getattr(file, "name", "") or ""
    ext = os.path.splitext(filename)[1].lower()
    declared_mime = getattr(file, "content_type", "") or ""
    detected_mime = _detect_mime(content)
    max_bytes = max_size_mb * 1024 * 1024

    if getattr(file, "size", 0) > max_bytes:
        reasons.append(
            {
                "code": "file_too_large",
                "field": "file",
                "message": f"File size excess max size. MAX {max_size_mb}MB",
            }
        )
        blocked_fields.add("file")

    if UNSAFE_FILE_NAME_PATTERNS.search(filename) or UNSAFE_FILE_NAME_PATTERNS.search(
        content[:4096].decode("utf-8", errors="ignore")
    ):
        reasons.append(
            {
                "code": "unsafe_image",
                "field": "file",
                "message": "File upload có dấu hiệu nội dung người lớn/không phù hợp.",
            }
        )
        blocked_fields.add("file")

    if _is_svg(content, declared_mime, ext):
        reasons.append(
            {
                "code": "scriptable_image_rejected",
                "field": "file",
                "message": "SVG/scriptable image không được phép cho avatar/logo/banner/public media.",
            }
        )
        blocked_fields.add("file")

    is_generic_image = (
        ext in ALLOWED_IMAGE_EXTENSIONS
        or declared_mime in ALLOWED_PUBLIC_IMAGE_MIMES
        or detected_mime in ALLOWED_PUBLIC_IMAGE_MIMES
    )
    is_pdf_like = (
        ext == ".pdf"
        or declared_mime == "application/pdf"
        or detected_mime == "application/pdf"
    )

    if _is_image_purpose(purpose) or is_generic_image:
        if ext not in ALLOWED_IMAGE_EXTENSIONS:
            reasons.append(
                {
                    "code": "unsupported_image_extension",
                    "field": "file",
                    "message": "Only JPEG, PNG, GIF, WEBP are allowed",
                }
            )
            blocked_fields.add("file")
        if declared_mime not in ALLOWED_PUBLIC_IMAGE_MIMES:
            reasons.append(
                {
                    "code": "unsupported_image_mime",
                    "field": "file",
                    "message": "File type is not allowed. Only JPEG, PNG, GIF, WEBP are allowed",
                }
            )
            blocked_fields.add("file")
        if detected_mime not in ALLOWED_PUBLIC_IMAGE_MIMES:
            reasons.append(
                {
                    "code": "fake_mime",
                    "field": "file",
                    "message": "File content does not match an allowed image type.",
                }
            )
            blocked_fields.add("file")
        elif detected_mime == "image/webp" and not _looks_like_webp(content):
            reasons.append(
                {
                    "code": "fake_mime",
                    "field": "file",
                    "message": "File content does not match an allowed WEBP image.",
                }
            )
            blocked_fields.add("file")
        else:
            pil_error = _verify_image_with_pillow(file)
            if pil_error:
                reasons.append(
                    {
                        "code": "invalid_image",
                        "field": "file",
                        "message": pil_error,
                    }
                )
                blocked_fields.add("file")
    else:
        if is_pdf_like:
            if ext != ".pdf":
                reasons.append(
                    {
                        "code": "unsupported_pdf_extension",
                        "field": "file",
                        "message": "PDF uploads must use a .pdf extension.",
                    }
                )
                blocked_fields.add("file")
            if detected_mime != "application/pdf":
                reasons.append(
                    {
                        "code": "invalid_pdf_magic",
                        "field": "file",
                        "message": "File content does not match a valid PDF.",
                    }
                )
                blocked_fields.add("file")
        if ext and ext not in ALLOWED_GENERIC_EXTENSIONS:
            reasons.append(
                {
                    "code": "unsupported_file_extension",
                    "field": "file",
                    "message": "File extension is not allowed.",
                }
            )
            blocked_fields.add("file")
        if (
            is_public
            and detected_mime == "unknown"
            and declared_mime
            not in {
                "application/msword",
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                "text/plain",
                "text/csv",
                "video/mp4",
                "video/quicktime",
                "video/webm",
            }
        ):
            reasons.append(
                {
                    "code": "unsafe_public_file",
                    "field": "file",
                    "message": "Public upload requires a recognized safe file type.",
                }
            )
            blocked_fields.add("file")

    allowed = not reasons
    return ModerationResult(
        allowed=allowed,
        decision="approved" if allowed else "rejected",
        severity="none" if allowed else "high",
        reasons=reasons,
        blocked_fields=sorted(blocked_fields),
        provider="rule",
        confidence=0.99 if allowed else 0.95,
        content_hash=full_hash,
    )


def _set_job_policy_state(job, domain_result, moderation_result, errors):
    from apps.recruitment.jobs.models import Job

    job.domain_status = (
        Job.DomainStatus.IT_APPROVED
        if domain_result.is_it
        else (
            Job.DomainStatus.NON_IT
            if domain_result.non_it_signals
            else Job.DomainStatus.NEEDS_REVIEW
        )
    )
    job.moderation_status = (
        Job.ModerationStatus.APPROVED
        if moderation_result.allowed
        else (
            Job.ModerationStatus.REJECTED
            if moderation_result.decision == "rejected"
            else Job.ModerationStatus.NEEDS_REVIEW
        )
    )
    job.moderation_reasons = errors
    job.last_moderated_at = timezone.now()
    job.save(
        update_fields=[
            "domain_status",
            "moderation_status",
            "moderation_reasons",
            "last_moderated_at",
            "updated_at",
        ]
    )


def _latest_approved_audit(entity_type, entity_id, purpose, content_hash):
    if not content_hash:
        return None
    return (
        ModerationAudit.objects.filter(
            entity_type=entity_type,
            entity_id=entity_id,
            purpose=purpose,
            content_hash=content_hash,
            decision=ModerationAudit.Decision.APPROVED,
        )
        .order_by("-created_at")
        .first()
    )


def _matched_terms(text: str, terms: set[str]) -> list[str]:
    matches = []
    for term in sorted(terms):
        pattern = r"(?<![a-z0-9])" + re.escape(term) + r"(?![a-z0-9])"
        if re.search(pattern, text):
            matches.append(term)
    return matches


def _merge_moderation_results(
    left: ModerationResult, right: ModerationResult, fail_closed: bool
) -> ModerationResult:
    if right.decision == "skipped":
        return left
    reasons = [*left.reasons, *right.reasons]
    blocked_fields = sorted(set(left.blocked_fields) | set(right.blocked_fields))
    severity = _max_severity(left.severity, right.severity)
    has_error = left.decision == "error" or right.decision == "error"
    allowed = left.allowed and right.allowed and not (has_error and fail_closed)
    if allowed:
        decision = "approved"
    elif has_error and not fail_closed:
        decision = "needs_review"
    elif severity in {"high", "critical"} or fail_closed:
        decision = "rejected"
    else:
        decision = "needs_review"
    return ModerationResult(
        allowed=allowed,
        decision=decision,
        severity=severity,
        reasons=reasons,
        blocked_fields=blocked_fields,
        provider="+".join(
            sorted(
                {provider for provider in [left.provider, right.provider] if provider}
            )
        ),
        confidence=max(left.confidence, right.confidence),
        content_hash=left.content_hash or right.content_hash,
    )


def _blocked_fields(errors: list[dict[str, Any]]) -> list[str]:
    return sorted(
        {str(error.get("field")) for error in errors if error.get("field") is not None}
    )


def _first_reason_message(reasons: list[dict[str, Any]]) -> str:
    if not reasons:
        return "Nội dung không đạt chính sách an toàn."
    return reasons[0].get("message") or "Nội dung không đạt chính sách an toàn."


def _with_policy_suggestions(reasons: list[dict[str, Any]]) -> list[dict[str, Any]]:
    enriched = []
    for reason in reasons:
        next_reason = {**reason}
        next_reason["suggestion"] = next_reason.get("suggestion") or (
            _policy_fix_suggestion(next_reason)
        )
        enriched.append(next_reason)
    return enriched


def _policy_fix_suggestion(reason: dict[str, Any]) -> str:
    code = str(reason.get("code") or "")
    field = str(reason.get("field") or "")
    skills = reason.get("skills") or []

    if code == "non_it_category":
        return (
            "Chọn lại danh mục thuộc nhóm Công nghệ thông tin và đang được phép đăng."
        )
    if code == "missing_verified_it_skill":
        return (
            "Thêm ít nhất một kỹ năng IT đã được duyệt, ví dụ Python, React, "
            "Java, DevOps, Data hoặc QA."
        )
    if code == "unapproved_skill":
        skill_text = ", ".join(str(skill) for skill in skills[:4])
        if skill_text:
            return f"Thay hoặc bổ sung kỹ năng IT đã duyệt thay cho: {skill_text}."
        return "Thay kỹ năng chưa duyệt bằng kỹ năng IT đã có trong taxonomy."
    if code == "non_it_job":
        return (
            "Chỉnh tiêu đề, mô tả, yêu cầu và kỹ năng để thể hiện rõ đây là "
            "vai trò IT; bỏ các tín hiệu ngoài IT như sales, kế toán, marketing."
        )
    if code == "weak_it_signal" or field == "description":
        return (
            "Bổ sung trách nhiệm kỹ thuật cụ thể như hệ thống, API, dữ liệu, "
            "hạ tầng, testing, bảo mật hoặc tech stack sẽ sử dụng."
        )
    if code in {"scam_or_fee", "spam_contact_bypass"}:
        return (
            "Gỡ nội dung thu phí, đặt cọc hoặc điều hướng liên hệ ngoài nền tảng; "
            "giữ toàn bộ quy trình tuyển dụng trong JOBIO."
        )
    if code in {"sexual_content", "hate_violence", "self_harm"}:
        return "Loại bỏ nội dung không an toàn rồi gửi kiểm tra lại."
    if code == "prompt_injection":
        return "Xóa các câu lệnh điều khiển hệ thống hoặc yêu cầu bỏ qua chính sách."
    if code in {"moderation_provider_error", "openai_moderation_flag"}:
        return (
            "Rà soát các phần bị đánh dấu, viết lại bằng ngôn ngữ tuyển dụng "
            "trung lập rồi thử xuất bản lại."
        )
    return "Điều chỉnh nội dung theo lý do bên trên rồi kiểm tra lại trước khi đăng."


def _max_severity(left: str, right: str) -> str:
    order = {"none": 0, "low": 1, "medium": 2, "high": 3, "critical": 4}
    return left if order.get(left, 0) >= order.get(right, 0) else right


def _read_file_bytes(file, limit: int | None = None) -> bytes:
    position = None
    if hasattr(file, "tell"):
        try:
            position = file.tell()
        except Exception:
            position = None
    if hasattr(file, "seek"):
        file.seek(0)
    content = file.read(limit) if limit else file.read()
    if hasattr(file, "seek"):
        file.seek(position or 0)
    return content or b""


def _detect_mime(content: bytes) -> str:
    if content.startswith(b"%PDF-"):
        return "application/pdf"
    if _is_svg(content, "", ""):
        return "image/svg+xml"
    for mime, signatures in IMAGE_MIME_BY_SIGNATURE.items():
        if any(content.startswith(signature) for signature in signatures):
            return mime
    if content.startswith(b"PK\x03\x04"):
        return "application/zip"
    return "unknown"


def _looks_like_webp(content: bytes) -> bool:
    return (
        len(content) >= 12 and content.startswith(b"RIFF") and content[8:12] == b"WEBP"
    )


def _is_svg(content: bytes, declared_mime: str, ext: str) -> bool:
    if declared_mime == "image/svg+xml" or ext == ".svg":
        return True
    prefix = content[:512].lstrip().lower()
    return prefix.startswith(b"<svg") or (
        prefix.startswith(b"<?xml") and b"<svg" in prefix
    )


def _is_image_purpose(purpose: str) -> bool:
    return purpose in {
        "avatar",
        "company_logo",
        "company_banner",
        "company_media",
        "blog_image",
        "image_upload",
    }


def _verify_image_with_pillow(file) -> str:
    try:
        from PIL import Image

        if hasattr(file, "seek"):
            file.seek(0)
        with Image.open(file) as image:
            image.verify()
            width, height = image.size
        if hasattr(file, "seek"):
            file.seek(0)
        if width > 8000 or height > 8000:
            return "Image dimensions are too large."
        return ""
    except Exception:
        if hasattr(file, "seek"):
            file.seek(0)
        return "Invalid image file."
