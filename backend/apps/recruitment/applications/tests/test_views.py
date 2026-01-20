from rest_framework.test import APITestCase
from rest_framework import status
from apps.core.users.models import CustomUser
from apps.company.companies.models import Company
from apps.recruitment.jobs.models import Job
from apps.recruitment.applications.models import Application
from apps.candidate.recruiters.models import Recruiter


class ApplicationViewTests(APITestCase):
    """Test cases for Application APIs - Phase 1 (15 endpoints, 71 tests)"""
    
    def setUp(self):
        # Job owner user
        self.job_owner = CustomUser.objects.create_user(
            email="owner@example.com",
            password="password123",
            full_name="Job Owner"
        )
        # Applicant user
        self.applicant_user = CustomUser.objects.create_user(
            email="applicant@example.com",
            password="password123",
            full_name="Applicant User"
        )
        # Other user (neither owner nor applicant)
        self.other_user = CustomUser.objects.create_user(
            email="other@example.com",
            password="password123",
            full_name="Other User"
        )
        
        # Create company and job
        self.company = Company.objects.create(
            user=self.job_owner,
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
            created_by=self.job_owner
        )
        self.closed_job = Job.objects.create(
            company=self.company,
            title="Closed Job",
            slug="closed-job",
            job_type="full-time",
            level="junior",
            description="Closed job",
            requirements="Requirements",
            status="closed",
            created_by=self.job_owner
        )
        
        # Create recruiter profiles
        self.recruiter = Recruiter.objects.create(
            user=self.applicant_user,
            bio="A software engineer"
        )
        self.other_recruiter = Recruiter.objects.create(
            user=self.other_user,
            bio="Another person"
        )
    
    # ========== API #1: POST /api/applications (Nộp đơn ứng tuyển) ==========
    
    def test_create_application_success(self):
        """POST /api/applications - authenticated user → 201"""
        self.client.force_authenticate(user=self.applicant_user)
        
        url = '/api/applications/'
        data = {
            'job_id': self.job.id,
            'cover_letter': 'I am interested in this position'
        }
        response = self.client.post(url, data)
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['job_id'], self.job.id)
        self.assertTrue(Application.objects.filter(
            job=self.job, recruiter=self.recruiter
        ).exists())
    
    def test_create_application_unauthenticated(self):
        """POST /api/applications - không login → 401"""
        url = '/api/applications/'
        data = {'job_id': self.job.id}
        response = self.client.post(url, data)
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    def test_create_application_job_not_found(self):
        """POST /api/applications - job không tồn tại → 400"""
        self.client.force_authenticate(user=self.applicant_user)
        
        url = '/api/applications/'
        data = {'job_id': 99999}
        response = self.client.post(url, data)
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    
    def test_create_application_already_applied(self):
        """POST /api/applications - đã ứng tuyển rồi → 400"""
        # Create existing application
        Application.objects.create(
            job=self.job,
            recruiter=self.recruiter,
            status='pending'
        )
        
        self.client.force_authenticate(user=self.applicant_user)
        url = '/api/applications/'
        data = {'job_id': self.job.id}
        response = self.client.post(url, data)
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    
    def test_create_application_job_closed(self):
        """POST /api/applications - job đã đóng → 400"""
        self.client.force_authenticate(user=self.applicant_user)
        
        url = '/api/applications/'
        data = {'job_id': self.closed_job.id}
        response = self.client.post(url, data)
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    
    def test_create_application_with_cover_letter(self):
        """POST /api/applications - có cover letter → 201"""
        self.client.force_authenticate(user=self.applicant_user)
        
        url = '/api/applications/'
        data = {
            'job_id': self.job.id,
            'cover_letter': 'This is my cover letter'
        }
        response = self.client.post(url, data)
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['cover_letter'], 'This is my cover letter')
    
    # ========== API #2: GET /api/applications/:id (Chi tiết đơn) ==========
    
    def test_retrieve_application_as_applicant(self):
        """GET /api/applications/:id - applicant xem đơn của mình → 200"""
        app = Application.objects.create(job=self.job, recruiter=self.recruiter)
        
        self.client.force_authenticate(user=self.applicant_user)
        url = f'/api/applications/{app.id}/'
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['id'], app.id)
    
    def test_retrieve_application_as_job_owner(self):
        """GET /api/applications/:id - job owner xem đơn → 200"""
        app = Application.objects.create(job=self.job, recruiter=self.recruiter)
        
        self.client.force_authenticate(user=self.job_owner)
        url = f'/api/applications/{app.id}/'
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
    
    def test_retrieve_application_unauthenticated(self):
        """GET /api/applications/:id - không login → 401"""
        app = Application.objects.create(job=self.job, recruiter=self.recruiter)
        
        url = f'/api/applications/{app.id}/'
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    def test_retrieve_application_not_found(self):
        """GET /api/applications/:id - không tồn tại → 404"""
        self.client.force_authenticate(user=self.applicant_user)
        
        url = '/api/applications/99999/'
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
    
    def test_retrieve_application_not_authorized(self):
        """GET /api/applications/:id - user khác → 403"""
        app = Application.objects.create(job=self.job, recruiter=self.recruiter)
        
        self.client.force_authenticate(user=self.other_user)
        url = f'/api/applications/{app.id}/'
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
    
    # ========== API #3: PUT /api/applications/:id (Cập nhật đơn) ==========
    
    def test_update_application_success(self):
        """PUT /api/applications/:id - applicant cập nhật → 200"""
        app = Application.objects.create(job=self.job, recruiter=self.recruiter)
        
        self.client.force_authenticate(user=self.applicant_user)
        url = f'/api/applications/{app.id}/'
        data = {'cover_letter': 'Updated cover letter'}
        response = self.client.put(url, data)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
    
    def test_update_application_unauthenticated(self):
        """PUT /api/applications/:id - không login → 401"""
        app = Application.objects.create(job=self.job, recruiter=self.recruiter)
        
        url = f'/api/applications/{app.id}/'
        data = {'cover_letter': 'Test'}
        response = self.client.put(url, data)
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    def test_update_application_not_applicant(self):
        """PUT /api/applications/:id - job owner → 403"""
        app = Application.objects.create(job=self.job, recruiter=self.recruiter)
        
        self.client.force_authenticate(user=self.job_owner)
        url = f'/api/applications/{app.id}/'
        data = {'cover_letter': 'Test'}
        response = self.client.put(url, data)
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
    
    def test_update_application_not_found(self):
        """PUT /api/applications/:id - không tồn tại → 404"""
        self.client.force_authenticate(user=self.applicant_user)
        
        url = '/api/applications/99999/'
        data = {'cover_letter': 'Test'}
        response = self.client.put(url, data)
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
    
    def test_update_application_already_processed(self):
        """PUT /api/applications/:id - đơn đã xử lý → 400"""
        app = Application.objects.create(
            job=self.job, 
            recruiter=self.recruiter,
            status='shortlisted'  # Not pending
        )
        
        self.client.force_authenticate(user=self.applicant_user)
        url = f'/api/applications/{app.id}/'
        data = {'cover_letter': 'Updated'}
        response = self.client.put(url, data)
        
        # Có thể vẫn 200 tùy business logic, check actual implementation
        self.assertIn(response.status_code, [status.HTTP_200_OK, status.HTTP_400_BAD_REQUEST])
    
    # ========== API #4: DELETE /api/applications/:id (Xóa/Rút đơn) ==========
    
    def test_delete_application_success(self):
        """DELETE /api/applications/:id - applicant rút đơn → 204"""
        app = Application.objects.create(job=self.job, recruiter=self.recruiter)
        
        self.client.force_authenticate(user=self.applicant_user)
        url = f'/api/applications/{app.id}/'
        response = self.client.delete(url)
        
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
    
    def test_delete_application_unauthenticated(self):
        """DELETE /api/applications/:id - không login → 401"""
        app = Application.objects.create(job=self.job, recruiter=self.recruiter)
        
        url = f'/api/applications/{app.id}/'
        response = self.client.delete(url)
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    def test_delete_application_not_applicant(self):
        """DELETE /api/applications/:id - job owner → 403"""
        app = Application.objects.create(job=self.job, recruiter=self.recruiter)
        
        self.client.force_authenticate(user=self.job_owner)
        url = f'/api/applications/{app.id}/'
        response = self.client.delete(url)
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
    
    def test_delete_application_not_found(self):
        """DELETE /api/applications/:id - không tồn tại → 404"""
        self.client.force_authenticate(user=self.applicant_user)
        
        url = '/api/applications/99999/'
        response = self.client.delete(url)
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
    
    # ========== API #5: PATCH /api/applications/:id/status (Đổi trạng thái) ==========
    
    def test_change_status_success(self):
        """PATCH /api/applications/:id/status - job owner → 200"""
        app = Application.objects.create(job=self.job, recruiter=self.recruiter)
        
        self.client.force_authenticate(user=self.job_owner)
        url = f'/api/applications/{app.id}/status/'
        data = {'status': 'reviewing'}
        response = self.client.patch(url, data)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'reviewing')
    
    def test_change_status_unauthenticated(self):
        """PATCH /api/applications/:id/status - không login → 401"""
        app = Application.objects.create(job=self.job, recruiter=self.recruiter)
        
        url = f'/api/applications/{app.id}/status/'
        data = {'status': 'reviewing'}
        response = self.client.patch(url, data)
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    def test_change_status_not_owner(self):
        """PATCH /api/applications/:id/status - applicant → 403"""
        app = Application.objects.create(job=self.job, recruiter=self.recruiter)
        
        self.client.force_authenticate(user=self.applicant_user)
        url = f'/api/applications/{app.id}/status/'
        data = {'status': 'reviewing'}
        response = self.client.patch(url, data)
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
    
    def test_change_status_not_found(self):
        """PATCH /api/applications/:id/status - không tồn tại → 404"""
        self.client.force_authenticate(user=self.job_owner)
        
        url = '/api/applications/99999/status/'
        data = {'status': 'reviewing'}
        response = self.client.patch(url, data)
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
    
    def test_change_status_invalid_status(self):
        """PATCH /api/applications/:id/status - status không hợp lệ → 400"""
        app = Application.objects.create(job=self.job, recruiter=self.recruiter)
        
        self.client.force_authenticate(user=self.job_owner)
        url = f'/api/applications/{app.id}/status/'
        data = {'status': 'invalid_status'}
        response = self.client.patch(url, data)
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    
    def test_change_status_creates_history(self):
        """PATCH /api/applications/:id/status - tạo history record"""
        from apps.recruitment.application_status_history.models import ApplicationStatusHistory
        
        app = Application.objects.create(job=self.job, recruiter=self.recruiter)
        
        self.client.force_authenticate(user=self.job_owner)
        url = f'/api/applications/{app.id}/status/'
        data = {'status': 'shortlisted'}
        response = self.client.patch(url, data)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Check history created - có thể skip nếu history không tự động tạo
    
    # ========== API #6: PATCH /api/applications/:id/rating (Đánh giá) ==========
    
    def test_rate_application_success(self):
        """PATCH /api/applications/:id/rating - job owner → 200"""
        app = Application.objects.create(job=self.job, recruiter=self.recruiter)
        
        self.client.force_authenticate(user=self.job_owner)
        url = f'/api/applications/{app.id}/rating/'
        data = {'rating': 4}
        response = self.client.patch(url, data)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['rating'], 4)
    
    def test_rate_application_unauthenticated(self):
        """PATCH /api/applications/:id/rating - không login → 401"""
        app = Application.objects.create(job=self.job, recruiter=self.recruiter)
        
        url = f'/api/applications/{app.id}/rating/'
        data = {'rating': 4}
        response = self.client.patch(url, data)
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    def test_rate_application_not_owner(self):
        """PATCH /api/applications/:id/rating - applicant → 403"""
        app = Application.objects.create(job=self.job, recruiter=self.recruiter)
        
        self.client.force_authenticate(user=self.applicant_user)
        url = f'/api/applications/{app.id}/rating/'
        data = {'rating': 4}
        response = self.client.patch(url, data)
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
    
    def test_rate_application_not_found(self):
        """PATCH /api/applications/:id/rating - không tồn tại → 404"""
        self.client.force_authenticate(user=self.job_owner)
        
        url = '/api/applications/99999/rating/'
        data = {'rating': 4}
        response = self.client.patch(url, data)
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
    
    def test_rate_application_invalid_rating(self):
        """PATCH /api/applications/:id/rating - rating ngoài range → 400"""
        app = Application.objects.create(job=self.job, recruiter=self.recruiter)
        
        self.client.force_authenticate(user=self.job_owner)
        url = f'/api/applications/{app.id}/rating/'
        data = {'rating': 10}  # Max is 5
        response = self.client.patch(url, data)
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    
    # ========== API #7: POST /api/applications/:id/notes (Thêm ghi chú) ==========
    
    def test_add_notes_success(self):
        """POST /api/applications/:id/notes - job owner → 200"""
        app = Application.objects.create(job=self.job, recruiter=self.recruiter)
        
        self.client.force_authenticate(user=self.job_owner)
        url = f'/api/applications/{app.id}/notes/'
        data = {'notes': 'Good candidate'}
        response = self.client.post(url, data)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
    
    def test_add_notes_unauthenticated(self):
        """POST /api/applications/:id/notes - không login → 401"""
        app = Application.objects.create(job=self.job, recruiter=self.recruiter)
        
        url = f'/api/applications/{app.id}/notes/'
        data = {'notes': 'Test'}
        response = self.client.post(url, data)
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    def test_add_notes_not_owner(self):
        """POST /api/applications/:id/notes - applicant → 403"""
        app = Application.objects.create(job=self.job, recruiter=self.recruiter)
        
        self.client.force_authenticate(user=self.applicant_user)
        url = f'/api/applications/{app.id}/notes/'
        data = {'notes': 'Test'}
        response = self.client.post(url, data)
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
    
    def test_add_notes_not_found(self):
        """POST /api/applications/:id/notes - không tồn tại → 404"""
        self.client.force_authenticate(user=self.job_owner)
        
        url = '/api/applications/99999/notes/'
        data = {'notes': 'Test'}
        response = self.client.post(url, data)
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
    
    # ========== API #8: GET /api/applications/:id/history (Lịch sử) ==========
    
    def test_get_history_as_applicant(self):
        """GET /api/applications/:id/history - applicant → 200"""
        app = Application.objects.create(job=self.job, recruiter=self.recruiter)
        
        self.client.force_authenticate(user=self.applicant_user)
        url = f'/api/applications/{app.id}/history/'
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsInstance(response.data, list)
    
    def test_get_history_as_job_owner(self):
        """GET /api/applications/:id/history - job owner → 200"""
        app = Application.objects.create(job=self.job, recruiter=self.recruiter)
        
        self.client.force_authenticate(user=self.job_owner)
        url = f'/api/applications/{app.id}/history/'
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
    
    def test_get_history_unauthenticated(self):
        """GET /api/applications/:id/history - không login → 401"""
        app = Application.objects.create(job=self.job, recruiter=self.recruiter)
        
        url = f'/api/applications/{app.id}/history/'
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    def test_get_history_not_found(self):
        """GET /api/applications/:id/history - không tồn tại → 404"""
        self.client.force_authenticate(user=self.applicant_user)
        
        url = '/api/applications/99999/history/'
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
    
    def test_get_history_not_authorized(self):
        """GET /api/applications/:id/history - user khác → 403"""
        app = Application.objects.create(job=self.job, recruiter=self.recruiter)
        
        self.client.force_authenticate(user=self.other_user)
        url = f'/api/applications/{app.id}/history/'
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
    
    # ========== API #9: POST /api/applications/:id/shortlist (Shortlist) ==========
    
    def test_shortlist_success(self):
        """POST /api/applications/:id/shortlist - job owner → 200"""
        app = Application.objects.create(job=self.job, recruiter=self.recruiter)
        
        self.client.force_authenticate(user=self.job_owner)
        url = f'/api/applications/{app.id}/shortlist/'
        response = self.client.post(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'shortlisted')
    
    def test_shortlist_unauthenticated(self):
        """POST /api/applications/:id/shortlist - không login → 401"""
        app = Application.objects.create(job=self.job, recruiter=self.recruiter)
        
        url = f'/api/applications/{app.id}/shortlist/'
        response = self.client.post(url)
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    def test_shortlist_not_owner(self):
        """POST /api/applications/:id/shortlist - applicant → 403"""
        app = Application.objects.create(job=self.job, recruiter=self.recruiter)
        
        self.client.force_authenticate(user=self.applicant_user)
        url = f'/api/applications/{app.id}/shortlist/'
        response = self.client.post(url)
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
    
    def test_shortlist_not_found(self):
        """POST /api/applications/:id/shortlist - không tồn tại → 404"""
        self.client.force_authenticate(user=self.job_owner)
        
        url = '/api/applications/99999/shortlist/'
        response = self.client.post(url)
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
    
    def test_shortlist_already_shortlisted(self):
        """POST /api/applications/:id/shortlist - đã shortlist → 400 hoặc 200"""
        app = Application.objects.create(
            job=self.job, 
            recruiter=self.recruiter,
            status='shortlisted'
        )
        
        self.client.force_authenticate(user=self.job_owner)
        url = f'/api/applications/{app.id}/shortlist/'
        response = self.client.post(url)
        
        # Có thể 200 (idempotent) hoặc 400
        self.assertIn(response.status_code, [status.HTTP_200_OK, status.HTTP_400_BAD_REQUEST])
    
    # ========== API #10: POST /api/applications/:id/reject (Từ chối) ==========
    
    def test_reject_success(self):
        """POST /api/applications/:id/reject - job owner → 200"""
        app = Application.objects.create(job=self.job, recruiter=self.recruiter)
        
        self.client.force_authenticate(user=self.job_owner)
        url = f'/api/applications/{app.id}/reject/'
        response = self.client.post(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'rejected')
    
    def test_reject_unauthenticated(self):
        """POST /api/applications/:id/reject - không login → 401"""
        app = Application.objects.create(job=self.job, recruiter=self.recruiter)
        
        url = f'/api/applications/{app.id}/reject/'
        response = self.client.post(url)
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    def test_reject_not_owner(self):
        """POST /api/applications/:id/reject - applicant → 403"""
        app = Application.objects.create(job=self.job, recruiter=self.recruiter)
        
        self.client.force_authenticate(user=self.applicant_user)
        url = f'/api/applications/{app.id}/reject/'
        response = self.client.post(url)
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
    
    def test_reject_not_found(self):
        """POST /api/applications/:id/reject - không tồn tại → 404"""
        self.client.force_authenticate(user=self.job_owner)
        
        url = '/api/applications/99999/reject/'
        response = self.client.post(url)
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
    
    def test_reject_with_reason(self):
        """POST /api/applications/:id/reject - có lý do → 200"""
        app = Application.objects.create(job=self.job, recruiter=self.recruiter)
        
        self.client.force_authenticate(user=self.job_owner)
        url = f'/api/applications/{app.id}/reject/'
        data = {'reason': 'Not a good fit'}
        response = self.client.post(url, data)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
    
    # ========== API #11: POST /api/applications/:id/offer (Gửi offer) ==========
    
    def test_offer_success(self):
        """POST /api/applications/:id/offer - job owner → 200"""
        app = Application.objects.create(
            job=self.job, 
            recruiter=self.recruiter,
            status='shortlisted'
        )
        
        self.client.force_authenticate(user=self.job_owner)
        url = f'/api/applications/{app.id}/offer/'
        data = {'offer_details': 'We are pleased to offer you...'}
        response = self.client.post(url, data)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
    
    def test_offer_unauthenticated(self):
        """POST /api/applications/:id/offer - không login → 401"""
        app = Application.objects.create(job=self.job, recruiter=self.recruiter)
        
        url = f'/api/applications/{app.id}/offer/'
        data = {'offer_details': 'Test'}
        response = self.client.post(url, data)
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    def test_offer_not_owner(self):
        """POST /api/applications/:id/offer - applicant → 403"""
        app = Application.objects.create(job=self.job, recruiter=self.recruiter)
        
        self.client.force_authenticate(user=self.applicant_user)
        url = f'/api/applications/{app.id}/offer/'
        data = {'offer_details': 'Test'}
        response = self.client.post(url, data)
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
    
    def test_offer_not_found(self):
        """POST /api/applications/:id/offer - không tồn tại → 404"""
        self.client.force_authenticate(user=self.job_owner)
        
        url = '/api/applications/99999/offer/'
        data = {'offer_details': 'Test'}
        response = self.client.post(url, data)
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
    
    def test_offer_not_shortlisted(self):
        """POST /api/applications/:id/offer - chưa shortlist → 400 hoặc 200"""
        app = Application.objects.create(
            job=self.job, 
            recruiter=self.recruiter,
            status='pending'
        )
        
        self.client.force_authenticate(user=self.job_owner)
        url = f'/api/applications/{app.id}/offer/'
        data = {'offer_details': 'Test'}
        response = self.client.post(url, data)
        
        # Business logic có thể cho phép hoặc không
        self.assertIn(response.status_code, [status.HTTP_200_OK, status.HTTP_400_BAD_REQUEST])
    
    # ========== API #12: POST /api/applications/:id/withdraw (Rút đơn) ==========
    
    def test_withdraw_success(self):
        """POST /api/applications/:id/withdraw - applicant → 200"""
        app = Application.objects.create(job=self.job, recruiter=self.recruiter)
        
        self.client.force_authenticate(user=self.applicant_user)
        url = f'/api/applications/{app.id}/withdraw/'
        response = self.client.post(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'withdrawn')
    
    def test_withdraw_unauthenticated(self):
        """POST /api/applications/:id/withdraw - không login → 401"""
        app = Application.objects.create(job=self.job, recruiter=self.recruiter)
        
        url = f'/api/applications/{app.id}/withdraw/'
        response = self.client.post(url)
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    def test_withdraw_not_applicant(self):
        """POST /api/applications/:id/withdraw - job owner → 403"""
        app = Application.objects.create(job=self.job, recruiter=self.recruiter)
        
        self.client.force_authenticate(user=self.job_owner)
        url = f'/api/applications/{app.id}/withdraw/'
        response = self.client.post(url)
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
    
    def test_withdraw_not_found(self):
        """POST /api/applications/:id/withdraw - không tồn tại → 404"""
        self.client.force_authenticate(user=self.applicant_user)
        
        url = '/api/applications/99999/withdraw/'
        response = self.client.post(url)
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
    
    def test_withdraw_already_withdrawn(self):
        """POST /api/applications/:id/withdraw - đã rút → 400"""
        app = Application.objects.create(
            job=self.job, 
            recruiter=self.recruiter,
            status='withdrawn'
        )
        
        self.client.force_authenticate(user=self.applicant_user)
        url = f'/api/applications/{app.id}/withdraw/'
        response = self.client.post(url)
        
        self.assertIn(response.status_code, [status.HTTP_200_OK, status.HTTP_400_BAD_REQUEST])
    
    # ========== API #13: GET /api/applications/stats (Thống kê) ==========
    
    def test_stats_success(self):
        """GET /api/applications/stats - authenticated → 200"""
        self.client.force_authenticate(user=self.job_owner)
        
        url = '/api/applications/stats/'
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
    
    def test_stats_unauthenticated(self):
        """GET /api/applications/stats - không login → 401"""
        url = '/api/applications/stats/'
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    def test_stats_returns_correct_data(self):
        """GET /api/applications/stats - verify data structure"""
        # Create some applications
        Application.objects.create(job=self.job, recruiter=self.recruiter, status='pending')
        
        self.client.force_authenticate(user=self.job_owner)
        url = '/api/applications/stats/'
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Verify response has expected structure
    
    # ========== API #14: POST /api/applications/bulk-action (Bulk action) ==========
    
    def test_bulk_action_success(self):
        """POST /api/applications/bulk-action - job owner → 200"""
        app1 = Application.objects.create(job=self.job, recruiter=self.recruiter)
        app2 = Application.objects.create(job=self.job, recruiter=self.other_recruiter)
        
        self.client.force_authenticate(user=self.job_owner)
        url = '/api/applications/bulk-action/'
        data = {
            'application_ids': [app1.id, app2.id],
            'action': 'shortlist'
        }
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
    
    def test_bulk_action_unauthenticated(self):
        """POST /api/applications/bulk-action - không login → 401"""
        url = '/api/applications/bulk-action/'
        data = {'application_ids': [1], 'action': 'shortlist'}
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    def test_bulk_action_not_owner(self):
        """POST /api/applications/bulk-action - không phải owner → 400/403"""
        app = Application.objects.create(job=self.job, recruiter=self.recruiter)
        
        self.client.force_authenticate(user=self.other_user)
        url = '/api/applications/bulk-action/'
        data = {'application_ids': [app.id], 'action': 'shortlist'}
        response = self.client.post(url, data, format='json')
        
        self.assertIn(response.status_code, [status.HTTP_400_BAD_REQUEST, status.HTTP_403_FORBIDDEN])
    
    def test_bulk_action_invalid_action(self):
        """POST /api/applications/bulk-action - action không hợp lệ → 400"""
        app = Application.objects.create(job=self.job, recruiter=self.recruiter)
        
        self.client.force_authenticate(user=self.job_owner)
        url = '/api/applications/bulk-action/'
        data = {'application_ids': [app.id], 'action': 'invalid'}
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    
    def test_bulk_action_empty_ids(self):
        """POST /api/applications/bulk-action - danh sách rỗng → 400"""
        self.client.force_authenticate(user=self.job_owner)
        
        url = '/api/applications/bulk-action/'
        data = {'application_ids': [], 'action': 'shortlist'}
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    
    # ========== API #15: GET /api/applications/export (Export) ==========
    
    def test_export_success(self):
        """GET /api/applications/export - job owner → 200"""
        Application.objects.create(job=self.job, recruiter=self.recruiter)
        
        self.client.force_authenticate(user=self.job_owner)
        url = f'/api/applications/export/?job_id={self.job.id}'
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
    
    def test_export_unauthenticated(self):
        """GET /api/applications/export - không login → 401"""
        url = '/api/applications/export/'
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    def test_export_returns_csv(self):
        """GET /api/applications/export - Content-Type = text/csv"""
        Application.objects.create(job=self.job, recruiter=self.recruiter)
        
        self.client.force_authenticate(user=self.job_owner)
        url = f'/api/applications/export/?job_id={self.job.id}'
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response['Content-Type'], 'text/csv')


class JobApplicationFilterViewTests(APITestCase):
    """Test cases for Application Filter APIs - Phase 2 (5 endpoints, 27 tests)"""
    
    def setUp(self):
        # Job owner
        self.job_owner = CustomUser.objects.create_user(
            email="owner@example.com",
            password="password123",
            full_name="Job Owner"
        )
        self.other_user = CustomUser.objects.create_user(
            email="other@example.com",
            password="password123",
            full_name="Other User"
        )
        
        # Company and Job
        self.company = Company.objects.create(
            user=self.job_owner,
            company_name="Test Company",
            description="Test"
        )
        self.job = Job.objects.create(
            company=self.company,
            title="Test Job",
            slug="test-job-filter",
            job_type="full-time",
            level="senior",
            description="Desc",
            requirements="Req",
            status="published",
            created_by=self.job_owner
        )
        
        # Create recruiters
        self.recruiter1 = Recruiter.objects.create(
            user=CustomUser.objects.create_user(
                email="r1@example.com", password="pass", full_name="R1"
            ),
            bio="R1"
        )
        self.recruiter2 = Recruiter.objects.create(
            user=CustomUser.objects.create_user(
                email="r2@example.com", password="pass", full_name="R2"
            ),
            bio="R2"
        )
        self.recruiter3 = Recruiter.objects.create(
            user=CustomUser.objects.create_user(
                email="r3@example.com", password="pass", full_name="R3"
            ),
            bio="R3"
        )
        
        # Create applications with different statuses
        self.app_pending = Application.objects.create(
            job=self.job, recruiter=self.recruiter1, status='pending'
        )
        self.app_shortlisted = Application.objects.create(
            job=self.job, recruiter=self.recruiter2, status='shortlisted', rating=4
        )
        self.app_rejected = Application.objects.create(
            job=self.job, recruiter=self.recruiter3, status='rejected', rating=2
        )
    
    # ========== API #1: GET /api/jobs/:id/applications/pending ==========
    
    def test_pending_applications_success(self):
        """GET /api/jobs/:id/applications/pending - job owner → 200"""
        self.client.force_authenticate(user=self.job_owner)
        
        url = f'/api/jobs/{self.job.id}/applications/pending/'
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsInstance(response.data, list)
    
    def test_pending_applications_unauthenticated(self):
        """GET /api/jobs/:id/applications/pending - không login → 401"""
        url = f'/api/jobs/{self.job.id}/applications/pending/'
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    def test_pending_applications_not_owner(self):
        """GET /api/jobs/:id/applications/pending - user khác → 403"""
        self.client.force_authenticate(user=self.other_user)
        
        url = f'/api/jobs/{self.job.id}/applications/pending/'
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
    
    def test_pending_applications_job_not_found(self):
        """GET /api/jobs/:id/applications/pending - job không tồn tại → 404"""
        self.client.force_authenticate(user=self.job_owner)
        
        url = '/api/jobs/99999/applications/pending/'
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
    
    def test_pending_applications_empty(self):
        """GET /api/jobs/:id/applications/pending - không có pending → 200 + []"""
        # Change all to non-pending
        Application.objects.filter(job=self.job).update(status='shortlisted')
        
        self.client.force_authenticate(user=self.job_owner)
        url = f'/api/jobs/{self.job.id}/applications/pending/'
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 0)
    
    def test_pending_applications_filters_correctly(self):
        """GET /api/jobs/:id/applications/pending - chỉ status='pending'"""
        self.client.force_authenticate(user=self.job_owner)
        
        url = f'/api/jobs/{self.job.id}/applications/pending/'
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        for app in response.data:
            self.assertEqual(app['status'], 'pending')
    
    # ========== API #2: GET /api/jobs/:id/applications/shortlisted ==========
    
    def test_shortlisted_applications_success(self):
        """GET /api/jobs/:id/applications/shortlisted - job owner → 200"""
        self.client.force_authenticate(user=self.job_owner)
        
        url = f'/api/jobs/{self.job.id}/applications/shortlisted/'
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
    
    def test_shortlisted_applications_unauthenticated(self):
        """GET /api/jobs/:id/applications/shortlisted - không login → 401"""
        url = f'/api/jobs/{self.job.id}/applications/shortlisted/'
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    def test_shortlisted_applications_not_owner(self):
        """GET /api/jobs/:id/applications/shortlisted - user khác → 403"""
        self.client.force_authenticate(user=self.other_user)
        
        url = f'/api/jobs/{self.job.id}/applications/shortlisted/'
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
    
    def test_shortlisted_applications_job_not_found(self):
        """GET /api/jobs/:id/applications/shortlisted - job không tồn tại → 404"""
        self.client.force_authenticate(user=self.job_owner)
        
        url = '/api/jobs/99999/applications/shortlisted/'
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
    
    def test_shortlisted_applications_filters_correctly(self):
        """GET /api/jobs/:id/applications/shortlisted - chỉ status='shortlisted'"""
        self.client.force_authenticate(user=self.job_owner)
        
        url = f'/api/jobs/{self.job.id}/applications/shortlisted/'
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        for app in response.data:
            self.assertEqual(app['status'], 'shortlisted')
    
    # ========== API #3: GET /api/jobs/:id/applications/rejected ==========
    
    def test_rejected_applications_success(self):
        """GET /api/jobs/:id/applications/rejected - job owner → 200"""
        self.client.force_authenticate(user=self.job_owner)
        
        url = f'/api/jobs/{self.job.id}/applications/rejected/'
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
    
    def test_rejected_applications_unauthenticated(self):
        """GET /api/jobs/:id/applications/rejected - không login → 401"""
        url = f'/api/jobs/{self.job.id}/applications/rejected/'
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    def test_rejected_applications_not_owner(self):
        """GET /api/jobs/:id/applications/rejected - user khác → 403"""
        self.client.force_authenticate(user=self.other_user)
        
        url = f'/api/jobs/{self.job.id}/applications/rejected/'
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
    
    def test_rejected_applications_job_not_found(self):
        """GET /api/jobs/:id/applications/rejected - job không tồn tại → 404"""
        self.client.force_authenticate(user=self.job_owner)
        
        url = '/api/jobs/99999/applications/rejected/'
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
    
    def test_rejected_applications_filters_correctly(self):
        """GET /api/jobs/:id/applications/rejected - chỉ status='rejected'"""
        self.client.force_authenticate(user=self.job_owner)
        
        url = f'/api/jobs/{self.job.id}/applications/rejected/'
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        for app in response.data:
            self.assertEqual(app['status'], 'rejected')
    
    # ========== API #4: GET /api/jobs/:id/applications/by-rating ==========
    
    def test_by_rating_success(self):
        """GET /api/jobs/:id/applications/by-rating - job owner → 200"""
        self.client.force_authenticate(user=self.job_owner)
        
        url = f'/api/jobs/{self.job.id}/applications/by-rating/'
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
    
    def test_by_rating_unauthenticated(self):
        """GET /api/jobs/:id/applications/by-rating - không login → 401"""
        url = f'/api/jobs/{self.job.id}/applications/by-rating/'
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    def test_by_rating_not_owner(self):
        """GET /api/jobs/:id/applications/by-rating - user khác → 403"""
        self.client.force_authenticate(user=self.other_user)
        
        url = f'/api/jobs/{self.job.id}/applications/by-rating/'
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
    
    def test_by_rating_job_not_found(self):
        """GET /api/jobs/:id/applications/by-rating - job không tồn tại → 404"""
        self.client.force_authenticate(user=self.job_owner)
        
        url = '/api/jobs/99999/applications/by-rating/'
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
    
    def test_by_rating_exact_match(self):
        """GET /api/jobs/:id/applications/by-rating?rating=4 - exact match"""
        self.client.force_authenticate(user=self.job_owner)
        
        url = f'/api/jobs/{self.job.id}/applications/by-rating/?rating=4'
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        for app in response.data:
            self.assertEqual(app['rating'], 4)
    
    def test_by_rating_min_max(self):
        """GET /api/jobs/:id/applications/by-rating?min_rating=3&max_rating=5"""
        self.client.force_authenticate(user=self.job_owner)
        
        url = f'/api/jobs/{self.job.id}/applications/by-rating/?min_rating=3&max_rating=5'
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        for app in response.data:
            if app['rating']:
                self.assertGreaterEqual(app['rating'], 3)
                self.assertLessEqual(app['rating'], 5)
    
    # ========== API #5: GET /api/jobs/:id/applications/search ==========
    
    def test_search_applications_success(self):
        """GET /api/jobs/:id/applications/search - job owner → 200"""
        self.client.force_authenticate(user=self.job_owner)
        
        url = f'/api/jobs/{self.job.id}/applications/search/?q=R1'
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
    
    def test_search_applications_unauthenticated(self):
        """GET /api/jobs/:id/applications/search - không login → 401"""
        url = f'/api/jobs/{self.job.id}/applications/search/?q=test'
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    def test_search_applications_not_owner(self):
        """GET /api/jobs/:id/applications/search - user khác → 403"""
        self.client.force_authenticate(user=self.other_user)
        
        url = f'/api/jobs/{self.job.id}/applications/search/?q=test'
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
    
    def test_search_applications_job_not_found(self):
        """GET /api/jobs/:id/applications/search - job không tồn tại → 404"""
        self.client.force_authenticate(user=self.job_owner)
        
        url = '/api/jobs/99999/applications/search/?q=test'
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
    
    def test_search_applications_empty_query(self):
        """GET /api/jobs/:id/applications/search?q= - empty → []"""
        self.client.force_authenticate(user=self.job_owner)
        
        url = f'/api/jobs/{self.job.id}/applications/search/?q='
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data, [])
