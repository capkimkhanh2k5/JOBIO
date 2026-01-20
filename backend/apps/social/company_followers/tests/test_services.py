from django.test import TestCase
from apps.core.users.models import CustomUser
from apps.company.companies.models import Company
from apps.candidate.recruiters.models import Recruiter
from apps.social.company_followers.models import CompanyFollower
from apps.social.company_followers.services.company_followers import (
    follow_company_service,
    unfollow_company_service
)

class CompanyFollowerServiceTest(TestCase):
    def setUp(self):
        self.user = CustomUser.objects.create_user(email="recruiter@test.com", password="password")
        self.recruiter = Recruiter.objects.create(user=self.user)
        
        self.company_user = CustomUser.objects.create_user(email="company@test.com", password="password")
        self.company = Company.objects.create(
            user=self.company_user, 
            company_name="Test Company", 
            slug="test-company-followers-service",
            follower_count=0
        )

        self.user_no_recruiter = CustomUser.objects.create_user(email="user@test.com", password="password")

    def test_follow_company_success(self):
        follower = follow_company_service(self.user, self.company.id)
        
        self.assertEqual(follower.recruiter, self.recruiter)
        self.assertEqual(follower.company, self.company)
        
        self.company.refresh_from_db()
        self.assertEqual(self.company.follower_count, 1)

    def test_follow_company_duplicate(self):
        follow_company_service(self.user, self.company.id)
        
        with self.assertRaises(ValueError):
            follow_company_service(self.user, self.company.id)
            
        self.company.refresh_from_db()
        self.assertEqual(self.company.follower_count, 1)

    def test_follow_company_not_recruiter(self):
        with self.assertRaises(ValueError):
            follow_company_service(self.company_user, self.company.id)

    def test_unfollow_company_success(self):
        follow_company_service(self.user, self.company.id)
        self.company.refresh_from_db()
        self.assertEqual(self.company.follower_count, 1)
        
        unfollow_company_service(self.user, self.company.id)
        
        self.assertFalse(CompanyFollower.objects.filter(recruiter=self.recruiter, company=self.company).exists())
        self.company.refresh_from_db()
        self.assertEqual(self.company.follower_count, 0)

    def test_unfollow_not_following(self):
        # Should not raise error, just do nothing
        unfollow_company_service(self.user, self.company.id)
        self.company.refresh_from_db()
        self.assertEqual(self.company.follower_count, 0)
