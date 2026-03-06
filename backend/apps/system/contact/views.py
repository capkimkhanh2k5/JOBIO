from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework import status


class ContactView(APIView):
    """
    POST /api/contact/
    Accept a contact form submission. No authentication required.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        name = (request.data.get('name') or '').strip()
        email = (request.data.get('email') or '').strip()
        subject = (request.data.get('subject') or '').strip()
        message = (request.data.get('message') or '').strip()

        if not all([name, email, subject, message]):
            return Response(
                {'detail': 'Vui lòng điền đầy đủ thông tin.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Log the contact submission to console for now.
        # In production this would send an email or save to DB.
        import logging
        logger = logging.getLogger(__name__)
        logger.info(
            'Contact form submission — name=%s email=%s subject=%s',
            name, email, subject
        )

        return Response(
            {'detail': 'Tin nhắn của bạn đã được ghi nhận. Chúng tôi sẽ phản hồi trong 24h.'},
            status=status.HTTP_201_CREATED
        )
