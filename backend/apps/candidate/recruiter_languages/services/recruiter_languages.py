from typing import Optional

from pydantic import BaseModel, ConfigDict
from django.db import transaction

from apps.candidate.recruiter_languages.models import RecruiterLanguage
from apps.candidate.recruiters.models import Recruiter
from apps.candidate.languages.models import Language

MAX_LANGUAGE_NAME_LENGTH = 50

# Mapping from common native names / aliases → canonical language_name in DB.
# Keys must be lowercase, NFD-normalized, diacritics stripped, non-alphanum → space.
LANGUAGE_ALIASES: dict[str, str] = {
    "tieng viet": "Vietnamese",
    "viet nam": "Vietnamese",
    "tieng anh": "English",
    "tieng nhat": "Japanese",
    "nhat ban": "Japanese",
    "tieng han": "Korean",
    "han quoc": "Korean",
    "tieng trung": "Chinese",
    "trung quoc": "Chinese",
    "tieng phap": "French",
    "tieng duc": "German",
    "tieng tay ban nha": "Spanish",
    "tieng bo dao nha": "Portuguese",
    "tieng nga": "Russian",
    "tieng thai": "Thai",
    "tieng y": "Italian",
}


def _strip_diacritics(text: str) -> str:
    """Remove Vietnamese/Unicode diacritics for alias matching."""
    import unicodedata
    import re

    nfkd = unicodedata.normalize("NFD", text)
    without_marks = "".join(ch for ch in nfkd if unicodedata.category(ch) != "Mn")
    # Collapse special Vietnamese characters (đ/Đ)
    without_marks = without_marks.replace("đ", "d").replace("Đ", "D")
    # Collapse non-alphanumeric to single space
    return re.sub(r"[^a-zA-Z0-9]+", " ", without_marks).strip().lower()


def _resolve_language_alias(language_name: str) -> Optional[str]:
    """Resolve a language name to its canonical English name via alias lookup."""
    alias_key = _strip_diacritics(language_name)
    return LANGUAGE_ALIASES.get(alias_key)


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

        # Step 1: Try exact match on language_name
        language = Language.objects.filter(
            language_name__iexact=lang_name_clean, is_active=True
        ).first()

        # Step 2: Try matching on native_name (e.g. "Tiếng Việt")
        if not language:
            language = Language.objects.filter(
                native_name__iexact=lang_name_clean, is_active=True
            ).first()

        # Step 3: Resolve alias (e.g. "Tiếng Việt" → "Vietnamese") and retry
        if not language:
            canonical = _resolve_language_alias(lang_name_clean)
            if canonical:
                language = Language.objects.filter(
                    language_name__iexact=canonical, is_active=True
                ).first()

        # Step 4: Create new language only if all lookups failed
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
