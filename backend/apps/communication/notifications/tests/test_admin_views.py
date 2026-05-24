from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase

from apps.communication.notification_types.models import NotificationType
from apps.communication.notifications.models import Notification

User = get_user_model()


class AdminNotificationViewTests(APITestCase):
    @classmethod
    def setUpTestData(cls):
        cls.notification_type = NotificationType.objects.create(
            type_name="system", is_active=True
        )
        cls.admin = User.objects.create_superuser(
            email="admin@jobio.vn",
            password="testpass123",
            full_name="Admin VN",
        )
        cls.other_admin = User.objects.create_superuser(
            email="admin@jobio.com",
            password="testpass123",
            full_name="Admin COM",
        )
        cls.own_unread = [
            Notification.objects.create(
                user=cls.admin,
                notification_type=cls.notification_type,
                title=f"Own unread {index}",
                content="Own unread content",
                is_read=False,
            )
            for index in range(4)
        ]
        cls.own_read = Notification.objects.create(
            user=cls.admin,
            notification_type=cls.notification_type,
            title="Own read",
            content="Own read content",
            is_read=True,
        )
        cls.other_unread = [
            Notification.objects.create(
                user=cls.other_admin,
                notification_type=cls.notification_type,
                title=f"Other unread {index}",
                content="Other unread content",
                is_read=False,
            )
            for index in range(3)
        ]

    def setUp(self):
        self.client.force_authenticate(user=self.admin)

    def test_admin_stats_are_scoped_to_current_admin(self):
        response = self.client.get("/api/notifications/admin-stats/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["total"], 5)
        self.assertEqual(response.data["total_unread"], 4)
        self.assertEqual(response.data["total_read"], 1)

    def test_admin_list_is_scoped_to_current_admin(self):
        response = self.client.get(
            "/api/notifications/admin-list/", {"page": 1, "page_size": 20}
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["count"], 5)
        returned_ids = {item["id"] for item in response.data["results"]}
        other_ids = {notification.id for notification in self.other_unread}
        self.assertTrue(
            {notification.id for notification in self.own_unread}.issubset(returned_ids)
        )
        self.assertIn(self.own_read.id, returned_ids)
        self.assertTrue(returned_ids.isdisjoint(other_ids))

    def test_admin_unread_list_matches_current_admin_unread_count(self):
        response = self.client.get(
            "/api/notifications/admin-list/",
            {"page": 1, "page_size": 20, "is_read": "false"},
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["count"], 4)
        self.assertTrue(all(not item["is_read"] for item in response.data["results"]))

    def test_admin_bulk_mark_read_does_not_mark_other_admin_notifications(self):
        response = self.client.post(
            "/api/notifications/admin-list/bulk-mark-as-read/", {"ids": []}
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(
            Notification.objects.filter(user=self.admin, is_read=False).count(), 0
        )
        self.assertEqual(
            Notification.objects.filter(user=self.other_admin, is_read=False).count(),
            3,
        )

    def test_admin_cannot_mark_other_admin_notification_as_read(self):
        response = self.client.patch(
            f"/api/notifications/admin-list/{self.other_unread[0].id}/mark-as-read/"
        )

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.other_unread[0].refresh_from_db()
        self.assertFalse(self.other_unread[0].is_read)
