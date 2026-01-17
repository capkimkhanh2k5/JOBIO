from typing import Optional
from datetime import date
from pydantic import BaseModel
from django.db import transaction
from apps.candidate.recruiters.models import Recruiter
from apps.company.companies.models import Company
from apps.geography.addresses.models import Address

class RecruiterInput(BaseModel):
    current_company: Optional[Company] = None
    current_position: Optional[str] = None
    date_of_birth: Optional[date] = None
    gender: Optional[str] = None
    address: Optional[Address] = None
    bio: Optional[str] = None
    linkedin_url: Optional[str] = None
    facebook_url: Optional[str] = None
    github_url: Optional[str] = None
    portfolio_url: Optional[str] = None
    job_search_status: Optional[str] = None
    desired_salary_min: Optional[float] = None
    desired_salary_max: Optional[float] = None
    salary_currency: Optional[str] = None
    available_from_date: Optional[date] = None
    years_of_experience: Optional[int] = None
    highest_education_level: Optional[str] = None
    is_profile_public: Optional[bool] = None

    class Config:
        arbitrary_types_allowed = True

# TODO: Define new services for Extended APIs
# 1. calculate_profile_completeness_service(recruiter: Recruiter) -> dict
#    - Input: Recruiter instance
#    - Logic: Check fields (bio, position, avatar...), calculate score, update DB.
#    - Return: {'score': 80, 'missing_fields': ['bio', 'avatar']}
#
# 2. upload_recruiter_avatar_service(user: CustomUser, file_data: RecruiterAvatarInput) -> str
#    - Input: User, file
#    - Logic: Upload to Cloudinary, update user.avatar_url
#    - Return: New Avatar URL
#
# 3. update_recruiter_privacy_service(recruiter: Recruiter, is_public: bool) -> Recruiter
#    - Input: Recruiter, bool
#    - Logic: Update is_profile_public

@transaction.atomic
def create_recruiter_service(user, data: RecruiterInput) -> Recruiter:
    """
    Tạo hồ sơ ứng viên (Recruiter profile).
    """
    if hasattr(user, 'recruiter_profile'):
        raise ValueError("User already has a recruiter profile.")
        
    #TODO: Điều chỉnh để có thể phù hợp
    #Sử dụng default tạm thời

    fields = data.dict(exclude_unset=True)
    recruiter = Recruiter.objects.create(user=user, **fields)
    return recruiter

@transaction.atomic
def update_recruiter_service(recruiter: Recruiter, data: RecruiterInput) -> Recruiter:
    """
    Cập nhật hồ sơ ứng viên.
    """
    fields = data.dict(exclude_unset=True)
    for field, value in fields.items():
        setattr(recruiter, field, value)
    
    recruiter.save()
    return recruiter

@transaction.atomic
def update_job_search_status_service(recruiter: Recruiter, status: str) -> Recruiter:
    """
    Cập nhật trạng thái tìm việc.
    """
    if status not in Recruiter.JobSearchStatus.values:
        raise ValueError("Invalid job search status")
    
    recruiter.job_search_status = status
    recruiter.save()
    return recruiter

@transaction.atomic
def delete_recruiter_service(recruiter: Recruiter) -> None:
    """
    Xóa hồ sơ ứng viên.
    """
    recruiter.delete()
