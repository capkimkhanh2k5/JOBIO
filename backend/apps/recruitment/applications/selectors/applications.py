from typing import Optional
from django.db.models import QuerySet, Q, Count
from django.utils import timezone
from datetime import timedelta

from apps.recruitment.applications.models import Application
from apps.recruitment.jobs.models import Job


def list_applications_by_job(job_id: int, filters: dict = None) -> QuerySet[Application]:
    """
        Lấy danh sách applications theo job_id với filters.
        
        Filters:
            - status: str
            - rating: int
    """
    queryset = Application.objects.filter(
        job_id=job_id
    ).select_related(
        'recruiter', 'recruiter__user', 'job', 'cv', 'reviewed_by'
    ).order_by('-applied_at')
    
    if not filters:
        return queryset
    
    if filters.get('status'):
        queryset = queryset.filter(status=filters['status'])
    
    if filters.get('rating'):
        queryset = queryset.filter(rating=filters['rating'])
    
    return queryset


def get_application_by_id(application_id: int) -> Optional[Application]:
    """
        Lấy application theo ID.
    """
    try:
        return Application.objects.select_related(
            'recruiter', 'recruiter__user', 'job', 'cv', 'reviewed_by'
        ).get(id=application_id)
    except Application.DoesNotExist:
        return None


def list_applications_by_recruiter(recruiter_id: int) -> QuerySet[Application]:
    """
        Lấy danh sách applications theo recruiter_id (đơn của ứng viên).
    """
    return Application.objects.filter(
        recruiter_id=recruiter_id
    ).select_related(
        'job', 'job__company', 'cv'
    ).order_by('-applied_at')


def get_application_stats(user) -> dict:
    """
        Lấy thống kê applications cho user.
        Job owner thấy stats của jobs họ sở hữu.
    """

    owned_jobs = Job.objects.filter(company__user=user)
    
    queryset = Application.objects.filter(job__in=owned_jobs)
    
    # Total
    total = queryset.count()
    
    # By status
    status_counts = queryset.values('status').annotate(count=Count('id'))
    by_status = {item['status']: item['count'] for item in status_counts}
    
    # Recent 7 days
    week_ago = timezone.now() - timedelta(days=7)
    recent_7_days = queryset.filter(applied_at__gte=week_ago).count()
    
    return {
        "total": total,
        "by_status": by_status,
        "recent_7_days": recent_7_days
    }


def list_applications_for_export(user, job_id: int = None, status: str = None) -> QuerySet[Application]:
    """
        Lấy danh sách applications cho export với filters.
    """
    
    # Chỉ lấy applications của jobs mà user sở hữu
    owned_jobs = Job.objects.filter(company__user=user)
    queryset = Application.objects.filter(
        job__in=owned_jobs
    ).select_related(
        'recruiter', 'recruiter__user', 'job', 'job__company'
    )
    
    if job_id:
        queryset = queryset.filter(job_id=job_id)
    
    if status:
        queryset = queryset.filter(status=status)
    
    return queryset.order_by('-applied_at')


def list_applications_by_status(job_id: int, status: str) -> QuerySet[Application]:
    """
        Lấy danh sách applications theo job_id và status.
    """
    return Application.objects.filter(
        job_id=job_id,
        status=status
    ).select_related(
        'recruiter', 'recruiter__user', 'job', 'cv', 'reviewed_by'
    ).order_by('-applied_at')


def list_applications_by_rating(
    job_id: int, 
    rating: int = None, 
    min_rating: int = None, 
    max_rating: int = None
) -> QuerySet[Application]:
    """
        Lấy danh sách applications theo rating.
    """
    queryset = Application.objects.filter(
        job_id=job_id
    ).select_related(
        'recruiter', 'recruiter__user', 'job', 'cv', 'reviewed_by'
    )
    
    if rating is not None:
        queryset = queryset.filter(rating=rating)
    else:
        if min_rating is not None:
            queryset = queryset.filter(rating__gte=min_rating)
        if max_rating is not None:
            queryset = queryset.filter(rating__lte=max_rating)
    
    return queryset.order_by('-rating', '-applied_at')


def search_applications(job_id: int, query: str) -> QuerySet[Application]:
    """
        Tìm kiếm applications theo keyword.
    """
    
    return Application.objects.filter(
        job_id=job_id
    ).filter(
        Q(recruiter__user__full_name__icontains=query) |
        Q(recruiter__user__email__icontains=query) |
        Q(notes__icontains=query) |
        Q(cover_letter__icontains=query)
    ).select_related(
        'recruiter', 'recruiter__user', 'job', 'cv', 'reviewed_by'
    ).order_by('-applied_at')
