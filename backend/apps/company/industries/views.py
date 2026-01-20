from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAdminUser

from .models import Industry
from .serializers import IndustrySerializer, IndustryTreeSerializer


class IndustryViewSet(viewsets.ModelViewSet):
    """
        ViewSet cho ngành nghề.
        URL: /api/industries/
        
        Endpoints:
        - GET /          → list (public)
        - GET /:id/      → retrieve (public)
        - GET /tree/     → hierarchical tree (public)
        - POST /         → create (admin)
        - PUT /:id/      → update (admin)
        - DELETE /:id/   → destroy (admin)
    """
    serializer_class = IndustrySerializer
    
    def get_queryset(self):
        queryset = Industry.objects.select_related('parent')
        
        # Filter by active status (admin sees all)
        if not self.request.user.is_staff:
            queryset = queryset.filter(is_active=True)
        
        # Filter by parent
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
            GET /api/industries/tree/
            Cây phân cấp ngành nghề
        """
        # Get only root nodes (parent=null)
        root_industries = Industry.objects.filter(
            is_active=True,
            parent__isnull=True
        ).order_by('display_order', 'name')
        
        serializer = IndustryTreeSerializer(root_industries, many=True)
        return Response(serializer.data)
