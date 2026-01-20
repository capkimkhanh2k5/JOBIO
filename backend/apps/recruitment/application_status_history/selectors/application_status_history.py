from typing import Optional
from django.db.models import QuerySet
from apps.recruitment.application_status_history.models import ApplicationStatusHistory


def list_history_by_application(application_id: int) -> QuerySet[ApplicationStatusHistory]:
    """
        Lấy lịch sử thay đổi trạng thái theo application_id.
    """
    return ApplicationStatusHistory.objects.filter(
        application_id=application_id
    ).select_related(
        'changed_by'
    ).order_by('-created_at')
