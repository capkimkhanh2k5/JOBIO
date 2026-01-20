from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAdminUser

from .models import Commune
from .serializers import (
    CommuneListSerializer,
    CommuneDetailSerializer,
    CommuneCreateUpdateSerializer
)


class CommuneViewSet(viewsets.ModelViewSet):
    """
        ViewSet cho Xã/Phường (CRUD - không có DELETE).
        URL: /api/communes/
        
        Endpoints:
            - GET  /                        → list (public)
            - GET  /:id/                    → retrieve (public)
            - POST /                        → create (admin)
            - PUT  /:id/                    → update (admin)
            - GET  /api/provinces/:id/communes/  → by_province (public, nested route)
    """
    http_method_names = ['get', 'post', 'put', 'head', 'options']
    
    def get_permissions(self):
        if self.action in ['create', 'update']:
            return [IsAdminUser()]
        return [AllowAny()]
    
    def get_queryset(self):
        queryset = Commune.objects.filter(is_active=True).select_related('province')
        
        # Hỗ trợ lọc bằng province_id query param
        province_id = self.request.query_params.get('province_id')
        if province_id:
            queryset = queryset.filter(province_id=province_id)
        
        return queryset.order_by('commune_name')
    
    def get_serializer_class(self):
        if self.action == 'retrieve':
            return CommuneDetailSerializer
        elif self.action in ['create', 'update']:
            return CommuneCreateUpdateSerializer
        return CommuneListSerializer
    
    def by_province(self, request, province_id=None):
        """
            GET /api/provinces/:province_id/communes/
            Danh sách xã/phường theo tỉnh
        """
        communes = Commune.objects.filter(
            province_id=province_id,
            is_active=True
        ).select_related('province').order_by('commune_name')
        
        serializer = CommuneListSerializer(communes, many=True)
        return Response(serializer.data)
