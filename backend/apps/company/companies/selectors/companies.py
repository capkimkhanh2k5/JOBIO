import django_filters
from django.db.models import QuerySet

from ..models import Company


class CompanyFilter(django_filters.FilterSet):
    """Filter cho danh sách công ty"""
    class Meta:
        model = Company
        fields = {
            'company_name': ['icontains'],
            'company_size': ['exact'],
            'industry': ['exact'],
            'verification_status': ['exact'],
        }


def list_companies(*, filters: dict = None) -> QuerySet[Company]:
    """
    Lấy danh sách công ty với hỗ trợ filter.
    """
    qs = Company.objects.select_related('industry', 'user').order_by('-created_at')
    
    if filters:
        return CompanyFilter(filters, queryset=qs).qs
    
    return qs


def get_company_by_id(*, company_id: int) -> Company | None:
    """Lấy công ty theo ID"""
    return Company.objects.select_related('industry', 'user', 'address').filter(id=company_id).first()


def get_company_by_slug(*, slug: str) -> Company | None:
    """Lấy công ty theo slug"""
    return Company.objects.select_related('industry', 'user', 'address').filter(slug=slug).first()