from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated, IsAdminUser

from .models import InterviewType
from .serializers import InterviewTypeSerializer


class InterviewTypeViewSet(viewsets.ModelViewSet):
    """
    ViewSet cho quản lý loại phỏng vấn.
    URL: /api/interview-types/
    
    Endpoints:
    - GET /           → list
    - POST /          → create
    - GET /:id/       → retrieve
    - PUT /:id/       → update
    - PATCH /:id/     → partial_update
    - DELETE /:id/    → destroy
    """
    queryset = InterviewType.objects.all().order_by('name')
    serializer_class = InterviewTypeSerializer
    
    def get_permissions(self):
        """
            List/Retrieve: Authenticated users
            Create/Update/Delete: Admin only
        """
        if self.action in ['list', 'retrieve']:
            permission_classes = [IsAuthenticated]
        else:
            permission_classes = [IsAdminUser]
        return [permission() for permission in permission_classes]
