from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework.throttling import AnonRateThrottle
from rest_framework import status
from django.core.mail import EmailMessage
from django.conf import settings
import logging
from urllib.parse import quote

from apps.communication.notification_types.models import NotificationType
from apps.communication.notifications.services.notifications import notify_admins

logger = logging.getLogger(__name__)


def build_gmail_search_url(admin_email: str, sender_email: str, subject: str) -> str:
    query = f'from:{admin_email} subject:"[JOBIO Contact]" "{sender_email}" "{subject}"'
    return f"https://mail.google.com/mail/u/0/#search/{quote(query, safe='')}"


class ContactRateThrottle(AnonRateThrottle):
    rate = "3/hour"


class ContactView(APIView):
    """
    POST /api/contact/
    Accept a contact form submission. No authentication required.
    """

    permission_classes = [AllowAny]
    throttle_classes = [ContactRateThrottle]

    def post(self, request):
        name = (request.data.get("name") or "").strip()
        email = (request.data.get("email") or "").strip()
        phone = (request.data.get("phone") or "").strip()
        subject = (request.data.get("subject") or "").strip()
        message = (request.data.get("message") or "").strip()

        if not all([name, email, subject, message]):
            return Response(
                {"detail": "Vui lòng điền đầy đủ thông tin bắt buộc."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Log the contact submission
        logger.info(
            "Contact form submission — name=%s email=%s phone=%s subject=%s",
            name,
            email,
            phone,
            subject,
        )

        # Gửi email cho Admin
        admin_email = getattr(settings, "DEFAULT_FROM_EMAIL", "support@jobio.vn")

        email_subject = f"[JOBIO Contact] {subject} - Từ {name}"
        email_body = f"""Bạn nhận được một yêu cầu liên hệ mới từ trang Contact:

- Họ tên: {name}
- Email: {email}
- Số điện thoại: {phone if phone else "Không cung cấp"}
- Chủ đề: {subject}

Nội dung tin nhắn:
{message}
"""
        try:
            email_message = EmailMessage(
                subject=email_subject,
                body=email_body,
                from_email=admin_email,
                to=[admin_email],
                reply_to=[email],
                headers={
                    "Importance": "High",
                    "X-Priority": "1",
                    "X-MSMail-Priority": "High",
                    "Priority": "urgent",
                },
            )
            email_message.send(fail_silently=False)
        except Exception as e:
            logger.error("Failed to send contact email: %s", e)

        try:
            NotificationType.objects.get_or_create(
                type_name="system",
                defaults={
                    "description": "Thông báo hệ thống chung",
                    "template": '{"html": ""}',
                    "is_active": True,
                },
            )
            phone_text = f" - {phone}" if phone else ""
            notify_admins(
                notification_type_name="system",
                title=f"Liên hệ mới: {subject}",
                content=(
                    f"{name} ({email}{phone_text}) vừa gửi tin nhắn từ trang Contact: "
                    f"{message}"
                ),
                link=build_gmail_search_url(admin_email, email, subject),
                entity_type="contact",
            )
        except Exception as e:
            logger.error("Failed to create contact admin notification: %s", e)

        return Response(
            {
                "detail": "Tin nhắn của bạn đã được ghi nhận. Chúng tôi sẽ phản hồi trong 24h."
            },
            status=status.HTTP_201_CREATED,
        )
