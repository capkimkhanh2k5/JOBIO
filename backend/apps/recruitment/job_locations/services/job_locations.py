from pydantic import BaseModel
from django.db import transaction

from apps.recruitment.jobs.models import Job
from apps.recruitment.job_locations.models import JobLocation


class JobLocationInput(BaseModel):
    """
        Pydantic input model cho job location
    """
    address_id: int
    is_primary: bool = False


@transaction.atomic
def add_job_location(job: Job, data: JobLocationInput) -> JobLocation:
    """
        Thêm địa điểm làm việc cho job.
        Nếu is_primary=True, unset tất cả locations khác.
    """
    # Kiểm tra trùng lặp
    if JobLocation.objects.filter(job=job, address_id=data.address_id).exists():
        raise ValueError("Địa điểm này đã được thêm cho công việc!")
    
    # Nếu set primary, unset các locations khác
    if data.is_primary:
        JobLocation.objects.filter(job=job).update(is_primary=False)
    
    job_location = JobLocation.objects.create(
        job=job,
        address_id=data.address_id,
        is_primary=data.is_primary
    )
    
    return job_location


@transaction.atomic
def update_job_location(job_location: JobLocation, data: JobLocationInput) -> JobLocation:
    """
        Cập nhật job location.
    """
    # Nếu đổi address_id, check duplicate
    if data.address_id != job_location.address_id:
        if JobLocation.objects.filter(job=job_location.job, address_id=data.address_id).exists():
            raise ValueError("Địa điểm này đã được thêm cho công việc!")
        job_location.address_id = data.address_id
    
    # Nếu set primary, unset các locations khác
    if data.is_primary and not job_location.is_primary:
        JobLocation.objects.filter(job=job_location.job).update(is_primary=False)
    
    job_location.is_primary = data.is_primary
    job_location.save()
    
    return job_location


@transaction.atomic
def remove_job_location(job_location: JobLocation) -> None:
    """
        Xóa job location.
    """
    job_location.delete()
