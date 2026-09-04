import logging
import os

from celery import shared_task
from celery.signals import worker_ready
from django.conf import settings
from django.utils import timezone

from apps.core.caching import CacheKeyBuilder, CacheService

logger = logging.getLogger(__name__)


def _should_retry(reason: str) -> bool:
    reason = str(reason or "").lower()
    return "rate" in reason or "timeout" in reason


def _worker_handles_embedding_queue(sender) -> bool:
    configured = os.getenv("CELERY_WORKER_QUEUES", "")
    if not configured and sender is not None:
        configured = str(sender.app.conf.task_default_queue or "")
    queues = {queue.strip() for queue in configured.split(",") if queue.strip()}
    return not queues or bool(queues & {"ai", "matching"})


@worker_ready.connect
def verify_embedding_model_cache_on_worker_ready(sender=None, **kwargs):
    if not getattr(settings, "RECOMMENDATION_SEMANTIC_ENABLED", True):
        return
    if (
        str(getattr(settings, "RECOMMENDATION_EMBEDDING_PROVIDER", "local") or "local")
        .strip()
        .lower()
        != "local"
    ):
        return
    if not _worker_handles_embedding_queue(sender):
        return

    from apps.recruitment.jobs.services.recommendations import (
        verify_embedding_model_cache_integrity,
    )

    result = verify_embedding_model_cache_integrity()
    if result.get("ok"):
        logger.info("Embedding model cache integrity check: %s", result)
    else:
        logger.error(
            "SECURITY WARNING: Embedding model cache failed safetensors check: %s",
            result,
        )


@shared_task(
    bind=True,
    name="apps.recruitment.jobs.tasks.generate_job_embedding_task",
    max_retries=3,
    default_retry_delay=30,
    soft_time_limit=45,
    time_limit=60,
    acks_late=True,
    retry_backoff=True,
    retry_jitter=True,
)
def generate_job_embedding_task(self, job_id: int):
    from apps.recruitment.jobs.services.recommendations import generate_job_embedding

    lock_key = CacheKeyBuilder.task_lock("job_embedding", job_id)
    with CacheService.lock(lock_key, timeout=120) as acquired:
        if not acquired:
            return {"status": "skipped", "reason": "already_running", "job_id": job_id}

        result = generate_job_embedding(job_id)
        if result.get("status") == "failed" and self.request.retries < self.max_retries:
            reason = result.get("reason", "")
            if _should_retry(reason):
                raise self.retry(exc=RuntimeError(reason))
        logger.info("Job embedding task result for %s: %s", job_id, result)
        return result


@shared_task(
    bind=True,
    name="apps.recruitment.jobs.tasks.generate_candidate_embedding_task",
    max_retries=3,
    default_retry_delay=30,
    soft_time_limit=45,
    time_limit=60,
    acks_late=True,
    retry_backoff=True,
    retry_jitter=True,
)
def generate_candidate_embedding_task(
    self,
    recruiter_id: int,
    cv_id: int | None = None,
    source_type: str = "profile",
):
    from apps.recruitment.jobs.services.recommendations import (
        generate_candidate_embedding,
    )

    lock_key = CacheKeyBuilder.task_lock(
        "candidate_embedding", recruiter_id, cv_id or "profile", source_type
    )
    with CacheService.lock(lock_key, timeout=120) as acquired:
        if not acquired:
            return {
                "status": "skipped",
                "reason": "already_running",
                "recruiter_id": recruiter_id,
                "cv_id": cv_id,
            }

        result = generate_candidate_embedding(recruiter_id, cv_id, source_type)
        if result.get("status") == "failed" and self.request.retries < self.max_retries:
            reason = result.get("reason", "")
            if _should_retry(reason):
                raise self.retry(exc=RuntimeError(reason))
        logger.info(
            "Candidate embedding task result for recruiter=%s cv=%s: %s",
            recruiter_id,
            cv_id,
            result,
        )
        return result


@shared_task(
    bind=True,
    name="apps.recruitment.jobs.tasks.expire_published_jobs_task",
    soft_time_limit=60,
    time_limit=90,
    acks_late=True,
)
def expire_published_jobs_task(self):
    """
    Close published jobs whose application deadline has passed and clear paid placement.
    """
    from apps.recruitment.jobs.models import Job
    from apps.recruitment.jobs.services.recommendations import (
        remove_job_from_vector_store,
    )

    lock_key = CacheKeyBuilder.task_lock("expire_published_jobs")
    with CacheService.lock(lock_key, timeout=120) as acquired:
        if not acquired:
            return {"status": "skipped", "reason": "already_running"}

        today = timezone.localdate()
        expired_ids = list(
            Job.objects.filter(
                status=Job.Status.PUBLISHED,
                application_deadline__isnull=False,
                application_deadline__lt=today,
            ).values_list("id", flat=True)
        )
        if not expired_ids:
            return {"status": "success", "expired_count": 0}

        updated = Job.objects.filter(id__in=expired_ids).update(
            status=Job.Status.EXPIRED,
            featured=False,
            featured_until=None,
            updated_at=timezone.now(),
        )
        for job_id in expired_ids:
            remove_job_from_vector_store(job_id)

        logger.info("Expired %s published jobs past deadline", updated)
        return {"status": "success", "expired_count": updated}
