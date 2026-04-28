from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.decorators import action
from drf_spectacular.utils import extend_schema
from django.db.models import Count, Q
from django.utils import timezone
from datetime import timedelta

from .models import ActivityLog
from .serializers import ActivityLogSerializer
from .selectors.activity_logs import list_activity_logs


class ActivityLogViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for viewing Activity Logs"""
    queryset = ActivityLog.objects.all()
    serializer_class = ActivityLogSerializer
    permission_classes = [IsAuthenticated, IsAdminUser]
    
    def get_queryset(self):
        return list_activity_logs(filters=self.request.query_params.dict())
    
    @extend_schema(summary="List system activity logs")
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)
        
    @extend_schema(summary="Get activity log details")
    def retrieve(self, request, *args, **kwargs):
        return super().retrieve(request, *args, **kwargs)

    @action(detail=False, methods=['get'], url_path='stats')
    def stats(self, request):
        """GET /api/activity-logs/stats/ - Thống kê Activity Logs"""
        now = timezone.now()
        day_ago = now - timedelta(days=1)
        
        total_actions = ActivityLog.objects.count()
        actions_24h = ActivityLog.objects.filter(created_at__gte=day_ago).count()
        active_users_24h = ActivityLog.objects.filter(
            created_at__gte=day_ago
        ).values('user').distinct().count()
        
        top_actions = ActivityLog.objects.values('action').annotate(
            count=Count('id')
        ).order_by('-count')[:5]
        
        return Response({
            'total_actions': total_actions,
            'actions_24h': actions_24h,
            'active_users_24h': active_users_24h,
            'top_actions': list(top_actions),
        })
