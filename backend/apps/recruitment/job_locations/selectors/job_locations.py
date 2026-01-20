from typing import Optional
from django.db.models import QuerySet
from apps.recruitment.job_locations.models import JobLocation


def list_locations_by_job(job_id: int) -> QuerySet[JobLocation]:
    """
        Lấy danh sách locations cho job.
    """
    return JobLocation.objects.filter(
        job_id=job_id
    ).select_related(
        'address', 'address__province', 'address__commune'
    ).order_by('-is_primary', '-created_at')


def get_job_location_by_id(location_id: int) -> Optional[JobLocation]:
    """
        Lấy job location theo ID.
    """
    try:
        return JobLocation.objects.select_related(
            'address', 'address__province', 'address__commune', 
            'job', 'job__company'
        ).get(id=location_id)
    except JobLocation.DoesNotExist:
        return None
