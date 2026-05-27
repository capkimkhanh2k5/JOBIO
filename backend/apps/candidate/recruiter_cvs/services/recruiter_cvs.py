import html
import json
import logging
import os
import re
import time
import uuid
from urllib.parse import urlparse

import cloudinary.utils
from django.core.files.base import ContentFile
from django.conf import settings
from django.db import transaction
from django.template.loader import render_to_string
from django.utils import timezone

from ..models import RecruiterCV

from apps.candidate.cv_templates.models import CVTemplate
from apps.candidate.recruiter_skills.models import RecruiterSkill
from apps.candidate.recruiter_education.models import RecruiterEducation
from apps.candidate.recruiter_experience.models import RecruiterExperience
from apps.candidate.recruiter_certifications.models import RecruiterCertification
from apps.candidate.recruiter_projects.models import RecruiterProject
from apps.candidate.recruiter_languages.models import RecruiterLanguage
from apps.company.companies.utils.cloudinary import save_raw_file

logger = logging.getLogger(__name__)

CV_DIRECT_UPLOAD_FOLDER = "Jobio/CVs"
CV_DIRECT_UPLOAD_PUBLIC_ID_RE = re.compile(
    r"^Jobio/CVs/cv_upload_(?P<recruiter_id>\d+)_[a-f0-9]{32}(\.pdf)?$"
)


@transaction.atomic
def set_cv_as_default(cv: RecruiterCV) -> RecruiterCV:
    """
    Äáº·t CV lÃ m máº·c Ä‘á»‹nh (reset cÃ¡c CV khÃ¡c).
    """
    RecruiterCV.objects.filter(recruiter=cv.recruiter, is_default=True).exclude(
        id=cv.id
    ).update(is_default=False)

    cv.is_default = True
    cv.save()
    return cv


def build_cv_data_from_profile(recruiter) -> dict:
    """
    Build cv_data dict from recruiter profile.
    Used for auto-populating new CVs and for preview rendering.
    """
    skills_data = []
    for rs in RecruiterSkill.objects.filter(recruiter=recruiter).select_related(
        "skill"
    ):
        skills_data.append(
            {
                "name": rs.skill.name,
                "proficiency_level": rs.proficiency_level,
                "years_of_experience": rs.years_of_experience or 0,
            }
        )

    education_data = []
    for edu in RecruiterEducation.objects.filter(recruiter=recruiter).order_by(
        "-start_date"
    ):
        education_data.append(
            {
                "school_name": edu.school_name,
                "degree": edu.degree or "",
                "field_of_study": edu.field_of_study or "",
                "start_date": edu.start_date.isoformat() if edu.start_date else None,
                "end_date": edu.end_date.isoformat() if edu.end_date else None,
                "is_current": edu.is_current,
                "description": edu.description or "",
            }
        )

    experience_data = []
    for exp in RecruiterExperience.objects.filter(recruiter=recruiter).order_by(
        "-start_date"
    ):
        experience_data.append(
            {
                "company_name": exp.company_name,
                "position": exp.job_title,
                "job_title": exp.job_title,
                "start_date": exp.start_date.isoformat() if exp.start_date else None,
                "end_date": exp.end_date.isoformat() if exp.end_date else None,
                "is_current": exp.is_current,
                "description": exp.description or "",
            }
        )

    certifications_data = []
    for cert in RecruiterCertification.objects.filter(recruiter=recruiter).order_by(
        "-issue_date"
    ):
        certifications_data.append(
            {
                "name": cert.certification_name,
                "issuing_organization": cert.issuing_organization or "",
                "issue_date": cert.issue_date.isoformat() if cert.issue_date else None,
                "expiry_date": cert.expiry_date.isoformat()
                if cert.expiry_date
                else None,
                "credential_id": cert.credential_id or "",
                "credential_url": cert.credential_url or "",
            }
        )

    projects_data = []
    for proj in RecruiterProject.objects.filter(recruiter=recruiter).order_by(
        "-start_date"
    ):
        technologies = []
        if proj.technologies_used:
            if isinstance(proj.technologies_used, list):
                technologies = proj.technologies_used
            else:
                technologies = [
                    t.strip()
                    for t in str(proj.technologies_used).split(",")
                    if t.strip()
                ]
        projects_data.append(
            {
                "name": proj.project_name,
                "description": proj.description or "",
                "project_url": proj.project_url or "",
                "start_date": proj.start_date.isoformat() if proj.start_date else None,
                "end_date": proj.end_date.isoformat() if proj.end_date else None,
                "technologies": technologies,
            }
        )

    languages_data = []
    for lang in RecruiterLanguage.objects.filter(recruiter=recruiter).select_related(
        "language"
    ):
        languages_data.append(
            {
                "name": lang.language.language_name if lang.language else "",
                "proficiency_level": lang.proficiency_level,
            }
        )

    return {
        "personal": {
            "full_name": recruiter.user.full_name,
            "email": recruiter.user.email,
            "phone": getattr(recruiter.user, "phone_number", "") or "",
            "current_position": recruiter.current_position or "",
            "bio": recruiter.bio or "",
            "avatar_url": getattr(recruiter.user, "avatar_url", "") or "",
            "years_of_experience": recruiter.years_of_experience or 0,
        },
        "location": {},
        "links": {
            "linkedin": recruiter.linkedin_url or "",
            "github": recruiter.github_url or "",
            "portfolio": recruiter.portfolio_url or "",
            "facebook": recruiter.facebook_url or "",
        },
        "skills": skills_data,
        "education": education_data,
        "experience": experience_data,
        "certifications": certifications_data,
        "projects": projects_data,
        "languages": languages_data,
    }


def render_cv_to_html(cv: RecruiterCV) -> str:
    """
    Render CV data to HTML string using the template associated with the CV.
    Falls back to modern.html if no template is set.
    """
    # Determine which HTML template file to use
    if cv.template and cv.template.file_name:
        template_name = f"cv/{cv.template.file_name}"
    else:
        template_name = "cv/modern.html"

    context = {"data": cv.cv_data, "cv": cv}

    html_string = render_to_string(template_name, context)
    return html_string


# Mapping from browser template filename â†’ WeasyPrint-compatible PDF template
_PDF_TEMPLATE_MAP = {
    "modern.html": "cv/pdf/modern_pdf.html",
    "ATS_Prime.html": "cv/pdf/ATS_Prime_pdf.html",
    "editorialBold.html": "cv/pdf/editorialBold_pdf.html",
    "modernHybird.html": "cv/pdf/modernHybird_pdf.html",
    "modernHybird2.html": "cv/pdf/modernHybird2_pdf.html",
    "modernLuxury.html": "cv/pdf/modernLuxury_pdf.html",
}


def render_cv_to_pdf_html(cv: RecruiterCV) -> str:
    """
    Render CV data to a WeasyPrint-compatible HTML string.
    Uses dedicated PDF templates (no Tailwind CDN, no Google Fonts CDN).
    Falls back to the browser template if no PDF template exists.
    """
    file_name = cv.template.file_name if cv.template else None

    # Use dedicated PDF template if available
    if file_name and file_name in _PDF_TEMPLATE_MAP:
        template_name = _PDF_TEMPLATE_MAP[file_name]
    elif file_name:
        # Fallback: try pdf/<name>_pdf.html
        pdf_name = file_name.replace(".html", "_pdf.html")
        template_name = f"cv/pdf/{pdf_name}"
        # Check if it exists, otherwise use browser template
        from django.template.loader import get_template
        from django.template import TemplateDoesNotExist

        try:
            get_template(template_name)
        except TemplateDoesNotExist:
            template_name = f"cv/{file_name}"
    else:
        template_name = "cv/modern.html"

    context = {"data": cv.cv_data, "cv": cv}
    return render_to_string(template_name, context)


def generate_cv_download(cv: RecruiterCV, force_regenerate: bool = False) -> dict:
    """
    Generate PDF for CV using WeasyPrint.
    Uses dedicated WeasyPrint-compatible PDF templates (no Tailwind CDN, no Google Fonts CDN).
    Uploads to Cloudinary and returns URL.
    """
    pdf_is_current = (
        not cv.template_id
        or (
            cv.pdf_generated_at is not None
            and cv.updated_at is not None
            and cv.updated_at <= cv.pdf_generated_at
        )
    )

    # Use cached URL if exists, not forced, and the PDF still reflects current CV data.
    if cv.cv_url and not force_regenerate and pdf_is_current:
        cv.download_count += 1
        cv.save(update_fields=["download_count"])
        return {
            "download_url": cv.cv_url,
            "format": "pdf",
            "message": "Retrieved from cache",
            "pdf_generated_at": cv.pdf_generated_at,
        }

    try:
        import weasyprint

        # Use PDF-specific template -- no external CDN dependencies
        html_string = render_cv_to_pdf_html(cv)
        pdf_bytes = weasyprint.HTML(string=html_string).write_pdf()
        content_file = ContentFile(pdf_bytes, name=f"{cv.cv_name}.pdf")
        try:
            cv_url = save_raw_file("CVs", content_file, f"cv_{cv.id}")
        except Exception:
            cv_url = f"/media/generated/cv_{cv.id}.pdf"
    except Exception:
        cv_url = f"/media/generated/cv_{cv.id}.pdf"

    cv.cv_url = cv_url
    cv.pdf_generated_at = timezone.now()
    cv.download_count += 1
    try:
        cv.save(update_fields=["cv_url", "pdf_generated_at", "download_count"])
    except Exception:
        _delete_orphan_cloudinary_file(cv_url, "raw")
        raise

    return {
        "download_url": cv_url,
        "format": "pdf",
        "message": "Generated new PDF",
        "pdf_generated_at": cv.pdf_generated_at,
    }


def generate_cv_preview(cv: RecruiterCV) -> dict:
    """
    Return HTML for preview using the CV's associated template.
    For CV_Upload (template=None, cv_url set), returns an HTML page embedding the PDF.
    """
    cv.view_count += 1
    cv.save(update_fields=["view_count"])

    try:
        html_content = render_cv_to_html(cv)
    except Exception:
        safe_cv_data = html.escape(
            json.dumps(cv.cv_data, ensure_ascii=False, default=str)
        )
        html_content = f"<html><body><pre>{safe_cv_data}</pre></body></html>"

    return {"html_content": html_content, "template_id": cv.template_id}


def create_cv_direct_upload_signature(recruiter, cv_name: str = None) -> dict:
    """
    Create signed Cloudinary raw-upload params after recruiter ownership is verified.
    The client uploads directly to Cloudinary, then calls finalize to create CV.
    """
    cloud_name, api_key, api_secret = _cloudinary_credentials()
    timestamp = int(time.time())
    public_id = f"cv_upload_{recruiter.id}_{uuid.uuid4().hex}"
    params_to_sign = {
        "allowed_formats": "pdf",
        "folder": CV_DIRECT_UPLOAD_FOLDER,
        "public_id": public_id,
        "timestamp": timestamp,
        "overwrite": "false",
    }
    signature = cloudinary.utils.api_sign_request(params_to_sign, api_secret)

    return {
        "cloud_name": cloud_name,
        "api_key": api_key,
        "timestamp": timestamp,
        "signature": signature,
        "folder": CV_DIRECT_UPLOAD_FOLDER,
        "public_id": public_id,
        "resource_type": "raw",
        "upload_url": f"https://api.cloudinary.com/v1_1/{cloud_name}/raw/upload",
        "max_bytes": getattr(settings, "CV_UPLOAD_MAX_BYTES", 10 * 1024 * 1024),
        "max_pages": getattr(settings, "CV_PDF_MAX_PAGES", 3),
        "cv_name": _normalize_cv_name(cv_name or public_id),
        "overwrite": "false",
        "allowed_formats": "pdf",
    }


@transaction.atomic
def create_cv_from_direct_upload(
    recruiter, upload_data: dict, cv_name: str = None
) -> RecruiterCV:
    """Validate a signed direct Cloudinary upload, then create CV_Upload."""
    from apps.candidate.recruiter_cvs.tasks import _download_pdf

    public_id = str(upload_data.get("public_id") or "").strip()
    secure_url = str(upload_data.get("secure_url") or "").strip()
    resource_type = str(upload_data.get("resource_type") or "").strip()
    byte_count = upload_data.get("bytes")

    _validate_direct_upload_metadata(
        recruiter, public_id, secure_url, resource_type, byte_count
    )
    try:
        pdf_bytes = _download_pdf(secure_url)

        cv = RecruiterCV.objects.create(
            recruiter=recruiter,
            template=None,
            cv_name=_normalize_cv_name(cv_name or public_id.rsplit("/", 1)[-1]),
            cv_data={},
            cv_url=secure_url,
            pdf_generated_at=timezone.now(),
            is_default=False,
            is_public=True,
        )
    except Exception:
        _delete_orphan_cloudinary_file(secure_url, "raw")
        raise

    transaction.on_commit(lambda: _dispatch_cv_parse(cv.id))
    logger.debug(
        "Validated direct CV upload: cv_id=%s, bytes=%d", cv.id, len(pdf_bytes)
    )
    return cv


def _cloudinary_credentials() -> tuple[str, str, str]:
    storage = getattr(settings, "CLOUDINARY_STORAGE", {}) or {}
    cloud_name = storage.get("CLOUD_NAME") or os.getenv("CLOUDINARY_CLOUD_NAME")
    api_key = storage.get("API_KEY") or os.getenv("CLOUDINARY_API_KEY")
    api_secret = storage.get("API_SECRET") or os.getenv("CLOUDINARY_API_SECRET")

    if not cloud_name or not api_key or not api_secret:
        raise ValueError("cloudinary_not_configured")
    return cloud_name, api_key, api_secret


def _normalize_cv_name(cv_name: str) -> str:
    normalized = os.path.basename(str(cv_name or "").strip())
    if normalized.lower().endswith(".pdf"):
        normalized = normalized[:-4]
    normalized = re.sub(r"[\x00-\x1f\x7f/\\]+", "", normalized).strip()
    return (normalized or "Uploaded CV")[:255]


def _validate_direct_upload_metadata(
    recruiter,
    public_id: str,
    secure_url: str,
    resource_type: str,
    byte_count,
) -> None:
    if resource_type and resource_type != "raw":
        raise ValueError("invalid_upload_resource_type")

    full_public_id = (
        public_id
        if public_id.startswith(f"{CV_DIRECT_UPLOAD_FOLDER}/")
        else f"{CV_DIRECT_UPLOAD_FOLDER}/{public_id}"
    )
    match = CV_DIRECT_UPLOAD_PUBLIC_ID_RE.match(full_public_id)
    if not match or int(match.group("recruiter_id")) != recruiter.id:
        raise ValueError("invalid_upload_public_id")

    configured_cloud_name, _, _ = _cloudinary_credentials()
    parsed_url = urlparse(secure_url)
    path_parts = [part for part in parsed_url.path.split("/") if part]
    if (
        parsed_url.scheme != "https"
        or parsed_url.hostname != "res.cloudinary.com"
        or len(path_parts) < 4
        or path_parts[0] != configured_cloud_name
        or path_parts[1] != "raw"
        or path_parts[2] != "upload"
    ):
        raise ValueError("invalid_upload_url")

    if f"/{full_public_id}" not in secure_url:
        raise ValueError("invalid_upload_url")

    if byte_count is not None:
        try:
            if int(byte_count) > getattr(
                settings, "CV_UPLOAD_MAX_BYTES", 10 * 1024 * 1024
            ):
                raise ValueError("pdf_too_large")
        except (TypeError, ValueError) as exc:
            if str(exc) == "pdf_too_large":
                raise
            raise ValueError("invalid_upload_size") from exc


@transaction.atomic
def upload_cv_pdf(recruiter, file, cv_name: str = None) -> RecruiterCV:
    """
    Upload file PDF lên Cloudinary và tạo RecruiterCV mới (CV_Upload).

    After saving, dispatches a Celery task to parse the PDF content
    using LLM (Groq) and populate cv_data asynchronously.
    If parsing fails after retries, cv_data stays empty and
    scoring falls back to recruiter profile data automatically.

    Args:
        recruiter: Recruiter instance thực hiện upload.
        file: File object (InMemoryUploadedFile hoặc tương tự) chứa nội dung PDF.
        cv_name: Tên CV tùy chọn. Nếu không cung cấp, dùng tên file gốc bỏ phần mở rộng .pdf.

    Returns:
        RecruiterCV instance vừa được tạo (CV_Upload, cv_data={} initially).
    """
    from apps.candidate.recruiter_cvs.services.cv_parser import validate_pdf_bytes

    file_bytes = file.read()
    validate_pdf_bytes(file_bytes)

    # Upload lên Cloudinary
    content_file = ContentFile(file_bytes, name=file.name)
    cv_url = save_raw_file("CVs", content_file, f"cv_upload_{recruiter.id}")

    # Tên CV: dùng cv_name nếu có, ngược lại dùng tên file gốc bỏ phần mở rộng .pdf
    if not cv_name:
        cv_name = file.name

    try:
        cv = RecruiterCV.objects.create(
            recruiter=recruiter,
            template=None,
            cv_name=_normalize_cv_name(cv_name),
            cv_data={},
            cv_url=cv_url,
            pdf_generated_at=timezone.now(),
            is_default=False,
            is_public=True,
        )

        # Dispatch async CV parsing task via Celery
        # The task will download the PDF, extract text, parse with LLM, and update cv_data
        transaction.on_commit(lambda: _dispatch_cv_parse(cv.id))
    except Exception:
        _delete_orphan_cloudinary_file(cv_url, "raw")
        raise

    return cv


def _dispatch_cv_parse(cv_id: int):
    """Dispatch CV parsing task, with graceful fallback if Celery is unavailable."""
    try:
        from apps.candidate.recruiter_cvs.tasks import parse_cv_task

        parse_cv_task.delay(cv_id)
    except Exception as e:
        logger.warning(
            f"Could not dispatch async CV parse task for CV {cv_id}: {e}. "
            "Celery may not be running. Matching will fallback to recruiter profile."
        )


def _delete_orphan_cloudinary_file(file_url: str, resource_type: str = "raw") -> None:
    if "res.cloudinary.com" not in str(file_url or ""):
        return

    try:
        from apps.system.file_uploads.cloudinary_utils import delete_cloudinary_file

        delete_cloudinary_file(file_url, resource_type=resource_type)
    except Exception as exc:
        logger.warning(
            "Could not cleanup orphan Cloudinary file url=%s resource_type=%s error=%s",
            file_url,
            resource_type,
            exc,
        )


@transaction.atomic
def auto_generate_cv(recruiter, template_id: int = None) -> RecruiterCV:
    """
    Tá»± Ä‘á»™ng táº¡o CV tá»« recruiter profile vá»›i Ä‘áº§y Ä‘á»§ dá»¯ liá»‡u.
    Fetch tá»«: skills, education, experience, certifications, projects, languages
    """

    # Get template
    template = None
    if template_id:
        try:
            template = CVTemplate.objects.get(id=template_id, is_active=True)
        except CVTemplate.DoesNotExist:
            pass

    # Fetch skills
    skills_data = []
    skills = RecruiterSkill.objects.filter(recruiter=recruiter).select_related("skill")
    for rs in skills:
        skills_data.append(
            {
                "name": rs.skill.name if rs.skill else rs.skill_name,
                "proficiency_level": rs.proficiency_level,
                "years_of_experience": rs.years_of_experience,
            }
        )

    # Fetch education
    education_data = []
    educations = RecruiterEducation.objects.filter(recruiter=recruiter).order_by(
        "-start_date"
    )
    for edu in educations:
        education_data.append(
            {
                "school_name": edu.school_name,
                "degree": edu.degree,
                "field_of_study": edu.field_of_study or "",
                "start_date": edu.start_date.isoformat() if edu.start_date else None,
                "end_date": edu.end_date.isoformat() if edu.end_date else None,
                "is_current": edu.is_current,
                "description": edu.description or "",
            }
        )

    # Fetch experience
    experience_data = []
    experiences = RecruiterExperience.objects.filter(recruiter=recruiter).order_by(
        "-start_date"
    )
    for exp in experiences:
        experience_data.append(
            {
                "company_name": exp.company_name,
                "job_title": exp.job_title,
                # "location": exp.location or "", # Model doesn't have location string, check if needed
                "start_date": exp.start_date.isoformat() if exp.start_date else None,
                "end_date": exp.end_date.isoformat() if exp.end_date else None,
                "is_current": exp.is_current,
                "description": exp.description or "",
            }
        )

    # Fetch certifications
    certifications_data = []
    certifications = RecruiterCertification.objects.filter(
        recruiter=recruiter
    ).order_by("-issue_date")
    for cert in certifications:
        certifications_data.append(
            {
                "name": cert.certification_name,  # fixed field name
                "issuing_organization": cert.issuing_organization or "",
                "issue_date": cert.issue_date.isoformat() if cert.issue_date else None,
                "expiry_date": cert.expiry_date.isoformat()
                if cert.expiry_date
                else None,
                "credential_id": cert.credential_id or "",
                "credential_url": cert.credential_url or "",
            }
        )

    # Fetch projects
    projects_data = []
    projects = RecruiterProject.objects.filter(recruiter=recruiter).order_by(
        "-start_date"
    )
    for proj in projects:
        projects_data.append(
            {
                "project_name": proj.project_name,
                "description": proj.description or "",
                "project_url": proj.project_url or "",
                "start_date": proj.start_date.isoformat() if proj.start_date else None,
                "end_date": proj.end_date.isoformat() if proj.end_date else None,
                "technologies_used": proj.technologies_used or "",
            }
        )

    # Fetch languages
    languages_data = []
    languages = RecruiterLanguage.objects.filter(recruiter=recruiter).select_related(
        "language"
    )
    for lang in languages:
        languages_data.append(
            {
                "name": lang.language.language_name
                if lang.language
                else "",  # field is language_name
                "proficiency_level": lang.proficiency_level,
            }
        )

    # Build cv_data from recruiter profile
    cv_data = {
        "personal": {
            "full_name": recruiter.user.full_name,
            "email": recruiter.user.email,
            "phone": getattr(recruiter.user, "phone_number", ""),
            "current_position": recruiter.current_position or "",
            "bio": recruiter.bio or "",
            "years_of_experience": recruiter.years_of_experience or 0,
        },
        "location": {},
        "links": {
            "linkedin": recruiter.linkedin_url or "",
            "github": recruiter.github_url or "",
            "portfolio": recruiter.portfolio_url or "",
            "facebook": recruiter.facebook_url or "",
        },
        "skills": skills_data,
        "education": education_data,
        "experience": experience_data,
        "certifications": certifications_data,
        "projects": projects_data,
        "languages": languages_data,
    }

    # Create CV
    cv = RecruiterCV.objects.create(
        recruiter=recruiter,
        template=template,
        cv_name=f"Auto-generated CV - {timezone.now().strftime('%Y-%m-%d')}",
        cv_data=cv_data,
        is_default=False,
        is_public=True,
    )

    return cv
