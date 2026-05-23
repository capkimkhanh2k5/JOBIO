"""
Celery tasks for async CV parsing.

When a CV_Upload is created, the upload_cv_pdf() service dispatches
this task to parse the PDF in the background via Groq LLM.

Logic:
- Download PDF from Cloudinary → extract text → LLM parse → save cv_data
- Retry up to 3 times on failure (transient API/network errors)
- If all retries exhausted → silent fallback (scoring uses recruiter profile)
- No status tracking — just check cv_data: truthy = parsed, empty = not parsed
"""

import logging

from celery import shared_task
from django.utils import timezone

logger = logging.getLogger(__name__)


@shared_task(
    bind=True,
    name="apps.candidate.recruiter_cvs.tasks.parse_cv_task",
    max_retries=3,
    default_retry_delay=15,   # 15 seconds between retries
    soft_time_limit=60,       # 60 seconds soft limit
    time_limit=90,            # 90 seconds hard limit
    acks_late=True,           # Re-queue if worker crashes mid-task
)
def parse_cv_task(self, cv_id: int):
    """
    Async Celery task: Parse an uploaded CV PDF using LLM.

    Flow:
    1. Fetch CV record and its PDF from Cloudinary
    2. Extract text from PDF (PyMuPDF + OCR fallback)
    3. Send to Groq LLM for structured extraction
    4. Update cv_data + parsed_at in DB
    5. Send notification to user

    On failure after all retries: CV stays with empty cv_data,
    scoring algorithm automatically falls back to recruiter profile.
    """
    from apps.candidate.recruiter_cvs.models import RecruiterCV

    try:
        cv = RecruiterCV.objects.select_related("recruiter__user").get(id=cv_id)
    except RecruiterCV.DoesNotExist:
        logger.error(f"CV {cv_id} not found for parsing task")
        return {"status": "error", "reason": "cv_not_found"}

    # Skip if already parsed (has cv_data)
    if cv.cv_data:
        logger.info(f"CV {cv_id} already has cv_data, skipping parse")
        return {"status": "skipped", "reason": "already_parsed"}

    logger.info(
        f"Starting CV parse for CV {cv_id} "
        f"(recruiter={cv.recruiter_id}, attempt={self.request.retries + 1}/{self.max_retries + 1})"
    )

    try:
        # Step 1: Download PDF from Cloudinary URL
        pdf_bytes = _download_pdf(cv.cv_url)

        if not pdf_bytes:
            raise ValueError("Failed to download PDF from Cloudinary")

        # Step 2: Run parsing pipeline (extract text → LLM → normalize)
        from apps.candidate.recruiter_cvs.services.cv_parser import process_cv_pdf

        cv_data = process_cv_pdf(pdf_bytes)

        if cv_data:
            # Success: save parsed data
            cv.cv_data = cv_data
            cv.parsed_at = timezone.now()
            cv.save(update_fields=["cv_data", "parsed_at"])

            logger.info(
                f"CV {cv_id} parsed successfully: "
                f"{len(cv_data.get('skills', []))} skills, "
                f"{len(cv_data.get('experience', []))} experiences"
            )

            # Notify user
            _notify_cv_parsed(cv, success=True)

            return {
                "status": "success",
                "cv_id": cv_id,
                "skills_count": len(cv_data.get("skills", [])),
                "experience_count": len(cv_data.get("experience", [])),
            }
        else:
            # LLM returned empty — could be a temporary issue
            raise ValueError("LLM parsing returned empty result")

    except Exception as exc:
        logger.warning(
            f"CV {cv_id} parse attempt {self.request.retries + 1} failed: {exc}"
        )

        # Retry if we haven't exhausted retries
        if self.request.retries < self.max_retries:
            raise self.retry(exc=exc)

        # All retries exhausted — silent fallback
        # cv_data stays empty, scoring will use recruiter profile instead
        logger.error(
            f"CV {cv_id} parsing failed after {self.max_retries + 1} attempts. "
            "Scoring will fallback to recruiter profile data."
        )
        _notify_cv_parsed(cv, success=False)

        return {"status": "failed", "reason": str(exc)}


def _download_pdf(cv_url: str) -> bytes:
    """Download PDF bytes from Cloudinary URL."""
    import requests

    if not cv_url:
        logger.error("cv_url is empty, cannot download PDF")
        return b""

    try:
        response = requests.get(cv_url, timeout=30)
        response.raise_for_status()

        content_length = len(response.content)
        if content_length == 0:
            logger.error(f"Downloaded empty PDF from {cv_url}")
            return b""

        logger.debug(f"Downloaded PDF: {content_length} bytes from {cv_url}")
        return response.content
    except Exception as e:
        logger.error(f"Failed to download PDF from {cv_url}: {e}")
        return b""


def _notify_cv_parsed(cv, success: bool):
    """
    Send real-time notification to user about CV parsing completion.
    Uses the existing notification/SSE infrastructure via send_notification().
    """
    try:
        from apps.communication.notifications.services.notifications import (
            send_notification,
        )

        user = cv.recruiter.user

        if success:
            skill_count = len(cv.cv_data.get("skills", []))
            title = "CV đã được phân tích thành công"
            content = (
                f"CV \"{cv.cv_name}\" đã được phân tích. "
                f"Tìm thấy {skill_count} kỹ năng. "
                "Bạn có thể xem gợi ý việc làm phù hợp ngay bây giờ."
            )
            type_name = "cv_parsed"
        else:
            title = "Không thể phân tích CV"
            content = (
                f"Hệ thống không thể trích xuất thông tin từ CV \"{cv.cv_name}\". "
                "Vui lòng thử upload lại hoặc sử dụng CV dạng text."
            )
            type_name = "cv_parse_failed"

        send_notification(
            user_id=user.id,
            notification_type_name=type_name,
            title=title,
            content=content,
            entity_type="cv",
            entity_id=cv.id,
        )
    except Exception as e:
        # Notification failure should not break the parsing flow
        logger.warning(f"Failed to send CV parse notification: {e}")
