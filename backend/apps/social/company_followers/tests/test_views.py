from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from apps.core.users.models import CustomUser
from apps.company.companies.models import Company
from apps.candidate.recruiters.models import Recruiter
from apps.social.company_followers.models import CompanyFollower

class CompanyFollowerViewTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = CustomUser.objects.create_user(email="recruiter@test.com", password="password")
        self.recruiter = Recruiter.objects.create(user=self.user)
        self.client.force_authenticate(user=self.user)
        
        self.company_user = CustomUser.objects.create_user(email="company@test.com", password="password")
        self.company = Company.objects.create(
            user=self.company_user, 
            company_name="Test Company", 
            slug="test-company-followers-views",
            follower_count=0
        )

    def test_follow_company_api(self):
        response = self.client.post(f'/api/companies/{self.company.id}/follow/')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(CompanyFollower.objects.filter(recruiter=self.recruiter, company=self.company).exists())
        self.assertEqual(response.data['company'], self.company.id)

    def test_unfollow_company_api(self):
        CompanyFollower.objects.create(recruiter=self.recruiter, company=self.company)
        
        response = self.client.delete(f'/api/companies/{self.company.id}/unfollow/')
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(CompanyFollower.objects.filter(recruiter=self.recruiter, company=self.company).exists())

    def test_is_following_api(self):
        CompanyFollower.objects.create(recruiter=self.recruiter, company=self.company)
        
        response = self.client.get(f'/api/companies/{self.company.id}/is-following/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['is_following'])

        # Unfollow and check again
        CompanyFollower.objects.all().delete()
        response = self.client.get(f'/api/companies/{self.company.id}/is-following/')
        self.assertFalse(response.data['is_following'])

    def test_list_following_companies_api(self):
        c1 = Company.objects.create(
            user=CustomUser.objects.create_user(email="c1@t.com", password="p"), 
            company_name="C1",
            slug="c1-company"
        )
        c2 = Company.objects.create(
            user=CustomUser.objects.create_user(email="c2@t.com", password="p"), 
            company_name="C2",
            slug="c2-company"
        )
        
        CompanyFollower.objects.create(recruiter=self.recruiter, company=c1)
        CompanyFollower.objects.create(recruiter=self.recruiter, company=c2)
        
        response = self.client.get('/api/companies/following/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)
        
        # Verify specific content
        names = {item['company_name'] for item in response.data}
        self.assertEqual(names, {'C1', 'C2'})
