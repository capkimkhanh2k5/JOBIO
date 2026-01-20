from django.db import transaction
from apps.recruitment.applications.models import Application
from apps.recruitment.application_status_history.models import ApplicationStatusHistory


@transaction.atomic
def log_status_history(
    application: Application,
    old_status: str,
    new_status: str,
    changed_by,
    notes: str = None
) -> ApplicationStatusHistory:
    """
        Ghi lại lịch sử thay đổi trạng thái.
    """
    return ApplicationStatusHistory.objects.create(
        application=application,
        old_status=old_status,
        new_status=new_status,
        changed_by=changed_by,
        notes=notes
    )
