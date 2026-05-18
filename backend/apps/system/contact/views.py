from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework.throttling import AnonRateThrottle
from rest_framework import status
from django.core.mail import send_mail
from django.conf import settings
import logging

logger = logging.getLogger(__name__)


class ContactRateThrottle(AnonRateThrottle):
    rate = "5/hour"


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
            send_mail(
                subject=email_subject,
                message=email_body,
                from_email=admin_email,
                recipient_list=[admin_email],
                fail_silently=False,
            )
        except Exception as e:
            logger.error("Failed to send contact email: %s", e)

        return Response(
            {
                "detail": "Tin nhắn của bạn đã được ghi nhận. Chúng tôi sẽ phản hồi trong 24h."
            },
            status=status.HTTP_201_CREATED,
        )
