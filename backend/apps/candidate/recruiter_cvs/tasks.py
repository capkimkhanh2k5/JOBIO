"""
Celery tasks for async CV parsing.

When a CV_Upload is created, the upload_cv_pdf() service dispatches
this task to parse the PDF in the background via Groq LLM.

Logic:
- Download PDF from Cloudinary → extract text → LLM parse → save cv_data
- Retry up to 3 times on transient failure
- If all retries fail, stay silent and let scoring fallback to recruiter profile
"""

import logging
from urllib.parse import urlparse

from celery import shared_task
from django.conf import settings
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
    4. Update cv_data + parsed_at in DB when parsing succeeds

    On failure after all retries, CV stays with empty cv_data and scoring
    automatically falls back to recruiter profile.
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

    from apps.candidate.recruiter_cvs.services.cv_parser import CVModerationBlocked

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

        cv_data = process_cv_pdf(
            pdf_bytes,
            user_identifier=f"recruiter:{cv.recruiter_id}:cv:{cv.id}",
        )

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

            return {
                "status": "success",
                "cv_id": cv_id,
                "skills_count": len(cv_data.get("skills", [])),
                "experience_count": len(cv_data.get("experience", [])),
            }
        else:
            # LLM returned empty — could be a temporary issue
            raise ValueError("LLM parsing returned empty result")

    except CVModerationBlocked:
        logger.warning("CV %s parsing blocked by safeguard", cv_id)
        return {"status": "blocked", "reason": "moderation_blocked"}
    except Exception as exc:
        error_code = _parse_error_code(exc)
        logger.warning(
            "CV %s parse attempt %s failed: %s",
            cv_id,
            self.request.retries + 1,
            error_code,
        )

        # Retry if we haven't exhausted retries
        if self.request.retries < self.max_retries:
            raise self.retry(exc=exc)

        # All retries exhausted — silent fallback.
        # cv_data stays empty, scoring will use recruiter profile instead.
        logger.error(
            "CV %s parsing failed after %s attempts: %s. "
            "Scoring will fallback to recruiter profile data.",
            cv_id,
            self.max_retries + 1,
            error_code,
        )

        return {"status": "failed", "reason": error_code}


def _download_pdf(cv_url: str) -> bytes:
    """Download bounded PDF bytes from an expected Cloudinary HTTPS host."""
    import requests
    from apps.candidate.recruiter_cvs.services.cv_parser import validate_pdf_bytes

    if not cv_url:
        raise ValueError("cv_url_empty")

    parsed = urlparse(cv_url)
    host = (parsed.hostname or "").lower()
    allowed_hosts = [
        host_name.lower()
        for host_name in getattr(settings, "CV_PARSE_ALLOWED_HOSTS", ["res.cloudinary.com"])
    ]
    if parsed.scheme != "https" or not _is_allowed_download_host(host, allowed_hosts):
        raise ValueError("cv_url_host_not_allowed")

    max_bytes = int(getattr(settings, "CV_UPLOAD_MAX_BYTES", 5 * 1024 * 1024))

    with requests.get(cv_url, stream=True, timeout=(5, 30)) as response:
        response.raise_for_status()

        content_length = response.headers.get("Content-Length")
        if content_length and int(content_length) > max_bytes:
            raise ValueError("pdf_too_large")

        chunks = []
        total_size = 0
        for chunk in response.iter_content(chunk_size=64 * 1024):
            if not chunk:
                continue
            total_size += len(chunk)
            if total_size > max_bytes:
                raise ValueError("pdf_too_large")
            chunks.append(chunk)

    pdf_bytes = b"".join(chunks)
    validate_pdf_bytes(pdf_bytes)
    logger.debug("Downloaded CV PDF: %d bytes", len(pdf_bytes))
    return pdf_bytes


def _is_allowed_download_host(host: str, allowed_hosts: list[str]) -> bool:
    return any(host == allowed or host.endswith(f".{allowed}") for allowed in allowed_hosts)


def _parse_error_code(exc: Exception) -> str:
    message = str(exc)
    if message in {
        "cv_url_empty",
        "cv_url_host_not_allowed",
        "pdf_too_large",
        "invalid_pdf_magic",
        "invalid_pdf",
        "pdf_empty",
        "pdf_no_pages",
        "pdf_too_many_pages",
    }:
        return message
    return exc.__class__.__name__.lower()
