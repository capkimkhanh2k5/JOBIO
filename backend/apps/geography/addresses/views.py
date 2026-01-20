from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated, IsAdminUser

from .models import Address
from .serializers import (
    AddressListSerializer,
    AddressDetailSerializer,
    AddressCreateUpdateSerializer
)


class AddressViewSet(viewsets.ModelViewSet):
    """
        ViewSet cho Địa chỉ (Full CRUD).
        URL: /api/addresses/
        
        Endpoints:
            - GET  /                   → list (public)
            - GET  /:id/               → retrieve (public)
            - POST /                   → create (authenticated)
            - PUT  /:id/               → update (authenticated)
            - DELETE /:id/             → destroy (admin)
            - PATCH /:id/verify/       → verify (admin)
    """
    
    def get_permissions(self):
        if self.action in ['create', 'update']:
            return [IsAuthenticated()]
        elif self.action in ['destroy', 'verify']:
            return [IsAdminUser()]
        return [AllowAny()]
    
    def get_queryset(self):
        return Address.objects.select_related('province', 'commune').order_by('-created_at')
    
    def get_serializer_class(self):
        if self.action == 'retrieve':
            return AddressDetailSerializer
        elif self.action in ['create', 'update']:
            return AddressCreateUpdateSerializer
        return AddressListSerializer
    
    @action(detail=True, methods=['patch'])
    def verify(self, request, pk=None):
        """
            PATCH /api/addresses/:id/verify/
            Xác thực địa chỉ (Admin only)
        """
        address = self.get_object()
        address.is_verified = True
        address.save()
        
        serializer = AddressDetailSerializer(address)
        return Response({
            'verified': True,
            'address': serializer.data
        })
