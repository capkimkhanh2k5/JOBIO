"""
Redis-aware caching helpers for the backend.

The helpers intentionally work with Django's cache API first so tests and local
development keep using LocMemCache, while production gets atomic Redis SET NX
semantics through django-redis.
"""

from contextlib import contextmanager
from functools import wraps
import hashlib
import json
import logging
import time
import uuid
from typing import Any, Callable, Optional

from django.core.cache import cache
from django.core.serializers.json import DjangoJSONEncoder
from django_redis import get_redis_connection

from apps.billing.models import SubscriptionPlan
from apps.candidate.skill_categories.models import SkillCategory
from apps.candidate.skills.models import Skill
from apps.company.industries.models import Industry
from apps.geography.communes.models import Commune
from apps.geography.provinces.models import Province
from apps.recruitment.job_categories.models import JobCategory

logger = logging.getLogger(__name__)

CACHE_TIMEOUT_SHORT = 60 * 5
CACHE_TIMEOUT_MEDIUM = 60 * 30
CACHE_TIMEOUT_LONG = 60 * 60
CACHE_TIMEOUT_DAY = 60 * 60 * 24
CACHE_LOCK_TIMEOUT = 30

_CACHE_MISS = object()


def _hash_value(value: str) -> str:
    return hashlib.sha256(value.encode("utf-8")).hexdigest()[:16]


def _stable_json(value: Any) -> str:
    return json.dumps(value, sort_keys=True, default=str, separators=(",", ":"))


class CacheKeyBuilder:
    """Build short, versioned cache keys with one project-wide prefix."""

    PREFIX = "jobportal"
    VERSION = "v1"

    @classmethod
    def build(cls, *args, **kwargs) -> str:
        parts = [cls.PREFIX, cls.VERSION]
        parts.extend(str(arg) for arg in args if arg is not None and str(arg) != "")

        if kwargs:
            kwargs_str = _stable_json(kwargs)
            parts.append(_hash_value(kwargs_str))

        key = ":".join(parts)
        if len(key) > 200:
            key = f"{cls.PREFIX}:{cls.VERSION}:hashed:{_hash_value(key)}"
        return key

    @classmethod
    def taxonomy_skills(cls, category_id: Optional[str] = None) -> str:
        return cls.build("taxonomy", "skills", category_id or "all")

    @classmethod
    def taxonomy_skill_categories(cls) -> str:
        return cls.build("taxonomy", "skill_categories", "all")

    @classmethod
    def taxonomy_industries(cls) -> str:
        return cls.build("taxonomy", "industries", "all")

    @classmethod
    def taxonomy_job_categories(cls) -> str:
        return cls.build("taxonomy", "job_categories", "all")

    @classmethod
    def geography_provinces(cls, region: Optional[str] = None) -> str:
        return cls.build("geography", "provinces", region or "all")

    @classmethod
    def geography_communes(cls, province_id: Optional[str] = None) -> str:
        return cls.build("geography", "communes", province_id or "all")

    @classmethod
    def subscription_plans(cls) -> str:
        return cls.build("billing", "subscription_plans", "active")

    @classmethod
    def system_setting(cls, key: str) -> str:
        return cls.build("system_setting", str(key).lower())

    @classmethod
    def view_response(cls, *parts, **kwargs) -> str:
        return cls.build("view", *parts, **kwargs)

    @classmethod
    def task_enqueue(cls, task_name: str, *parts) -> str:
        return cls.build("celery", "enqueue", task_name, *parts)

    @classmethod
    def task_lock(cls, task_name: str, *parts) -> str:
        return cls.build("celery", "lock", task_name, *parts)

    @classmethod
    def cache_lock(cls, key: str) -> str:
        return cls.build("cache_lock", _hash_value(key))


def cached(
    timeout: int = CACHE_TIMEOUT_MEDIUM,
    key_func: Callable | None = None,
    key_prefix: str | None = None,
):
    """Cache a pure function result behind a stable key."""

    def decorator(func: Callable) -> Callable:
        @wraps(func)
        def wrapper(*args, **kwargs):
            if key_func:
                cache_key = key_func(*args, **kwargs)
            else:
                key_data = {
                    "func": f"{func.__module__}.{func.__name__}",
                    "args": [str(arg) for arg in args],
                    "kwargs": {key: str(value) for key, value in kwargs.items()},
                }
                cache_key = CacheKeyBuilder.build(
                    key_prefix or "func", _hash_value(_stable_json(key_data))
                )

            return CacheService.get_or_set(
                cache_key, lambda: func(*args, **kwargs), timeout
            )

        wrapper.invalidate = lambda *args, **kwargs: cache.delete(
            key_func(*args, **kwargs)
            if key_func
            else CacheKeyBuilder.build("func", func.__name__)
        )
        return wrapper

    return decorator


class CacheService:
    """Small facade around Django cache with Redis-safe primitives."""

    @staticmethod
    def get(key: str, default: Any = None) -> Any:
        return cache.get(key, default)

    @staticmethod
    def set(key: str, value: Any, timeout: int = CACHE_TIMEOUT_MEDIUM) -> bool:
        try:
            cache.set(key, value, timeout)
            return True
        except Exception as exc:
            logger.error("Cache set error key=%s error=%s", key, exc)
            return False

    @staticmethod
    def add(key: str, value: Any = "1", timeout: int = CACHE_TIMEOUT_MEDIUM) -> bool:
        try:
            return bool(cache.add(key, value, timeout))
        except Exception as exc:
            logger.error("Cache add error key=%s error=%s", key, exc)
            return False

    @staticmethod
    def delete(key: str) -> bool:
        try:
            cache.delete(key)
            return True
        except Exception as exc:
            logger.error("Cache delete error key=%s error=%s", key, exc)
            return False

    @staticmethod
    def delete_pattern(pattern: str, batch_size: int = 500) -> int:
        """
        Delete keys by pattern using SCAN instead of Redis KEYS.

        The pattern can be a fragment such as "taxonomy" or a full Redis glob.
        LocMemCache and non-Redis backends simply return 0.
        """
        deleted = 0
        redis_pattern = pattern if "*" in pattern else f"*{pattern}*"
        try:
            redis_conn = get_redis_connection("default")
            batch = []
            for key in redis_conn.scan_iter(match=redis_pattern, count=batch_size):
                batch.append(key)
                if len(batch) >= batch_size:
                    deleted += redis_conn.delete(*batch)
                    batch = []
            if batch:
                deleted += redis_conn.delete(*batch)
        except Exception as exc:
            logger.debug(
                "Cache delete_pattern skipped pattern=%s error=%s", pattern, exc
            )
        return deleted

    @staticmethod
    @contextmanager
    def lock(key: str, timeout: int = CACHE_LOCK_TIMEOUT):
        token = uuid.uuid4().hex
        acquired = CacheService.add(key, token, timeout)
        try:
            yield acquired
        finally:
            if acquired and cache.get(key) == token:
                CacheService.delete(key)

    @staticmethod
    def get_or_set(
        key: str,
        default_func: Callable,
        timeout: int = CACHE_TIMEOUT_MEDIUM,
        lock_timeout: int = CACHE_LOCK_TIMEOUT,
    ) -> Any:
        result = cache.get(key, _CACHE_MISS)
        if result is not _CACHE_MISS:
            logger.debug("Cache HIT: %s", key)
            return result

        logger.debug("Cache MISS: %s", key)
        lock_key = CacheKeyBuilder.cache_lock(key)
        with CacheService.lock(lock_key, lock_timeout) as acquired:
            if acquired:
                result = cache.get(key, _CACHE_MISS)
                if result is not _CACHE_MISS:
                    return result
                result = default_func()
                if result is not None:
                    cache.set(key, result, timeout)
                return result

            time.sleep(0.05)
            result = cache.get(key, _CACHE_MISS)
            if result is not _CACHE_MISS:
                return result

        result = default_func()
        if result is not None:
            cache.set(key, result, timeout)
        return result

    @staticmethod
    def primitive(value: Any) -> Any:
        return json.loads(json.dumps(value, cls=DjangoJSONEncoder))

    @staticmethod
    def invalidate_taxonomy():
        CacheService.delete_pattern(
            f"{CacheKeyBuilder.PREFIX}:{CacheKeyBuilder.VERSION}:taxonomy"
        )
        logger.info("Taxonomy cache invalidated")

    @staticmethod
    def invalidate_geography():
        CacheService.delete_pattern(
            f"{CacheKeyBuilder.PREFIX}:{CacheKeyBuilder.VERSION}:geography"
        )
        logger.info("Geography cache invalidated")

    @staticmethod
    def invalidate_company(company_id: str):
        CacheService.delete_pattern(
            f"{CacheKeyBuilder.PREFIX}:{CacheKeyBuilder.VERSION}:company:{company_id}"
        )
        logger.info("Company %s cache invalidated", company_id)

    @staticmethod
    def invalidate_job(job_id: str):
        CacheService.delete_pattern(
            f"{CacheKeyBuilder.PREFIX}:{CacheKeyBuilder.VERSION}:job:{job_id}"
        )
        logger.info("Job %s cache invalidated", job_id)


class CachedTaxonomySelectors:
    """Cached read models for public taxonomy data."""

    @staticmethod
    def get_all_skills(category_id: Optional[str] = None) -> list[dict]:
        cache_key = CacheKeyBuilder.taxonomy_skills(category_id)

        def fetch_skills():
            queryset = Skill.objects.filter(
                is_active=True,
                domain=Skill.Domain.IT,
                is_publishable=True,
            ).select_related("category")
            if category_id:
                queryset = queryset.filter(category_id=category_id)
            return list(
                queryset.order_by("name").values(
                    "id",
                    "name",
                    "slug",
                    "category_id",
                    "category__name",
                    "is_verified",
                    "domain",
                    "is_publishable",
                    "usage_count",
                )
            )

        return CacheService.get_or_set(cache_key, fetch_skills, CACHE_TIMEOUT_LONG)

    @staticmethod
    def get_skill_categories() -> list[dict]:
        cache_key = CacheKeyBuilder.taxonomy_skill_categories()

        def fetch_categories():
            return list(
                SkillCategory.objects.filter(is_active=True)
                .order_by("display_order", "name")
                .values(
                    "id", "name", "slug", "description", "parent_id", "display_order"
                )
            )

        return CacheService.get_or_set(cache_key, fetch_categories, CACHE_TIMEOUT_LONG)

    @staticmethod
    def get_industries() -> list[dict]:
        cache_key = CacheKeyBuilder.taxonomy_industries()

        def fetch_industries():
            return list(
                Industry.objects.filter(is_active=True)
                .order_by("display_order", "name")
                .values(
                    "id",
                    "name",
                    "slug",
                    "description",
                    "icon_url",
                    "parent_id",
                    "display_order",
                )
            )

        return CacheService.get_or_set(cache_key, fetch_industries, CACHE_TIMEOUT_LONG)

    @staticmethod
    def get_job_categories() -> list[dict]:
        cache_key = CacheKeyBuilder.taxonomy_job_categories()

        def fetch_categories():
            return list(
                JobCategory.objects.filter(
                    is_active=True,
                    domain=JobCategory.Domain.IT,
                    is_publishable=True,
                )
                .order_by("display_order", "name")
                .values(
                    "id",
                    "name",
                    "slug",
                    "description",
                    "icon_url",
                    "parent_id",
                    "domain",
                    "is_publishable",
                    "display_order",
                )
            )

        return CacheService.get_or_set(cache_key, fetch_categories, CACHE_TIMEOUT_LONG)


class CachedGeographySelectors:
    """Cached read models for public geography data."""

    @staticmethod
    def get_provinces(region: Optional[str] = None) -> list[dict]:
        cache_key = CacheKeyBuilder.geography_provinces(region)

        def fetch_provinces():
            queryset = Province.objects.filter(is_active=True)
            if region:
                queryset = queryset.filter(region=region)
            return list(
                queryset.order_by("province_name").values(
                    "id", "province_name", "province_type", "region"
                )
            )

        return CacheService.get_or_set(cache_key, fetch_provinces, CACHE_TIMEOUT_DAY)

    @staticmethod
    def get_communes_by_province(province_id: Optional[str] = None) -> list[dict]:
        cache_key = CacheKeyBuilder.geography_communes(province_id)

        def fetch_communes():
            queryset = Commune.objects.filter(is_active=True)
            if province_id:
                queryset = queryset.filter(province_id=province_id)
            return list(
                queryset.order_by("commune_name").values(
                    "id", "commune_name", "commune_type", "province_id"
                )
            )

        return CacheService.get_or_set(cache_key, fetch_communes, CACHE_TIMEOUT_DAY)


class CachedBillingSelectors:
    """Cached read models for public billing data."""

    @staticmethod
    def get_subscription_plans() -> list[dict]:
        cache_key = CacheKeyBuilder.subscription_plans()

        def fetch_plans():
            plans = list(
                SubscriptionPlan.objects.filter(is_active=True)
                .order_by("price", "duration_days", "name")
                .values(
                    "id",
                    "name",
                    "slug",
                    "price",
                    "currency",
                    "duration_days",
                    "features",
                    "is_active",
                    "created_at",
                )
            )
            return CacheService.primitive(plans)

        return CacheService.get_or_set(cache_key, fetch_plans, CACHE_TIMEOUT_MEDIUM)
