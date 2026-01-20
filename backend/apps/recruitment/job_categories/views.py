from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAdminUser

from .models import JobCategory
from .serializers import JobCategorySerializer, JobCategoryTreeSerializer


class JobCategoryViewSet(viewsets.ModelViewSet):
    """
        ViewSet cho danh mục việc làm.
        URL: /api/job-categories/
        
        Endpoints:
        - GET /          → list (public)
        - GET /:id/      → retrieve (public)
        - GET /tree/     → hierarchical tree (public)
        - POST /         → create (admin)
        - PUT /:id/      → update (admin)
        - DELETE /:id/   → destroy (admin)
    """
    serializer_class = JobCategorySerializer
    
    def get_queryset(self):
        queryset = JobCategory.objects.select_related('parent')
        
        # Lọc bằng is_active
        if not self.request.user.is_staff:
            queryset = queryset.filter(is_active=True)
        
        # Lọc bằng parent
        parent_id = self.request.query_params.get('parent_id')
        if parent_id:
            if parent_id == 'null':
                queryset = queryset.filter(parent__isnull=True)
            else:
                queryset = queryset.filter(parent_id=parent_id)
        
        return queryset.order_by('display_order', 'name')
    
    def get_permissions(self):
        """
            Public: list, retrieve, tree
            Admin: create, update, destroy
        """
        if self.action in ['list', 'retrieve', 'tree']:
            return [AllowAny()]
        return [IsAdminUser()]
    
    @action(detail=False, methods=['get'])
    def tree(self, request):
        """
            GET /api/job-categories/tree/
            Cây phân cấp danh mục
        """
        root_categories = JobCategory.objects.filter(
            is_active=True,
            parent__isnull=True
        ).order_by('display_order', 'name')
        
        serializer = JobCategoryTreeSerializer(root_categories, many=True)
        return Response(serializer.data)
