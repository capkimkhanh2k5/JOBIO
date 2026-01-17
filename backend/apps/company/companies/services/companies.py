from django.db import transaction
from django.utils.text import slugify
from django.core.files.uploadedfile import UploadedFile

from pydantic import BaseModel

from ..models import Company

from apps.core.users.models import CustomUser
from apps.company.industries.models import Industry

from ..utils.cloudinary import save_company_file, delete_company_file, validate_image_file


class CompanyCreateInput(BaseModel):
    company_name: str
    slug: str | None = None
    tax_code: str | None = None
    company_size: str | None = None
    industry_id: int | None = None
    website: str | None = None
    description: str | None = None
    founded_year: int | None = None


def create_company(user: CustomUser, data: CompanyCreateInput) -> Company:
    """
    Tạo hồ sơ công ty cho user.
    - Validate: User chưa có company profile (OneToOne)
    - Auto-generate slug nếu không cung cấp
    """
    # Kiểm tra user đã có company chưa
    if hasattr(user, 'company_profile') and user.company_profile is not None:
        raise ValueError("Người dùng đã có hồ sơ công ty")
    
    # Auto-generate slug nếu không cung cấp
    slug = data.slug
    if not slug:
        base_slug = slugify(data.company_name)
        slug = base_slug
        counter = 1
        while Company.objects.filter(slug=slug).exists():
            slug = f"{base_slug}-{counter}"
            counter += 1
    
    # Lấy industry nếu có
    industry = None
    if data.industry_id:
        industry = Industry.objects.filter(id=data.industry_id).first()
    
    # Tạo Company
    with transaction.atomic():
        company = Company.objects.create(
            user=user,
            company_name=data.company_name,
            slug=slug,
            tax_code=data.tax_code or None,
            company_size=data.company_size or None,
            industry=industry,
            website=data.website or None,
            description=data.description or None,
            founded_year=data.founded_year or None,
        )
    
    return company


class CompanyUpdateInput(BaseModel):
    company_name: str | None = None
    tax_code: str | None = None
    company_size: str | None = None
    industry_id: int | None = None
    website: str | None = None
    description: str | None = None
    founded_year: int | None = None


def update_company(company: Company, data: CompanyUpdateInput) -> Company:
    """Cập nhật thông tin công ty"""
    fields_to_update = []
    
    if data.company_name is not None:
        company.company_name = data.company_name
        fields_to_update.append('company_name')
    
    if data.tax_code is not None:
        company.tax_code = data.tax_code or None
        fields_to_update.append('tax_code')
    
    if data.company_size is not None:
        company.company_size = data.company_size or None
        fields_to_update.append('company_size')
    
    if data.industry_id is not None:
        if data.industry_id:
            company.industry = Industry.objects.filter(id=data.industry_id).first()
        else:
            company.industry = None
        fields_to_update.append('industry')
    
    if data.website is not None:
        company.website = data.website or None
        fields_to_update.append('website')
    
    if data.description is not None:
        company.description = data.description or None
        fields_to_update.append('description')
    
    if data.founded_year is not None:
        company.founded_year = data.founded_year or None
        fields_to_update.append('founded_year')
    
    if fields_to_update:
        company.save(update_fields=fields_to_update)
    
    return company


def delete_company(company: Company) -> None:
    """Xóa công ty (Hard delete)"""
    company.delete()

def upload_company_logo(company: Company, file: UploadedFile) -> str:
    """
    Upload logo cho công ty
    """
    validate_image_file(file, max_size_mb=2)
    
    if company.logo_url:
        delete_company_file(company.logo_url)
    
    new_url = save_company_file(company.id, file, 'logo')
    company.logo_url = new_url
    company.save(update_fields=['logo_url'])
    
    return new_url
    
def upload_company_banner(company: Company, file: UploadedFile) -> str:
    """
    Upload banner cho công ty
    """
    validate_image_file(file, max_size_mb=5)
    
    if company.banner_url:
        delete_company_file(company.banner_url)
    
    new_url = save_company_file(company.id, file, 'banner')
    company.banner_url = new_url
    company.save(update_fields=['banner_url'])
    
    return new_url
    