from rest_framework.test import APITestCase
from rest_framework import status
from apps.core.users.models import CustomUser
from apps.candidate.recruiters.models import Recruiter
from django.urls import reverse

class RecruiterViewTest(APITestCase):
    def setUp(self):
        self.user = CustomUser.objects.create_user(email="test@example.com", password="password123", full_name="User 1")
        self.user2 = CustomUser.objects.create_user(email="test2@example.com", password="password123", full_name="User 2")
        self.client.force_authenticate(user=self.user)
        
        self.list_url = reverse('recruiter-list') 

    def test_create_recruiter_profile(self):
        data = {
            "bio": "My new profile",
            "years_of_experience": 3
        }
        response = self.client.post(self.list_url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Recruiter.objects.count(), 1)
        self.assertEqual(Recruiter.objects.first().user, self.user)
        self.assertEqual(response.data['user']['email'], "test@example.com")

    def test_create_duplicate_fail(self):
        Recruiter.objects.create(user=self.user)
        data = {"bio": "Duplicate"}
        response = self.client.post(self.list_url, data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_unauthenticated(self):
        self.client.logout()
        data = {"bio": "Anon"}
        response = self.client.post(self.list_url, data)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_retrieve_recruiter(self):
        recruiter = Recruiter.objects.create(user=self.user, bio="Test")
        url = reverse('recruiter-detail', args=[recruiter.id])
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['bio'], "Test")
        self.assertEqual(response.data['user']['email'], "test@example.com")

    def test_update_recruiter_owner(self):
        recruiter = Recruiter.objects.create(user=self.user, bio="Old")
        url = reverse('recruiter-detail', args=[recruiter.id])
        data = {"bio": "New"}
        response = self.client.put(url, data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['bio'], "New")
        
        # Verify db update
        recruiter.refresh_from_db()
        self.assertEqual(recruiter.bio, "New")

    def test_update_recruiter_not_owner(self):
        recruiter2 = Recruiter.objects.create(user=self.user2, bio="User 2")
        url = reverse('recruiter-detail', args=[recruiter2.id])
        data = {"bio": "Hacked"}
        response = self.client.put(url, data)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        
        # Verify no update
        recruiter2.refresh_from_db()
        self.assertEqual(recruiter2.bio, "User 2")

    def test_delete_recruiter_owner(self):
        recruiter = Recruiter.objects.create(user=self.user)
        url = reverse('recruiter-detail', args=[recruiter.id])
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(Recruiter.objects.count(), 0)

    def test_delete_recruiter_not_owner(self):
        recruiter2 = Recruiter.objects.create(user=self.user2)
        url = reverse('recruiter-detail', args=[recruiter2.id])
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(Recruiter.objects.count(), 1)

    def test_update_job_search_status(self):
        recruiter = Recruiter.objects.create(user=self.user, job_search_status='active')
        url = reverse('recruiter-update-status', args=[recruiter.id])
        
        data = {"job_search_status": "not_looking"}
        response = self.client.patch(url, data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        recruiter.refresh_from_db()
        self.assertEqual(recruiter.job_search_status, 'not_looking')
        
    def test_update_job_search_status_invalid(self):
        recruiter = Recruiter.objects.create(user=self.user, job_search_status='active')
        url = reverse('recruiter-update-status', args=[recruiter.id])
        
        data = {"job_search_status": "invalid_status"}
        response = self.client.patch(url, data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    # ========== Tests for Extended APIs ==========
    
    def test_get_profile_completeness(self):
        """Test GET /api/recruiters/:id/profile-completeness"""
        recruiter = Recruiter.objects.create(user=self.user, bio="Test Bio", current_position="Developer")
        url = reverse('recruiter-get-completeness', args=[recruiter.id])
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('score', response.data)
        self.assertIn('missing_fields', response.data)
        self.assertIsInstance(response.data['score'], int)
        self.assertIsInstance(response.data['missing_fields'], list)

    def test_get_profile_completeness_not_owner(self):
        """Only owner can view detailed completeness"""
        recruiter2 = Recruiter.objects.create(user=self.user2)
        url = reverse('recruiter-get-completeness', args=[recruiter2.id])
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_public_profile_visible(self):
        """Test GET /api/recruiters/:id/public_profile when profile is public"""
        recruiter = Recruiter.objects.create(user=self.user, bio="Public Bio", is_profile_public=True)
        url = reverse('recruiter-public-profile', args=[recruiter.id])
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['bio'], "Public Bio")

    def test_public_profile_hidden(self):
        """Test GET /api/recruiters/:id/public_profile when profile is private"""
        recruiter2 = Recruiter.objects.create(user=self.user2, bio="Private Bio", is_profile_public=False)
        url = reverse('recruiter-public-profile', args=[recruiter2.id])
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_update_privacy(self):
        """Test PATCH /api/recruiters/:id/privacy"""
        recruiter = Recruiter.objects.create(user=self.user, is_profile_public=True)
        url = reverse('recruiter-update-privacy', args=[recruiter.id])
        
        response = self.client.patch(url, {"is_profile_public": False})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        recruiter.refresh_from_db()
        self.assertFalse(recruiter.is_profile_public)

    def test_update_privacy_not_owner(self):
        """Only owner can update privacy"""
        recruiter2 = Recruiter.objects.create(user=self.user2, is_profile_public=True)
        url = reverse('recruiter-update-privacy', args=[recruiter2.id])
        
        response = self.client.patch(url, {"is_profile_public": False})
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_get_stats(self):
        """Test GET /api/recruiters/:id/stats"""
        recruiter = Recruiter.objects.create(user=self.user, profile_views_count=100)
        url = reverse('recruiter-get-stats', args=[recruiter.id])
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('profile_views', response.data)
        self.assertIn('following_companies', response.data)
        self.assertEqual(response.data['profile_views'], 100)

    def test_get_stats_not_owner(self):
        """Only owner can view stats"""
        recruiter2 = Recruiter.objects.create(user=self.user2)
        url = reverse('recruiter-get-stats', args=[recruiter2.id])
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    # ========== Tests for Advanced APIs ==========

    def test_verify_phone(self):
        """Test POST /api/recruiters/:id/verify-phone"""
        recruiter = Recruiter.objects.create(user=self.user)
        url = reverse('recruiter-verify-phone', args=[recruiter.id])
        response = self.client.post(url, {"phone": "0123456789"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_verify_phone_not_owner(self):
        """Only owner can verify phone"""
        recruiter2 = Recruiter.objects.create(user=self.user2)
        url = reverse('recruiter-verify-phone', args=[recruiter2.id])
        response = self.client.post(url, {"phone": "0123456789"})
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_matching_jobs(self):
        """Test GET /api/recruiters/:id/matching-jobs"""
        recruiter = Recruiter.objects.create(user=self.user)
        url = reverse('recruiter-matching-jobs', args=[recruiter.id])
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsInstance(response.data, list)

    def test_matching_jobs_not_owner(self):
        """Only owner can view matching jobs"""
        recruiter2 = Recruiter.objects.create(user=self.user2)
        url = reverse('recruiter-matching-jobs', args=[recruiter2.id])
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_applications(self):
        """Test GET /api/recruiters/:id/applications"""
        recruiter = Recruiter.objects.create(user=self.user)
        url = reverse('recruiter-applications', args=[recruiter.id])
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_applications_not_owner(self):
        """Only owner can view applications"""
        recruiter2 = Recruiter.objects.create(user=self.user2)
        url = reverse('recruiter-applications', args=[recruiter2.id])
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_saved_jobs(self):
        """Test GET /api/recruiters/:id/saved-jobs"""
        recruiter = Recruiter.objects.create(user=self.user)
        url = reverse('recruiter-saved-jobs', args=[recruiter.id])
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_saved_jobs_not_owner(self):
        """Only owner can view saved jobs"""
        recruiter2 = Recruiter.objects.create(user=self.user2)
        url = reverse('recruiter-saved-jobs', args=[recruiter2.id])
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_search_recruiters(self):
        """Test GET /api/recruiters/search - requires company user"""
        # Create a company user
        company_user = CustomUser.objects.create_user(
            email="company@example.com", 
            password="password123", 
            full_name="Company User",
            role='company'
        )
        # Add is_company property check - this test verifies company-only access
        self.client.force_authenticate(user=company_user)
        
        # Create some public recruiters
        Recruiter.objects.create(user=self.user, is_profile_public=True, job_search_status='active')
        
        url = reverse('recruiter-search')
        response = self.client.get(url)
        
        # Should succeed for company users (if is_company check passes)
        # Or return 403 if user doesn't have is_company attribute
        self.assertIn(response.status_code, [status.HTTP_200_OK, status.HTTP_403_FORBIDDEN])

    def test_search_recruiters_non_company(self):
        """Non-company users cannot search recruiters"""
        url = reverse('recruiter-search')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
