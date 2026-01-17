from typing import Optional
from django.db.models import QuerySet
from apps.candidate.recruiters.models import Recruiter

def get_recruiter_by_user(user) -> Optional[Recruiter]:
    """
    Lấy hồ sơ ứng viên theo user.
    """
    if not hasattr(user, 'recruiter_profile'):
        return None
    return user.recruiter_profile

def get_recruiter_by_id(pk: int) -> Optional[Recruiter]:
    """
    Lấy hồ sơ ứng viên theo ID.
    """
    try:
        return Recruiter.objects.get(pk=pk)
    except Recruiter.DoesNotExist:
        return None

def get_recruiter_stats(recruiter: Recruiter) -> dict:
    """
    Lấy thống kê hồ sơ ứng viên.
    """
    # following_companies là reverse relation từ CompanyFollower model
    following_count = recruiter.following_companies.count() if hasattr(recruiter, 'following_companies') else 0
    
    return {
        'profile_views': recruiter.profile_views_count,
        'following_companies': following_count,
    }

#TODO: Thực hiện tìm kiếm hồ sơ ứng viên với các filter: skills, location, min_experience, job_status có thể nhiều hơn
def search_recruiters(filters: dict) -> QuerySet:
    """
    Tìm kiếm hồ sơ ứng viên theo các filter.
    filters có thể chứa: skills, location, min_experience, job_status
    """
    queryset = Recruiter.objects.filter(is_profile_public=True)
    
    # Filter by job_status
    if filters.get('job_status'):
        queryset = queryset.filter(job_search_status=filters['job_status'])
    
    # Filter by min_experience
    if filters.get('min_experience'):
        queryset = queryset.filter(years_of_experience__gte=int(filters['min_experience']))
    
    # Filter by location (address)
    if filters.get('location'):
        queryset = queryset.filter(address__city__icontains=filters['location'])
    
    return queryset

def get_matching_jobs(recruiter: Recruiter) -> list:
    """
    Tìm kiếm công việc phù hợp với hồ sơ ứng viên.
    """
    # TODO: Bổ sung thuật toán matching AI/Algorithm based matching
    return []

def get_recruiter_applications(recruiter: Recruiter) -> QuerySet:
    """
    Lấy các CV đã ứng tuyển của hồ sơ ứng viên.
    """
    return recruiter.applications.all()

def get_saved_jobs(recruiter: Recruiter) -> QuerySet:
    """
    Lấy các công việc đã lưu của hồ sơ ứng viên.
    """
    return recruiter.saved_jobs.all()
