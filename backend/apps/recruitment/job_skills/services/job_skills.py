from typing import Optional
from pydantic import BaseModel
from django.db import transaction

from apps.recruitment.jobs.models import Job
from apps.recruitment.job_skills.models import JobSkill


class JobSkillInput(BaseModel):
    """Pydantic input model cho job skill"""
    skill_id: int
    is_required: bool = True
    proficiency_level: Optional[str] = None
    years_required: Optional[int] = None


@transaction.atomic
def add_job_skill(job: Job, data: JobSkillInput) -> JobSkill:
    """
        Thêm kỹ năng yêu cầu cho job.
        Raise ValueError nếu skill đã tồn tại cho job.
    """
    # Kiểm tra kỹ năng đã tồn tại
    if JobSkill.objects.filter(job=job, skill_id=data.skill_id).exists():
        raise ValueError("Kỹ năng này đã được thêm cho công việc!")
    
    job_skill = JobSkill.objects.create(
        job=job,
        skill_id=data.skill_id,
        is_required=data.is_required,
        proficiency_level=data.proficiency_level,
        years_required=data.years_required
    )
    
    return job_skill


@transaction.atomic
def update_job_skill(job_skill: JobSkill, data: JobSkillInput) -> JobSkill:
    """
        Cập nhật job skill.
    """
    # Nếu đổi skill_id, check duplicate
    if data.skill_id != job_skill.skill_id:
        if JobSkill.objects.filter(job=job_skill.job, skill_id=data.skill_id).exists():
            raise ValueError("Kỹ năng này đã được thêm cho công việc!")
        job_skill.skill_id = data.skill_id
    
    job_skill.is_required = data.is_required
    job_skill.proficiency_level = data.proficiency_level
    job_skill.years_required = data.years_required
    job_skill.save()
    
    return job_skill


@transaction.atomic
def remove_job_skill(job_skill: JobSkill) -> None:
    """
        Xóa job skill.
    """
    job_skill.delete()
