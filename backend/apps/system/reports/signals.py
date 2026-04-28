from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Report
from apps.communication.notifications.services.notifications import notify_admins

@receiver(post_save, sender=Report)
def notify_admin_on_new_report(sender, instance, created, **kwargs):
    """Notify all admins when a new violation report is submitted."""
    if created:
        notify_admins(
            notification_type_name='report',
            title='Báo cáo vi phạm mới',
            content=f'Có báo cáo vi phạm mới về {instance.entity_type} (ID: {instance.entity_id}): {instance.report_type.type_name}',
            link=f'/admin/reports?id={instance.id}',
            entity_type='report',
            entity_id=instance.id
        )
