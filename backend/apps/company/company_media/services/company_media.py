from typing import List, Optional
from pydantic import BaseModel, ConfigDict
from django.db import transaction
from django.core.files.uploadedfile import UploadedFile

from apps.company.companies.utils.cloudinary import (
    save_company_file,
)
from apps.company.companies.models import Company
from apps.company.media_types.models import MediaType
from ..models import CompanyMedia
from ..selectors import get_company_media


class CompanyMediaCreateInput(BaseModel):
    media_file: UploadedFile
    media_type_id: int
    title: Optional[str] = None
    caption: Optional[str] = None
    display_order: int = 0

    model_config = ConfigDict(arbitrary_types_allowed=True)


class CompanyMediaUpdateInput(BaseModel):
    title: Optional[str] = None
    caption: Optional[str] = None
    display_order: Optional[int] = None


class MediaReorderItemInput(BaseModel):
    id: int
    display_order: int


class CompanyMediaReorderInput(BaseModel):
    reorders: List[MediaReorderItemInput]


class CompanyMediaBulkUploadInput(BaseModel):
    media_files: List[UploadedFile]
    media_type_id: int

    model_config = ConfigDict(arbitrary_types_allowed=True)


@transaction.atomic
def upload_company_media_service(
    company_id: int, user, data: CompanyMediaCreateInput
) -> CompanyMedia:
    """Xử lý upload media đơn lẻ lên Cloudinary và lưu DB"""
    try:
        company = Company.objects.get(id=company_id)
    except Company.DoesNotExist:
        raise ValueError("Công ty không tồn tại")

    if company.user_id != user.id:
        raise ValueError("Bạn không có quyền cập nhật media của công ty này")

    try:
        media_type = MediaType.objects.get(id=data.media_type_id)
    except MediaType.DoesNotExist:
        raise ValueError("Loại media không tồn tại")

    # Xác định resource_type cho Cloudinary
    resource_type = "video" if "video" in media_type.type_name.lower() else "image"

    # Upload lên Cloudinary
    try:
        media_url = save_company_file(
            company_id=company_id,
            file=data.media_file,
            file_type="office_media",
            resource_type=resource_type,
        )
    except Exception as e:
        raise ValueError(f"Lỗi khi upload lên Cloudinary: {str(e)}")

    # Lưu vào database
    media = CompanyMedia.objects.create(
        company=company,
        media_type=media_type,
        media_url=media_url,
        title=data.title,
        caption=data.caption,
        display_order=data.display_order,
    )

    return media


@transaction.atomic
def update_company_media_service(
    media_id: int, user, data: CompanyMediaUpdateInput
) -> CompanyMedia:
    """Cập nhật thông tin media (title, caption, order)"""
    media = get_company_media(id=media_id)
    if not media:
        raise ValueError("Media không tồn tại")

    if media.company.user_id != user.id:
        raise ValueError("Bạn không có quyền cập nhật media này")

    if data.title is not None:
        media.title = data.title
    if data.caption is not None:
        media.caption = data.caption
    if data.display_order is not None:
        media.display_order = data.display_order

    media.save()
    return media


@transaction.atomic
def delete_company_media_service(media_id: int, user) -> None:
    """Xóa media khỏi DB và Cloudinary"""
    media = get_company_media(id=media_id)
    if not media:
        raise ValueError("Media không tồn tại")

    # Xác định resource_type để xóa đúng trên Cloudinary
    if media.company.user_id != user.id:
        raise ValueError("Bạn không có quyền xóa media này")

    media.delete()


@transaction.atomic
def reorder_company_media_service(
    company_id: int, user, data: CompanyMediaReorderInput
) -> None:
    """Cập nhật display_order cho danh sách media"""
    try:
        company = Company.objects.get(id=company_id)
    except Company.DoesNotExist:
        raise ValueError("Công ty không tồn tại")

    if company.user_id != user.id:
        raise ValueError("Bạn không có quyền sắp xếp media của công ty này")

    for item in data.reorders:
        CompanyMedia.objects.filter(id=item.id, company_id=company_id).update(
            display_order=item.display_order
        )


@transaction.atomic
def bulk_upload_company_media_service(
    company_id: int, user, data: CompanyMediaBulkUploadInput
) -> List[CompanyMedia]:
    """Upload nhiều media cùng lúc"""
    media_list = []

    # Pre-fetch media type check once
    try:
        MediaType.objects.get(id=data.media_type_id)
    except MediaType.DoesNotExist:
        raise ValueError("Loại media không tồn tại")

    for file in data.media_files:
        upload_data = CompanyMediaCreateInput(
            media_file=file, media_type_id=data.media_type_id, display_order=0
        )
        # Reuse upload service logic but maybe optimize to avoid re-fetching media_type if needed,
        # but calling the service is safer to reuse logic.
        media = upload_company_media_service(company_id, user, upload_data)
        media_list.append(media)

    return media_list
