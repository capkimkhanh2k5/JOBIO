from typing import Optional
from django.db.models import QuerySet
from django.core.cache import cache

from ..models import SystemSetting
from apps.core.caching import CacheKeyBuilder


_SETTING_CACHE_FIELDS = [
    "id",
    "setting_key",
    "setting_value",
    "setting_type",
    "category",
    "description",
    "is_public",
    "updated_by_id",
]


def _setting_to_cache(setting: SystemSetting) -> dict:
    return {field: getattr(setting, field) for field in _SETTING_CACHE_FIELDS}


def _setting_from_cache(data) -> SystemSetting:
    if isinstance(data, SystemSetting):
        return data
    setting = SystemSetting(**data)
    setting._state.adding = False
    setting._state.db = "default"
    return setting


def list_settings(filters: dict = None) -> QuerySet[SystemSetting]:
    """
    Danh sách các setting theo các filter
    """
    queryset = SystemSetting.objects.all()

    if filters:
        if filters.get("category"):
            queryset = queryset.filter(category=filters["category"])
        if filters.get("is_public") is not None:
            queryset = queryset.filter(is_public=filters["is_public"])
        if filters.get("search"):
            queryset = queryset.filter(setting_key__icontains=filters["search"])

    return queryset.order_by("category", "setting_key")


def get_setting_by_key(key: str) -> Optional[SystemSetting]:
    """
    Lấy setting theo key (có caching)
    """
    cache_key = CacheKeyBuilder.system_setting(key)

    # Try getting from cache
    setting_data = cache.get(cache_key)
    if setting_data:
        return _setting_from_cache(setting_data)

    try:
        setting = SystemSetting.objects.get(setting_key=key)
        # Cache for 24 hours
        cache.set(cache_key, _setting_to_cache(setting), timeout=86400)
        return setting
    except SystemSetting.DoesNotExist:
        return None
