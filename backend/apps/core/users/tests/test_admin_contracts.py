from datetime import timedelta
from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from apps.billing.models import PaymentMethod, SubscriptionPlan, Transaction
from apps.candidate.skills.models import Skill
from apps.candidate.skill_categories.models import SkillCategory
from apps.communication.notification_types.models import NotificationType
from apps.communication.notifications.models import Notification
from apps.company.benefit_categories.models import BenefitCategory
from apps.company.companies.models import Company
from apps.company.industries.models import Industry
from apps.geography.addresses.models import Address
from apps.geography.communes.models import Commune
from apps.geography.provinces.models import Province
from apps.recruitment.job_categories.models import JobCategory
from apps.recruitment.interview_types.models import InterviewType
from apps.recruitment.jobs.models import Job
from apps.system.activity_log_types.models import ActivityLogType
from apps.system.activity_logs.models import ActivityLog
from apps.system.file_uploads.models import FileUpload
from apps.system.report_types.models import ReportType
from apps.system.reports.models import Report
from apps.system.system_settings.models import SystemSetting


User = get_user_model()


class AdminApiContractTests(APITestCase):
    def setUp(self):
        self.role_admin = User.objects.create_user(
            email="role-admin@example.com",
            password="password123",
            full_name="Role Admin",
            role="admin",
            is_staff=False,
            is_superuser=False,
        )
        self.company_user = User.objects.create_user(
            email="company-contract@example.com",
            password="password123",
            full_name="Company User",
            role="company",
        )
        self.normal_user = User.objects.create_user(
            email="normal-contract@example.com",
            password="password123",
            full_name="Normal User",
            role="candidate",
        )

    def _assert_paginated_response(self, response, *, expected_page=1):
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        for key in ("count", "total_pages", "page_size", "results"):
            self.assertIn(key, response.data)
        self.assertGreaterEqual(response.data["total_pages"], 1)
        self.assertEqual(response.data["current_page"], expected_page)
        self.assertIsInstance(response.data["results"], list)

    def _assert_excel_response(self, response):
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(
            response["Content-Type"],
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        )
        self.assertTrue(response["Content-Disposition"].startswith("attachment;"))

    def _seed_admin_contract_data(self):
        industry = Industry.objects.create(
            name="Matrix Technology",
            slug="matrix-technology",
        )
        company = Company.objects.create(
            user=self.company_user,
            company_name="Matrix Company",
            slug="matrix-company",
            industry=industry,
            verification_status=Company.VerificationStatus.PENDING,
        )
        plan = SubscriptionPlan.objects.create(
            name="Matrix Pro",
            slug="matrix-pro",
            price=250000,
            duration_days=30,
            is_active=True,
        )
        payment_method = PaymentMethod.objects.create(name="VNPay", code="matrix-vnpay")
        transaction = Transaction.objects.create(
            company=company,
            payment_method=payment_method,
            amount=plan.price,
            status=Transaction.Status.COMPLETED,
            reference_code="MATRIX-TXN-001",
            description="Matrix contract payment",
        )
        job_category = JobCategory.objects.create(
            name="Matrix Engineering",
            slug="matrix-engineering",
        )
        job = Job.objects.create(
            company=company,
            title="Matrix Backend Engineer",
            slug="matrix-backend-engineer",
            category=job_category,
            job_type=Job.JobType.FULL_TIME,
            level=Job.Level.SENIOR,
            description="Matrix backend work",
            requirements="Python and Django",
            application_deadline=timezone.now().date() + timedelta(days=30),
            status=Job.Status.PUBLISHED,
            created_by=self.company_user,
        )
        report_type = ReportType.objects.create(type_name="Spam")
        report = Report.objects.create(
            reporter=self.normal_user,
            report_type=report_type,
            entity_type="job",
            entity_id=job.id,
            description="Matrix spam report",
            status=Report.Status.PENDING,
        )
        notification_type = NotificationType.objects.create(type_name="General")
        Notification.objects.create(
            user=self.role_admin,
            notification_type=notification_type,
            title="Matrix Admin Notice",
            content="Matrix notice content",
        )
        log_type = ActivityLogType.objects.create(
            type_name="Matrix Login",
            description="Matrix log type",
        )
        ActivityLog.objects.create(
            user=self.normal_user,
            log_type=log_type,
            action="Matrix action",
            ip_address="127.0.0.1",
        )
        file_upload = FileUpload.objects.create(
            user=self.normal_user,
            file_name="matrix.txt",
            original_name="matrix.txt",
            file_path="uploads/matrix.txt",
        )
        setting = SystemSetting.objects.create(
            setting_key="matrix_public",
            setting_value="enabled",
            setting_type=SystemSetting.SettingType.STRING,
            is_public=True,
        )
        skill_category = SkillCategory.objects.create(
            name="Matrix Skills",
            slug="matrix-skills",
        )
        skill = Skill.objects.create(
            name="Matrix Django",
            slug="matrix-django",
            category=skill_category,
        )
        benefit = BenefitCategory.objects.create(
            name="Matrix Benefit",
            slug="matrix-benefit",
        )

        return {
            "company": company,
            "transaction": transaction,
            "job": job,
            "report": report,
            "notification_type": notification_type,
            "file_upload": file_upload,
            "setting": setting,
            "skill": skill,
            "industry": industry,
            "job_category": job_category,
            "benefit": benefit,
        }

    def test_role_admin_can_use_admin_endpoints_without_staff_flag(self):
        industry = Industry.objects.create(name="Contract Tech", slug="contract-tech")
        province = Province.objects.create(
            province_name="Contract Province",
            province_type=Province.ProvinceType.PROVINCE,
            region=Province.Region.NORTH,
        )
        commune = Commune.objects.create(
            province=province,
            commune_name="Contract Ward",
            commune_type=Commune.CommuneType.WARD,
        )
        address = Address.objects.create(
            address_line="1 Contract Street",
            province=province,
            commune=commune,
        )
        InterviewType.objects.create(name="Contract Screening")
        company = Company.objects.create(
            user=self.company_user,
            company_name="Contract Pending Company",
            slug="contract-pending-company",
            industry=industry,
            verification_status="pending",
        )
        setting = SystemSetting.objects.create(
            setting_key="contract_secret",
            setting_value="secret",
            setting_type=SystemSetting.SettingType.STRING,
            is_public=False,
        )
        log_type = ActivityLogType.objects.create(
            type_name="Contract Action",
            description="Contract log type",
        )
        ActivityLog.objects.create(
            user=self.normal_user,
            log_type=log_type,
            action="Contract action",
            ip_address="127.0.0.1",
        )
        FileUpload.objects.create(
            user=self.normal_user,
            file_name="normal.txt",
            original_name="normal.txt",
            file_path="uploads/normal.txt",
        )
        FileUpload.objects.create(
            user=self.role_admin,
            file_name="admin.txt",
            original_name="admin.txt",
            file_path="uploads/admin.txt",
        )

        skill_category = SkillCategory.objects.create(
            name="Contract Skills",
            slug="contract-skills",
        )

        self.client.force_authenticate(user=self.role_admin)

        checks = [
            ("get", "/api/companies/?verification_status=pending", None),
            ("get", "/api/companies/moderation-stats/", None),
            (
                "patch",
                f"/api/companies/{company.id}/verification/",
                {"status": "verified"},
            ),
            ("get", "/api/system/settings/", None),
            (
                "patch",
                f"/api/system/settings/{setting.id}/",
                {"setting_value": "changed"},
            ),
            ("get", "/api/activity-logs/", None),
            ("get", "/api/file-uploads/", None),
            ("get", "/api/file-uploads/stats/", None),
            ("post", "/api/blog/categories/", {"name": "Contract Category"}),
            ("post", "/api/blog/tags/", {"name": "Contract Tag"}),
            (
                "post",
                "/api/skills/",
                {
                    "name": "Contract Skill",
                    "slug": "contract-skill",
                    "category": skill_category.id,
                },
            ),
            (
                "post",
                "/api/industries/",
                {"name": "Contract Industry", "slug": "contract-industry"},
            ),
            (
                "post",
                "/api/job-categories/",
                {"name": "Contract Job Category", "slug": "contract-job-category"},
            ),
            (
                "post",
                "/api/benefit-categories/",
                {"name": "Contract Benefit", "slug": "contract-benefit"},
            ),
            (
                "post",
                "/api/interview-types/",
                {"name": "Contract Final", "description": "Final interview"},
            ),
            (
                "post",
                "/api/communes/",
                {
                    "commune_name": "Contract Commune",
                    "commune_type": Commune.CommuneType.COMMUNE,
                    "province": province.id,
                    "is_active": True,
                },
            ),
            ("patch", f"/api/addresses/{address.id}/verify/", None),
        ]

        for method, url, payload in checks:
            with self.subTest(url=url):
                request = getattr(self.client, method)
                response = (
                    request(url, payload, format="json") if payload else request(url)
                )
                self.assertNotEqual(response.status_code, status.HTTP_403_FORBIDDEN)
                self.assertLess(response.status_code, status.HTTP_400_BAD_REQUEST)

        files_response = self.client.get("/api/file-uploads/")
        self.assertEqual(files_response.data["count"], 2)

        setting.refresh_from_db()
        self.assertEqual(setting.setting_value, "changed")

    def test_users_list_returns_admin_pagination_metadata(self):
        for idx in range(15):
            User.objects.create_user(
                email=f"pagination-{idx}@example.com",
                password="password123",
                full_name=f"Pagination User {idx}",
            )

        self.client.force_authenticate(user=self.role_admin)
        response = self.client.get("/api/users/", {"page": 1, "page_size": 10})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["count"], 18)
        self.assertEqual(response.data["total_pages"], 2)
        self.assertEqual(response.data["current_page"], 1)
        self.assertEqual(response.data["page_size"], 10)
        self.assertEqual(len(response.data["results"]), 10)

    def test_admin_lists_return_consistent_pagination_metadata(self):
        self._seed_admin_contract_data()
        self.client.force_authenticate(user=self.role_admin)

        endpoints = [
            "/api/users/",
            "/api/companies/?verification_status=pending",
            "/api/billing/admin-finance/",
            "/api/billing/admin-finance/subscriptions/",
            "/api/billing/admin-subscription-plans/",
            "/api/jobs/admin-jobs/",
            "/api/system/reports/admin-reports/",
            "/api/notifications/admin-list/",
            "/api/activity-logs/",
            "/api/file-uploads/",
            "/api/skills/",
            "/api/industries/",
            "/api/job-categories/",
            "/api/benefit-categories/",
        ]

        for endpoint in endpoints:
            with self.subTest(endpoint=endpoint):
                separator = "&" if "?" in endpoint else "?"
                response = self.client.get(f"{endpoint}{separator}page=1&page_size=5")
                self._assert_paginated_response(response)

    def test_admin_search_filter_and_export_contracts(self):
        data = self._seed_admin_contract_data()
        self.client.force_authenticate(user=self.role_admin)

        filtered_checks = [
            (
                "/api/users/",
                {"search": "normal-contract", "page": 1, "page_size": 5},
                self.normal_user.email,
                "email",
            ),
            (
                "/api/jobs/admin-jobs/",
                {"search": "Matrix Backend", "status": Job.Status.PUBLISHED},
                data["job"].id,
                "id",
            ),
            (
                "/api/system/reports/admin-reports/",
                {"search": "Matrix spam", "status": Report.Status.PENDING},
                data["report"].id,
                "id",
            ),
            (
                "/api/billing/admin-finance/",
                {"search": "MATRIX-TXN-001", "status": Transaction.Status.COMPLETED},
                data["transaction"].id,
                "id",
            ),
            (
                "/api/activity-logs/",
                {"search": "Matrix action"},
                "Matrix action",
                "action",
            ),
            (
                "/api/file-uploads/",
                {"search": "matrix.txt"},
                data["file_upload"].id,
                "id",
            ),
            (
                "/api/skills/",
                {"search": "Matrix Django"},
                data["skill"].id,
                "id",
            ),
            (
                "/api/industries/",
                {"search": "Matrix Technology"},
                data["industry"].id,
                "id",
            ),
            (
                "/api/job-categories/",
                {"search": "Matrix Engineering"},
                data["job_category"].id,
                "id",
            ),
            (
                "/api/benefit-categories/",
                {"search": "Matrix Benefit"},
                data["benefit"].id,
                "id",
            ),
        ]

        for endpoint, params, expected, field in filtered_checks:
            with self.subTest(endpoint=endpoint):
                response = self.client.get(endpoint, params)
                self._assert_paginated_response(response)
                values = {item[field] for item in response.data["results"]}
                self.assertIn(expected, values)

        export_checks = [
            ("/api/users/export/", {"search": "normal-contract"}),
            ("/api/jobs/admin-jobs/export/", {"search": "Matrix Backend"}),
            ("/api/system/reports/admin-reports/export/", {"search": "Matrix spam"}),
            ("/api/billing/admin-finance/export/", {"search": "MATRIX-TXN-001"}),
        ]

        for endpoint, params in export_checks:
            with self.subTest(endpoint=endpoint):
                self._assert_excel_response(self.client.get(endpoint, params))

    def test_non_admin_users_cannot_use_admin_endpoint_families(self):
        self._seed_admin_contract_data()
        protected_requests = [
            ("get", "/api/users/", None),
            ("get", "/api/companies/moderation-stats/", None),
            ("get", "/api/billing/admin-finance/", None),
            ("get", "/api/jobs/admin-jobs/", None),
            ("get", "/api/system/reports/admin-reports/", None),
            ("get", "/api/notifications/admin-list/", None),
            ("post", "/api/notifications/broadcast/", {"title": "x", "message": "y"}),
            ("get", "/api/activity-logs/", None),
            ("post", "/api/skills/", {"name": "Nope", "slug": "nope"}),
            ("post", "/api/industries/", {"name": "Nope", "slug": "nope"}),
            ("post", "/api/job-categories/", {"name": "Nope", "slug": "nope"}),
            ("post", "/api/benefit-categories/", {"name": "Nope", "slug": "nope"}),
        ]

        for user in (self.normal_user, self.company_user):
            self.client.force_authenticate(user=user)
            for method, endpoint, payload in protected_requests:
                with self.subTest(user=user.role, endpoint=endpoint):
                    request = getattr(self.client, method)
                    response = (
                        request(endpoint, payload, format="json")
                        if payload is not None
                        else request(endpoint)
                    )
                    self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_non_admin_scoped_endpoints_do_not_leak_admin_data(self):
        data = self._seed_admin_contract_data()

        self.client.force_authenticate(user=self.normal_user)
        settings_response = self.client.get("/api/system/settings/")
        self.assertEqual(settings_response.status_code, status.HTTP_200_OK)
        settings_data = (
            settings_response.data.get("results", settings_response.data)
            if isinstance(settings_response.data, dict)
            else settings_response.data
        )
        self.assertTrue(all(item["is_public"] for item in settings_data))

        files_response = self.client.get("/api/file-uploads/")
        self._assert_paginated_response(files_response)
        self.assertEqual(files_response.data["count"], 1)
        self.assertEqual(
            files_response.data["results"][0]["id"], data["file_upload"].id
        )

        self.client.force_authenticate(user=self.company_user)
        files_response = self.client.get("/api/file-uploads/")
        self._assert_paginated_response(files_response)
        self.assertEqual(files_response.data["count"], 0)

    def test_admin_business_actions_update_state_and_side_effects(self):
        data = self._seed_admin_contract_data()
        self.client.force_authenticate(user=self.role_admin)

        response = self.client.patch(
            f"/api/system/reports/admin-reports/{data['report'].id}/resolve/",
            {},
        )
        self.assertEqual(response.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)

        with patch("apps.system.reports.admin_views.EmailService.send_email"):
            response = self.client.post(
                f"/api/system/reports/admin-reports/{data['report'].id}/resolve/",
                {
                    "action": "reject",
                    "reporter_note": "Không phát hiện vi phạm",
                    "violator_note": "",
                },
                format="json",
            )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data["report"].refresh_from_db()
        self.assertEqual(data["report"].status, Report.Status.REJECTED)
        self.assertEqual(data["report"].resolved_by, self.role_admin)
        self.assertIsNotNone(data["report"].resolved_at)
        self.assertIn("Không phát hiện vi phạm", data["report"].resolution_notes)

        response = self.client.post(
            "/api/notifications/broadcast/",
            {
                "title": "Thông báo hợp đồng",
                "message": "Nội dung hợp đồng",
                "target": "candidate",
                "notification_type_id": data["notification_type"].id,
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["count"], 1)
        self.assertTrue(
            Notification.objects.filter(
                user=self.normal_user,
                title="Thông báo hợp đồng",
            ).exists()
        )

        response = self.client.patch(
            f"/api/system/settings/{data['setting'].id}/",
            {"setting_value": "disabled"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data["setting"].refresh_from_db()
        self.assertEqual(data["setting"].setting_value, "disabled")

        response = self.client.delete(f"/api/file-uploads/{data['file_upload'].id}/")
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(FileUpload.objects.filter(id=data["file_upload"].id).exists())
