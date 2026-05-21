from django.contrib.auth import get_user_model
from django.core import mail
from django.test import override_settings
from urllib.parse import unquote
from rest_framework import status
from rest_framework.test import APITestCase

from apps.communication.notifications.models import Notification

User = get_user_model()


@override_settings(
    EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend",
    DEFAULT_FROM_EMAIL="admin@jobio.vn",
)
class ContactViewTests(APITestCase):
    def setUp(self):
        self.admin = User.objects.create_user(
            email="admin@example.com",
            password="testpass123",
            full_name="Admin User",
            role="admin",
            is_staff=True,
            is_superuser=True,
        )

    def test_contact_submission_sends_priority_email_and_admin_notification(self):
        response = self.client.post(
            "/api/contact/",
            {
                "name": "Khánh Cấp Kim",
                "email": "khanh@example.com",
                "phone": "0839117789",
                "subject": "Báo giá & Gói dịch vụ",
                "message": "Hãy báo giá cho tôi với mức ưu đãi tốt nhất",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(len(mail.outbox), 1)
        self.assertEqual(mail.outbox[0].reply_to, ["khanh@example.com"])
        self.assertEqual(mail.outbox[0].extra_headers["Importance"], "High")
        self.assertEqual(mail.outbox[0].extra_headers["X-Priority"], "1")

        notification = Notification.objects.get(user=self.admin)
        self.assertEqual(notification.notification_type.type_name, "system")
        self.assertEqual(notification.entity_type, "contact")
        self.assertFalse(notification.is_read)
        self.assertIn("Liên hệ mới", notification.title)
        self.assertIn("Khánh Cấp Kim", notification.content)
        self.assertTrue(notification.link.startswith("https://mail.google.com/mail/u/0/#search/"))
        decoded_link = unquote(notification.link)
        self.assertIn("from:admin@jobio.vn", decoded_link)
        self.assertIn('subject:"[JOBIO Contact]"', decoded_link)
        self.assertIn('"khanh@example.com"', decoded_link)
        self.assertIn('"Báo giá & Gói dịch vụ"', decoded_link)
