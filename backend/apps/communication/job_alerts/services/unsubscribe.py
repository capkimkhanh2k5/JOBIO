from django.core import signing

from apps.communication.job_alerts.models import JobAlert

JOB_ALERT_UNSUBSCRIBE_SALT = "job-alert-unsubscribe"
JOB_ALERT_UNSUBSCRIBE_MAX_AGE = 60 * 60 * 24 * 90


def make_job_alert_unsubscribe_token(alert: JobAlert) -> str:
    return signing.dumps(
        {"alert_id": alert.id, "recruiter_id": alert.recruiter_id},
        salt=JOB_ALERT_UNSUBSCRIBE_SALT,
        compress=True,
    )


def unsubscribe_job_alert(token: str) -> JobAlert:
    try:
        payload = signing.loads(
            token,
            salt=JOB_ALERT_UNSUBSCRIBE_SALT,
            max_age=JOB_ALERT_UNSUBSCRIBE_MAX_AGE,
        )
        alert_id = int(payload["alert_id"])
        recruiter_id = int(payload["recruiter_id"])
    except (KeyError, TypeError, ValueError, signing.BadSignature) as exc:
        raise ValueError("invalid_unsubscribe_token") from exc

    alert = JobAlert.objects.filter(id=alert_id, recruiter_id=recruiter_id).first()
    if not alert:
        raise ValueError("invalid_unsubscribe_token")

    if alert.is_active:
        alert.is_active = False
        alert.save(update_fields=["is_active", "updated_at"])
    return alert
