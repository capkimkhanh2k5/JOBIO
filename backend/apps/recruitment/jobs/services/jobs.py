from typing import Optional
from datetime import date
from decimal import Decimal
import uuid

from pydantic import BaseModel
from django.db import transaction
from django.utils.text import slugify
from django.utils import timezone

from apps.recruitment.jobs.models import Job
from apps.company.companies.models import Company
from apps.core.users.models import CustomUser


class JobInput(BaseModel):
    """
        Pydantic input model cho create/update job
    """
    # Required for create
    company_id: Optional[int] = None
    title: Optional[str] = None
    job_type: Optional[str] = None
    level: Optional[str] = None
    description: Optional[str] = None
    requirements: Optional[str] = None

    category_id: Optional[int] = None
    experience_years_min: Optional[int] = None
    experience_years_max: Optional[int] = None
    salary_min: Optional[Decimal] = None
    salary_max: Optional[Decimal] = None
    salary_currency: Optional[str] = None
    salary_type: Optional[str] = None
    is_salary_negotiable: Optional[bool] = None
    number_of_positions: Optional[int] = None
    benefits: Optional[str] = None
    is_remote: Optional[bool] = None
    application_deadline: Optional[date] = None
    status: Optional[str] = None
    
    class Config:
        arbitrary_types_allowed = True


def generate_slug(title: str, company_id: int) -> str:
    """
        Tạo unique slug cho job.
        Format: {title-slug}-{company_id}-{short-uuid}
        Example: senior-python-developer-5-a1b2c3d4
    """
    base_slug = slugify(title)
    short_uuid = str(uuid.uuid4())[:8]
    return f"{base_slug}-{company_id}-{short_uuid}"


@transaction.atomic
def create_job(user: CustomUser, data: JobInput) -> Job:
    """
        Tạo tin tuyển dụng mới.
        
        Business Rules:
        - User phải là owner của company
        - Status mặc định là draft
        - Auto generate slug
    """
    # Lấy company
    company = Company.objects.filter(id=data.company_id).first()
    if not company:
        raise ValueError("Company is not found!")
    
    # Kiểm tra user có quyền tạo tin tuyển dụng cho company
    if company.user != user:
        raise ValueError("You do not have permission to create a job for this company!")
    
    # Tạo unique slug
    slug = generate_slug(data.title, data.company_id)
    
    # Kiểm tra slug có tồn tại không
    while Job.objects.filter(slug=slug).exists():
        slug = generate_slug(data.title, data.company_id)
    
    # Build fields
    fields = data.dict(exclude_unset=True)
    fields.pop('company_id', None)  # Handled separately
    
    # Lấy category
    category_id = fields.pop('category_id', None)
    
    # Tạo job
    job = Job.objects.create(
        company=company,
        slug=slug,
        category_id=category_id,
        created_by=user,
        status='draft',  # Default status
        **fields
    )
    
    return job


@transaction.atomic
def update_job(job: Job, data: JobInput) -> Job:
    """
        Cập nhật tin tuyển dụng.
        
        Note: Không cho phép thay đổi company
    """
    fields = data.dict(exclude_unset=True)
    
    # Không cho update company_id
    fields.pop('company_id', None)
    
    # Lấy category_id
    if 'category_id' in fields:
        job.category_id = fields.pop('category_id')
    
    # Cập nhật status
    if 'status' in fields:
        new_status = fields.pop('status')
        if new_status == 'published' and job.status != 'published':
            job.published_at = timezone.now()
        job.status = new_status
    
    # Cập nhật các field khác
    for field, value in fields.items():
        setattr(job, field, value)
    
    job.save()
    return job


@transaction.atomic
def delete_job(job: Job) -> None:
    """
        Xóa tin tuyển dụng (hard delete).
    """
    job.delete()


@transaction.atomic
def change_job_status(job: Job, new_status: str) -> Job:
    """
         Thay đổi trạng thái tin tuyển dụng.

        Transition Rules:
            - draft → published ✅
            - draft → closed ✅
            - published → closed ✅
            - published → draft ❌
            - closed → published ✅
            - expired → published ✅
    """
    # Không cho published quay lại draft
    if job.status == 'published' and new_status == 'draft':
        raise ValueError("You cannot change a published job to draft!")
    
    # Set published_at nếu chuyển sang published
    if new_status == 'published' and job.status != 'published':
        job.published_at = timezone.now()
    
    job.status = new_status
    job.save()
    return job


@transaction.atomic
def publish_job(job: Job) -> Job:
    """
        Xuất bản tin tuyển dụng.
        Sets status=published và published_at=now
    """
    if job.status == 'published':
        raise ValueError("The job is already published!")
    
    job.status = 'published'
    job.published_at = timezone.now()
    job.save()
    return job


@transaction.atomic
def close_job(job: Job) -> Job:
    """
        Đóng tin tuyển dụng.
        Sets status=closed
    """
    if job.status == 'closed':
        raise ValueError("The job is already closed!")
    
    job.status = 'closed'
    job.save()
    return job


@transaction.atomic
def duplicate_job(user: CustomUser, job: Job) -> Job:
    """
        Nhân bản tin tuyển dụng.
        
            - Copy tất cả fields
            - Reset status=draft
            - Generate new slug
            - Clear published_at
            - Reset counts
    """
    # Tạo slug mới
    new_slug = generate_slug(job.title, job.company_id)
    while Job.objects.filter(slug=new_slug).exists():
        new_slug = generate_slug(job.title, job.company_id)
    
    # Tạo job mới
    new_job = Job.objects.create(
        company=job.company,
        title=f"{job.title} (Copy)",
        slug=new_slug,
        category=job.category,
        job_type=job.job_type,
        level=job.level,
        experience_years_min=job.experience_years_min,
        experience_years_max=job.experience_years_max,
        salary_min=job.salary_min,
        salary_max=job.salary_max,
        salary_currency=job.salary_currency,
        salary_type=job.salary_type,
        is_salary_negotiable=job.is_salary_negotiable,
        number_of_positions=job.number_of_positions,
        description=job.description,
        requirements=job.requirements,
        benefits=job.benefits,
        address=job.address,
        is_remote=job.is_remote,
        application_deadline=None,  # Reset deadline
        status='draft',  # Always draft for copies
        view_count=0,
        application_count=0,
        featured=False,
        featured_until=None,
        published_at=None,
        created_by=user
    )
    
    return new_job


@transaction.atomic
def record_job_view(job: Job) -> Job:
    """
        Ghi nhận lượt xem (atomic increment).
    """
    from django.db.models import F
    Job.objects.filter(id=job.id).update(
        view_count=F('view_count') + 1
    )
    job.refresh_from_db()
    return job


@transaction.atomic
def set_job_featured(job: Job, featured: bool, featured_until=None) -> Job:
    """
        Set/unset featured flag.
        
        Args:
            job: Job instance
            featured: True để đánh dấu nổi bật, False để bỏ
            featured_until: Optional date kết thúc nổi bật
    """
    job.featured = featured
    
    if featured and featured_until:
        job.featured_until = featured_until
    elif not featured:
        job.featured_until = None
    
    job.save()
    return job
