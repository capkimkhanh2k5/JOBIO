import logging

from celery import shared_task

from apps.core.caching import CacheKeyBuilder, CacheService
from .cloudinary_utils import delete_cloudinary_file

logger = logging.getLogger(__name__)


@shared_task(
    bind=True,
    name="apps.system.file_uploads.tasks.delete_cloudinary_file_task",
    max_retries=3,
    default_retry_delay=30,
    soft_time_limit=30,
    time_limit=45,
    acks_late=True,
)
def delete_cloudinary_file_task(self, file_url: str, resource_type: str = "image"):
    lock_key = CacheKeyBuilder.task_lock("cloudinary_delete", file_url, resource_type)
    with CacheService.lock(lock_key, timeout=90) as acquired:
        if not acquired:
            return {"deleted": False, "reason": "already_running"}
        try:
            deleted = delete_cloudinary_file(
                file_url, resource_type=resource_type, raise_on_error=True
            )
        except Exception as exc:
            logger.warning(
                "Cloudinary cleanup failed; retrying url=%s resource_type=%s error=%s",
                file_url,
                resource_type,
                exc,
            )
            raise self.retry(exc=exc) from exc

        return {"deleted": deleted, "resource_type": resource_type}
