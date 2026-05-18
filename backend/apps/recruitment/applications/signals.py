from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver
from .models import Application
from apps.communication.notifications.services.notifications import send_notification

@receiver(pre_save, sender=Application)
def store_old_status(sender, instance, **kwargs):
    """Store the status before saving to detect changes."""
    if instance.pk:
        try:
            old_obj = Application.objects.get(pk=instance.pk)
            instance._old_status = old_obj.status
        except Application.DoesNotExist:
            instance._old_status = None
    else:
        instance._old_status = None

@receiver(post_save, sender=Application)
def notify_on_application_event(sender, instance, created, **kwargs):

    """
    1. Notify company when someone applies to their job.
    2. Notify candidate when their application status changes.
    """
    if created:
        # Notify Company
        if instance.job.company.user:
            send_notification(
                user_id=instance.job.company.user.id,
                notification_type_name='application',
                title='Ứng tuyển mới',
                content=f'Ứng viên {instance.recruiter.user.full_name} vừa ứng tuyển vào vị trí "{instance.job.title}".',
                link=f'/company/jobs/{instance.job.id}/candidates?application_id={instance.id}',
                entity_type='application',
                entity_id=instance.id
            )
    else:
        # Check if status changed (using tracker or comparing with old value)
        # For simplicity, we notify on any update that involves a status change.
        # Ideally, use django-model-utils FieldTracker.
        if hasattr(instance, '_old_status') and instance._old_status != instance.status:
            status_labels = dict(Application.Status.choices)
            send_notification(
                user_id=instance.recruiter.user.id,
                notification_type_name='application',
                title='Cập nhật trạng thái ứng tuyển',
                content=f'Hồ sơ của bạn cho vị trí "{instance.job.title}" đã được chuyển sang trạng thái: {status_labels.get(instance.status)}.',
                link='/candidate/applications',
                entity_type='application',
                entity_id=instance.id
            )

