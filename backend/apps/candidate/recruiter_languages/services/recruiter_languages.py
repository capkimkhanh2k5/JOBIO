from typing import Optional

from pydantic import BaseModel, ConfigDict
from django.db import transaction

from apps.candidate.recruiter_languages.models import RecruiterLanguage
from apps.candidate.recruiters.models import Recruiter
from apps.candidate.languages.models import Language

MAX_LANGUAGE_NAME_LENGTH = 50


def normalize_language_name(language_name: Optional[str]) -> str:
    name = (language_name or "").strip()
    if not name:
        raise ValueError("Tên ngôn ngữ không được để trống.")
    if len(name) > MAX_LANGUAGE_NAME_LENGTH:
        raise ValueError(f"Tên ngôn ngữ tối đa {MAX_LANGUAGE_NAME_LENGTH} ký tự.")
    return name


class LanguageInput(BaseModel):
    """
    Pydantic input model cho create/update recruiter language
    """

    language_id: Optional[int] = None
    language_name: Optional[str] = None
    proficiency_level: Optional[str] = None
    is_native: Optional[bool] = None

    model_config = ConfigDict(arbitrary_types_allowed=True)


@transaction.atomic
def create_language(recruiter: Recruiter, data: LanguageInput) -> RecruiterLanguage:
    """
    Thêm ngôn ngữ mới cho recruiter.

    Raises:
        ValueError: Nếu language_id không tồn tại hoặc đã được thêm
    """
    import uuid

    # Kiểm tra language tồn tại
    if data.language_id:
        language = Language.objects.filter(id=data.language_id, is_active=True).first()
    elif data.language_name:
        lang_name_clean = normalize_language_name(data.language_name)
        language = Language.objects.filter(
            language_name__iexact=lang_name_clean, is_active=True
        ).first()
        if not language:
            code = str(uuid.uuid4())[:8]
            language = Language.objects.create(
                language_name=lang_name_clean, language_code=code, is_active=True
            )
    else:
        raise ValueError("Phải cung cấp language_id hoặc language_name!")

    if not language:
        raise ValueError("Ngôn ngữ không tồn tại!")

    # Kiểm tra đã thêm language này chưa
    existing = RecruiterLanguage.objects.filter(
        recruiter=recruiter, language=language
    ).first()
    if existing:
        raise ValueError("Ngôn ngữ này đã được thêm!")

    # Tạo RecruiterLanguage
    recruiter_language = RecruiterLanguage.objects.create(
        recruiter=recruiter,
        language=language,
        proficiency_level=data.proficiency_level,
        is_native=data.is_native or False,
    )

    return recruiter_language


@transaction.atomic
def update_language(
    recruiter_language: RecruiterLanguage, data: LanguageInput
) -> RecruiterLanguage:
    """
    Cập nhật thông tin ngôn ngữ.
    Không cho phép update language_id.
    """
    fields = data.model_dump(exclude_unset=True)

    # Không cho update language_id
    fields.pop("language_id", None)
    fields.pop("language_name", None)

    for field, value in fields.items():
        if value is not None:
            setattr(recruiter_language, field, value)

    recruiter_language.save()
    return recruiter_language


@transaction.atomic
def delete_language(recruiter_language: RecruiterLanguage) -> None:
    """
    Xóa ngôn ngữ của recruiter.
    """
    recruiter_language.delete()
