from rest_framework import status
from rest_framework.test import APITestCase
from django.contrib.auth import get_user_model

from apps.communication.notification_types.models import NotificationType


User = get_user_model()


class NotificationTypeViewSetTests(APITestCase):
    @classmethod
    def setUpTestData(cls):
        cls.user = User.objects.create_user(
            email="notification-types@example.com",
            password="password123",
            full_name="Notification Admin",
        )
        cls.active_type = NotificationType.objects.create(
            type_name="system",
            description="System notices",
            template="Hello {{name}}",
            is_active=True,
        )
        NotificationType.objects.create(type_name="inactive", is_active=False)

    def test_list_notification_types_requires_auth(self):
        response = self.client.get("/api/notification-types/")

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_list_notification_types_returns_active_types(self):
        self.client.force_authenticate(self.user)

        response = self.client.get("/api/notification-types/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["id"], self.active_type.id)
        self.assertEqual(response.data[0]["type_name"], "system")
