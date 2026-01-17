from typing import Optional, List
from pydantic import BaseModel
from django.db import transaction

from ..models import CompanyBenefit
from ..selectors.company_benefits import get_max_display_order, get_benefit_ids_by_company
from apps.company.benefit_categories.models import BenefitCategory
from apps.company.companies.models import Company

class BenefitCreateInput(BaseModel):
    category_id: int
    benefit_name: str
    description: Optional[str] = ''
    display_order: Optional[int] = None  # None = auto (max + 1)

    class Config:
        extra = 'forbid'


class BenefitUpdateInput(BaseModel):
    category_id: Optional[int] = None
    benefit_name: Optional[str] = None
    description: Optional[str] = None
    display_order: Optional[int] = None

    class Config:
        extra = 'forbid'


def create_benefit(company: Company, data: BenefitCreateInput) -> CompanyBenefit:
    """
    Tạo phúc lợi mới cho công ty
    
    Business rules:
    - category_id phải tồn tại và is_active=True
    - display_order nếu None thì tự tính = max + 1
    """
    # Validate category
    try:
        category = BenefitCategory.objects.get(id=data.category_id, is_active=True)
    except BenefitCategory.DoesNotExist:
        raise ValueError("Danh mục phúc lợi không tồn tại hoặc không hoạt động")
    
    # Tính display_order nếu không cung cấp
    display_order = data.display_order
    if display_order is None:
        display_order = get_max_display_order(company.id) + 1
    
    # Tạo benefit
    benefit = CompanyBenefit.objects.create(
        company=company,
        category=category,
        benefit_name=data.benefit_name,
        description=data.description or '',
        display_order=display_order
    )
    
    return benefit


def update_benefit(benefit: CompanyBenefit, data: BenefitUpdateInput) -> CompanyBenefit:
    """
    Cập nhật thông tin phúc lợi
    
    Business rules:
    - Chỉ cập nhật fields được cung cấp (partial update)
    - category_id nếu thay đổi phải tồn tại và is_active=True
    """
    # Update category nếu có
    if data.category_id is not None:
        try:
            category = BenefitCategory.objects.get(id=data.category_id, is_active=True)
            benefit.category = category
        except BenefitCategory.DoesNotExist:
            raise ValueError("Danh mục phúc lợi không tồn tại")
    
    # Update các fields khác
    if data.benefit_name is not None:
        benefit.benefit_name = data.benefit_name
    if data.description is not None:
        benefit.description = data.description
    if data.display_order is not None:
        benefit.display_order = data.display_order
    
    # Save
    benefit.save()
    return benefit


def delete_benefit(benefit: CompanyBenefit) -> None:
    """Xóa phúc lợi"""
    benefit.delete()


def reorder_benefits(company: Company, benefit_ids: List[int]) -> List[CompanyBenefit]:
    """
    Sắp xếp lại thứ tự phúc lợi
    
    Business rules:
    - Tất cả IDs phải thuộc company này
    
    Args:
        company: Company object
        benefit_ids: List các benefit IDs theo thứ tự mới
    
    Returns:
        List benefits đã được sắp xếp
    """
    # Validate IDs
    existing_ids = get_benefit_ids_by_company(company.id)
    invalid_ids = set(benefit_ids) - existing_ids
    if invalid_ids:
        raise ValueError(f"Các benefit IDs không hợp lệ: {invalid_ids}")
    
    # Bulk update display_order
    with transaction.atomic():
        for index, benefit_id in enumerate(benefit_ids):
            CompanyBenefit.objects.filter(id=benefit_id).update(display_order=index)
    
    # Return updated list
    return list(company.benefits.all())
