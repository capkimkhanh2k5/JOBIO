from typing import Optional
from datetime import date
import re

from pydantic import BaseModel, ConfigDict
from django.db import transaction
from apps.candidate.recruiters.models import Recruiter
from apps.company.companies.models import Company
from apps.geography.addresses.models import Address
from apps.core.utils import remove_accents


LOCATION_ALIAS_MAP = {
    "hanoi": "ha noi",
    "hn": "ha noi",
    "danang": "da nang",
    "da nang city": "da nang",
    "hcm": "ho chi minh",
    "hcmc": "ho chi minh",
    "tp hcm": "ho chi minh",
    "tphcm": "ho chi minh",
    "tp ho chi minh": "ho chi minh",
    "ho chi minh city": "ho chi minh",
    "sai gon": "ho chi minh",
    "saigon": "ho chi minh",
    "hue": "hue",
    "hue city": "hue",
}
LOCATION_STOP_WORDS = {
    "viet nam",
    "vietnam",
    "vn",
    "city",
    "province",
    "tinh",
    "thanh pho",
    "tp",
}


def normalize_location_key(value: object) -> str:
    text = remove_accents(str(value or "")).lower()
    text = re.sub(r"[^a-z0-9]+", " ", text)
    text = re.sub(r"\s+", " ", text).strip()
    return LOCATION_ALIAS_MAP.get(text, text)


def compact_location_key(value: object) -> str:
    return normalize_location_key(value).replace(" ", "")


def simplify_location_key(value: object) -> str:
    text = normalize_location_key(value)
    for stop_word in LOCATION_STOP_WORDS:
        text = re.sub(rf"\b{re.escape(stop_word)}\b", " ", text)
    text = re.sub(r"\s+", " ", text).strip()
    return LOCATION_ALIAS_MAP.get(text, text)


def location_candidates(value: object) -> list[str]:
    text = str(value or "")
    pieces = [text]
    pieces.extend(re.split(r"[,;/|\\-]+", text))

    candidates: list[str] = []
    seen: set[str] = set()
    for piece in pieces:
        for candidate in (
            normalize_location_key(piece),
            simplify_location_key(piece),
            compact_location_key(piece),
        ):
            if (
                candidate
                and candidate not in LOCATION_STOP_WORDS
                and candidate not in seen
            ):
                seen.add(candidate)
                candidates.append(candidate)
    return candidates


def resolve_province_from_location(value: object):
    from apps.geography.provinces.models import Province

    if isinstance(value, int):
        return Province.objects.filter(id=value, is_active=True).first()
    if isinstance(value, str) and value.strip().isdigit():
        return Province.objects.filter(id=int(value.strip()), is_active=True).first()

    candidates = location_candidates(value)
    if not candidates:
        return None

    provinces = list(Province.objects.filter(is_active=True))
    exact_map = {}
    for province in provinces:
        for key in (
            normalize_location_key(province.province_name),
            simplify_location_key(province.province_name),
            compact_location_key(province.province_name),
        ):
            if key:
                exact_map[key] = province

    for candidate in candidates:
        province = exact_map.get(LOCATION_ALIAS_MAP.get(candidate, candidate))
        if province:
            return province

    normalized_full = f" {normalize_location_key(value)} "
    matches = []
    for key, province in exact_map.items():
        if len(key) >= 4 and f" {key} " in normalized_full:
            matches.append((len(key), province))
    if not matches:
        return None

    matches.sort(key=lambda item: item[0], reverse=True)
    return matches[0][1]


def resolve_commune_from_location(value: object, province=None, *extra_values: object):
    from apps.geography.communes.models import Commune

    if isinstance(value, int):
        queryset = Commune.objects.filter(id=value, is_active=True)
        if province:
            queryset = queryset.filter(province=province)
        return queryset.first()
    if isinstance(value, str) and value.strip().isdigit():
        queryset = Commune.objects.filter(id=int(value.strip()), is_active=True)
        if province:
            queryset = queryset.filter(province=province)
        return queryset.first()

    province_keys: set[str] = set()
    if province:
        province_keys.update(location_candidates(province.province_name))

    candidates: list[str] = []
    seen: set[str] = set()
    for source in (value, *extra_values):
        for candidate in location_candidates(source):
            if candidate in seen or candidate in province_keys:
                continue
            seen.add(candidate)
            candidates.append(candidate)

    if not candidates:
        return None

    queryset = Commune.objects.filter(is_active=True)
    if province:
        queryset = queryset.filter(province=province)
    communes = list(queryset)

    scored_matches = []
    for index, candidate in enumerate(candidates):
        if len(candidate) < 3:
            continue

        candidate_matches = []
        for commune in communes:
            keys = {
                normalize_location_key(commune.commune_name),
                simplify_location_key(commune.commune_name),
                compact_location_key(commune.commune_name),
            }
            if any(
                candidate == key
                or f" {candidate} " in f" {key} "
                or f" {key} " in f" {candidate} "
                for key in keys
                if key
            ):
                candidate_matches.append(commune)

        # A district-only value such as "Lien Chieu" can match many wards.
        # Only auto-select when the value identifies exactly one commune.
        unique_matches = {commune.id: commune for commune in candidate_matches}
        if len(unique_matches) == 1:
            scored_matches.append(
                (len(candidate), -index, next(iter(unique_matches.values())))
            )

    if not scored_matches:
        return None

    scored_matches.sort(key=lambda item: (item[0], item[1]), reverse=True)
    return scored_matches[0][2]


class RecruiterInput(BaseModel):
    current_company: Optional[Company] = None
    current_position: Optional[str] = None
    date_of_birth: Optional[date] = None
    gender: Optional[str] = None
    address: Optional[Address | dict] = None
    bio: Optional[str] = None
    linkedin_url: Optional[str] = None
    facebook_url: Optional[str] = None
    github_url: Optional[str] = None
    portfolio_url: Optional[str] = None

    desired_salary_min: Optional[float] = None
    desired_salary_max: Optional[float] = None
    salary_currency: Optional[str] = None
    available_from_date: Optional[date] = None
    years_of_experience: Optional[int] = None
    highest_education_level: Optional[str] = None

    full_name: Optional[str] = None

    model_config = ConfigDict(arbitrary_types_allowed=True)


@transaction.atomic
def create_recruiter_service(user, data: RecruiterInput) -> Recruiter:
    """
    Tạo hồ sơ ứng viên (Recruiter profile).
    """
    if hasattr(user, "recruiter_profile"):
        raise ValueError("User already has a recruiter profile.")

    fields = data.model_dump(exclude_unset=True)
    recruiter = Recruiter.objects.create(user=user, **fields)
    return recruiter


@transaction.atomic
def update_recruiter_service(recruiter: Recruiter, data: RecruiterInput) -> Recruiter:
    """
    Cập nhật hồ sơ ứng viên.
    """
    fields = data.model_dump(exclude_unset=True)
    for field, value in fields.items():
        if field == "full_name":
            if recruiter.user:
                recruiter.user.full_name = value
                recruiter.user.save()
            continue

        if field == "address" and isinstance(value, dict):
            from apps.geography.addresses.models import Address

            addr_data = value.copy()
            province_name = addr_data.pop("province", None)
            commune_name = addr_data.pop("commune", None)
            allowed_address_fields = {
                "address_line",
                "latitude",
                "longitude",
                "is_verified",
            }
            addr_data = {
                key: val
                for key, val in addr_data.items()
                if key in allowed_address_fields and val is not None
            }

            # Find province
            province = resolve_province_from_location(province_name)

            # Find commune/ward. CVs often put the ward inside address_line
            # and may provide a district in the commune field, so resolve from
            # both values and require a unique commune match.
            commune = resolve_commune_from_location(
                commune_name, province, addr_data.get("address_line")
            )

            if recruiter.address:
                for addr_key, addr_val in addr_data.items():
                    if hasattr(recruiter.address, addr_key):
                        setattr(recruiter.address, addr_key, addr_val)
                if province:
                    recruiter.address.province = province
                if commune:
                    recruiter.address.commune = commune
                recruiter.address.save()
            elif province:  # Only create if we have a valid province
                addr_data.setdefault("address_line", "")
                addr_data["province"] = province
                addr_data["commune"] = commune
                recruiter.address = Address.objects.create(**addr_data)
            continue

        setattr(recruiter, field, value)

    recruiter.save()
    return recruiter


@transaction.atomic
def delete_recruiter_service(recruiter: Recruiter) -> None:
    """
    Xóa hồ sơ ứng viên.
    """
    recruiter.delete()


def calculate_profile_completeness_service(recruiter: Recruiter) -> dict:
    """
    Calculate profile completeness using weighted scoring system.

    Weights:
    - Avatar: 10 pts
    - Bio (>50 chars): 15 pts
    - Experience (>1 item): 20 pts
    - Education (>0 item): 10 pts
    - Skills (>3 items): 15 pts
    - Contact Info (Links): 10 pts
    - Projects/Certifications: 20 pts (Bonus)

    Total: Max 100 points (capped)
    """
    score = 0
    missing_fields = []
    details = {}

    # 1. Avatar (10 pts)
    if recruiter.user.avatar_url:
        score += 10
        details["avatar"] = 10
    else:
        missing_fields.append("avatar")
        details["avatar"] = 0

    # 2. Bio > 50 chars (15 pts) - Quality check
    bio = recruiter.bio or ""
    if len(bio) >= 50:
        score += 15
        details["bio"] = 15
    elif len(bio) > 0:
        # Partial credit for short bio
        score += 5
        details["bio"] = 5
        missing_fields.append("bio (expand to 50+ chars)")
    else:
        missing_fields.append("bio")
        details["bio"] = 0

    # 3. Experience > 1 item (20 pts)
    experience_count = (
        recruiter.experiences.count() if hasattr(recruiter, "experiences") else 0
    )
    if experience_count >= 2:
        score += 20
        details["experience"] = 20
    elif experience_count == 1:
        score += 10
        details["experience"] = 10
        missing_fields.append("experience (add more)")
    else:
        missing_fields.append("experience")
        details["experience"] = 0

    # 4. Education > 0 item (10 pts)
    education_count = (
        recruiter.education.count() if hasattr(recruiter, "education") else 0
    )
    if education_count >= 1:
        score += 10
        details["education"] = 10
    else:
        missing_fields.append("education")
        details["education"] = 0

    # 5. Skills > 3 items (15 pts)
    skills_count = recruiter.skills.count() if hasattr(recruiter, "skills") else 0
    if skills_count >= 4:
        score += 15
        details["skills"] = 15
    elif skills_count >= 1:
        # Partial credit
        partial = min(skills_count * 4, 12)  # 4 pts per skill up to 12
        score += partial
        details["skills"] = partial
        missing_fields.append("skills (add more)")
    else:
        missing_fields.append("skills")
        details["skills"] = 0

    # 6. Contact Info - Links (10 pts)
    contact_score = 0
    if recruiter.linkedin_url or recruiter.github_url or recruiter.portfolio_url:
        contact_score += 7

    if recruiter.address:
        contact_score += 3

    score += contact_score
    details["contact_info"] = contact_score
    if contact_score < 10:
        missing_fields.append("contact_links")

    # 7. Projects/Certifications (20 pts - Bonus)
    projects_count = recruiter.projects.count() if hasattr(recruiter, "projects") else 0
    certs_count = (
        recruiter.certifications.count() if hasattr(recruiter, "certifications") else 0
    )
    bonus_items = projects_count + certs_count
    if bonus_items >= 3:
        score += 20
        details["projects_certs"] = 20
    elif bonus_items >= 1:
        partial = min(bonus_items * 7, 14)  # 7 pts per item up to 14
        score += partial
        details["projects_certs"] = partial
    else:
        details["projects_certs"] = 0

    # Cap at 100
    final_score = min(score, 100)

    # Update DB
    recruiter.profile_completeness_score = final_score
    recruiter.save(update_fields=["profile_completeness_score"])

    # Create checklist for frontend
    checklist = [
        {
            "task": "Thêm ảnh đại diện",
            "completed": bool(recruiter.user.avatar_url),
        },
        {
            "task": "Cập nhật giới thiệu bản thân",
            "completed": len(recruiter.bio or "") >= 50,
        },
        {
            "task": "Thêm kinh nghiệm làm việc",
            "completed": (
                recruiter.experiences.count()
                if hasattr(recruiter, "experiences")
                else 0
            )
            >= 2,
        },
        {
            "task": "Thêm thông tin học vấn",
            "completed": (
                recruiter.education.count() if hasattr(recruiter, "education") else 0
            )
            >= 1,
        },
        {
            "task": "Thêm kỹ năng",
            "completed": (
                recruiter.skills.count() if hasattr(recruiter, "skills") else 0
            )
            >= 4,
        },
        {
            "task": "Liên kết mạng xã hội (LinkedIn/Github/Portfolio)",
            "completed": bool(
                recruiter.linkedin_url
                or recruiter.github_url
                or recruiter.portfolio_url
            ),
        },
    ]

    return {
        "score": final_score,
        "missing_fields": missing_fields,
        "checklist": checklist,
        "details": details,
    }


def upload_recruiter_avatar_service(recruiter: Recruiter, file_data: dict) -> Recruiter:
    """
    Cập nhật ảnh đại diện cho hồ sơ ứng viên sử dụng Cloudinary.
    """
    from apps.core.users.services.users import upload_user_avatar

    avatar_file = file_data.get("avatar")
    if avatar_file:
        upload_user_avatar(recruiter.user, avatar_file)

    return recruiter
