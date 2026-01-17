from django.db.models import QuerySet
from apps.company.companies.models import Company
from apps.social.company_followers.models import CompanyFollower

def list_following_companies(user) -> QuerySet[Company]:
    """
    Lấy danh sách các công ty mà user (recruiter) đang theo dõi.
    """
    if not hasattr(user, 'recruiter_profile'):
        return Company.objects.none()
        
    return Company.objects.filter(
        followers__recruiter=user.recruiter_profile
    ).select_related('industry', 'address')

def check_is_following(user, company_id: int) -> bool:
    """
    Kiểm tra user có đang theo dõi công ty không.
    """
    if not hasattr(user, 'recruiter_profile'):
        return False
        
    return CompanyFollower.objects.filter(
        recruiter=user.recruiter_profile,
        company_id=company_id
    ).exists()
