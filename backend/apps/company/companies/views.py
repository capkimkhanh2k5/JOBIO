from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated, AllowAny

from .models import Company
from .serializers import CompanySerializer, CompanyCreateSerializer, CompanyUpdateSerializer
from .services.companies import create_company, update_company, delete_company, CompanyCreateInput, CompanyUpdateInput
from .selectors.companies import list_companies, get_company_by_id, get_company_by_slug


class IsCompanyOwner:
    """
    Permission: Chỉ chủ sở hữu mới được chỉnh sửa
    """
    def has_object_permission(self, request, view, obj):
        return obj.user == request.user


class CompanyViewSet(viewsets.GenericViewSet):
    """
    ViewSet cho quản lý Company.
    
    Endpoints:
    - GET    /api/companies/           -> list()
    - POST   /api/companies/           -> create()
    - GET    /api/companies/:id/       -> retrieve()
    - PUT    /api/companies/:id/       -> update()
    - DELETE /api/companies/:id/       -> destroy()
    - GET    /api/companies/slug/:slug/ -> retrieve_by_slug()
    """
    serializer_class = CompanySerializer
    
    def get_queryset(self):
        """
        Lấy queryset cho viewset
        """
        return list_companies(filters=self.request.query_params)
    
    def get_permissions(self):
        """
        Lấy permissions cho viewset
        """
        if self.action in ['list', 'retrieve', 'retrieve_by_slug']:
            return [AllowAny()]
        return [IsAuthenticated()]
    
    def list(self, request):
        """
        GET /api/companies/ - Danh sách công ty (công khai)
        """
        queryset = self.get_queryset()
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
    def create(self, request):
        """
        POST /api/companies/ - Tạo hồ sơ công ty
        """
        # Validate input
        serializer = CompanyCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # Gọi service layer
        try:
            company = create_company(
                user=request.user,
                data=CompanyCreateInput(**serializer.validated_data)
            )
        except ValueError as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        
        # Trả về response
        output_serializer = CompanySerializer(company)
        return Response(output_serializer.data, status=status.HTTP_201_CREATED)
    
    def retrieve(self, request, pk=None):
        """
        GET /api/companies/:id/ - Chi tiết công ty
        """
        company = get_company_by_id(company_id=pk)
        if not company:
            return Response({"detail": "Không tìm thấy công ty"}, status=status.HTTP_404_NOT_FOUND)
        
        serializer = self.get_serializer(company)
        return Response(serializer.data)
    
    def update(self, request, pk=None):
        """
        PUT /api/companies/:id/ - Cập nhật thông tin công ty
        """
        company = get_company_by_id(company_id=pk)
        if not company:
            return Response({"detail": "Không tìm thấy công ty"}, status=status.HTTP_404_NOT_FOUND)
        
        # Kiểm tra quyền sở hữu
        if company.user != request.user:
            return Response({"detail": "Bạn không có quyền chỉnh sửa công ty này"}, status=status.HTTP_403_FORBIDDEN)
        
        # Validate input
        serializer = CompanyUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # Gọi service layer
        updated_company = update_company(company, CompanyUpdateInput(**serializer.validated_data))
        
        output_serializer = CompanySerializer(updated_company)
        return Response(output_serializer.data)
    
    def destroy(self, request, pk=None):
        """
        DELETE /api/companies/:id/ - Xóa công ty
        """
        company = get_company_by_id(company_id=pk)
        if not company:
            return Response({"detail": "Không tìm thấy công ty"}, status=status.HTTP_404_NOT_FOUND)
        
        # Kiểm tra quyền sở hữu
        if company.user != request.user:
            return Response({"detail": "Bạn không có quyền xóa công ty này"}, status=status.HTTP_403_FORBIDDEN)
        
        delete_company(company)
        return Response(status=status.HTTP_204_NO_CONTENT)
    
    @action(detail=False, methods=['get'], url_path='slug/(?P<slug>[^/.]+)')
    def retrieve_by_slug(self, request, slug=None):
        """
        GET /api/companies/slug/:slug/ - Chi tiết theo slug
        """
        company = get_company_by_slug(slug=slug)
        if not company:
            return Response({"detail": "Không tìm thấy công ty"}, status=status.HTTP_404_NOT_FOUND)
        
        serializer = self.get_serializer(company)
        return Response(serializer.data)
