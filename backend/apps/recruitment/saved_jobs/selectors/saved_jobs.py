from typing import Optional
from django.db.models import QuerySet
from apps.recruitment.saved_jobs.models import SavedJob


def list_saved_jobs_by_recruiter(recruiter_id: int) -> QuerySet[SavedJob]:
    """
        Lấy danh sách saved jobs theo recruiter.
    """
    return SavedJob.objects.filter(
        recruiter_id=recruiter_id
    ).select_related(
        'job', 'job__company'
    ).order_by('-created_at')


def get_saved_job_by_id(saved_job_id: int) -> Optional[SavedJob]:
    """
        Lấy saved job theo ID.
    """
    try:
        return SavedJob.objects.select_related(
            'job', 'job__company', 'recruiter', 'recruiter__user'
        ).get(id=saved_job_id)
    except SavedJob.DoesNotExist:
        return None


def get_saved_job_by_recruiter_and_job(recruiter_id: int, job_id: int) -> Optional[SavedJob]:
    """
        Lấy saved job theo recruiter_id và job_id.
    """
    try:
        return SavedJob.objects.select_related(
            'job', 'job__company'
        ).get(recruiter_id=recruiter_id, job_id=job_id)
    except SavedJob.DoesNotExist:
        return None


def is_job_saved(recruiter_id: int, job_id: int) -> bool:
    """
        Kiểm tra job đã được lưu bởi recruiter chưa.
    """
    return SavedJob.objects.filter(
        recruiter_id=recruiter_id,
        job_id=job_id
    ).exists()
