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
    else:
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
    
    return queryset.order_by('-featured', '-published_at', '-created_at')


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
