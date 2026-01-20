from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAdminUser

from .models import CVTemplate
from .serializers import (
    CVTemplateListSerializer, 
    CVTemplateDetailSerializer,
    CVTemplateCategorySerializer,
    CVTemplateCreateSerializer
)


class CVTemplateViewSet(viewsets.ModelViewSet):
    """
    ViewSet cho mẫu CV.
    URL: /api/cv-templates/
    
    Endpoints:
    - GET /             → list (public)
    - GET /:id/         → retrieve (public)
    - GET /categories/  → list categories (public)
    - GET /premium/     → premium templates (public)
    - GET /popular/     → popular templates (public)
    - POST /            → create (admin)
    - PUT /:id/         → update (admin)
    - DELETE /:id/      → destroy (admin)
    """
    
    def get_queryset(self):
        queryset = CVTemplate.objects.select_related('category')
        
        # Admin thấy tất cả, user chỉ thấy active
        if not self.request.user.is_staff:
            queryset = queryset.filter(is_active=True)
        
        # Filter by category
        category = self.request.query_params.get('category')
        if category:
            queryset = queryset.filter(category__slug=category)
        
        # Filter by premium
        is_premium = self.request.query_params.get('is_premium')
        if is_premium is not None:
            queryset = queryset.filter(is_premium=is_premium.lower() == 'true')
        
        return queryset.order_by('-usage_count', '-rating')
    
    def get_serializer_class(self):
        if self.action == 'retrieve':
            return CVTemplateDetailSerializer
        if self.action in ['create', 'update', 'partial_update']:
            return CVTemplateCreateSerializer
        return CVTemplateListSerializer
    
    def get_permissions(self):
        """
        Public: list, retrieve, categories, premium, popular
        Admin: create, update, partial_update, destroy
        """
        if self.action in ['list', 'retrieve', 'categories', 'premium', 'popular']:
            return [AllowAny()]
        return [IsAdminUser()]
    
    @action(detail=False, methods=['get'])
    def categories(self, request):
        """
        GET /api/cv-templates/categories/
        Danh sách danh mục mẫu CV
        """
        from apps.candidate.cv_template_categories.models import CVTemplateCategory
        
        categories = CVTemplateCategory.objects.filter(
            is_active=True
        ).prefetch_related('templates').order_by('name')
        
        serializer = CVTemplateCategorySerializer(categories, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def premium(self, request):
        """
        GET /api/cv-templates/premium/
        Danh sách mẫu CV premium
        """
        queryset = CVTemplate.objects.filter(
            is_active=True,
            is_premium=True
        ).select_related('category').order_by('-rating', '-usage_count')
        
        serializer = CVTemplateListSerializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def popular(self, request):
        """
        GET /api/cv-templates/popular/
        Danh sách mẫu CV phổ biến (top 10)
        """
        queryset = CVTemplate.objects.filter(
            is_active=True
        ).select_related('category').order_by('-usage_count')[:10]
        
        serializer = CVTemplateListSerializer(queryset, many=True)
        return Response(serializer.data)
