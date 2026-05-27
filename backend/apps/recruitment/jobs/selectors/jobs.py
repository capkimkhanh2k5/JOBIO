import re
import unicodedata
from typing import Optional

from django.db.models import QuerySet, Q, Count, Case, When, IntegerField, Value
from django.utils import timezone

from datetime import timedelta

from apps.recruitment.jobs.models import Job
from apps.recruitment.applications.models import Application
from apps.candidate.recruiter_skills.models import RecruiterSkill
from apps.recruitment.job_skills.models import JobSkill


def _as_list(value):
    if isinstance(value, (list, tuple, set)):
        return list(value)
    return [value]


def _with_active_featured(queryset: QuerySet[Job]) -> QuerySet[Job]:
    today = timezone.now().date()
    return queryset.annotate(
        active_featured=Case(
            When(
                Q(featured=True)
                & (Q(featured_until__isnull=True) | Q(featured_until__gte=today)),
                then=Value(1),
            ),
            default=Value(0),
            output_field=IntegerField(),
        )
    )


def _not_deadline_expired_q():
    today = timezone.now().date()
    return Q(application_deadline__isnull=True) | Q(application_deadline__gte=today)


def _expired_job_q():
    today = timezone.now().date()
    return Q(status=Job.Status.EXPIRED) | (
        Q(status=Job.Status.PUBLISHED)
        & Q(application_deadline__isnull=False)
        & Q(application_deadline__lt=today)
    )


def _with_effective_expired(queryset: QuerySet[Job]) -> QuerySet[Job]:
    return queryset.annotate(
        effective_is_expired=Case(
            When(_expired_job_q(), then=Value(1)),
            default=Value(0),
            output_field=IntegerField(),
        )
    )


def _active_published_jobs(queryset: QuerySet[Job]) -> QuerySet[Job]:
    return queryset.filter(status=Job.Status.PUBLISHED).filter(
        _not_deadline_expired_q()
    )


def list_jobs(filters: dict = None) -> QuerySet[Job]:
    """
    Lấy danh sách jobs với filter logic.

    Filters:
        - company_id: int
        - category_id: int
        - job_type: str (full-time, part-time, etc.)
        - level: str (intern, fresher, junior, etc.)
        - status: str (draft, published, closed, expired)
        - is_remote: bool
        - salary_min: decimal
        - salary_max: decimal
        - experience_min: int
        - experience_max: int
        - skills: list[str]
        - search: str (search in title, company, category, skills, description)
    """
    queryset = Job.objects.select_related(
        "company", "category", "created_by", "address", "address__province"
    ).prefetch_related("required_skills__skill")

    if not filters:
        return _with_effective_expired(
            _with_active_featured(queryset.filter(status=Job.Status.PUBLISHED))
        ).order_by(
            "effective_is_expired", "-active_featured", "-published_at", "-created_at"
        )

    # Filter by company
    if filters.get("company_id"):
        queryset = queryset.filter(company_id=filters["company_id"])

    # Filter by category
    if filters.get("category_id"):
        queryset = queryset.filter(category_id=filters["category_id"])

    # Filter by province
    if filters.get("province_id"):
        queryset = queryset.filter(
            Q(address__province_id=filters["province_id"])
            | Q(locations__address__province_id=filters["province_id"])
        ).distinct()

    # Filter by job_type
    if filters.get("job_type"):
        queryset = queryset.filter(job_type__in=_as_list(filters["job_type"]))

    # Filter by level
    if filters.get("level"):
        queryset = queryset.filter(level__in=_as_list(filters["level"]))

    # Filter by status
    if filters.get("status"):
        if filters["status"] == Job.Status.EXPIRED:
            queryset = queryset.filter(_expired_job_q())
        else:
            queryset = queryset.filter(status=filters["status"])
    elif not filters.get("include_all_statuses"):
        # Default: only show published jobs for public
        queryset = queryset.filter(status=Job.Status.PUBLISHED)

    # Filter by is_remote
    if filters.get("is_remote") is not None:
        queryset = queryset.filter(is_remote=filters["is_remote"])

    # Filter by salary range
    if filters.get("salary_min"):
        queryset = queryset.filter(
            Q(salary_max__gte=filters["salary_min"]) | Q(is_salary_negotiable=True)
        )

    if filters.get("salary_max"):
        queryset = queryset.filter(
            Q(salary_min__lte=filters["salary_max"]) | Q(is_salary_negotiable=True)
        )

    # Filter by overlapping experience range.
    if filters.get("experience_min") is not None:
        queryset = queryset.filter(
            Q(experience_years_max__gte=filters["experience_min"])
            | Q(experience_years_max__isnull=True)
        )

    if filters.get("experience_max") is not None:
        queryset = queryset.filter(experience_years_min__lte=filters["experience_max"])

    if filters.get("skills"):
        skills = [
            str(skill).strip()
            for skill in _as_list(filters["skills"])
            if str(skill).strip()
        ]
        skill_query = Q()
        for skill in skills:
            skill_query |= Q(required_skills__skill__name__iexact=skill)
        if skills:
            queryset = queryset.filter(skill_query).distinct()

    # Search by the same fields exposed in the public job-search UI.
    if filters.get("search"):
        search = str(filters["search"]).strip()
        if search:
            queryset = queryset.filter(
                Q(title__icontains=search)
                | Q(description__icontains=search)
                | Q(requirements__icontains=search)
                | Q(benefits__icontains=search)
                | Q(company__company_name__icontains=search)
                | Q(company__slug__icontains=search)
                | Q(category__name__icontains=search)
                | Q(required_skills__skill__name__icontains=search)
            ).distinct()

    public_priority = (
        [] if filters.get("include_all_statuses") else ["effective_is_expired"]
    )
    featured_priority = (
        []
        if filters.get("include_all_statuses")
        else [*public_priority, "-active_featured"]
    )
    featured_order = (
        "-featured" if filters.get("include_all_statuses") else "-active_featured"
    )
    ordering_map = {
        "-created_at": [*featured_priority, "-created_at"],
        "created_at": [*featured_priority, "created_at"],
        "-posted_at": [*featured_priority, "-published_at", "-created_at"],
        "posted_at": [*featured_priority, "published_at", "created_at"],
        "deadline": [
            *featured_priority,
            "application_deadline",
            "-published_at",
            "-created_at",
        ],
        "-salary_max": [
            *featured_priority,
            "-salary_max",
            "-published_at",
            "-created_at",
        ],
        "salary_max": [
            *featured_priority,
            "salary_max",
            "-published_at",
            "-created_at",
        ],
        "-is_featured": [
            *public_priority,
            featured_order,
            "-published_at",
            "-created_at",
        ],
        "-featured": [
            *public_priority,
            featured_order,
            "-published_at",
            "-created_at",
        ],
        "-views_count": [
            *featured_priority,
            "-view_count",
            "-published_at",
            "-created_at",
        ],
        "-applications_count": [
            *featured_priority,
            "-application_count",
            "-published_at",
            "-created_at",
        ],
    }
    ordering = ordering_map.get(
        filters.get("ordering"),
        [*public_priority, featured_order, "-published_at", "-created_at"],
    )

    if not filters.get("include_all_statuses"):
        queryset = _with_effective_expired(_with_active_featured(queryset))

    return queryset.order_by(*ordering)


def get_job_by_id(job_id: int) -> Optional[Job]:
    """
    Lấy job theo ID.
    Trả về None nếu không tìm thấy.
    """
    try:
        return Job.objects.select_related("company", "category", "created_by").get(
            id=job_id
        )
    except Job.DoesNotExist:
        return None


def get_job_by_slug(slug: str) -> Optional[Job]:
    """
    Lấy job theo slug.
    Trả về None nếu không tìm thấy.
    """
    try:
        return Job.objects.select_related("company", "category", "created_by").get(
            slug=slug
        )
    except Job.DoesNotExist:
        return None


def get_job_stats(job_id: int) -> dict:
    """
    Lấy thống kê cho job.
    Returns: view_count, application_count, applications_by_status
    """

    job = get_job_by_id(job_id)
    if not job:
        return None

    # Count applications by status
    status_counts = (
        Application.objects.filter(job_id=job_id)
        .values("status")
        .annotate(count=Count("id"))
    )

    applications_by_status = {item["status"]: item["count"] for item in status_counts}

    return {
        "view_count": job.view_count,
        "application_count": job.application_count,
        "applications_by_status": applications_by_status,
    }


def list_featured_jobs(limit: int = 8) -> QuerySet[Job]:
    """
    Lấy danh sách việc làm nổi bật.
    Ưu tiên featured=True; fallback sang published jobs theo traffic nếu chưa có featured.
    """
    base_queryset = (
        _active_published_jobs(Job.objects.all())
        .select_related("company", "category", "address", "address__province")
        .prefetch_related("required_skills__skill")
    )

    annotated_queryset = _with_active_featured(base_queryset)
    featured_queryset = annotated_queryset.filter(active_featured=1).order_by(
        "-published_at", "-created_at"
    )[:limit]

    if featured_queryset.exists():
        return featured_queryset

    return annotated_queryset.order_by(
        "-view_count",
        "-application_count",
        "-published_at",
        "-created_at",
    )[:limit]


def list_urgent_jobs(days: int = 7) -> QuerySet[Job]:
    """
    Lấy danh sách việc làm gấp.
    Deadline trong N ngày tới, status=published
    """

    deadline_threshold = timezone.now().date() + timedelta(days=days)

    return (
        _active_published_jobs(Job.objects.all())
        .filter(
            application_deadline__isnull=False,
            application_deadline__lte=deadline_threshold,
        )
        .select_related("company", "category", "address", "address__province")
        .prefetch_related("required_skills__skill")
        .order_by("application_deadline")[:10]
    )


def get_similar_jobs(job_id: int, limit: int = 10) -> QuerySet[Job]:
    """
    Tìm jobs tương tự dựa trên multi-factor:
        - Same category (highest priority)
        - Same level
        - Same job_type
    """

    job = get_job_by_id(job_id)
    if not job:
        return Job.objects.none()

    # Build similarity query với scoring
    queryset = (
        _active_published_jobs(Job.objects.all())
        .exclude(id=job_id)
        .annotate(
            similarity_score=Case(
                When(category=job.category, then=Value(3)),
                default=Value(0),
                output_field=IntegerField(),
            )
            + Case(
                When(level=job.level, then=Value(2)),
                default=Value(0),
                output_field=IntegerField(),
            )
            + Case(
                When(job_type=job.job_type, then=Value(1)),
                default=Value(0),
                output_field=IntegerField(),
            )
        )
        .filter(
            similarity_score__gt=0  # At least one match
        )
        .select_related("company", "category", "address", "address__province")
        .prefetch_related("required_skills__skill")
        .order_by("-similarity_score", "-published_at")[:limit]
    )

    return queryset


def get_job_recommendations(recruiter_id: int, limit: int = 20) -> QuerySet[Job]:
    """
    Gợi ý việc làm cho ứng viên (Hybrid approach):
        - Nếu có skills → match với job_skills
        - Fallback → trending jobs (high views, recent)
    """

    # Get recruiter's skill IDs
    recruiter_skill_ids = list(
        RecruiterSkill.objects.filter(recruiter_id=recruiter_id).values_list(
            "skill_id", flat=True
        )
    )

    if recruiter_skill_ids:
        # Skill-based recommendations
        matching_job_ids = (
            JobSkill.objects.filter(skill_id__in=recruiter_skill_ids)
            .values("job_id")
            .annotate(match_count=Count("skill_id"))
            .order_by("-match_count")
            .values_list("job_id", flat=True)[: limit * 2]
        )

        queryset = (
            _active_published_jobs(Job.objects.filter(id__in=matching_job_ids))
            .select_related("company", "category", "address", "address__province")
            .prefetch_related("required_skills__skill")
            .order_by("-published_at")[:limit]
        )

        if queryset.exists():
            return queryset

    # Fallback: Trending jobs (high views, recent published)
    return (
        _active_published_jobs(Job.objects.all())
        .select_related("company", "category", "address", "address__province")
        .prefetch_related("required_skills__skill")
        .order_by("-view_count", "-published_at")[:limit]
    )


# =============================================================================
# JOB MATCHING ENGINE — 6-Factor Weighted Scoring
#
# Factors:
#   1. Skill Match        35%  — ID-based (RecruiterSkill ↔ JobSkill via Skill FK)
#   2. Experience Level   20%  — proximity matching (years → level → distance)
#   3. Category/Domain    15%  — job category ↔ recruiter experience domain
#   4. Salary             15%  — overlap ratio (desired vs offered)
#   5. Location           10%  — province matching + remote bonus
#   6. Job Type            5%  — compatibility matrix
# =============================================================================

# ── Weights ──────────────────────────────────────────────────────────────────
WEIGHT_SKILL = 0.35
WEIGHT_LEVEL = 0.20
WEIGHT_CATEGORY = 0.15
WEIGHT_SALARY = 0.15
WEIGHT_LOCATION = 0.10
WEIGHT_JOB_TYPE = 0.05

# ── Experience Level Mapping ─────────────────────────────────────────────────
LEVEL_ORDER = {
    "intern": 0,
    "fresher": 1,
    "junior": 2,
    "middle": 3,
    "senior": 4,
    "lead": 5,
    "manager": 6,
    "director": 7,
}

# Years of experience → estimated level
_YEARS_THRESHOLDS = [
    (0, "intern"),
    (1, "fresher"),
    (2, "junior"),
    (4, "middle"),
    (6, "senior"),
    (9, "lead"),
    (12, "manager"),
    (15, "director"),
]

# Job type compatibility matrix
_JOB_TYPE_COMPAT = {
    "internship": {"internship", "part-time"},
    "full-time": {"full-time", "contract"},
    "part-time": {"part-time", "freelance", "internship"},
    "contract": {"contract", "full-time", "freelance"},
    "freelance": {"freelance", "part-time", "contract"},
}

_SKILL_ALIASES = {
    "js": "javascript",
    "javascript": "javascript",
    "ts": "typescript",
    "typescript": "typescript",
    "react": "react",
    "reactjs": "react",
    "reactnative": "reactnative",
    "node": "nodejs",
    "nodejs": "nodejs",
    "next": "nextjs",
    "nextjs": "nextjs",
    "nestjs": "nestjs",
    "postgres": "postgresql",
    "postgresql": "postgresql",
    "csharp": "csharp",
    "dotnet": "dotnet",
    "golang": "go",
}


# ── Helper: Normalize cv_data ────────────────────────────────────────────────


def _normalize_cv_data(cv_data) -> dict:
    if isinstance(cv_data, dict):
        return cv_data

    if isinstance(cv_data, str):
        import json

        try:
            parsed = json.loads(cv_data)
            return parsed if isinstance(parsed, dict) else {}
        except (TypeError, ValueError):
            return {}

    return {}


# ── Helper: Years → Level ────────────────────────────────────────────────────


def _years_to_level(years: int) -> str:
    """Convert years of experience to estimated career level."""
    if years is None:
        return "junior"  # default assumption
    level = "intern"
    for threshold, lvl in _YEARS_THRESHOLDS:
        if years >= threshold:
            level = lvl
        else:
            break
    return level


# ── Helper: Resolve CV skill names → Skill IDs ──────────────────────────────


def _normalize_skill_key(value: str) -> str:
    text = str(value or "").strip().lower()
    text = text.replace("c#", "csharp").replace(".net", "dotnet")
    text = unicodedata.normalize("NFKD", text).encode("ascii", "ignore").decode("ascii")
    text = re.sub(r"[^a-z0-9]+", "", text)
    return _SKILL_ALIASES.get(text, text)


def _skill_keys(*values: str) -> set[str]:
    keys = set()
    for value in values:
        raw = str(value or "").strip()
        if not raw:
            continue
        normalized = _normalize_skill_key(raw)
        direct = re.sub(
            r"[^a-z0-9]+",
            "",
            unicodedata.normalize("NFKD", raw.lower())
            .encode("ascii", "ignore")
            .decode("ascii")
            .replace("c#", "csharp")
            .replace(".net", "dotnet"),
        )
        for key in {normalized, direct}:
            if key:
                keys.add(key)
    return keys


def _resolve_cv_skill_ids(cv_data: dict) -> set:
    """
    Resolve skill names from parsed cv_data (LLM output) to Skill IDs in DB.

    Strategy:
    1. Normalize exact name/slug/known aliases.
    2. Allow fuzzy fallback only when it resolves to one unique Skill.
    """
    from apps.candidate.skills.models import Skill

    raw_skills = cv_data.get("skills", [])
    if not raw_skills:
        return set()

    # Extract skill names from cv_data
    skill_names = []
    for skill in raw_skills:
        if isinstance(skill, dict):
            name = (
                skill.get("name") or skill.get("skill_name") or skill.get("title") or ""
            )
        else:
            name = str(skill or "")
        if name:
            skill_names.append(name.strip())

    if not skill_names:
        return set()

    skill_index: dict[str, set[int]] = {}
    for skill_id, name, slug in Skill.objects.filter(is_active=True).values_list(
        "id", "name", "slug"
    ):
        for key in _skill_keys(name, slug):
            skill_index.setdefault(key, set()).add(skill_id)

    requested_keys = {key for name in skill_names for key in _skill_keys(name)}
    matched_ids = set()
    unmatched_keys = set()

    for key in requested_keys:
        ids = skill_index.get(key, set())
        if len(ids) == 1:
            matched_ids.update(ids)
        elif not ids:
            unmatched_keys.add(key)

    for key in unmatched_keys:
        if len(key) < 4:
            continue
        fuzzy_ids = set()
        for known_key, ids in skill_index.items():
            if key in known_key or known_key in key:
                fuzzy_ids.update(ids)
        if len(fuzzy_ids) == 1:
            matched_ids.update(fuzzy_ids)

    return matched_ids


def _recruiter_skill_ids(recruiter) -> set:
    prefetched = getattr(recruiter, "_prefetched_objects_cache", {})
    if "skills" in prefetched:
        return {skill.skill_id for skill in recruiter.skills.all() if skill.skill_id}

    return set(
        RecruiterSkill.objects.filter(recruiter=recruiter).values_list(
            "skill_id", flat=True
        )
    )


# ── Helper: Extract candidate data (unified for CV_Template + CV_Upload) ─────


def _extract_candidate_data(cv, recruiter, exclude_job_id: int = None) -> dict:
    """
    Extract all candidate data needed for scoring.
    Unifies data from both CV_Template (DB relations) and CV_Upload (parsed cv_data).

    Returns dict with:
      - skill_ids: set of Skill IDs
      - years_of_experience: int
      - province_id: int or None
      - category_ids: set of JobCategory IDs (from past applications/experience)
      - category_parent_ids: set of JobCategory parent IDs
      - preferred_job_types: set of job_type strings
    """
    data = {
        "skill_ids": set(),
        "years_of_experience": recruiter.years_of_experience or 0,
        "province_id": None,
        "category_ids": set(),
        "category_parent_ids": set(),
        "preferred_job_types": set(),
    }

    # ── Province (always from recruiter profile) ──
    if recruiter.address_id:
        try:
            data["province_id"] = recruiter.address.province_id
        except Exception:
            pass

    # ── Category IDs from past applications ──
    applied_categories_query = Application.objects.filter(recruiter=recruiter).exclude(
        job__category_id__isnull=True
    )
    if exclude_job_id:
        applied_categories_query = applied_categories_query.exclude(
            job_id=exclude_job_id
        )

    applied_categories = applied_categories_query.values_list(
        "job__category_id",
        "job__category__parent_id",
    ).distinct()[:20]
    for category_id, parent_id in applied_categories:
        data["category_ids"].add(category_id)
        if parent_id:
            data["category_parent_ids"].add(parent_id)

    # ── Skills ──
    has_cv_data = bool(cv.cv_data)

    if has_cv_data:
        # CV has parsed data (either CV_Template or parsed CV_Upload)
        cv_data = _normalize_cv_data(cv.cv_data)

        # Skills from cv_data → resolve to Skill IDs
        cv_skill_ids = _resolve_cv_skill_ids(cv_data)
        if cv_skill_ids:
            data["skill_ids"] = cv_skill_ids
        else:
            # Fallback to profile skills if cv_data skills couldn't resolve
            data["skill_ids"] = _recruiter_skill_ids(recruiter)

        # Years of experience from cv_data (override profile if present)
        personal = cv_data.get("personal", {})
        if isinstance(personal, dict):
            cv_years = personal.get("years_of_experience")
            if cv_years is not None and isinstance(cv_years, (int, float)):
                data["years_of_experience"] = int(cv_years)

    else:
        # CV_Upload without parsed data → use recruiter profile
        data["skill_ids"] = _recruiter_skill_ids(recruiter)

    return data


# ── Scoring Function 1: Skill Match (35%) ────────────────────────────────────


def _skill_match_score(candidate_skill_ids: set, job) -> float:
    """
    ID-based skill matching: compare candidate Skill IDs with job required Skill IDs.

    Required skills (is_required=True) are weighted 80%, optional skills 20%.
    Returns 0.0–1.0.
    """
    if not candidate_skill_ids:
        return 0.0

    # Get job skill IDs with required/optional distinction
    job_skills = job.required_skills.all()
    required_ids = set()
    optional_ids = set()

    for js in job_skills:
        if js.skill_id:
            if js.is_required:
                required_ids.add(js.skill_id)
            else:
                optional_ids.add(js.skill_id)

    all_job_ids = required_ids | optional_ids
    if not all_job_ids:
        return 0.0

    # Calculate weighted match
    required_matched = len(candidate_skill_ids & required_ids)
    optional_matched = len(candidate_skill_ids & optional_ids)

    required_score = required_matched / len(required_ids) if required_ids else 1.0
    optional_score = optional_matched / len(optional_ids) if optional_ids else 0.0

    # If no required skills defined, treat all as required
    if not required_ids:
        total_matched = len(candidate_skill_ids & all_job_ids)
        return total_matched / len(all_job_ids)

    return required_score * 0.8 + optional_score * 0.2


# ── Scoring Function 2: Experience Level (20%) ──────────────────────────────


def _experience_level_score(
    candidate_years: int,
    job_level: str,
    job_years_min: int = None,
    job_years_max: int = None,
) -> float:
    """
    Experience matching.

    Prefer explicit job years min/max. Fall back to level proximity when the
    job does not define an experience range.
    Returns: exact=1.0, ±1 level=0.7, ±2=0.3, >2=0.0.
    """
    candidate_years = candidate_years or 0

    if job_years_min is not None or job_years_max is not None:
        minimum = job_years_min or 0
        maximum = job_years_max

        if candidate_years < minimum:
            gap = minimum - candidate_years
            if gap <= 1:
                return 0.7
            if gap <= 2:
                return 0.4
            return 0.0

        if maximum is not None and candidate_years > maximum:
            gap = candidate_years - maximum
            if gap <= 2:
                return 0.8
            if gap <= 4:
                return 0.6
            return 0.4

        return 1.0

    if not job_level:
        return 0.5  # neutral if job doesn't specify

    candidate_level = _years_to_level(candidate_years)
    candidate_idx = LEVEL_ORDER.get(candidate_level, 2)
    job_idx = LEVEL_ORDER.get(job_level, 2)

    distance = abs(candidate_idx - job_idx)
    if distance == 0:
        return 1.0
    if distance == 1:
        return 0.7
    if distance == 2:
        return 0.3
    return 0.0


# ── Scoring Function 3: Category/Domain (15%) ───────────────────────────────


def _category_score(
    candidate_category_ids: set,
    job,
    candidate_category_parent_ids: set = None,
) -> float:
    """
    Match job category against candidate's domain experience.

    Signals used (in priority order):
    1. Direct category match from past applications
    2. Parent category match (sibling categories)
    3. No history → neutral score

    Returns 0.0–1.0.
    """
    if not job.category_id:
        return 0.5  # job has no category → neutral

    if not candidate_category_ids:
        return 0.5  # new candidate → neutral, don't penalize

    # Direct match
    if job.category_id in candidate_category_ids:
        return 1.0

    # Sibling match (same parent category)
    try:
        candidate_category_parent_ids = candidate_category_parent_ids or set()
        if job.category and job.category.parent_id:
            if job.category.parent_id in candidate_category_parent_ids:
                return 0.5
    except Exception:
        pass

    return 0.0


# ── Scoring Function 4: Salary (15%) ────────────────────────────────────────


def _salary_match_score(
    desired_min,
    desired_max,
    job_min,
    job_max,
    is_negotiable: bool = False,
) -> float:
    """
    Returns 0.0–1.0 based on how well job salary overlaps with desired salary.
    """
    if is_negotiable:
        return 0.5  # Negotiable salary is neutral, not a match or mismatch.
    if desired_min is None and desired_max is None:
        return 0.5  # No preference → neutral
    if job_min is None and job_max is None:
        return 0.5  # Job salary negotiable → neutral

    d_min = float(desired_min or 0)
    d_max = float(desired_max or desired_min or 0)
    j_min = float(job_min or 0)
    j_max = float(job_max or job_min or 0)

    if d_max < j_min or j_max < d_min:
        return 0.0  # No overlap

    overlap_start = max(d_min, j_min)
    overlap_end = min(d_max, j_max)
    overlap = overlap_end - overlap_start
    total_range = max(d_max, j_max) - min(d_min, j_min)
    return overlap / total_range if total_range > 0 else 1.0


# ── Scoring Function 5: Location (10%) ──────────────────────────────────────


def _location_score(candidate_province_id, job) -> float:
    """
    Province-based location matching with remote bonus.

    Returns:
      - Same province:  1.0
      - Remote job:     0.8 (good for anyone)
      - Unknown:        0.5 (neutral)
      - Different:      0.0
    """
    if job.is_remote:
        return 0.8  # Remote → good match for most people

    if not candidate_province_id:
        return 0.5  # Unknown candidate location → neutral

    job_province_ids = _job_location_province_ids(job)

    if not job_province_ids:
        return 0.5  # Job has no location info → neutral

    if candidate_province_id in job_province_ids:
        return 1.0

    return 0.0


def _job_location_province_ids(job) -> set:
    province_ids = set()

    try:
        if job.address_id and job.address and job.address.province_id:
            province_ids.add(job.address.province_id)
    except Exception:
        pass

    try:
        for location in job.locations.all():
            address = getattr(location, "address", None)
            if address and address.province_id:
                province_ids.add(address.province_id)
    except Exception:
        pass

    return province_ids


# ── Scoring Function 6: Job Type (5%) ───────────────────────────────────────


def _job_type_score(candidate_years: int, job_type: str) -> float:
    """
    Job type compatibility based on candidate profile.

    Infers preferred job types from experience level:
    - Intern/Fresher: prefer internship, part-time
    - Junior+: prefer full-time, contract
    - Senior+: prefer full-time, contract, freelance

    Returns 1.0 (exact), 0.5 (compatible), 0.0 (mismatch).
    """
    if not job_type:
        return 0.5

    level = _years_to_level(candidate_years)

    # Infer preferred types based on level
    if level in ("intern", "fresher"):
        preferred = {"internship", "part-time", "full-time"}
    elif level in ("junior", "middle"):
        preferred = {"full-time", "contract", "part-time"}
    else:  # senior, lead, manager, director
        preferred = {"full-time", "contract", "freelance"}

    if job_type in preferred:
        return 1.0

    # Check compatibility matrix
    compatible = _JOB_TYPE_COMPAT.get(job_type, set())
    if preferred & compatible:
        return 0.5

    return 0.0


# ── Main: Calculate Match Score ──────────────────────────────────────────────


def _score_cv_job(candidate: dict, recruiter, job) -> dict:
    skill = _skill_match_score(candidate["skill_ids"], job)
    level = _experience_level_score(
        candidate["years_of_experience"],
        job.level,
        job.experience_years_min,
        job.experience_years_max,
    )
    category = _category_score(
        candidate["category_ids"],
        job,
        candidate.get("category_parent_ids", set()),
    )
    salary = _salary_match_score(
        recruiter.desired_salary_min,
        recruiter.desired_salary_max,
        job.salary_min,
        job.salary_max,
        job.is_salary_negotiable,
    )
    location = _location_score(candidate["province_id"], job)
    job_type = _job_type_score(candidate["years_of_experience"], job.job_type)

    total = (
        skill * WEIGHT_SKILL
        + level * WEIGHT_LEVEL
        + category * WEIGHT_CATEGORY
        + salary * WEIGHT_SALARY
        + location * WEIGHT_LOCATION
        + job_type * WEIGHT_JOB_TYPE
    ) * 100

    return {
        "score": round(total),
        "factors": {
            "skill": skill,
            "level": level,
            "category": category,
            "salary": salary,
            "location": location,
            "job_type": job_type,
        },
    }


def calculate_cv_job_match_score(cv, recruiter, job) -> int:
    """
    Calculate overall match score (0–100) between a candidate's CV and a job.

    Uses 6 weighted factors:
      1. Skill Match        35%
      2. Experience Level   20%
      3. Category/Domain    15%
      4. Salary             15%
      5. Location           10%
      6. Job Type            5%
    """
    if not cv or not recruiter or not job:
        return 0

    # Extract unified candidate data
    candidate = _extract_candidate_data(cv, recruiter, exclude_job_id=job.id)
    return _score_cv_job(candidate, recruiter, job)["score"]


# ── Main: Job Suggestions for CV ─────────────────────────────────────────────


def get_job_suggestions_for_cv(cv_id: int, recruiter, limit: int = 20) -> list:
    """
    Gợi ý việc làm cho một CV cụ thể với 6-factor weighted scoring.

    Pipeline:
    1. Extract candidate data (skills, level, category, location)
    2. Pre-filter jobs at DB level (at least 1 signal match)
    3. Score each job with 6 factors
    4. Sort by score desc, return top N

    Returns: list of dict [{'job': Job, 'match_score': int, 'match_reasons': list[str]}, ...]
    """
    from apps.candidate.recruiter_cvs.models import RecruiterCV

    try:
        cv = RecruiterCV.objects.select_related("recruiter__address__province").get(
            id=cv_id, recruiter=recruiter
        )
    except RecruiterCV.DoesNotExist:
        return []

    # Step 1: Extract candidate data
    candidate = _extract_candidate_data(cv, recruiter)

    # Step 2: Pre-filter jobs (DB level — reduce scoring candidates)
    base_query = _with_active_featured(_active_published_jobs(Job.objects.all()))

    # Build OR filter: at least 1 relevance signal
    relevance_filter = Q()
    has_relevance_signal = False

    if candidate["skill_ids"]:
        relevance_filter |= Q(
            required_skills__skill_id__in=list(candidate["skill_ids"])
        )
        has_relevance_signal = True

    if candidate["category_ids"]:
        relevance_filter |= Q(category_id__in=list(candidate["category_ids"]))
        has_relevance_signal = True

    if candidate["province_id"]:
        relevance_filter |= Q(address__province_id=candidate["province_id"]) | Q(
            locations__address__province_id=candidate["province_id"]
        )
        has_relevance_signal = True

    if has_relevance_signal:
        relevance_filter |= Q(is_remote=True)
        jobs = (
            base_query.filter(relevance_filter)
            .distinct()
            .select_related("company", "category__parent", "address__province")
            .prefetch_related("required_skills__skill", "locations__address__province")
            .order_by("-active_featured", "-published_at", "-created_at")[: limit * 4]
        )
    else:
        # No signals at all → fallback to recent jobs
        jobs = (
            base_query.select_related(
                "company", "category__parent", "address__province"
            )
            .prefetch_related("required_skills__skill", "locations__address__province")
            .order_by("-active_featured", "-published_at")[: limit * 3]
        )

    # Step 3: Score each job
    scored = []
    for job in jobs:
        reasons = []
        score = _score_cv_job(candidate, recruiter, job)
        factors = score["factors"]

        # 1. Skill Match (35%)
        skill = factors["skill"]
        if skill > 0:
            matched_count = len(
                candidate["skill_ids"]
                & {js.skill_id for js in job.required_skills.all() if js.skill_id}
            )
            total_required = sum(1 for js in job.required_skills.all() if js.skill_id)
            if matched_count > 0:
                reasons.append(f"{matched_count}/{total_required} kỹ năng phù hợp")

        # 2. Experience Level (20%)
        level = factors["level"]
        if level >= 0.7:
            reasons.append("Cấp bậc phù hợp")

        # 3. Category (15%)
        category = factors["category"]
        if category >= 0.5 and job.category:
            reasons.append(f"Ngành {job.category.name}")

        # 4. Salary (15%)
        salary = factors["salary"]
        if salary > 0.5:
            reasons.append("Mức lương phù hợp")

        # 5. Location (10%)
        location = factors["location"]
        if location >= 0.8:
            if job.is_remote:
                reasons.append("Làm việc từ xa")
            else:
                reasons.append("Cùng khu vực")

        match_score = score["score"]

        if match_score > 0:
            scored.append(
                {
                    "job": job,
                    "match_score": match_score,
                    "match_reasons": reasons if reasons else ["Việc làm gợi ý"],
                }
            )

    # Step 4: Sort by score desc, then freshness
    scored.sort(
        key=lambda x: (
            -x["match_score"],
            -getattr(x["job"], "active_featured", 0),
            -(x["job"].published_at.timestamp() if x["job"].published_at else 0),
        )
    )

    # Fallback: if no scored results → trending jobs
    if not scored:
        trending = (
            _with_active_featured(_active_published_jobs(Job.objects.all()))
            .select_related("company", "category__parent", "address__province")
            .prefetch_related("required_skills__skill", "locations__address__province")
            .order_by("-active_featured", "-view_count", "-published_at")[:limit]
        )
        scored = [
            {"job": j, "match_score": 0, "match_reasons": ["Việc làm phổ biến"]}
            for j in trending
        ]

    return scored[:limit]
