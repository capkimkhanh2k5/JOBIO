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
