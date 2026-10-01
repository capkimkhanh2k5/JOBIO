from unittest.mock import patch

from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from apps.core.users.models import CustomUser
from apps.candidate.recruiters.models import Recruiter
from apps.candidate.recruiter_cvs.models import RecruiterCV
from apps.candidate.cv_templates.models import CVTemplate
from apps.candidate.cv_template_categories.models import CVTemplateCategory
from apps.company.companies.models import Company
from apps.recruitment.applications.models import Application
from apps.recruitment.job_categories.models import JobCategory
from apps.recruitment.jobs.models import Job


class RecruiterCVViewSetTests(TestCase):
    """Tests cho Recruiter CVs API"""

    def setUp(self):
        self.client = APIClient()

        # Create users
        self.user = CustomUser.objects.create_user(
            email="test@example.com", password="testpass123", full_name="Test User"
        )
        self.other_user = CustomUser.objects.create_user(
            email="other@example.com", password="testpass123", full_name="Other User"
        )
        self.company_user = CustomUser.objects.create_user(
            email="company@example.com",
            password="testpass123",
            full_name="Company User",
            role="company",
        )
        self.other_company_user = CustomUser.objects.create_user(
            email="other-company@example.com",
            password="testpass123",
            full_name="Other Company",
            role="company",
        )

        # Create recruiter (job seeker)
        self.recruiter = Recruiter.objects.create(
            user=self.user, current_position="Software Engineer"
        )

        # Create category and template
        self.category = CVTemplateCategory.objects.create(name="Modern", slug="modern")
        self.template = CVTemplate.objects.create(
            name="Modern Template",
            category=self.category,
            thumbnail_url="https://example.com/templates/modern.png",
        )

        # Create CV
        self.cv = RecruiterCV.objects.create(
            recruiter=self.recruiter,
            template=self.template,
            cv_name="My Main CV",
            cv_data={"personal": {"name": "Test User"}},
            is_default=True,
            is_public=True,
        )
        self.company = Company.objects.create(
            user=self.company_user,
            company_name="Hiring Co",
            slug="hiring-co",
            description="Hiring",
            verification_status=Company.VerificationStatus.VERIFIED,
        )
        self.other_company = Company.objects.create(
            user=self.other_company_user,
            company_name="Other Hiring Co",
            slug="other-hiring-co",
            description="Hiring",
            verification_status=Company.VerificationStatus.VERIFIED,
        )
        self.category = JobCategory.objects.create(name="Engineering", slug="eng")
        self.job = Job.objects.create(
            company=self.company,
            created_by=self.company_user,
            title="Backend Developer",
            slug="backend-developer",
            category=self.category,
            job_type="full-time",
            level="junior",
            description="Build APIs",
            requirements="Python",
            status=Job.Status.PUBLISHED,
        )
        self.other_job = Job.objects.create(
            company=self.other_company,
            created_by=self.other_company_user,
            title="Frontend Developer",
            slug="frontend-developer",
            category=self.category,
            job_type="full-time",
            level="junior",
            description="Build UI",
            requirements="React",
            status=Job.Status.PUBLISHED,
        )

    def test_list_cvs(self):
        """Test GET /api/candidates/:id/cvs/ - List CVs"""
        self.client.force_authenticate(user=self.user)
        response = self.client.get(f"/api/candidates/{self.recruiter.id}/cvs/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(
            len(
                response.data.get("results", response.data)
                if isinstance(response.data, dict)
                else response.data
            ),
            1,
        )
        items = (
            response.data.get("results", response.data)
            if isinstance(response.data, dict)
            else response.data
        )
        self.assertEqual(items[0]["thumbnail_url"], self.template.thumbnail_url)

    def test_list_cvs_forbidden(self):
        """Test GET /api/candidates/:id/cvs/ - Other user cannot access"""
        self.client.force_authenticate(user=self.other_user)
        response = self.client.get(f"/api/candidates/{self.recruiter.id}/cvs/")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_create_cv(self):
        """Test POST /api/candidates/:id/cvs/ - Create CV"""
        self.client.force_authenticate(user=self.user)
        data = {
            "cv_name": "New CV",
            "template_id": self.template.id,
            "cv_data": {"personal": {"name": "Test"}},
            "is_public": True,
        }
        response = self.client.post(
            f"/api/candidates/{self.recruiter.id}/cvs/", data, format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_retrieve_cv(self):
        """Test GET /api/candidates/:id/cvs/:cvId/ - Get CV detail"""
        self.client.force_authenticate(user=self.user)
        response = self.client.get(
            f"/api/candidates/{self.recruiter.id}/cvs/{self.cv.id}/"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["cv_name"], "My Main CV")

    def test_update_cv(self):
        """Test PUT /api/candidates/:id/cvs/:cvId/ - Update CV"""
        self.client.force_authenticate(user=self.user)
        data = {
            "cv_name": "Updated CV Name",
            "cv_data": {"personal": {"name": "Updated"}},
            "is_public": False,
        }
        response = self.client.put(
            f"/api/candidates/{self.recruiter.id}/cvs/{self.cv.id}/",
            data,
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["cv_name"], "Updated CV Name")

    def test_delete_cv(self):
        """Test DELETE /api/candidates/:id/cvs/:cvId/ - Delete CV"""
        self.client.force_authenticate(user=self.user)
        response = self.client.delete(
            f"/api/candidates/{self.recruiter.id}/cvs/{self.cv.id}/"
        )
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

    def test_delete_default_cv_promotes_newest_remaining_cv(self):
        replacement = RecruiterCV.objects.create(
            recruiter=self.recruiter,
            cv_name="Replacement CV",
            cv_data={"personal": {"name": "Replacement"}},
            is_default=False,
            is_public=True,
        )

        self.client.force_authenticate(user=self.user)
        response = self.client.delete(
            f"/api/candidates/{self.recruiter.id}/cvs/{self.cv.id}/"
        )

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        replacement.refresh_from_db()
        self.assertTrue(replacement.is_default)

    def test_set_default_cv(self):
        """Test PATCH /api/candidates/:id/cvs/:cvId/default/ - Set default"""
        # Create another CV
        cv2 = RecruiterCV.objects.create(
            recruiter=self.recruiter, cv_name="Second CV", cv_data={}, is_default=False
        )

        self.client.force_authenticate(user=self.user)
        response = self.client.patch(
            f"/api/candidates/{self.recruiter.id}/cvs/{cv2.id}/default/"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        cv2.refresh_from_db()
        self.assertTrue(cv2.is_default)

    def test_set_privacy(self):
        """Test PATCH /api/candidates/:id/cvs/:cvId/privacy/ - Set privacy"""
        self.client.force_authenticate(user=self.user)
        data = {"is_public": False}
        response = self.client.patch(
            f"/api/candidates/{self.recruiter.id}/cvs/{self.cv.id}/privacy/",
            data,
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.cv.refresh_from_db()
        self.assertFalse(self.cv.is_public)

    def test_download_cv(self):
        """Test POST /api/candidates/:id/cvs/:cvId/download/ - Download CV"""
        self.client.force_authenticate(user=self.user)
        response = self.client.post(
            f"/api/candidates/{self.recruiter.id}/cvs/{self.cv.id}/download/"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("download_url", response.data)
        self.assertIn(
            f"/api/candidates/{self.recruiter.id}/cvs/{self.cv.id}/file/",
            response.data["download_url"],
        )

    @patch("apps.candidate.recruiter_cvs.tasks._download_pdf")
    def test_cv_file_proxy_allows_owner_without_exposing_storage_url(
        self, mock_download
    ):
        """GET /api/candidates/:id/cvs/:cvId/file/ - owner gets proxied PDF."""
        mock_download.return_value = b"%PDF-1.4 test"
        raw_url = "https://res.cloudinary.com/demo/raw/upload/cv.pdf"
        uploaded_cv = RecruiterCV.objects.create(
            recruiter=self.recruiter,
            template=None,
            cv_name="Uploaded CV",
            cv_data={},
            cv_url=raw_url,
        )

        self.client.force_authenticate(user=self.user)
        detail_response = self.client.get(
            f"/api/candidates/{self.recruiter.id}/cvs/{uploaded_cv.id}/"
        )
        self.assertEqual(detail_response.status_code, status.HTTP_200_OK)
        self.assertNotEqual(detail_response.data["cv_url"], raw_url)
        self.assertIn(
            f"/api/candidates/{self.recruiter.id}/cvs/{uploaded_cv.id}/file/",
            detail_response.data["cv_url"],
        )

        file_response = self.client.get(
            f"/api/candidates/{self.recruiter.id}/cvs/{uploaded_cv.id}/file/"
        )

        self.assertEqual(file_response.status_code, status.HTTP_200_OK)
        self.assertEqual(file_response["Content-Type"], "application/pdf")
        self.assertEqual(file_response["Cache-Control"], "private, max-age=60")
        mock_download.assert_called_once_with(raw_url)

    @patch("apps.candidate.recruiter_cvs.tasks._download_pdf")
    def test_cv_file_proxy_allows_company_with_submitted_application(
        self, mock_download
    ):
        """Company can fetch only CVs submitted to its jobs."""
        mock_download.return_value = b"%PDF-1.4 test"
        raw_url = "https://res.cloudinary.com/demo/raw/upload/submitted-cv.pdf"
        uploaded_cv = RecruiterCV.objects.create(
            recruiter=self.recruiter,
            template=None,
            cv_name="Submitted Uploaded CV",
            cv_data={},
            cv_url=raw_url,
        )
        Application.objects.create(
            recruiter=self.recruiter, job=self.job, cv=uploaded_cv
        )

        self.client.force_authenticate(user=self.company_user)
        response = self.client.get(
            f"/api/candidates/{self.recruiter.id}/cvs/{uploaded_cv.id}/file/"
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response["Content-Type"], "application/pdf")
        mock_download.assert_called_once_with(raw_url)

    def test_cv_file_proxy_blocks_unrelated_company(self):
        """GET /api/candidates/:id/cvs/:cvId/file/ - unrelated company is denied."""
        self.cv.cv_url = "https://res.cloudinary.com/demo/raw/upload/cv.pdf"
        self.cv.save(update_fields=["cv_url"])
        Application.objects.create(recruiter=self.recruiter, job=self.job, cv=self.cv)

        self.client.force_authenticate(user=self.other_company_user)
        response = self.client.get(
            f"/api/candidates/{self.recruiter.id}/cvs/{self.cv.id}/file/"
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_preview_cv(self):
        """Test POST /api/candidates/:id/cvs/:cvId/preview/ - Preview CV"""
        self.client.force_authenticate(user=self.user)
        response = self.client.post(
            f"/api/candidates/{self.recruiter.id}/cvs/{self.cv.id}/preview/"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # API returns html_content for preview rendering
        self.assertIn("html_content", response.data)

    def test_company_can_view_only_cv_submitted_to_its_job(self):
        Application.objects.create(recruiter=self.recruiter, job=self.job, cv=self.cv)
        other_cv = RecruiterCV.objects.create(
            recruiter=self.recruiter,
            template=self.template,
            cv_name="Private CV",
            cv_data={"personal": {"name": "Private"}},
        )
        self.client.force_authenticate(user=self.company_user)

        list_response = self.client.get(f"/api/candidates/{self.recruiter.id}/cvs/")
        items = (
            list_response.data.get("results", list_response.data)
            if isinstance(list_response.data, dict)
            else list_response.data
        )
        self.assertEqual(list_response.status_code, status.HTTP_200_OK)
        self.assertEqual([item["id"] for item in items], [self.cv.id])

        detail_response = self.client.get(
            f"/api/candidates/{self.recruiter.id}/cvs/{self.cv.id}/"
        )
        self.assertEqual(detail_response.status_code, status.HTTP_200_OK)

        private_response = self.client.get(
            f"/api/candidates/{self.recruiter.id}/cvs/{other_cv.id}/"
        )
        self.assertEqual(private_response.status_code, status.HTTP_404_NOT_FOUND)

    def test_company_cannot_mutate_submitted_cv(self):
        Application.objects.create(recruiter=self.recruiter, job=self.job, cv=self.cv)
        self.client.force_authenticate(user=self.company_user)

        response = self.client.patch(
            f"/api/candidates/{self.recruiter.id}/cvs/{self.cv.id}/",
            {"cv_name": "Edited by company"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_other_company_cannot_view_cv_without_application(self):
        Application.objects.create(recruiter=self.recruiter, job=self.job, cv=self.cv)
        self.client.force_authenticate(user=self.other_company_user)

        response = self.client.get(f"/api/candidates/{self.recruiter.id}/cvs/")

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    @patch("apps.candidate.recruiter_cvs.views.rewrite_cv_section")
    def test_rewrite_cv_section(self, mock_rewrite):
        """Test POST /api/candidates/:id/cvs/:cvId/rewrite-section/."""
        mock_rewrite.return_value = {
            "section": "summary",
            "rewritten_text": "Backend developer with production API experience.",
            "model": "test-model",
        }
        self.client.force_authenticate(user=self.user)

        response = self.client.post(
            f"/api/candidates/{self.recruiter.id}/cvs/{self.cv.id}/rewrite-section/",
            {"section": "summary", "text": "I build APIs with Django."},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(
            response.data["rewritten_text"],
            "Backend developer with production API experience.",
        )
        mock_rewrite.assert_called_once()

    def test_rewrite_cv_section_forbidden_for_uploaded_pdf(self):
        """Uploaded PDF CVs are read-only for inline AI rewriting."""
        uploaded = RecruiterCV.objects.create(
            recruiter=self.recruiter,
            cv_name="Uploaded CV",
            cv_url="https://example.com/cv.pdf",
            cv_data={},
        )
        self.client.force_authenticate(user=self.user)

        response = self.client.post(
            f"/api/candidates/{self.recruiter.id}/cvs/{uploaded.id}/rewrite-section/",
            {"section": "summary", "text": "I build APIs with Django."},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_generate_cv(self):
        """Test POST /api/candidates/:id/cvs/generate/ - Auto-generate CV"""
        self.client.force_authenticate(user=self.user)
        data = {"template_id": self.template.id}
        response = self.client.post(
            f"/api/candidates/{self.recruiter.id}/cvs/generate/", data, format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn("cv_data", response.data)

    # ========== Tests bổ sung ==========

    def test_list_cvs_unauthenticated(self):
        """Test GET /api/candidates/:id/cvs/ - Unauthenticated → 401"""
        response = self.client.get(f"/api/candidates/{self.recruiter.id}/cvs/")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_create_cv_unauthenticated(self):
        """Test POST /api/candidates/:id/cvs/ - Unauthenticated → 401"""
        data = {"cv_name": "Test", "cv_data": {}}
        response = self.client.post(
            f"/api/candidates/{self.recruiter.id}/cvs/", data, format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_retrieve_cv_not_found(self):
        """Test GET /api/candidates/:id/cvs/:cvId/ - CV not found → 404"""
        self.client.force_authenticate(user=self.user)
        response = self.client.get(f"/api/candidates/{self.recruiter.id}/cvs/99999/")
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_update_cv_forbidden(self):
        """Test PUT /api/candidates/:id/cvs/:cvId/ - Other user → 403"""
        self.client.force_authenticate(user=self.other_user)
        data = {"cv_name": "Hacked", "cv_data": {}}
        response = self.client.put(
            f"/api/candidates/{self.recruiter.id}/cvs/{self.cv.id}/",
            data,
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_delete_cv_forbidden(self):
        """Test DELETE /api/candidates/:id/cvs/:cvId/ - Other user → 403"""
        self.client.force_authenticate(user=self.other_user)
        response = self.client.delete(
            f"/api/candidates/{self.recruiter.id}/cvs/{self.cv.id}/"
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_download_cv_forbidden(self):
        """Test POST /api/candidates/:id/cvs/:cvId/download/ - Other user → 403"""
        self.client.force_authenticate(user=self.other_user)
        response = self.client.post(
            f"/api/candidates/{self.recruiter.id}/cvs/{self.cv.id}/download/"
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
