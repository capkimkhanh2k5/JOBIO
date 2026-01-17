from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated, AllowAny

from .models import CompanyBenefit
from .serializers import (
    CompanyBenefitSerializer, 
    CompanyBenefitCreateSerializer,
    CompanyBenefitUpdateSerializer,
    BenefitReorderSerializer
)
from .services.company_benefits import (
    create_benefit, update_benefit, delete_benefit, reorder_benefits,
    BenefitCreateInput, BenefitUpdateInput
)
from .selectors.company_benefits import list_benefits_by_company, get_benefit_by_id
from apps.company.companies.selectors.companies import get_company_by_id


class CompanyBenefitViewSet(viewsets.GenericViewSet):
    """
    ViewSet cho Company Benefits APIs (Nested under companies)
    
    Endpoints:
    - GET    /api/companies/:company_pk/benefits/           - Danh sách phúc lợi
    - POST   /api/companies/:company_pk/benefits/           - Thêm phúc lợi mới
    - GET    /api/companies/:company_pk/benefits/:pk/       - Chi tiết phúc lợi
    - PUT    /api/companies/:company_pk/benefits/:pk/       - Cập nhật phúc lợi
    - DELETE /api/companies/:company_pk/benefits/:pk/       - Xóa phúc lợi
    - PATCH  /api/companies/:company_pk/benefits/reorder/   - Sắp xếp lại thứ tự
    """
    
    def get_queryset(self):
        company_pk = self.kwargs.get('company_pk')
        if company_pk:
            return list_benefits_by_company(company_pk)
        return CompanyBenefit.objects.none()
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [AllowAny()]
        return [IsAuthenticated()]
    
    def get_company(self):
        """Helper để lấy company từ URL parameter"""
        company_pk = self.kwargs.get('company_pk')
        return get_company_by_id(company_id=company_pk)
    
    def list(self, request, company_pk=None):
        """GET /api/companies/:company_pk/benefits/ - Danh sách phúc lợi"""
        company = self.get_company()
        if not company:
            return Response({"detail": "Not found company"}, status=status.HTTP_404_NOT_FOUND)
        
        benefits = list_benefits_by_company(company_pk)
        serializer = CompanyBenefitSerializer(benefits, many=True)
        return Response(serializer.data)
    
    def create(self, request, company_pk=None):
        """POST /api/companies/:company_pk/benefits/ - Thêm phúc lợi mới"""
        company = self.get_company()
        if not company:
            return Response({"detail": "Not found company"}, status=status.HTTP_404_NOT_FOUND)
        
        if company.user != request.user:
            return Response({"detail": "Permission denied"}, status=status.HTTP_403_FORBIDDEN)
        
        serializer = CompanyBenefitCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        try:
            benefit = create_benefit(company, BenefitCreateInput(**serializer.validated_data))
            output = CompanyBenefitSerializer(benefit)
            return Response(output.data, status=status.HTTP_201_CREATED)
        except ValueError as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)
    
    def retrieve(self, request, company_pk=None, pk=None):
        """GET /api/companies/:company_pk/benefits/:pk/ - Chi tiết phúc lợi"""
        benefit = get_benefit_by_id(pk)
        if not benefit:
            return Response({"detail": "Not found benefit"}, status=status.HTTP_404_NOT_FOUND)
        
        serializer = CompanyBenefitSerializer(benefit)
        return Response(serializer.data)
    
    def update(self, request, company_pk=None, pk=None):
        """PUT /api/companies/:company_pk/benefits/:pk/ - Cập nhật phúc lợi"""
        benefit = get_benefit_by_id(pk)
        if not benefit:
            return Response({"detail": "Not found benefit"}, status=status.HTTP_404_NOT_FOUND)
        
        if benefit.company.user != request.user:
            return Response({"detail": "Permission denied"}, status=status.HTTP_403_FORBIDDEN)
        
        serializer = CompanyBenefitUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        try:
            updated = update_benefit(benefit, BenefitUpdateInput(**serializer.validated_data))
            output = CompanyBenefitSerializer(updated)
            return Response(output.data)
        except ValueError as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)
    
    def destroy(self, request, company_pk=None, pk=None):
        """DELETE /api/companies/:company_pk/benefits/:pk/ - Xóa phúc lợi"""
        benefit = get_benefit_by_id(pk)
        if not benefit:
            return Response({"detail": "Not found benefit"}, status=status.HTTP_404_NOT_FOUND)
        
        if benefit.company.user != request.user:
            return Response({"detail": "Permission denied"}, status=status.HTTP_403_FORBIDDEN)
        
        delete_benefit(benefit)
        return Response(status=status.HTTP_204_NO_CONTENT)
    
    @action(detail=False, methods=['patch'], url_path='reorder')
    def reorder(self, request, company_pk=None):
        """PATCH /api/companies/:company_pk/benefits/reorder/ - Sắp xếp lại thứ tự"""
        company = self.get_company()
        if not company:
            return Response({"detail": "Not found company"}, status=status.HTTP_404_NOT_FOUND)
        
        if company.user != request.user:
            return Response({"detail": "Permission denied"}, status=status.HTTP_403_FORBIDDEN)
        
        serializer = BenefitReorderSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        try:
            benefits = reorder_benefits(company, serializer.validated_data['benefit_ids'])
            output = CompanyBenefitSerializer(benefits, many=True)
            return Response(output.data)
        except ValueError as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)
