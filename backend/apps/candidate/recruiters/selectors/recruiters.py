from typing import Optional
from django.db.models import QuerySet
from apps.candidate.recruiters.models import Recruiter
from apps.assessment.ai_matching_scores.models import AIMatchingScore
from django.contrib.postgres.search import SearchVector, SearchQuery, SearchRank
from django.db.models import F

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

def search_recruiters(filters: dict) -> QuerySet:
    """
    Advanced recruiter search using Postgres Full Text Search.
    
    filters can contain:
    - q: Search query (searches position, bio, skills)
    - skills: List of skill names or IDs
    - location: Province/City name
    - min_experience / experience_min: Minimum years of experience
    - max_experience / experience_max: Maximum years of experience
    - job_status / search_status: Job search status
    - education_level: Highest education level
    - salary_min / salary_max: Desired salary range
    """
    queryset = Recruiter.objects.filter(is_profile_public=True).select_related('user', 'address', 'address__province')
    
    # Full Text Search (q parameter)
    search_query = filters.get('q') or filters.get('search')
    if search_query and search_query.lower() != 'all':
        # Build search vector from multiple fields
        search_vector = SearchVector(
            'current_position', weight='A',
            config='english'
        ) + SearchVector(
            'bio', weight='B',
            config='english'
        )
        
        # Create query
        query = SearchQuery(search_query, config='english')
        
        # Annotate with search rank and filter
        queryset = queryset.annotate(
            search=search_vector,
            rank=SearchRank(search_vector, query)
        ).filter(search=query).order_by('-rank')
    
    # Normalize and Filter by job_status
    job_status = filters.get('job_status') or filters.get('search_status')
    if job_status and job_status.lower() != 'all':
        queryset = queryset.filter(job_search_status=job_status)
    
    # Normalize and Filter by experience range
    min_exp = filters.get('min_experience') or filters.get('experience_min')
    if min_exp is not None and str(min_exp).lower() != 'all':
        try:
            queryset = queryset.filter(years_of_experience__gte=int(min_exp))
        except (ValueError, TypeError):
            pass

    max_exp = filters.get('max_experience') or filters.get('experience_max')
    if max_exp is not None and str(max_exp).lower() != 'all':
        try:
            queryset = queryset.filter(years_of_experience__lte=int(max_exp))
        except (ValueError, TypeError):
            pass
    
    # Filter by salary range
    min_salary = filters.get('salary_min')
    if min_salary is not None and str(min_salary).lower() != 'all':
        try:
            queryset = queryset.filter(desired_salary_max__gte=float(min_salary))
        except (ValueError, TypeError):
            pass

    max_salary = filters.get('salary_max')
    if max_salary is not None and str(max_salary).lower() != 'all':
        try:
            queryset = queryset.filter(desired_salary_min__lte=float(max_salary))
        except (ValueError, TypeError):
            pass

    # Filter by education level
    edu_level = filters.get('education_level')
    if edu_level and edu_level.lower() != 'all':
        queryset = queryset.filter(highest_education_level=edu_level)
    
    # Filter by location (province via address)
    location = filters.get('location')
    if location and location.lower() != 'all':
        queryset = queryset.filter(
            address__province__province_name__icontains=location
        )
    
    # Filter by skills (exact or list)
    skills = filters.get('skills')
    if skills and str(skills).lower() != 'all':
        if isinstance(skills, str):
            skills = [s.strip() for s in skills.split(',')]
        # Filter recruiters who have at least one of the skills
        queryset = queryset.filter(skills__skill__name__in=skills).distinct()
    
    return queryset

def get_matching_jobs(recruiter: Recruiter) -> list:
    """
    Tìm kiếm công việc phù hợp với hồ sơ ứng viên.
    Sử dụng kết quả matching AI đã tính toán sẵn.
    """
    # Get top 10 jobs with highest overall score
    matches = AIMatchingScore.objects.filter(
        recruiter=recruiter,
        is_valid=True
    ).select_related('job', 'job__company', 'job__address').order_by('-overall_score')[:10]
    
    return [match.job for match in matches]

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
