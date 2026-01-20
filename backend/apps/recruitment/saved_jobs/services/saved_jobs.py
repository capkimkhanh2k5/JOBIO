from typing import Optional
from pydantic import BaseModel
from django.db import transaction

from apps.candidate.recruiters.models import Recruiter
from apps.recruitment.jobs.models import Job
from apps.recruitment.saved_jobs.models import SavedJob


class SavedJobUpdateInput(BaseModel):
    """
        Pydantic input model cho update/saved job
    """
    folder_name: Optional[str] = None
    notes: Optional[str] = None


@transaction.atomic
def save_job(recruiter: Recruiter, job: Job, folder_name: str = None) -> SavedJob:
    """
        Lưu job cho recruiter.
        Raise ValueError nếu đã lưu rồi.
    """
    if SavedJob.objects.filter(recruiter=recruiter, job=job).exists():
        raise ValueError("You have already saved this job!")
    
    saved_job = SavedJob.objects.create(
        recruiter=recruiter,
        job=job,
        folder_name=folder_name
    )
    
    return saved_job


@transaction.atomic
def unsave_job(recruiter: Recruiter, job: Job) -> None:
    """
        Bỏ lưu job.
        Raise ValueError nếu chưa lưu.
    """
    try:
        saved_job = SavedJob.objects.get(recruiter=recruiter, job=job)
        saved_job.delete()
    except SavedJob.DoesNotExist:
        raise ValueError("You haven't saved this job!")


@transaction.atomic
def update_saved_job(saved_job: SavedJob, data: SavedJobUpdateInput) -> SavedJob:
    """
        Cập nhật folder_name và notes cho saved job.
    """
    if data.folder_name is not None:
        saved_job.folder_name = data.folder_name if data.folder_name else None
    
    if data.notes is not None:
        saved_job.notes = data.notes if data.notes else None
    
    saved_job.save()
    return saved_job
