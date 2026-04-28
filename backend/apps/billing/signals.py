from django.db.models.signals import pre_save, post_save
from django.dispatch import receiver
from .models import Transaction
from apps.communication.notifications.services.notifications import notify_admins


@receiver(pre_save, sender=Transaction)
def store_old_transaction_status(sender, instance, **kwargs):
    """Store the old status before saving to detect changes."""
    if instance.pk:
        try:
            old_obj = Transaction.objects.get(pk=instance.pk)
            instance._old_status = old_obj.status
        except Transaction.DoesNotExist:
            instance._old_status = None
    else:
        instance._old_status = None


@receiver(post_save, sender=Transaction)
def notify_admin_on_completed_transaction(sender, instance, created, **kwargs):
    """Notify all admins when a transaction is completed."""
    old_status = getattr(instance, '_old_status', None)

    # Only notify when status transitions to 'completed'
    if instance.status == Transaction.Status.COMPLETED and old_status != Transaction.Status.COMPLETED:
        company_name = instance.company.company_name if instance.company else 'N/A'
        plan_name = instance.metadata.get('plan_name', '') if instance.metadata else ''
        desc = f'từ {company_name}'
        if plan_name:
            desc += f' cho gói "{plan_name}"'

        notify_admins(
            notification_type_name='billing',
            title='Giao dịch thanh toán mới',
            content=f'Giao dịch {instance.reference_code} trị giá {instance.amount:,.0f} VND {desc} đã hoàn thành.',
            link='/admin/financial',
            entity_type='transaction',
            entity_id=instance.id
        )
