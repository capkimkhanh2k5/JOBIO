from unittest.mock import patch

from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase

from apps.system.report_types.models import ReportType
from apps.system.reports.models import Report


User = get_user_model()


class ReportCreateViewTests(APITestCase):
    def setUp(self):
        self.reporter = User.objects.create_user(
            email="reporter@example.com",
            password="password123",
            role="candidate",
        )
        self.target_user = User.objects.create_user(
            email="target@example.com",
            password="password123",
            role="company",
        )
        self.admin = User.objects.create_user(
            email="admin@example.com",
            password="password123",
            role="admin",
        )
        self.report_type = ReportType.objects.create(
            type_name="Spam", description="Spam or scam content"
        )
        self.url = "/api/system/reports/"

    def test_authenticated_user_can_submit_report_and_notifies_admins(self):
        self.client.force_authenticate(user=self.reporter)

        with patch("apps.system.reports.signals.notify_admins") as notify_admins:
            response = self.client.post(
                self.url,
                {
                    "report_type": self.report_type.id,
                    "entity_type": "user",
                    "entity_id": self.target_user.id,
                    "description": "<b>Người dùng này spam tin tuyển dụng giả mạo.</b>",
                    "reporter": self.admin.id,
                    "status": Report.Status.RESOLVED,
                },
                format="json",
            )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        report = Report.objects.get(id=response.data["id"])
        self.assertEqual(report.reporter, self.reporter)
        self.assertEqual(report.status, Report.Status.PENDING)
        self.assertEqual(
            report.description, "Người dùng này spam tin tuyển dụng giả mạo."
        )
        notify_admins.assert_called_once()

    def test_anonymous_user_cannot_submit_report(self):
        response = self.client.post(
            self.url,
            {
                "report_type": self.report_type.id,
                "entity_type": "user",
                "entity_id": self.target_user.id,
                "description": "Nội dung spam cần kiểm tra.",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertFalse(Report.objects.exists())

    def test_duplicate_pending_report_is_rejected(self):
        self.client.force_authenticate(user=self.reporter)
        payload = {
            "report_type": self.report_type.id,
            "entity_type": "user",
            "entity_id": self.target_user.id,
            "description": "Nội dung spam cần kiểm tra.",
        }
        first_response = self.client.post(self.url, payload, format="json")
        second_response = self.client.post(self.url, payload, format="json")

        self.assertEqual(first_response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(second_response.status_code, status.HTTP_409_CONFLICT)
        self.assertEqual(Report.objects.count(), 1)

    def test_inactive_report_type_is_rejected(self):
        inactive_type = ReportType.objects.create(type_name="Inactive", is_active=False)
        self.client.force_authenticate(user=self.reporter)

        response = self.client.post(
            self.url,
            {
                "report_type": inactive_type.id,
                "entity_type": "user",
                "entity_id": self.target_user.id,
                "description": "Nội dung spam cần kiểm tra.",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(Report.objects.exists())

    def test_unknown_entity_is_rejected(self):
        self.client.force_authenticate(user=self.reporter)

        response = self.client.post(
            self.url,
            {
                "report_type": self.report_type.id,
                "entity_type": "user",
                "entity_id": 999999,
                "description": "Nội dung spam cần kiểm tra.",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("entity_id", response.data)
        self.assertFalse(Report.objects.exists())
