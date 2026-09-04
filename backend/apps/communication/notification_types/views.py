from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated

from .models import NotificationType
from .serializers import NotificationTypeSerializer


class NotificationTypeViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = NotificationTypeSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = None

    def get_queryset(self):
        return NotificationType.objects.filter(is_active=True).order_by("type_name")
