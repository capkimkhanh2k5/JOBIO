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

def calculate_profile_completeness_service(recruiter: Recruiter) -> dict:
    """
    Tính toán mức độ hoàn thiện hồ sơ.
    """
    score = 0
    missing_fields = []
    
    #TODO: Điều chỉnh để có thể phù hợp sau này tích hợp AI để có thể đánh giá mức độ hoàn thiện hồ sơ
    
    # Check fields
    if recruiter.bio:
        score += 10
    else:
        missing_fields.append('bio')
    
    if recruiter.current_position:
        score += 10
    else:
        missing_fields.append('current_position')
    
    if recruiter.current_company:
        score += 10
    else:
        missing_fields.append('current_company')
    
    if recruiter.years_of_experience:
        score += 10
    else:
        missing_fields.append('years_of_experience')
    
    if recruiter.highest_education_level:
        score += 10
    else:
        missing_fields.append('highest_education_level')

    if recruiter.user.avatar_url:
        score += 10
    else:
        missing_fields.append('avatar') 
    
    if recruiter.address:
        score += 10
    else:
        missing_fields.append('address')

    if recruiter.linkedin_url:
        score += 10
    else:
        missing_fields.append('linkedin_url')

    if recruiter.facebook_url:
        score += 10
    else:
        missing_fields.append('facebook_url')

    if recruiter.portfolio_url:
        score += 10
    else:
        missing_fields.append('portfolio_url')

    # Update DB
    recruiter.profile_completeness_score = score
    recruiter.save()
    
    return {'score': score, 'missing_fields': missing_fields}

def upload_recruiter_avatar_service(recruiter: Recruiter, file_data: dict) -> Recruiter:
    """
    Cập nhật ảnh đại diện cho hồ sơ ứng viên.
    """
    recruiter.user.avatar_url = file_data.get('avatar')
    recruiter.user.save()
    return recruiter

def update_recruiter_privacy_service(recruiter: Recruiter, is_public: bool) -> Recruiter:
    """
    Cập nhật trạng thái riêng tư của hồ sơ ứng viên.
    """
    recruiter.is_profile_public = is_public
    recruiter.save()
    return recruiter

#TODO: Thực hiện xác minh số điện thoại với SMS hoặc Telegram sau khi có API
def send_phone_otp_service(user, phone: str) -> bool:
    # def send_phone_otp_service(user, phone: str) -> bool:
    #     - Generate OTP, store in cache/db
    #     - Send SMS via Twilio/other provider
    #     - Return: success status
    return True

#TODO: Thực hiện xác minh số điện thoại với SMS hoặc Telegram sau khi có API
def verify_phone_otp_service(user, otp_code: str) -> bool:
    #     - Validate OTP from cache/db
    #     - Update user.phone_verified = True
    #     - Return: success status
    return True