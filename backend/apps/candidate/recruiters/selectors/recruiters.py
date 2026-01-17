from apps.candidate.recruiters.models import Recruiter

# TODO: Define new selector for Stats
# function: get_recruiter_stats(recruiter: Recruiter) -> dict
# - Logic:
#   - Count profile_views
#   - Count following_companies (reverse relation)
#   - Count job_applications (future)
# - Return: {'profile_views': 100, 'following_companies': 5}

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
