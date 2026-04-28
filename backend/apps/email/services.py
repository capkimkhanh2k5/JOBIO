import logging
from django.conf import settings
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.utils.html import strip_tags

logger = logging.getLogger(__name__)

class EmailService:
    @staticmethod
    def send_email(recipient: str, subject: str, context: dict = None, body: str = None, template_path: str = None):
        """
        Send email using template (File) or raw body.
        Priority: template_path > body
        """
        if context is None:
            context = {}
            
        html_content = None
        plain_content = None
        
        # Try File Template
        if template_path:
            try:
                html_content = render_to_string(template_path, context)
                plain_content = strip_tags(html_content)

            except Exception as e:
                logger.error(f"Error rendering file template {template_path}: {e}")
                return False

        # Raw Body
        elif body:
            html_content = body # Assume body is HTML if intend is HTML email, or just text.
            plain_content = strip_tags(body)       

        if not html_content and not plain_content:
            logger.error("No content provided for email.")
            return False

        try:
            # Send email via Django's send_mail
            send_mail(
                subject=subject,
                message=plain_content or strip_tags(html_content), # Fallback plain text
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[recipient],
                html_message=html_content, # HTML Content
                fail_silently=False
            )
            return True
        except Exception as e:
            logger.error(f"Error sending email to {recipient}: {e}")
            return False
