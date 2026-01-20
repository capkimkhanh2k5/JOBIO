from typing import Optional
from django.db.models import QuerySet
from apps.recruitment.job_skills.models import JobSkill


def list_skills_by_job(job_id: int) -> QuerySet[JobSkill]:
    """
        Lấy danh sách skills cho job.
    """
    return JobSkill.objects.filter(
        job_id=job_id
    ).select_related('skill').order_by('-is_required', 'skill__name')


def get_job_skill_by_id(skill_id: int) -> Optional[JobSkill]:
    """
        Lấy job skill theo ID.
    """
    try:
        return JobSkill.objects.select_related('skill', 'job', 'job__company').get(id=skill_id)
    except JobSkill.DoesNotExist:
        return None
