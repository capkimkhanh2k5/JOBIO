from django.db.models import Max
from ..models import CompanyBenefit


def list_benefits_by_company(company_id: int):
    """
    Lấy danh sách phúc lợi của một công ty
    Model đã có ordering = ['display_order'] trong Meta
    """
    return CompanyBenefit.objects.filter(company_id=company_id).select_related('category')


def get_benefit_by_id(benefit_id: int):
    """Lấy phúc lợi theo ID, trả về None nếu không tồn tại"""
    try:
        return CompanyBenefit.objects.select_related('category', 'company').get(id=benefit_id)
    except CompanyBenefit.DoesNotExist:
        return None


def get_benefit_count_by_company(company_id: int) -> int:
    """Đếm số phúc lợi của công ty"""
    return CompanyBenefit.objects.filter(company_id=company_id).count()


def get_benefit_ids_by_company(company_id: int) -> set:
    """Lấy set các benefit IDs của công ty"""
    return set(CompanyBenefit.objects.filter(company_id=company_id).values_list('id', flat=True))


def get_max_display_order(company_id: int) -> int:
    """Lấy display_order lớn nhất của company, để gán +1 cho benefit mới"""
    result = CompanyBenefit.objects.filter(company_id=company_id).aggregate(Max('display_order'))
    return result['display_order__max'] or 0
