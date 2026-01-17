from typing import Optional
from django.db.models import QuerySet
from ..models import CompanyMedia


def list_company_media(company_id: int) -> QuerySet[CompanyMedia]:
    """
    Lấy danh sách media của một công ty, sắp xếp theo display_order.
    """
    return CompanyMedia.objects.filter(company_id=company_id).select_related('media_type')


def get_company_media(id: int) -> Optional[CompanyMedia]:
    """
    Lấy media theo ID. Trả về None nếu không tìm thấy.
    """
    try:
        return CompanyMedia.objects.select_related('media_type').get(id=id)
    except CompanyMedia.DoesNotExist:
        return None
