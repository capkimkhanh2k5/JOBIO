from typing import Optional
from datetime import date

from pydantic import BaseModel, ConfigDict
from django.db import transaction

from apps.candidate.recruiters.models import Recruiter
from apps.candidate.recruiter_skills.models import RecruiterSkill
from apps.candidate.skills.services.skills import resolve_skill


class SkillInput(BaseModel):
    """Input để tạo/update skill cho recruiter"""

    skill_id: Optional[int] = None
    skill_name: Optional[str] = None
    proficiency_level: Optional[str] = None
    years_of_experience: Optional[int] = None
    last_used_date: Optional[date] = None

    model_config = ConfigDict(arbitrary_types_allowed=True)


@transaction.atomic
def create_skill(recruiter: Recruiter, data: SkillInput) -> RecruiterSkill:
    """
    Tạo skill mới cho recruiter.

    Returns:
        RecruiterSkill: Skill vừa tạo

    Raises:
        ValueError: Nếu skill_id không tồn tại hoặc đã được thêm
    """
    skill = resolve_skill(data.skill_id, data.skill_name)

    existing = RecruiterSkill.objects.filter(recruiter=recruiter, skill=skill).first()
    if existing:
        raise ValueError("Skill này đã được thêm!")

    recruiter_skill = RecruiterSkill.objects.create(
        recruiter=recruiter,
        skill=skill,
        proficiency_level=data.proficiency_level or "intermediate",
        years_of_experience=data.years_of_experience,
        last_used_date=data.last_used_date,
    )

    return recruiter_skill


@transaction.atomic
def update_skill(recruiter_skill: RecruiterSkill, data: SkillInput) -> RecruiterSkill:
    """
    Cập nhật thông tin skill của recruiter.
    Không cho phép update skill_id.

    Returns:
        RecruiterSkill: Skill đã cập nhật
    """
    fields = data.model_dump(exclude_unset=True)

    # xoá skill_id nếu có (không cho update)
    fields.pop("skill_id", None)
    fields.pop("skill_name", None)

    for field, value in fields.items():
        if value is not None:
            setattr(recruiter_skill, field, value)

    recruiter_skill.save()
    return recruiter_skill


@transaction.atomic
def delete_skill(recruiter_skill: RecruiterSkill) -> None:
    """Xóa skill của recruiter (Hard delete)"""
    recruiter_skill.delete()


@transaction.atomic
def bulk_add_skills(
    recruiter: Recruiter, skills_data: list[SkillInput]
) -> list[RecruiterSkill]:
    """
    Thêm nhiều skill cùng lúc cho recruiter.
    Skip duplicate skills without raising error.

    Returns:
        list[RecruiterSkill]: Danh sách skill vừa thêm
    """
    created_skills = []

    # Lấy skill_ids đã tồn tại của recruiter
    existing_skill_ids = set(
        RecruiterSkill.objects.filter(recruiter=recruiter).values_list(
            "skill_id", flat=True
        )
    )

    for skill_data in skills_data:
        # Bỏ qua nếu skill đã tồn tại
        if skill_data.skill_id in existing_skill_ids:
            continue

        try:
            skill = resolve_skill(skill_data.skill_id, skill_data.skill_name)
        except ValueError:
            continue
        if skill.id in existing_skill_ids:
            continue

        # Tạo RecruiterSkill mới
        recruiter_skill = RecruiterSkill.objects.create(
            recruiter=recruiter,
            skill=skill,
            proficiency_level=skill_data.proficiency_level or "intermediate",
            years_of_experience=skill_data.years_of_experience,
            last_used_date=skill_data.last_used_date,
        )
        created_skills.append(recruiter_skill)
        existing_skill_ids.add(skill.id)

    return created_skills
