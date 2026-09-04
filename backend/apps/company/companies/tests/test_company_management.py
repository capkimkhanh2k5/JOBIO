from rest_framework.test import APITestCase
from rest_framework import status
from django.urls import reverse
from django.contrib.auth import get_user_model
import unittest
from apps.company.companies.models import Company, CompanyMember
from apps.company.industries.models import Industry
from apps.recruitment.jobs.models import Job

CustomUser = get_user_model()


class TestCompanyManagement(APITestCase):
    """Test suite cho Company Management APIs"""

    def test_create_company_success(self):
        """Kiểm tra tạo công ty thành công qua API"""
        user = CustomUser.objects.create_user(
            email="company@example.com", password="password123", role="company"
        )
        self.client.force_authenticate(user=user)

        url = reverse("company-list")
        data = {
            "company_name": "Công ty ABC",
            "website": "https://abc.com",
            "description": "Mô tả công ty ABC",
        }
        response = self.client.post(url, data, format="json")

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["company_name"], "Công ty ABC")
        self.assertIn("cong-ty-abc", response.data["slug"])
        self.assertEqual(response.data["user"], user.id)
        self.assertTrue(
            CompanyMember.objects.filter(
                company_id=response.data["id"],
                user=user,
                role=CompanyMember.Role.OWNER,
                status=CompanyMember.Status.ACTIVE,
            ).exists()
        )

    def test_create_company_rejects_insecure_website_url(self):
        user = CustomUser.objects.create_user(
            email="company-insecure-website@example.com",
            password="password123",
            role="company",
        )
        self.client.force_authenticate(user=user)

        response = self.client.post(
            reverse("company-list"),
            {"company_name": "Insecure Website Co", "website": "http://example.com"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(Company.objects.filter(user=user).count(), 0)

    def test_create_company_duplicate_user(self):
        """Lỗi khi user đã có company (sử dụng API thay vì trực tiếp tạo)"""
        user = CustomUser.objects.create_user(
            email="company2@example.com", password="password123", role="company"
        )
        self.client.force_authenticate(user=user)

        url = reverse("company-list")

        # Tạo company đầu tiên qua API
        response1 = self.client.post(url, {"company_name": "Công ty 1"}, format="json")
        self.assertEqual(response1.status_code, status.HTTP_201_CREATED)

        # Tạo công ty thứ 2 sẽ lỗi
        response2 = self.client.post(url, {"company_name": "Công ty 2"}, format="json")
        self.assertEqual(response2.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("đã có hồ sơ công ty", str(response2.data["detail"]))

    def test_candidate_cannot_create_company(self):
        """Candidate không được tạo hồ sơ công ty bằng API trực tiếp"""
        user = CustomUser.objects.create_user(
            email="candidate-create-company@example.com",
            password="password123",
            role="candidate",
        )
        self.client.force_authenticate(user=user)

        response = self.client.post(
            reverse("company-list"),
            {"company_name": "Candidate Company"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_list_companies_public(self):
        """Danh sách công ty công khai (không cần auth)"""
        # Tạo company trước
        user = CustomUser.objects.create_user(
            email="company3@example.com", password="password123", role="company"
        )
        self.client.force_authenticate(user=user)
        self.client.post(
            reverse("company-list"), {"company_name": "Test Company"}, format="json"
        )
        self.client.logout()

        # Truy cập list không cần auth
        url = reverse("company-list")
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_list_companies_filter_by_industry_id(self):
        """GET /api/companies/?industry_id=<id> filters companies by industry"""
        product_industry = Industry.objects.create(name="IT Product")
        outsourcing_industry = Industry.objects.create(name="IT Outsourcing")

        user1 = CustomUser.objects.create_user(
            email="product-company@example.com", password="password123", role="company"
        )
        self.client.force_authenticate(user=user1)
        self.client.post(
            reverse("company-list"),
            {"company_name": "Product Company", "industry_id": product_industry.id},
            format="json",
        )

        user2 = CustomUser.objects.create_user(
            email="outsourcing-company@example.com",
            password="password123",
            role="company",
        )
        self.client.force_authenticate(user=user2)
        self.client.post(
            reverse("company-list"),
            {
                "company_name": "Outsourcing Company",
                "industry_id": outsourcing_industry.id,
            },
            format="json",
        )
        self.client.logout()

        response = self.client.get(
            reverse("company-list"), {"industry_id": product_industry.id}
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = (
            response.data["results"]
            if isinstance(response.data, dict)
            else response.data
        )
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]["company_name"], "Product Company")

    def test_retrieve_company_by_slug(self):
        """Lấy chi tiết công ty theo slug"""
        user = CustomUser.objects.create_user(
            email="company4@example.com", password="password123", role="company"
        )
        self.client.force_authenticate(user=user)
        create_response = self.client.post(
            reverse("company-list"), {"company_name": "Slug Company"}, format="json"
        )
        self.assertEqual(create_response.status_code, status.HTTP_201_CREATED)

        slug = create_response.data["slug"]
        self.client.logout()

        url = reverse("company-retrieve-by-slug", kwargs={"slug": slug})
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["slug"], slug)

    def test_update_company_owner_only(self):
        """Chỉ chủ sở hữu mới được cập nhật"""
        owner = CustomUser.objects.create_user(
            email="owner@example.com", password="password", role="company"
        )
        other = CustomUser.objects.create_user(
            email="other@example.com", password="password", role="company"
        )

        # Tạo company bằng owner
        self.client.force_authenticate(user=owner)
        create_response = self.client.post(
            reverse("company-list"), {"company_name": "Owner Company"}, format="json"
        )
        company_id = create_response.data["id"]

        # Thử update bằng other user
        self.client.force_authenticate(user=other)
        url = reverse("company-detail", kwargs={"pk": company_id})
        response = self.client.put(url, {"company_name": "Hacked"}, format="json")

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_update_company_ignores_sensitive_fields(self):
        """Company profile update does not allow mass-assignment of trust fields."""
        owner = CustomUser.objects.create_user(
            email="sensitive-owner@example.com", password="password", role="company"
        )
        other_owner = CustomUser.objects.create_user(
            email="sensitive-other@example.com", password="password", role="company"
        )

        self.client.force_authenticate(user=owner)
        create_response = self.client.post(
            reverse("company-list"),
            {"company_name": "Sensitive Company"},
            format="json",
        )
        company_id = create_response.data["id"]

        response = self.client.put(
            reverse("company-detail", kwargs={"pk": company_id}),
            {
                "company_name": "Sensitive Company Updated",
                "verification_status": Company.VerificationStatus.VERIFIED,
                "verified_by": other_owner.id,
                "user": other_owner.id,
                "follower_count": 999,
                "job_count": 999,
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        company = Company.objects.get(id=company_id)
        self.assertEqual(company.company_name, "Sensitive Company Updated")
        self.assertEqual(company.user_id, owner.id)
        self.assertEqual(
            company.verification_status, Company.VerificationStatus.PENDING
        )
        self.assertIsNone(company.verified_by_id)
        self.assertEqual(company.follower_count, 0)
        self.assertEqual(company.job_count, 0)

    def test_update_company_rejects_insecure_website_url(self):
        owner = CustomUser.objects.create_user(
            email="insecure-update-owner@example.com",
            password="password",
            role="company",
        )
        self.client.force_authenticate(user=owner)
        create_response = self.client.post(
            reverse("company-list"),
            {"company_name": "Secure Company", "website": "https://example.com"},
            format="json",
        )
        company_id = create_response.data["id"]

        response = self.client.patch(
            reverse("company-detail", kwargs={"pk": company_id}),
            {"website": "http://example.com"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        company = Company.objects.get(id=company_id)
        self.assertEqual(company.website, "https://example.com")

    def test_delete_company_owner_only(self):
        """Chỉ chủ sở hữu mới được xóa"""
        owner = CustomUser.objects.create_user(
            email="deleteowner@example.com", password="password", role="company"
        )

        self.client.force_authenticate(user=owner)
        create_response = self.client.post(
            reverse("company-list"), {"company_name": "Delete Company"}, format="json"
        )
        company_id = create_response.data["id"]

        url = reverse("company-detail", kwargs={"pk": company_id})
        response = self.client.delete(url)

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

    def test_company_owner_can_manage_members(self):
        owner = CustomUser.objects.create_user(
            email="team-owner@example.com", password="password", role="company"
        )
        member_user = CustomUser.objects.create_user(
            email="hr@example.com",
            password="password",
            full_name="HR User",
            role="company",
        )

        self.client.force_authenticate(user=owner)
        create_response = self.client.post(
            reverse("company-list"), {"company_name": "Team Company"}, format="json"
        )
        company_id = create_response.data["id"]

        add_response = self.client.post(
            f"/api/companies/{company_id}/members/",
            {"email": member_user.email, "role": "recruiter", "status": "active"},
            format="json",
        )

        self.assertEqual(add_response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(add_response.data["user"], member_user.id)
        self.assertEqual(add_response.data["role"], "recruiter")

        list_response = self.client.get(f"/api/companies/{company_id}/members/")
        self.assertEqual(list_response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(list_response.data), 2)

    def test_company_member_management_role_boundaries(self):
        owner = CustomUser.objects.create_user(
            email="team-boundary-owner@example.com", password="password", role="company"
        )
        admin_user = CustomUser.objects.create_user(
            email="team-boundary-admin@example.com", password="password", role="company"
        )
        recruiter_user = CustomUser.objects.create_user(
            email="team-boundary-recruiter@example.com",
            password="password",
            role="company",
        )
        viewer_user = CustomUser.objects.create_user(
            email="team-boundary-viewer@example.com",
            password="password",
            role="company",
        )

        self.client.force_authenticate(user=owner)
        create_response = self.client.post(
            reverse("company-list"), {"company_name": "Boundary Company"}, format="json"
        )
        company_id = create_response.data["id"]

        admin_response = self.client.post(
            f"/api/companies/{company_id}/members/",
            {"email": admin_user.email, "role": "admin", "status": "active"},
            format="json",
        )
        self.assertEqual(admin_response.status_code, status.HTTP_201_CREATED)

        self.client.force_authenticate(user=admin_user)
        recruiter_response = self.client.post(
            f"/api/companies/{company_id}/members/",
            {"email": recruiter_user.email, "role": "recruiter", "status": "active"},
            format="json",
        )
        self.assertEqual(recruiter_response.status_code, status.HTTP_201_CREATED)

        self.client.force_authenticate(user=recruiter_user)
        viewer_response = self.client.post(
            f"/api/companies/{company_id}/members/",
            {"email": viewer_user.email, "role": "viewer", "status": "active"},
            format="json",
        )
        self.assertEqual(viewer_response.status_code, status.HTTP_403_FORBIDDEN)

        owner_membership = CompanyMember.objects.get(
            company_id=company_id, user=owner, role=CompanyMember.Role.OWNER
        )
        self.client.force_authenticate(user=admin_user)
        owner_patch_response = self.client.patch(
            f"/api/companies/{company_id}/members/{owner_membership.id}/",
            {"role": "viewer"},
            format="json",
        )
        self.assertEqual(owner_patch_response.status_code, status.HTTP_400_BAD_REQUEST)
        owner_membership.refresh_from_db()
        self.assertEqual(owner_membership.role, CompanyMember.Role.OWNER)

    # =========================================================================
    # Tests cho Company Stats API
    # =========================================================================
    @unittest.skip(
        "Company stats API needs Job/Review/Follower models not available in test settings"
    )
    def test_company_stats(self):
        """GET /api/companies/:id/stats - Lấy thống kê công ty"""
        user = CustomUser.objects.create_user(
            email="stats@example.com", password="password", role="company"
        )
        self.client.force_authenticate(user=user)

        # Tạo company
        create_response = self.client.post(
            reverse("company-list"), {"company_name": "Stats Company"}, format="json"
        )
        company_id = create_response.data["id"]

        # Lấy stats
        url = f"/api/companies/{company_id}/stats/"
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("job_count", response.data)
        self.assertIn("follower_count", response.data)
        self.assertIn("review_count", response.data)

    # =========================================================================
    # Tests cho Request Verification API
    # =========================================================================
    def test_request_verification_success(self):
        """POST /api/companies/:id/verify - Yêu cầu xác thực thành công"""
        user = CustomUser.objects.create_user(
            email="verify@example.com", password="password", role="company"
        )
        self.client.force_authenticate(user=user)

        # Tạo company
        create_response = self.client.post(
            reverse("company-list"), {"company_name": "Verify Company"}, format="json"
        )
        company_id = create_response.data["id"]

        # Yêu cầu xác thực
        url = f"/api/companies/{company_id}/verify/"
        response = self.client.post(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("successfully", response.data["detail"])

    def test_request_verification_not_owner(self):
        """POST /api/companies/:id/verify - Không phải chủ sở hữu"""
        owner = CustomUser.objects.create_user(
            email="verifyowner@example.com", password="password", role="company"
        )
        other = CustomUser.objects.create_user(
            email="verifyother@example.com", password="password", role="company"
        )

        self.client.force_authenticate(user=owner)
        create_response = self.client.post(
            reverse("company-list"),
            {"company_name": "Other Verify Company"},
            format="json",
        )
        company_id = create_response.data["id"]

        # Other user cố yêu cầu xác thực
        self.client.force_authenticate(user=other)
        url = f"/api/companies/{company_id}/verify/"
        response = self.client.post(url)

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    # =========================================================================
    # Tests cho Admin Verification API
    # =========================================================================
    def test_admin_verification_success(self):
        """PATCH /api/companies/:id/verification - Admin duyệt thành công"""
        owner = CustomUser.objects.create_user(
            email="adminverifyowner@example.com", password="password", role="company"
        )
        admin = CustomUser.objects.create_user(
            email="admin@example.com", password="password", is_staff=True
        )

        # Tạo company
        self.client.force_authenticate(user=owner)
        create_response = self.client.post(
            reverse("company-list"),
            {"company_name": "Admin Verify Company"},
            format="json",
        )
        company_id = create_response.data["id"]

        # Admin duyệt
        self.client.force_authenticate(user=admin)
        url = f"/api/companies/{company_id}/verification/"
        response = self.client.patch(url, {"status": "verified"}, format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_admin_rejecting_verified_company_closes_published_jobs(self):
        owner = CustomUser.objects.create_user(
            email="reject-verified-owner@example.com",
            password="password",
            role="company",
        )
        admin = CustomUser.objects.create_user(
            email="reject-verified-admin@example.com",
            password="password",
            is_staff=True,
        )
        company = Company.objects.create(
            user=owner,
            company_name="Reject Verified Company",
            slug="reject-verified-company",
            verification_status=Company.VerificationStatus.VERIFIED,
        )
        job = Job.objects.create(
            company=company,
            title="Published Role",
            slug="published-role-rejected-company",
            job_type=Job.JobType.FULL_TIME,
            level=Job.Level.JUNIOR,
            description="Build APIs",
            requirements="Python",
            status=Job.Status.PUBLISHED,
            featured=True,
            created_by=owner,
        )

        self.client.force_authenticate(user=admin)
        response = self.client.patch(
            f"/api/companies/{company.id}/verification/",
            {"status": Company.VerificationStatus.REJECTED},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        job.refresh_from_db()
        self.assertEqual(job.status, Job.Status.CLOSED)
        self.assertFalse(job.featured)
        self.assertIsNone(job.featured_until)

    def test_admin_verification_not_admin(self):
        """PATCH /api/companies/:id/verification - User thường không được duyệt"""
        owner = CustomUser.objects.create_user(
            email="notadminowner@example.com", password="password", role="company"
        )

        self.client.force_authenticate(user=owner)
        create_response = self.client.post(
            reverse("company-list"),
            {"company_name": "Not Admin Company"},
            format="json",
        )
        company_id = create_response.data["id"]

        url = f"/api/companies/{company_id}/verification/"
        response = self.client.patch(url, {"status": "verified"}, format="json")

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    # =========================================================================
    # Tests cho Search Companies API
    # =========================================================================
    def test_search_companies(self):
        """GET /api/companies/search - Tìm kiếm công ty"""
        user = CustomUser.objects.create_user(
            email="searchtest@example.com", password="password", role="company"
        )
        self.client.force_authenticate(user=user)
        self.client.post(
            reverse("company-list"), {"company_name": "Tech ABC Company"}, format="json"
        )
        self.client.logout()

        # Tìm kiếm
        url = "/api/companies/search/?q=Tech"
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsInstance(response.data, list)

    # =========================================================================
    # Tests cho Featured Companies API
    # =========================================================================
    def test_featured_companies(self):
        """GET /api/companies/featured - Công ty nổi bật"""
        url = "/api/companies/featured/"
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsInstance(response.data, list)

    # =========================================================================
    # Tests cho Company Suggestions API
    # =========================================================================
    def test_company_suggestions_anonymous(self):
        """GET /api/companies/suggestions - Gợi ý cho anonymous user"""
        url = "/api/companies/suggestions/"
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsInstance(response.data, list)

    def test_company_suggestions_authenticated(self):
        """GET /api/companies/suggestions - Gợi ý cho authenticated user"""
        user = CustomUser.objects.create_user(
            email="suggestions@example.com", password="password"
        )
        self.client.force_authenticate(user=user)

        url = "/api/companies/suggestions/"
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsInstance(response.data, list)

    # =========================================================================
    # Tests cho Claim Company API
    # =========================================================================
    def test_claim_company_already_claimed(self):
        """POST /api/companies/:id/claim - Công ty đã có chủ sở hữu"""
        owner = CustomUser.objects.create_user(
            email="claimowner@example.com", password="password", role="company"
        )
        other = CustomUser.objects.create_user(
            email="claimother@example.com", password="password", role="company"
        )

        # Tạo company có owner
        self.client.force_authenticate(user=owner)
        create_response = self.client.post(
            reverse("company-list"), {"company_name": "Claimed Company"}, format="json"
        )
        company_id = create_response.data["id"]

        # Other user cố claim
        self.client.force_authenticate(user=other)
        url = f"/api/companies/{company_id}/claim/"
        response = self.client.post(url)

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("already claimed", str(response.data["detail"]))
