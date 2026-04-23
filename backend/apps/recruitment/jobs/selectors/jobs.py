from typing import Optional

from django.db.models import QuerySet, Q, Count, Case, When, IntegerField, Value
from django.utils import timezone

from datetime import timedelta

from apps.recruitment.jobs.models import Job
from apps.recruitment.applications.models import Application
from apps.candidate.recruiter_skills.models import RecruiterSkill
from apps.recruitment.job_skills.models import JobSkill

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
            - search: str (search in title)
    """
    queryset = Job.objects.select_related(
        'company', 'category', 'created_by'
    )
    
    if not filters:
        return queryset.order_by('-published_at', '-created_at')
    
    # Filter by company
    if filters.get('company_id'):
        queryset = queryset.filter(company_id=filters['company_id'])
    
    # Filter by category
    if filters.get('category_id'):
        queryset = queryset.filter(category_id=filters['category_id'])
    
    # Filter by job_type
    if filters.get('job_type'):
        queryset = queryset.filter(job_type=filters['job_type'])
    
    # Filter by level
    if filters.get('level'):
        queryset = queryset.filter(level=filters['level'])
    
    # Filter by status
    if filters.get('status'):
        queryset = queryset.filter(status=filters['status'])
    elif not filters.get('include_all_statuses'):
        # Default: only show published jobs for public
        queryset = queryset.filter(status='published')
    
    # Filter by is_remote
    if filters.get('is_remote') is not None:
        queryset = queryset.filter(is_remote=filters['is_remote'])
    
    # Filter by salary range
    if filters.get('salary_min'):
        queryset = queryset.filter(
            Q(salary_max__gte=filters['salary_min']) | Q(is_salary_negotiable=True)
        )
    
    if filters.get('salary_max'):
        queryset = queryset.filter(
            Q(salary_min__lte=filters['salary_max']) | Q(is_salary_negotiable=True)
        )
    
    # Search in title
    if filters.get('search'):
        queryset = queryset.filter(title__icontains=filters['search'])
    
    ordering_map = {
        '-posted_at': ['-published_at', '-created_at'],
        'posted_at': ['published_at', 'created_at'],
        'deadline': ['application_deadline', '-published_at', '-created_at'],
        '-views_count': ['-view_count', '-published_at', '-created_at'],
        '-applications_count': ['-application_count', '-published_at', '-created_at'],
    }
    ordering = ordering_map.get(filters.get('ordering'), ['-featured', '-published_at', '-created_at'])

    return queryset.order_by(*ordering)


def get_job_by_id(job_id: int) -> Optional[Job]:
    """
        Lấy job theo ID.
        Trả về None nếu không tìm thấy.
    """
    try:
        return Job.objects.select_related(
            'company', 'category', 'created_by'
        ).get(id=job_id)
    except Job.DoesNotExist:
        return None


def get_job_by_slug(slug: str) -> Optional[Job]:
    """
        Lấy job theo slug.
        Trả về None nếu không tìm thấy.
    """
    try:
        return Job.objects.select_related(
            'company', 'category', 'created_by'
        ).get(slug=slug)
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
    status_counts = Application.objects.filter(
        job_id=job_id
    ).values('status').annotate(
        count=Count('id')
    )
    
    applications_by_status = {item['status']: item['count'] for item in status_counts}
    
    return {
        'view_count': job.view_count,
        'application_count': job.application_count,
        'applications_by_status': applications_by_status
    }


def list_featured_jobs() -> QuerySet[Job]:
    """
        Lấy danh sách việc làm nổi bật.
        featured=True, status=published
    """
    return Job.objects.filter(
        featured=True,
        status='published'
    ).select_related(
        'company', 'category'
    ).order_by('-published_at')[:20]


def list_urgent_jobs(days: int = 7) -> QuerySet[Job]:
    """
        Lấy danh sách việc làm gấp.
        Deadline trong N ngày tới, status=published
    """
    
    deadline_threshold = timezone.now().date() + timedelta(days=days)
    
    return Job.objects.filter(
        status='published',
        application_deadline__isnull=False,
        application_deadline__lte=deadline_threshold,
        application_deadline__gte=timezone.now().date()
    ).select_related(
        'company', 'category'
    ).order_by('application_deadline')[:20]


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
    queryset = Job.objects.filter(
        status='published'
    ).exclude(
        id=job_id
    ).annotate(
        similarity_score=
            Case(
                When(category=job.category, then=Value(3)),
                default=Value(0),
                output_field=IntegerField()
            ) +
            Case(
                When(level=job.level, then=Value(2)),
                default=Value(0),
                output_field=IntegerField()
            ) +
            Case(
                When(job_type=job.job_type, then=Value(1)),
                default=Value(0),
                output_field=IntegerField()
            )
    ).filter(
        similarity_score__gt=0  # At least one match
    ).select_related(
        'company', 'category'
    ).order_by('-similarity_score', '-published_at')[:limit]
    
    return queryset


def get_job_recommendations(recruiter_id: int, limit: int = 20) -> QuerySet[Job]:
    """
        Gợi ý việc làm cho ứng viên (Hybrid approach):
            - Nếu có skills → match với job_skills
            - Fallback → trending jobs (high views, recent)
    """

    # Get recruiter's skill IDs
    recruiter_skill_ids = list(
        RecruiterSkill.objects.filter(
            recruiter_id=recruiter_id
        ).values_list('skill_id', flat=True)
    )
    
    if recruiter_skill_ids:
        # Skill-based recommendations
        matching_job_ids = JobSkill.objects.filter(
            skill_id__in=recruiter_skill_ids
        ).values('job_id').annotate(
            match_count=Count('skill_id')
        ).order_by('-match_count').values_list('job_id', flat=True)[:limit * 2]
        
        queryset = Job.objects.filter(
            id__in=matching_job_ids,
            status='published'
        ).select_related(
            'company', 'category'
        ).order_by('-published_at')[:limit]
        
        if queryset.exists():
            return queryset
    
    # Fallback: Trending jobs (high views, recent published)
    return Job.objects.filter(
        status='published'
    ).select_related(
        'company', 'category'
    ).order_by('-view_count', '-published_at')[:limit]


def _tokenize(text: str) -> set:
    """Simple Vietnamese-friendly tokenizer: lowercase, split by spaces & special chars."""
    import re
    if not text:
        return set()
    tokens = re.findall(r'[a-z0-9]+', text.lower())
    return set(tokens)


def _title_similarity_score(position: str, job_title: str) -> float:
    """
    Jaccard-like overlap between candidate position tokens and job title tokens.
    Returns 0.0–1.0.
    """
    pos_tokens = _tokenize(position)
    title_tokens = _tokenize(job_title)
    if not pos_tokens or not title_tokens:
        return 0.0
    intersection = pos_tokens & title_tokens
    union = pos_tokens | title_tokens
    return len(intersection) / len(union)


def _salary_match_score(desired_min, desired_max, job_min, job_max) -> float:
    """
    Returns 0.0–1.0 based on how well job salary overlaps with desired salary.
    """
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


def get_job_suggestions_for_cv(cv_id: int, recruiter, limit: int = 20) -> list:
    """
    Gợi ý việc làm cho một CV cụ thể với multi-factor scoring:
      - Title similarity  40%: so sánh cv_data.personal.current_position với job.title
      - Salary match      30%: so sánh desired_salary của recruiter với job salary
      - Skill match       30%: so sánh cv_data.skills với job skills

    Trả về list of dict: [{'job': Job, 'match_score': int, 'match_reasons': list[str]}, ...]
    """
    from apps.candidate.recruiter_cvs.models import RecruiterCV

    try:
        cv = RecruiterCV.objects.get(id=cv_id, recruiter=recruiter)
    except RecruiterCV.DoesNotExist:
        return []

    cv_data = cv.cv_data or {}
    personal = cv_data.get('personal', {})
    candidate_position = personal.get('current_position', '') or ''

    # ----- Extract CV skills -----
    cv_skills_raw = cv_data.get('skills', [])
    cv_skill_names = set()
    for s in cv_skills_raw:
        name = s.get('name', '')
        if name:
            cv_skill_names.update(_tokenize(name))

    # ----- Get all published jobs -----
    jobs = Job.objects.filter(status='published').select_related(
        'company', 'category'
    ).prefetch_related('required_skills__skill')[:limit * 5]  # Over-fetch then re-rank

    # ----- Scoring -----
    scored = []
    for job in jobs:
        reasons = []

        # 1. Title similarity (40%)
        title_score = _title_similarity_score(candidate_position, job.title)
        if title_score > 0:
            reasons.append(f"Tên vị trí tương đồng {int(title_score * 100)}%")

        # 2. Salary match (30%)
        salary_score = _salary_match_score(
            recruiter.desired_salary_min,
            recruiter.desired_salary_max,
            job.salary_min,
            job.salary_max
        )
        if salary_score > 0.5:
            reasons.append("Mức lương phù hợp")

        # 3. Skill match (30%)
        job_skill_tokens = set()
        for js in job.required_skills.all():
            if js.skill and js.skill.name:
                job_skill_tokens.update(_tokenize(js.skill.name))

        skill_intersection = cv_skill_names & job_skill_tokens if job_skill_tokens else set()
        skill_score = len(skill_intersection) / len(job_skill_tokens) if job_skill_tokens else 0.0
        if skill_score > 0:
            reasons.append(f"{len(skill_intersection)} kỹ năng phù hợp")

        # Weighted score (0–100)
        total = (title_score * 0.40 + salary_score * 0.30 + skill_score * 0.30) * 100
        match_score = round(total)

        if match_score > 0 or not candidate_position:
            scored.append({
                'job': job,
                'match_score': match_score,
                'match_reasons': reasons,
            })

    # Sort by match_score desc, published_at desc
    scored.sort(key=lambda x: (-x['match_score'], -(x['job'].published_at.timestamp() if x['job'].published_at else 0)))

    # If no scored results, fallback to trending
    if not scored:
        trending = Job.objects.filter(status='published').select_related('company', 'category').order_by('-view_count', '-published_at')[:limit]
        scored = [{'job': j, 'match_score': 0, 'match_reasons': ['Việc làm phổ biến']} for j in trending]

    return scored[:limit]
