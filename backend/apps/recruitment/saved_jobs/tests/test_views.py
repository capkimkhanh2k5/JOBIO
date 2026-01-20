from rest_framework.test import APITestCase
from rest_framework import status
from apps.core.users.models import CustomUser
from apps.company.companies.models import Company
from apps.recruitment.jobs.models import Job
from apps.recruitment.saved_jobs.models import SavedJob
from apps.candidate.recruiters.models import Recruiter


class SavedJobViewTests(APITestCase):
    """Test cases for Saved Jobs APIs"""
    
    def setUp(self):
        # Create test users
        self.user = CustomUser.objects.create_user(
            email="user@example.com",
            password="password123",
            full_name="Test User"
        )
        self.other_user = CustomUser.objects.create_user(
            email="other@example.com",
            password="password123",
            full_name="Other User"
        )
        self.employer = CustomUser.objects.create_user(
            email="employer@example.com",
            password="password123",
            full_name="Employer"
        )
        
        # Create company and job
        self.company = Company.objects.create(
            user=self.employer,
            company_name="Test Company",
            description="A test company"
        )
        self.job = Job.objects.create(
            company=self.company,
            title="Python Developer",
            slug="python-developer-test",
            job_type="full-time",
            level="senior",
            description="Job description",
            requirements="Job requirements",
            status="published",
            created_by=self.employer
        )
        self.job2 = Job.objects.create(
            company=self.company,
            title="Django Developer",
            slug="django-developer-test",
            job_type="full-time",
            level="junior",
            description="Django job",
            requirements="Django requirements",
            status="published",
            created_by=self.employer
        )
        
        # Create recruiter profiles
        self.recruiter = Recruiter.objects.create(
            user=self.user,
            current_position="Software Engineer",
            bio="A software engineer"
        )
        self.other_recruiter = Recruiter.objects.create(
            user=self.other_user,
            current_position="Other Engineer",
            bio="Another engineer"
        )

    # ========== API #1: GET /api/recruiters/:id/saved-jobs/ ==========
    
    def test_list_saved_jobs_success(self):
        """GET /api/recruiters/:id/saved-jobs/ - list saved jobs → 200"""
        # Save a job first
        SavedJob.objects.create(
            recruiter=self.recruiter,
            job=self.job,
            folder_name="Tech Jobs"
        )
        
        self.client.force_authenticate(user=self.user)
        url = f'/api/recruiters/{self.recruiter.id}/saved-jobs/'
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
    
    def test_list_saved_jobs_empty(self):
        """GET /api/recruiters/:id/saved-jobs/ - empty → 200 + []"""
        self.client.force_authenticate(user=self.user)
        url = f'/api/recruiters/{self.recruiter.id}/saved-jobs/'
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data, [])
    
    def test_list_saved_jobs_unauthenticated(self):
        """GET /api/recruiters/:id/saved-jobs/ - không login → 401"""
        url = f'/api/recruiters/{self.recruiter.id}/saved-jobs/'
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    def test_list_saved_jobs_not_owner(self):
        """GET /api/recruiters/:id/saved-jobs/ - xem của người khác → 403"""
        self.client.force_authenticate(user=self.other_user)
        url = f'/api/recruiters/{self.recruiter.id}/saved-jobs/'
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
    
    def test_list_saved_jobs_recruiter_not_found(self):
        """GET /api/recruiters/:id/saved-jobs/ - recruiter không tồn tại → 404"""
        self.client.force_authenticate(user=self.user)
        url = '/api/recruiters/99999/saved-jobs/'
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    # ========== API #2: PATCH /api/saved-jobs/:id/ ==========
    
    def test_update_saved_job_success(self):
        """PATCH /api/saved-jobs/:id/ - cập nhật folder/notes → 200"""
        saved = SavedJob.objects.create(
            recruiter=self.recruiter,
            job=self.job
        )
        
        self.client.force_authenticate(user=self.user)
        url = f'/api/saved-jobs/{saved.id}/'
        data = {
            'folder_name': 'Tech Jobs',
            'notes': 'Interesting position'
        }
        response = self.client.patch(url, data)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['folder_name'], 'Tech Jobs')
    
    def test_update_saved_job_unauthenticated(self):
        """PATCH /api/saved-jobs/:id/ - không login → 401"""
        saved = SavedJob.objects.create(
            recruiter=self.recruiter,
            job=self.job
        )
        
        url = f'/api/saved-jobs/{saved.id}/'
        data = {'folder_name': 'Tech Jobs'}
        response = self.client.patch(url, data)
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    def test_update_saved_job_not_owner(self):
        """PATCH /api/saved-jobs/:id/ - non-owner → 403"""
        saved = SavedJob.objects.create(
            recruiter=self.recruiter,
            job=self.job
        )
        
        self.client.force_authenticate(user=self.other_user)
        url = f'/api/saved-jobs/{saved.id}/'
        data = {'folder_name': 'Hacked'}
        response = self.client.patch(url, data)
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
    
    def test_update_saved_job_not_found(self):
        """PATCH /api/saved-jobs/:id/ - không tồn tại → 404"""
        self.client.force_authenticate(user=self.user)
        url = '/api/saved-jobs/99999/'
        data = {'folder_name': 'Test'}
        response = self.client.patch(url, data)
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    # ========== API #3: POST /api/jobs/:id/save/ ==========
    
    def test_save_job_success(self):
        """POST /api/jobs/:id/save/ - lưu job → 201"""
        self.client.force_authenticate(user=self.user)
        
        url = f'/api/jobs/{self.job.id}/save/'
        data = {'folder_name': 'Tech Jobs'}
        response = self.client.post(url, data)
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(SavedJob.objects.filter(
            recruiter=self.recruiter,
            job=self.job
        ).exists())
    
    def test_save_job_unauthenticated(self):
        """POST /api/jobs/:id/save/ - không login → 401"""
        url = f'/api/jobs/{self.job.id}/save/'
        response = self.client.post(url)
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    def test_save_job_not_found(self):
        """POST /api/jobs/:id/save/ - job không tồn tại → 404"""
        self.client.force_authenticate(user=self.user)
        url = '/api/jobs/99999/save/'
        response = self.client.post(url)
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
    
    def test_save_job_no_recruiter_profile(self):
        """POST /api/jobs/:id/save/ - user không có recruiter profile → 404"""
        # Create user without recruiter profile
        new_user = CustomUser.objects.create_user(
            email="newuser@example.com",
            password="password123",
            full_name="New User"
        )
        
        self.client.force_authenticate(user=new_user)
        url = f'/api/jobs/{self.job.id}/save/'
        response = self.client.post(url)
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
    
    def test_save_job_already_saved(self):
        """POST /api/jobs/:id/save/ - đã lưu rồi → 400"""
        # Save job first
        SavedJob.objects.create(
            recruiter=self.recruiter,
            job=self.job
        )
        
        self.client.force_authenticate(user=self.user)
        url = f'/api/jobs/{self.job.id}/save/'
        response = self.client.post(url)
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    
    def test_save_job_with_folder(self):
        """POST /api/jobs/:id/save/ - lưu với folder_name → 201"""
        self.client.force_authenticate(user=self.user)
        
        url = f'/api/jobs/{self.job.id}/save/'
        data = {'folder_name': 'AI Jobs'}
        response = self.client.post(url, data)
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        saved = SavedJob.objects.get(recruiter=self.recruiter, job=self.job)
        self.assertEqual(saved.folder_name, 'AI Jobs')

    # ========== API #4: DELETE /api/jobs/:id/unsave/ ==========
    
    def test_unsave_job_success(self):
        """DELETE /api/jobs/:id/unsave/ - bỏ lưu → 204"""
        SavedJob.objects.create(
            recruiter=self.recruiter,
            job=self.job
        )
        
        self.client.force_authenticate(user=self.user)
        url = f'/api/jobs/{self.job.id}/unsave/'
        response = self.client.delete(url)
        
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(SavedJob.objects.filter(
            recruiter=self.recruiter,
            job=self.job
        ).exists())
    
    def test_unsave_job_unauthenticated(self):
        """DELETE /api/jobs/:id/unsave/ - không login → 401"""
        url = f'/api/jobs/{self.job.id}/unsave/'
        response = self.client.delete(url)
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    def test_unsave_job_not_found(self):
        """DELETE /api/jobs/:id/unsave/ - job không tồn tại → 404"""
        self.client.force_authenticate(user=self.user)
        url = '/api/jobs/99999/unsave/'
        response = self.client.delete(url)
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
    
    def test_unsave_job_not_saved(self):
        """DELETE /api/jobs/:id/unsave/ - chưa save mà unsave → 400"""
        self.client.force_authenticate(user=self.user)
        url = f'/api/jobs/{self.job.id}/unsave/'
        response = self.client.delete(url)
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    # ========== API #5: GET /api/jobs/:id/is-saved/ ==========
    
    def test_is_saved_true(self):
        """GET /api/jobs/:id/is-saved/ - đã save → {is_saved: true}"""
        SavedJob.objects.create(
            recruiter=self.recruiter,
            job=self.job
        )
        
        self.client.force_authenticate(user=self.user)
        url = f'/api/jobs/{self.job.id}/is-saved/'
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['is_saved'])
    
    def test_is_saved_false(self):
        """GET /api/jobs/:id/is-saved/ - chưa save → {is_saved: false}"""
        self.client.force_authenticate(user=self.user)
        url = f'/api/jobs/{self.job.id}/is-saved/'
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.data['is_saved'])
    
    def test_is_saved_unauthenticated(self):
        """GET /api/jobs/:id/is-saved/ - không login → {is_saved: false}"""
        url = f'/api/jobs/{self.job.id}/is-saved/'
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.data['is_saved'])
    
    def test_is_saved_job_not_found(self):
        """GET /api/jobs/:id/is-saved/ - job không tồn tại → 404"""
        self.client.force_authenticate(user=self.user)
        url = '/api/jobs/99999/is-saved/'
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    # ========== Business Logic Tests ==========
    
    def test_save_unsave_workflow(self):
        """Workflow: save → verify → unsave → verify unsaved"""
        self.client.force_authenticate(user=self.user)
        
        # Save job
        save_url = f'/api/jobs/{self.job.id}/save/'
        response = self.client.post(save_url)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Verify saved
        check_url = f'/api/jobs/{self.job.id}/is-saved/'
        response = self.client.get(check_url)
        self.assertTrue(response.data['is_saved'])
        
        # Unsave
        unsave_url = f'/api/jobs/{self.job.id}/unsave/'
        response = self.client.delete(unsave_url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        
        # Verify unsaved
        response = self.client.get(check_url)
        self.assertFalse(response.data['is_saved'])
    
    def test_folder_organization(self):
        """Lưu jobs vào các folders khác nhau"""
        self.client.force_authenticate(user=self.user)
        
        # Save job1 to folder A
        response1 = self.client.post(
            f'/api/jobs/{self.job.id}/save/',
            {'folder_name': 'AI Jobs'}
        )
        self.assertEqual(response1.status_code, status.HTTP_201_CREATED)
        
        # Save job2 to folder B
        response2 = self.client.post(
            f'/api/jobs/{self.job2.id}/save/',
            {'folder_name': 'Backend Jobs'}
        )
        self.assertEqual(response2.status_code, status.HTTP_201_CREATED)
        
        # Verify both saved with different folders
        saved1 = SavedJob.objects.get(recruiter=self.recruiter, job=self.job)
        saved2 = SavedJob.objects.get(recruiter=self.recruiter, job=self.job2)
        
        self.assertEqual(saved1.folder_name, 'AI Jobs')
        self.assertEqual(saved2.folder_name, 'Backend Jobs')
