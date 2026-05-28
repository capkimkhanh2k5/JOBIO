from typing import Optional

from django.db import IntegrityError, transaction

from apps.candidate.skill_categories.models import SkillCategory
from apps.candidate.skills.models import Skill
from apps.core.utils import slugify_vietnamese as slugify


CUSTOM_SKILL_CATEGORY_NAME = "Khác"
CUSTOM_SKILL_CATEGORY_SLUG = "khac"
MAX_SKILL_NAME_LENGTH = 100


def normalize_skill_name(skill_name: Optional[str]) -> str:
    name = (skill_name or "").strip()
    if not name:
        raise ValueError("Tên kỹ năng không được để trống.")
    if len(name) > MAX_SKILL_NAME_LENGTH:
        raise ValueError(f"Tên kỹ năng tối đa {MAX_SKILL_NAME_LENGTH} ký tự.")
    return name


def get_custom_skill_category() -> SkillCategory:
    category = SkillCategory.objects.filter(slug=CUSTOM_SKILL_CATEGORY_SLUG).first()
    if category:
        return category

    try:
        with transaction.atomic():
            return SkillCategory.objects.create(
                name=CUSTOM_SKILL_CATEGORY_NAME,
                slug=CUSTOM_SKILL_CATEGORY_SLUG,
                is_active=True,
            )
    except IntegrityError:
        return SkillCategory.objects.get(slug=CUSTOM_SKILL_CATEGORY_SLUG)


def get_or_create_custom_skill(skill_name: str) -> Skill:
    name = normalize_skill_name(skill_name)
    skill = Skill.objects.filter(name__iexact=name).first()
    if skill:
        return skill

    category = get_custom_skill_category()
    try:
        with transaction.atomic():
            return Skill.objects.create(
                name=name,
                category=category,
                is_verified=False,
                is_active=True,
            )
    except IntegrityError:
        skill = Skill.objects.filter(name__iexact=name).first()
        if skill:
            return skill

        slug = slugify(name)
        skill = Skill.objects.filter(slug=slug).first()
        if skill:
            return skill
        raise


def resolve_skill(
    skill_id: Optional[int] = None, skill_name: Optional[str] = None
) -> Skill:
    if skill_id:
        skill = Skill.objects.filter(id=skill_id).first()
        if not skill:
            raise ValueError("Skill không tồn tại!")
        return skill

    if skill_name is not None:
        return get_or_create_custom_skill(skill_name)

    raise ValueError("Phải cung cấp skill_id hoặc skill_name!")
