from celery import shared_task
from datetime import timedelta
from django.apps import apps
from django.db import transaction
from django.db.models import Q
from django.utils import timezone
from apps.communication.job_alerts.models import JobAlert, JobAlertMatch
from apps.communication.job_alerts.services.matching import JobMatchingService
from apps.communication.notifications.services.notifications import send_notification
from apps.core.caching import CacheKeyBuilder, CacheService
import logging

logger = logging.getLogger(__name__)


def _send_alert_match_notification(alert, job, match) -> bool:
    with transaction.atomic():
        locked_match = JobAlertMatch.objects.select_for_update().get(pk=match.pk)
        locked_alert = (
            JobAlert.objects.select_for_update()
            .select_related("recruiter__user")
            .get(pk=locked_match.job_alert_id)
        )

        if not locked_alert.is_active:
            logger.info(
                "Skipped job alert notification for disabled alert %s and job %s",
                locked_alert.id,
                job.id,
            )
            return False

        if locked_match.is_sent:
            logger.info(
                "Skipped duplicate job alert notification for alert %s and job %s",
                locked_alert.id,
                job.id,
            )
            return False

        notification = send_notification(
            user_id=locked_alert.recruiter.user_id,
            notification_type_name="job_alert",
            title=f"Job matched: {job.title}",
            content=f"Job {job.title} at {job.company.company_name} is matched with your alert '{locked_alert.alert_name}'.",
            link=f"/jobs/{job.slug}",
            entity_type="job",
            entity_id=job.id,
        )

        if not notification:
            logger.warning(
                "Failed to send notification for job %s (NotificationType 'job_alert' missing or disabled)",
                job.id,
            )
            return False

        locked_match.is_sent = True
        locked_match.save(update_fields=["is_sent"])
        locked_alert.last_sent_at = timezone.now()
        locked_alert.save(update_fields=["last_sent_at", "updated_at"])

    match.is_sent = True
    alert.last_sent_at = locked_alert.last_sent_at
    return True


@shared_task(
    bind=True,
    name="apps.communication.job_alerts.tasks.process_job_matching_task",
    max_retries=3,
    default_retry_delay=30,
    soft_time_limit=60,
    time_limit=90,
    acks_late=True,
    retry_backoff=True,
    retry_jitter=True,
)
def process_job_matching_task(self, job_id):
    """
    Celery task để xử lý matching job alert bất đồng bộ.
    """
    lock_key = CacheKeyBuilder.task_lock("job_matching", job_id)
    with CacheService.lock(lock_key, timeout=120) as acquired:
        if not acquired:
            return {"status": "skipped", "reason": "already_running", "job_id": job_id}
        return _process_job_matching_locked(self, job_id)


def _process_job_matching_locked(self, job_id):
    try:
        # Lazy import để tránh circular import
        Job = apps.get_model("recruitment_jobs", "Job")

        try:
            job = Job.objects.select_related("company").get(id=job_id)
        except Job.DoesNotExist:
            logger.error(f"Job {job_id} not found for matching task")
            return {"status": "error", "reason": "job_not_found", "job_id": job_id}

        from apps.recruitment.jobs.selectors.jobs import is_job_publicly_available

        if not is_job_publicly_available(job):
            logger.info(
                "Skipped job alert matching for non-public job %s",
                job_id,
            )
            return {
                "status": "skipped",
                "reason": "job_not_publicly_available",
                "job_id": job_id,
            }

        logger.info(f"Processing background matching for Job {job_id}")

        matched_alerts = JobMatchingService.find_alerts_for_job(job)

        count = 0
        for alert in matched_alerts:
            # Tạo bản ghi match
            match = JobMatchingService.record_match(
                job_alert=alert,
                job=job,
                is_sent=False,
                score=getattr(alert, "_matching_score", 0.0),
            )

            if not match.is_sent and _send_alert_match_notification(alert, job, match):
                count += 1

        logger.info(f"Completed matching for Job {job_id}. Notifications sent: {count}")
        return {"status": "success", "job_id": job_id, "notifications_sent": count}

    except Exception as e:
        logger.error(f"Error in process_job_matching_task for job {job_id}: {str(e)}")
        if self.request.retries < self.max_retries:
            raise self.retry(exc=e)
        return {"status": "failed", "reason": e.__class__.__name__.lower()}


@shared_task(
    bind=True,
    name="apps.communication.job_alerts.tasks.process_due_job_alerts_task",
    max_retries=2,
    default_retry_delay=60,
    soft_time_limit=120,
    time_limit=180,
)
def process_due_job_alerts_task(self, max_jobs=200):
    """
    Periodically sweep active alerts so missed instant tasks or older alerts still
    receive matched-job notifications according to their frequency.
    """
    lock_key = CacheKeyBuilder.task_lock("due_job_alerts", "sweep")
    with CacheService.lock(lock_key, timeout=180) as acquired:
        if not acquired:
            return {"status": "skipped", "reason": "already_running"}
        return _process_due_job_alerts_locked(self, max_jobs=max_jobs)


def _process_due_job_alerts_locked(self, max_jobs=200):
    try:
        Job = apps.get_model("recruitment_jobs", "Job")
        JobAlert = apps.get_model("communication_job_alerts", "JobAlert")
        from apps.recruitment.jobs.selectors.jobs import publicly_available_jobs

        now = timezone.now()
        due_alert_ids = set(
            JobAlert.objects.filter(is_active=True)
            .filter(
                Q(frequency=JobAlert.Frequency.INSTANT)
                | Q(last_sent_at__isnull=True)
                | Q(
                    frequency=JobAlert.Frequency.DAILY,
                    last_sent_at__lte=now - timedelta(days=1),
                )
                | Q(
                    frequency=JobAlert.Frequency.WEEKLY,
                    last_sent_at__lte=now - timedelta(days=7),
                )
            )
            .values_list("id", flat=True)
        )
        if not due_alert_ids:
            return {"status": "success", "notifications_sent": 0, "alerts_checked": 0}

        jobs = (
            publicly_available_jobs(Job.objects.all())
            .select_related("company", "category", "address__province")
            .prefetch_related("required_skills__skill")
            .order_by("-published_at", "-created_at")[: int(max_jobs or 200)]
        )

        sent = 0
        checked = 0
        for job in jobs:
            for alert in JobMatchingService.find_alerts_for_job(job):
                if alert.id not in due_alert_ids:
                    continue
                checked += 1
                match = JobMatchingService.record_match(
                    job_alert=alert,
                    job=job,
                    is_sent=False,
                    score=getattr(alert, "_matching_score", 0.0),
                )
                if not match.is_sent and _send_alert_match_notification(
                    alert, job, match
                ):
                    sent += 1

        return {
            "status": "success",
            "notifications_sent": sent,
            "alerts_checked": checked,
        }
    except Exception as e:
        logger.error("Error in process_due_job_alerts_task: %s", str(e))
        if self.request.retries < self.max_retries:
            raise self.retry(exc=e)
        return {"status": "failed", "reason": e.__class__.__name__.lower()}
