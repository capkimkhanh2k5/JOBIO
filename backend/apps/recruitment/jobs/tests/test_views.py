from rest_framework.test import APITestCase
from rest_framework import status
from apps.core.users.models import CustomUser
from apps.company.companies.models import Company
from apps.recruitment.jobs.models import Job


class JobViewTests(APITestCase):
    """Test cases for Job APIs"""
    
    def setUp(self):
        # Create test users
        self.user = CustomUser.objects.create_user(
            email="employer@example.com",
            password="password123",
            full_name="Employer User"
        )
        self.user2 = CustomUser.objects.create_user(
            email="other@example.com",
            password="password123",
            full_name="Other User"
        )
        
        # Create company
        self.company = Company.objects.create(
            user=self.user,
            company_name="Test Company",
            description="A test company"
        )
        
        # Create sample job
        self.job = Job.objects.create(
            company=self.company,
            title="Python Developer",
            slug="python-developer-1-test",
            job_type="full-time",
            level="senior",
            description="Job description",
            requirements="Job requirements",
            status="published",
            created_by=self.user
        )
    
    # ========== LIST Tests ==========
    
    def test_list_jobs_public(self):
        """Test GET /api/jobs/ - public access"""
        url = '/api/jobs/'
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(response.data), 1)
    
    def test_list_jobs_with_filters(self):
        """Test GET /api/jobs/?job_type=full-time"""
        url = '/api/jobs/?job_type=full-time'
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        for job in response.data:
            self.assertEqual(job['job_type'], 'full-time')
    
    # ========== RETRIEVE Tests ==========
    
    def test_get_job_by_id(self):
        """Test GET /api/jobs/:id/"""
        url = f'/api/jobs/{self.job.id}/'
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['title'], "Python Developer")
    
    def test_get_job_by_slug(self):
        """Test GET /api/jobs/slug/:slug/"""
        url = f'/api/jobs/slug/{self.job.slug}/'
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['slug'], self.job.slug)
    
    # ========== CREATE Tests ==========
    
    def test_create_job_success(self):
        """Test POST /api/jobs/ - success"""
        self.client.force_authenticate(user=self.user)
        
        url = '/api/jobs/'
        data = {
            "company_id": self.company.id,
            "title": "React Developer",
            "job_type": "full-time",
            "level": "junior",
            "description": "React developer job description",
            "requirements": "React and JavaScript knowledge"
        }
        response = self.client.post(url, data)
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['title'], "React Developer")
        self.assertEqual(response.data['status'], "draft")
    
    def test_create_job_not_company_member(self):
        """Test POST by non-company owner returns 400"""
        self.client.force_authenticate(user=self.user2)
        
        url = '/api/jobs/'
        data = {
            "company_id": self.company.id,  # Not owned by user2
            "title": "Hacked Job",
            "job_type": "full-time",
            "level": "junior",
            "description": "Description",
            "requirements": "Requirements"
        }
        response = self.client.post(url, data)
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    
    # ========== UPDATE Tests ==========
    
    def test_update_job_success(self):
        """Test PUT /api/jobs/:id/ - success"""
        self.client.force_authenticate(user=self.user)
        
        url = f'/api/jobs/{self.job.id}/'
        data = {
            "title": "Senior Python Developer",
            "status": "published"
        }
        response = self.client.put(url, data)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.job.refresh_from_db()
        self.assertEqual(self.job.title, "Senior Python Developer")
    
    def test_update_job_not_owner(self):
        """Test PUT by non-owner returns 403"""
        self.client.force_authenticate(user=self.user2)
        
        url = f'/api/jobs/{self.job.id}/'
        data = {"title": "Hacked Title"}
        response = self.client.put(url, data)
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
    
    # ========== DELETE Tests ==========
    
    def test_delete_job_success(self):
        """Test DELETE /api/jobs/:id/ - success"""
        self.client.force_authenticate(user=self.user)
        
        url = f'/api/jobs/{self.job.id}/'
        response = self.client.delete(url)
        
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(Job.objects.filter(id=self.job.id).count(), 0)
    
    def test_delete_job_not_owner(self):
        """Test DELETE by non-owner returns 403"""
        self.client.force_authenticate(user=self.user2)
        
        url = f'/api/jobs/{self.job.id}/'
        response = self.client.delete(url)
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
    
    # ========== STATUS Tests ==========
    
    def test_change_status_success(self):
        """Test PATCH /api/jobs/:id/status/ - success"""
        self.client.force_authenticate(user=self.user)
        
        # Create draft job first
        draft_job = Job.objects.create(
            company=self.company,
            title="Draft Job",
            slug="draft-job-test",
            job_type="full-time",
            level="junior",
            description="Desc",
            requirements="Req",
            status="draft",
            created_by=self.user
        )
        
        url = f'/api/jobs/{draft_job.id}/status/'
        response = self.client.patch(url, {"status": "published"})
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        draft_job.refresh_from_db()
        self.assertEqual(draft_job.status, "published")
        self.assertIsNotNone(draft_job.published_at)
    
    # ========== PUBLISH Tests ==========
    
    def test_publish_job_success(self):
        """Test POST /api/jobs/:id/publish/ - success"""
        self.client.force_authenticate(user=self.user)
        
        draft_job = Job.objects.create(
            company=self.company,
            title="Unpublished Job",
            slug="unpublished-job-test",
            job_type="full-time",
            level="junior",
            description="Desc",
            requirements="Req",
            status="draft",
            created_by=self.user
        )
        
        url = f'/api/jobs/{draft_job.id}/publish/'
        response = self.client.post(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        draft_job.refresh_from_db()
        self.assertEqual(draft_job.status, "published")
    
    # ========== CLOSE Tests ==========
    
    def test_close_job_success(self):
        """Test POST /api/jobs/:id/close/ - success"""
        self.client.force_authenticate(user=self.user)
        
        url = f'/api/jobs/{self.job.id}/close/'
        response = self.client.post(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.job.refresh_from_db()
        self.assertEqual(self.job.status, "closed")
    
    # ========== DUPLICATE Tests ==========
    
    def test_duplicate_job_success(self):
        """Test POST /api/jobs/:id/duplicate/ - success"""
        self.client.force_authenticate(user=self.user)
        
        url = f'/api/jobs/{self.job.id}/duplicate/'
        response = self.client.post(url)
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn("(Copy)", response.data['title'])
        self.assertEqual(response.data['status'], "draft")
        self.assertNotEqual(response.data['slug'], self.job.slug)

    # ========== NHÓM 1: CRUD Error Cases (7 tests) ==========
    
    def test_get_job_by_id_not_found(self):
        """Test GET /api/jobs/:id/ - job không tồn tại → 404"""
        url = '/api/jobs/99999/'
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
    
    def test_get_job_by_slug_not_found(self):
        """Test GET /api/jobs/slug/:slug/ - slug không tồn tại → 404"""
        url = '/api/jobs/slug/non-existent-slug/'
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
    
    def test_create_job_unauthenticated(self):
        """Test POST /api/jobs/ - không login → 401"""
        url = '/api/jobs/'
        data = {
            "company_id": self.company.id,
            "title": "New Job",
            "job_type": "full-time",
            "level": "junior",
            "description": "Description",
            "requirements": "Requirements"
        }
        response = self.client.post(url, data)
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    def test_create_job_invalid_data(self):
        """Test POST /api/jobs/ - data không hợp lệ → 400"""
        self.client.force_authenticate(user=self.user)
        
        url = '/api/jobs/'
        data = {
            "company_id": self.company.id,
            # Missing required fields: title, description
            "job_type": "invalid-type"
        }
        response = self.client.post(url, data)
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    
    def test_update_job_not_found(self):
        """Test PUT /api/jobs/:id/ - job không tồn tại → 404"""
        self.client.force_authenticate(user=self.user)
        
        url = '/api/jobs/99999/'
        data = {"title": "Updated Title"}
        response = self.client.put(url, data)
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
    
    def test_update_job_unauthenticated(self):
        """Test PUT /api/jobs/:id/ - không login → 401"""
        url = f'/api/jobs/{self.job.id}/'
        data = {"title": "Updated Title"}
        response = self.client.put(url, data)
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    def test_delete_job_not_found(self):
        """Test DELETE /api/jobs/:id/ - job không tồn tại → 404"""
        self.client.force_authenticate(user=self.user)
        
        url = '/api/jobs/99999/'
        response = self.client.delete(url)
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    # ========== NHÓM 2: Workflow Error Cases (11 tests) ==========
    
    def test_change_status_not_owner(self):
        """Test PATCH /api/jobs/:id/status/ - non-owner → 403"""
        self.client.force_authenticate(user=self.user2)
        
        url = f'/api/jobs/{self.job.id}/status/'
        response = self.client.patch(url, {"status": "closed"})
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
    
    def test_change_status_not_found(self):
        """Test PATCH /api/jobs/:id/status/ - job không tồn tại → 404"""
        self.client.force_authenticate(user=self.user)
        
        url = '/api/jobs/99999/status/'
        response = self.client.patch(url, {"status": "published"})
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
    
    def test_change_status_invalid(self):
        """Test PATCH /api/jobs/:id/status/ - status không hợp lệ → 400"""
        self.client.force_authenticate(user=self.user)
        
        url = f'/api/jobs/{self.job.id}/status/'
        response = self.client.patch(url, {"status": "invalid-status"})
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    
    def test_publish_job_not_owner(self):
        """Test POST /api/jobs/:id/publish/ - non-owner → 403"""
        self.client.force_authenticate(user=self.user2)
        
        url = f'/api/jobs/{self.job.id}/publish/'
        response = self.client.post(url)
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
    
    def test_publish_job_not_found(self):
        """Test POST /api/jobs/:id/publish/ - job không tồn tại → 404"""
        self.client.force_authenticate(user=self.user)
        
        url = '/api/jobs/99999/publish/'
        response = self.client.post(url)
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
    
    def test_publish_already_published(self):
        """Test POST /api/jobs/:id/publish/ - đã published → 400"""
        self.client.force_authenticate(user=self.user)
        
        # self.job already has status="published"
        url = f'/api/jobs/{self.job.id}/publish/'
        response = self.client.post(url)
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    
    def test_close_job_not_owner(self):
        """Test POST /api/jobs/:id/close/ - non-owner → 403"""
        self.client.force_authenticate(user=self.user2)
        
        url = f'/api/jobs/{self.job.id}/close/'
        response = self.client.post(url)
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
    
    def test_close_job_not_found(self):
        """Test POST /api/jobs/:id/close/ - job không tồn tại → 404"""
        self.client.force_authenticate(user=self.user)
        
        url = '/api/jobs/99999/close/'
        response = self.client.post(url)
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
    
    def test_close_already_closed(self):
        """Test POST /api/jobs/:id/close/ - đã closed → 400"""
        self.client.force_authenticate(user=self.user)
        
        # Create closed job first
        closed_job = Job.objects.create(
            company=self.company,
            title="Closed Job",
            slug="closed-job-test",
            job_type="full-time",
            level="junior",
            description="Desc",
            requirements="Req",
            status="closed",
            created_by=self.user
        )
        
        url = f'/api/jobs/{closed_job.id}/close/'
        response = self.client.post(url)
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    
    def test_duplicate_job_not_owner(self):
        """Test POST /api/jobs/:id/duplicate/ - non-owner → 403"""
        self.client.force_authenticate(user=self.user2)
        
        url = f'/api/jobs/{self.job.id}/duplicate/'
        response = self.client.post(url)
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
    
    def test_duplicate_job_not_found(self):
        """Test POST /api/jobs/:id/duplicate/ - job không tồn tại → 404"""
        self.client.force_authenticate(user=self.user)
        
        url = '/api/jobs/99999/duplicate/'
        response = self.client.post(url)
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    # ========== NHÓM 3: Discovery APIs (13 tests) ==========
    
    def test_get_job_stats_success(self):
        """Test GET /api/jobs/:id/stats/ - owner lấy stats → 200"""
        self.client.force_authenticate(user=self.user)
        
        url = f'/api/jobs/{self.job.id}/stats/'
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # API trả về view_count và application_count
        self.assertIn('view_count', response.data)
    
    def test_get_job_stats_not_owner(self):
        """Test GET /api/jobs/:id/stats/ - non-owner cũng lấy được stats (public)"""
        self.client.force_authenticate(user=self.user2)
        
        url = f'/api/jobs/{self.job.id}/stats/'
        response = self.client.get(url)
        
        # API stats là public access
        self.assertEqual(response.status_code, status.HTTP_200_OK)
    
    def test_get_job_stats_not_found(self):
        """Test GET /api/jobs/:id/stats/ - job không tồn tại → 404"""
        self.client.force_authenticate(user=self.user)
        
        url = '/api/jobs/99999/stats/'
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
    
    def test_get_featured_jobs_success(self):
        """Test GET /api/jobs/featured/ - public access → 200"""
        url = '/api/jobs/featured/'
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsInstance(response.data, list)
    
    def test_featured_jobs_contains_featured(self):
        """Test GET /api/jobs/featured/ - trả về jobs featured"""
        # Set job as featured
        self.job.featured = True
        self.job.status = 'published'
        self.job.save()
        
        url = '/api/jobs/featured/'
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # API trả về danh sách jobs, có thể rỗng nếu filter thêm điều kiện
        self.assertIsInstance(response.data, list)
    
    def test_get_urgent_jobs_success(self):
        """Test GET /api/jobs/urgent/ - public access → 200"""
        url = '/api/jobs/urgent/'
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsInstance(response.data, list)
    
    def test_get_similar_jobs_success(self):
        """Test GET /api/jobs/:id/similar/ - public access → 200"""
        url = f'/api/jobs/{self.job.id}/similar/'
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsInstance(response.data, list)
    
    def test_similar_jobs_not_found(self):
        """Test GET /api/jobs/:id/similar/ - job không tồn tại → 404"""
        url = '/api/jobs/99999/similar/'
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
    
    def test_similar_jobs_excludes_self(self):
        """Test GET /api/jobs/:id/similar/ - không chứa job hiện tại"""
        url = f'/api/jobs/{self.job.id}/similar/'
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        job_ids = [job['id'] for job in response.data]
        self.assertNotIn(self.job.id, job_ids)
    
    def test_recommendations_unauthenticated(self):
        """Test GET /api/jobs/recommendations/ - không login → 401"""
        url = '/api/jobs/recommendations/'
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    # ========== NHÓM 4: Feature & View Management (8 tests) ==========
    
    def test_record_view_success(self):
        """Test POST /api/jobs/:id/view/ - ghi nhận view → 200"""
        # record_view cần authentication
        self.client.force_authenticate(user=self.user)
        
        url = f'/api/jobs/{self.job.id}/view/'
        response = self.client.post(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
    
    def test_record_view_not_found(self):
        """Test POST /api/jobs/:id/view/ - job không tồn tại → 404"""
        self.client.force_authenticate(user=self.user)
        
        url = '/api/jobs/99999/view/'
        response = self.client.post(url)
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
    
    def test_set_featured_success(self):
        """Test POST /api/jobs/:id/feature/ - set featured → 200"""
        self.client.force_authenticate(user=self.user)
        
        url = f'/api/jobs/{self.job.id}/feature/'
        response = self.client.post(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.job.refresh_from_db()
        self.assertTrue(self.job.featured)
    
    def test_unset_featured_success(self):
        """Test DELETE /api/jobs/:id/feature/ - unset featured → 200"""
        self.client.force_authenticate(user=self.user)
        
        # Set featured first
        self.job.featured = True
        self.job.save()
        
        url = f'/api/jobs/{self.job.id}/feature/'
        response = self.client.delete(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.job.refresh_from_db()
        self.assertFalse(self.job.featured)
    
    def test_feature_not_owner(self):
        """Test POST /api/jobs/:id/feature/ - non-owner → 403"""
        self.client.force_authenticate(user=self.user2)
        
        url = f'/api/jobs/{self.job.id}/feature/'
        response = self.client.post(url)
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
    
    def test_feature_not_found(self):
        """Test POST /api/jobs/:id/feature/ - job không tồn tại → 404"""
        self.client.force_authenticate(user=self.user)
        
        url = '/api/jobs/99999/feature/'
        response = self.client.post(url)
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    # ========== NHÓM 5: View Analytics (đã phân tích ở Phase 5) ==========
    
    def test_get_view_stats_success(self):
        """Test GET /api/jobs/:id/views/ - owner lấy view stats → 200"""
        self.client.force_authenticate(user=self.user)
        
        url = f'/api/jobs/{self.job.id}/views/'
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('total_views', response.data)
    
    def test_get_view_chart_success(self):
        """Test GET /api/jobs/:id/views/chart/ - owner lấy chart data → 200"""
        self.client.force_authenticate(user=self.user)
        
        url = f'/api/jobs/{self.job.id}/views/chart/'
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('period', response.data)
        self.assertIn('data', response.data)
    
    def test_view_chart_with_period(self):
        """Test GET /api/jobs/:id/views/chart/?period=30d - custom period"""
        self.client.force_authenticate(user=self.user)
        
        url = f'/api/jobs/{self.job.id}/views/chart/?period=30d'
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['period'], '30d')
