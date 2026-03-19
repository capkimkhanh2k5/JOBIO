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
    address: Optional[Address | dict] = None
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
    full_name: Optional[str] = None

    class Config:
        arbitrary_types_allowed = True

@transaction.atomic
def create_recruiter_service(user, data: RecruiterInput) -> Recruiter:
    """
    Tạo hồ sơ ứng viên (Recruiter profile).
    """
    if hasattr(user, 'recruiter_profile'):
        raise ValueError("User already has a recruiter profile.")

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
        if field == 'full_name':
            if recruiter.user:
                recruiter.user.full_name = value
                recruiter.user.save()
            continue
        
        if field == 'address' and isinstance(value, dict):
            from apps.geography.addresses.models import Address
            from apps.geography.provinces.models import Province
            from apps.geography.communes.models import Commune
            
            addr_data = value.copy()
            province_name = addr_data.pop('province', None)
            commune_name = addr_data.pop('commune', None)
            
            # Find province by name
            province = None
            if province_name:
                province = Province.objects.filter(province_name__icontains=province_name).first()
            
            # Find commune by name
            commune = None
            if commune_name and province:
                commune = Commune.objects.filter(commune_name__icontains=commune_name, province=province).first()
            
            if recruiter.address:
                for addr_key, addr_val in addr_data.items():
                    if hasattr(recruiter.address, addr_key):
                        setattr(recruiter.address, addr_key, addr_val)
                if province:
                    recruiter.address.province = province
                if commune:
                    recruiter.address.commune = commune
                recruiter.address.save()
            elif province: # Only create if we have a valid province
                addr_data['province'] = province
                addr_data['commune'] = commune
                recruiter.address = Address.objects.create(**addr_data)
            continue

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
        details['avatar'] = 10
    else:
        missing_fields.append('avatar')
        details['avatar'] = 0
    
    # 2. Bio > 50 chars (15 pts) - Quality check
    bio = recruiter.bio or ""
    if len(bio) >= 50:
        score += 15
        details['bio'] = 15
    elif len(bio) > 0:
        # Partial credit for short bio
        score += 5
        details['bio'] = 5
        missing_fields.append('bio (expand to 50+ chars)')
    else:
        missing_fields.append('bio')
        details['bio'] = 0
    
    # 3. Experience > 1 item (20 pts)
    experience_count = recruiter.experience.count() if hasattr(recruiter, 'experience') else 0
    if experience_count >= 2:
        score += 20
        details['experience'] = 20
    elif experience_count == 1:
        score += 10
        details['experience'] = 10
        missing_fields.append('experience (add more)')
    else:
        missing_fields.append('experience')
        details['experience'] = 0
    
    # 4. Education > 0 item (10 pts)
    education_count = recruiter.education.count() if hasattr(recruiter, 'education') else 0
    if education_count >= 1:
        score += 10
        details['education'] = 10
    else:
        missing_fields.append('education')
        details['education'] = 0
    
    # 5. Skills > 3 items (15 pts)
    skills_count = recruiter.skills.count() if hasattr(recruiter, 'skills') else 0
    if skills_count >= 4:
        score += 15
        details['skills'] = 15
    elif skills_count >= 1:
        # Partial credit
        partial = min(skills_count * 4, 12)  # 4 pts per skill up to 12
        score += partial
        details['skills'] = partial
        missing_fields.append('skills (add more)')
    else:
        missing_fields.append('skills')
        details['skills'] = 0
    
    # 6. Contact Info - Links (10 pts)
    contact_score = 0
    if recruiter.linkedin_url:
        contact_score += 4
    if recruiter.github_url or recruiter.portfolio_url:
        contact_score += 3
    if recruiter.address:
        contact_score += 3
    score += contact_score
    details['contact_info'] = contact_score
    if contact_score < 10:
        missing_fields.append('contact_links')
    
    # 7. Projects/Certifications (20 pts - Bonus)
    projects_count = recruiter.projects.count() if hasattr(recruiter, 'projects') else 0
    certs_count = recruiter.certifications.count() if hasattr(recruiter, 'certifications') else 0
    bonus_items = projects_count + certs_count
    if bonus_items >= 3:
        score += 20
        details['projects_certs'] = 20
    elif bonus_items >= 1:
        partial = min(bonus_items * 7, 14)  # 7 pts per item up to 14
        score += partial
        details['projects_certs'] = partial
    else:
        details['projects_certs'] = 0
    
    # Cap at 100
    final_score = min(score, 100)
    
    # Update DB
    recruiter.profile_completeness_score = final_score
    recruiter.save(update_fields=['profile_completeness_score'])
    
    # Create checklist for frontend
    checklist = [
        {'task': 'Thêm ảnh đại diện', 'completed': recruiter.user.avatar_url is not None},
        {'task': 'Cập nhật giới thiệu bản thân (>50 ký tự)', 'completed': len(recruiter.bio or "") >= 50},
        {'task': 'Thêm kinh nghiệm làm việc (>=2 mục)', 'completed': (recruiter.experience.count() if hasattr(recruiter, 'experience') else 0) >= 2},
        {'task': 'Thêm thông tin học vấn', 'completed': (recruiter.education.count() if hasattr(recruiter, 'education') else 0) >= 1},
        {'task': 'Thêm kỹ năng (>=4 kỹ năng)', 'completed': (recruiter.skills.count() if hasattr(recruiter, 'skills') else 0) >= 4},
        {'task': 'Liên kết mạng xã hội (LinkedIn/Github)', 'completed': (recruiter.linkedin_url or recruiter.github_url) is not None},
    ]

    return {
        'score': final_score,
        'missing_fields': missing_fields,
        'checklist': checklist,
        'details': details,
    }

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
