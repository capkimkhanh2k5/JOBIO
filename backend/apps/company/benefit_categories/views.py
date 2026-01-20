from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAdminUser
from django.db import transaction

from .models import BenefitCategory
from .serializers import (
    BenefitCategorySerializer,
    BenefitCategoryListSerializer,
    ReorderSerializer
)


class BenefitCategoryViewSet(viewsets.ModelViewSet):
    """
        ViewSet cho Danh mục phúc lợi.
        URL: /api/benefit-categories/
        
        Endpoints:
            - GET /              → list (public)
            - POST /             → create (admin)
            - PUT /:id/          → update (admin)
            - DELETE /:id/       → destroy (admin)
            - PATCH /reorder/    → bulk reorder (admin)
    """
    
    def get_queryset(self):
        queryset = BenefitCategory.objects.all()
        
        # Lọc bằng is_active
        if not self.request.user.is_staff:
            queryset = queryset.filter(is_active=True)
        
        return queryset.order_by('display_order', 'name')
    
    def get_serializer_class(self):
        if self.action == 'list':
            return BenefitCategoryListSerializer
        if self.action == 'reorder':
            return ReorderSerializer
        return BenefitCategorySerializer
    
    def get_permissions(self):
        """
            Public: list
            Admin: create, update, partial_update, destroy, reorder
        """
        if self.action == 'list':
            return [AllowAny()]
        return [IsAdminUser()]
    
    @action(detail=False, methods=['patch'])
    @transaction.atomic
    def reorder(self, request):
        """
            PATCH /api/benefit-categories/reorder/
            Bulk update display_order cho nhiều categories
        
        Input:
        {
            "items": [
                {"id": 1, "display_order": 0},
                {"id": 2, "display_order": 1},
                {"id": 3, "display_order": 2}
            ]
        }
        """
        serializer = ReorderSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        items = serializer.validated_data['items']
        
        # Kiểm tra xem tất cả các ID có tồn tại không
        ids = [item['id'] for item in items]
        existing_ids = set(
            BenefitCategory.objects.filter(id__in=ids).values_list('id', flat=True)
        )
        
        missing_ids = set(ids) - existing_ids
        if missing_ids:
            return Response(
                {"detail": f"Categories not found: {list(missing_ids)}"},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Cập nhật display_order cho mỗi item
        for item in items:
            BenefitCategory.objects.filter(id=item['id']).update(
                display_order=item['display_order']
            )
        
        # Trả về danh sách đã được cập nhật
        categories = BenefitCategory.objects.filter(id__in=ids).order_by('display_order')
        return Response(BenefitCategoryListSerializer(categories, many=True).data)
