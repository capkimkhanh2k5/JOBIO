from django.db import transaction, models
from django.shortcuts import get_object_or_404
from django.core.exceptions import ValidationError

from apps.company.companies.models import Company
from apps.social.company_followers.models import CompanyFollower

@transaction.atomic
def follow_company_service(user, company_id: int) -> CompanyFollower:
    """
    User (Recruiter) follow một công ty.
    """
    if not hasattr(user, 'recruiter_profile'):
        raise ValueError("Only recuiter can follow company.")
        
    recruiter = user.recruiter_profile
    company = get_object_or_404(Company, pk=company_id)
    
    # Check existing follow to avoid duplicate increment
    if CompanyFollower.objects.filter(recruiter=recruiter, company=company).exists():
        raise ValueError("You have already followed this company.")
        
    follower = CompanyFollower.objects.create(
        recruiter=recruiter,
        company=company
    )
    
    # Increment follower count
    Company.objects.filter(pk=company_id).update(follower_count=models.F('follower_count') + 1)
    
    return follower

@transaction.atomic
def unfollow_company_service(user, company_id: int) -> None:
    """
    User (Recruiter) unfollow một công ty.
    """
    if not hasattr(user, 'recruiter_profile'):
        raise ValueError("Only recuiter can unfollow company.")
        
    recruiter = user.recruiter_profile
    
    deleted_count, _ = CompanyFollower.objects.filter(
        recruiter=recruiter,
        company_id=company_id
    ).delete()
    
    if deleted_count > 0:
        # Decrement follower count, ensure not negative
        Company.objects.filter(pk=company_id, follower_count__gt=0).update(
            follower_count=models.F('follower_count') - 1
        )
