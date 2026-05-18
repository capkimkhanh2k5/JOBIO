from django.db import models
from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Company
from apps.communication.notifications.services.notifications import notify_admins, send_notification

@receiver(post_save, sender=Company)

def notify_admin_on_new_company(sender, instance, created, **kwargs):
    """Notify all admins when a new company is registered and needs verification."""
    if created:
        notify_admins(
            notification_type_name='verification',
            title='Công ty mới chờ duyệt',
            content=f'Công ty "{instance.company_name}" vừa đăng ký và đang chờ xác minh.',
            link=f'/admin/moderation?id={instance.id}',
            entity_type='company',
            entity_id=instance.id
        )
    else:
        # If status changed from pending to verified or rejected
        if hasattr(instance, '_old_status') and instance._old_status != instance.verification_status:
            if instance.user:
                status_label = "được duyệt" if instance.verification_status == Company.VerificationStatus.VERIFIED else "bị từ chối"
                send_notification(
                    user_id=instance.user.id,
                    notification_type_name='verification',
                    title='Kết quả xác minh công ty',
                    content=f'Hồ sơ công ty "{instance.company_name}" của bạn đã {status_label}.',
                    link='/company/settings',
                    entity_type='company',
                    entity_id=instance.id
                )

@receiver(models.signals.pre_save, sender=Company)
def store_old_company_status(sender, instance, **kwargs):
    if instance.pk:
        try:
            old_obj = Company.objects.get(pk=instance.pk)
            instance._old_status = old_obj.verification_status
        except Company.DoesNotExist:
            instance._old_status = None
    else:
        instance._old_status = None

