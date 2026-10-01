from rest_framework import viewsets

from apps.core.users.permissions import IsAdmin

from .models import ModerationAudit
from .serializers import ModerationAuditSerializer


class ModerationAuditViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = ModerationAuditSerializer
    permission_classes = [IsAdmin]

    def get_queryset(self):
        queryset = ModerationAudit.objects.select_related("created_by").order_by(
            "-created_at"
        )
        params = self.request.query_params
        for field in ("entity_type", "entity_id", "purpose", "decision", "severity"):
            value = params.get(field)
            if value:
                queryset = queryset.filter(**{field: value})
        return queryset
