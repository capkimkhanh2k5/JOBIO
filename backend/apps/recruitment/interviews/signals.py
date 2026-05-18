from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Interview
from apps.communication.notifications.services.notifications import send_notification


@receiver(post_save, sender=Interview)
def notify_candidate_on_interview_scheduled(sender, instance, created, **kwargs):
    """Notify the candidate when a new interview is scheduled."""
    if created:
        candidate_user = instance.application.recruiter.user
        job_title = instance.application.job.title

        send_notification(
            user_id=candidate_user.id,
            notification_type_name="interview",
            title="Lịch phỏng vấn mới",
            content=f'Bạn có lịch phỏng vấn mới cho vị trí "{job_title}" vào lúc {instance.scheduled_at.strftime("%H:%M %d/%m/%Y")}.',
            link="/candidate/interviews",
            entity_type="interview",
            entity_id=instance.id,
        )
