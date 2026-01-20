from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny

from .models import Province
from .serializers import ProvinceListSerializer, ProvinceDetailSerializer


class ProvinceViewSet(viewsets.ReadOnlyModelViewSet):
    """
        ViewSet cho Tỉnh/Thành phố (Read-Only).
        URL: /api/provinces/
        
        Endpoints:
            - GET /                    → list (public)
            - GET /:id/                → retrieve (public)
            - GET /by-region/:region/  → filter theo miền (public)
            - GET /search/?q=          → tìm kiếm (public)
    """
    permission_classes = [AllowAny]
    
    def get_queryset(self):
        return Province.objects.filter(is_active=True).order_by('province_name')
    
    def get_serializer_class(self):
        if self.action == 'retrieve':
            return ProvinceDetailSerializer
        return ProvinceListSerializer
    
    @action(detail=False, url_path='by-region/(?P<region>[^/.]+)')
    def by_region(self, request, region=None):
        """
            GET /api/provinces/by-region/:region/
            Filter tỉnh theo miền: north, central, south
        """
        valid_regions = ['north', 'central', 'south']
        
        if region not in valid_regions:
            return Response([])
        
        provinces = self.get_queryset().filter(region=region)
        serializer = ProvinceListSerializer(provinces, many=True)
        return Response(serializer.data)
    
    @action(detail=False)
    def search(self, request):
        """
            GET /api/provinces/search/?q=hanoi
            Tìm kiếm tỉnh theo tên
        """
        query = request.query_params.get('q', '')
        
        if len(query) < 2:
            return Response([])
        
        provinces = self.get_queryset().filter(
            province_name__icontains=query
        )[:20]
        
        serializer = ProvinceListSerializer(provinces, many=True)
        return Response(serializer.data)
