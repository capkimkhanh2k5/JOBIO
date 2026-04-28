from django.db.models import QuerySet
from ..models import ActivityLog
from django.db.models import Q


def list_activity_logs(filters: dict = None) -> QuerySet[ActivityLog]:
    """List activity logs with filters"""
    queryset = ActivityLog.objects.select_related('user', 'log_type').all()
    
    if filters:
        search = filters.get('search')
        if search:
            queryset = queryset.filter(
                Q(action__icontains=search) |
                Q(user__full_name__icontains=search) |
                Q(user__email__icontains=search)
            )
        if filters.get('user_id'):
            queryset = queryset.filter(user_id=filters['user_id'])
        if filters.get('action'):
            queryset = queryset.filter(action__icontains=filters['action'])
        if filters.get('log_type'):
            queryset = queryset.filter(log_type__type_name=filters['log_type'])
        if filters.get('date_from'):
            queryset = queryset.filter(created_at__gte=filters['date_from'])
        if filters.get('date_to'):
            queryset = queryset.filter(created_at__lte=filters['date_to'])
            
    return queryset.order_by('-created_at')
