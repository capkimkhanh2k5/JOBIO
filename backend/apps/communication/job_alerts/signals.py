from django.db.models.signals import post_save
from django.dispatch import receiver
from apps.recruitment.jobs.models import Job
import logging

logger = logging.getLogger(__name__)


from django.db import transaction  # noqa: E402
from apps.communication.job_alerts.tasks import process_job_matching_task  # noqa: E402
from apps.core.caching import CACHE_TIMEOUT_SHORT, CacheKeyBuilder, CacheService  # noqa: E402


def _enqueue_job_matching(job_id: int) -> None:
    enqueue_key = CacheKeyBuilder.task_enqueue("job_matching", job_id)
    if not CacheService.add(enqueue_key, timeout=CACHE_TIMEOUT_SHORT):
        logger.debug("Job matching task already queued for Job %s", job_id)
        return
    try:
        process_job_matching_task.delay(job_id)
    except Exception:
        CacheService.delete(enqueue_key)
        raise


@receiver(post_save, sender=Job)
def trigger_job_matching(sender, instance, created, **kwargs):
    """
    Trigger matching logic khi một Job được Published.
    Sử dụng Celery task để xử lý bất đồng bộ.
    """
    if instance.status == Job.Status.PUBLISHED:
        logger.info(f"Triggering async matching for Job {instance.id}")
        # Sử dụng on_commit để đảm bảo transaction đã commit trước khi task chạy
        transaction.on_commit(lambda: _enqueue_job_matching(instance.id))
