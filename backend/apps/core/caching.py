"""
Redis Caching Layer cho Django Backend.

Cung cấp caching utilities cho các data thường xuyên truy cập.
"""
from functools import wraps
from typing import Any, Callable, Optional, Union, List
from django.core.cache import cache
from django.conf import settings
import hashlib
import json
import logging

from apps.billing.models import SubscriptionPlan
from apps.geography.communes.models import Commune
from apps.recruitment.job_categories.models import JobCategory
from apps.company.industries.models import Industry
from apps.candidate.skill_categories.models import SkillCategory
from apps.candidate.skills.models import Skill
from django_redis import get_redis_connection
from apps.geography.provinces.models import Province

logger = logging.getLogger(__name__)

# Cache timeout constants (in seconds)
CACHE_TIMEOUT_SHORT = 60 * 5  # 5 minutes
CACHE_TIMEOUT_MEDIUM = 60 * 30  # 30 minutes
CACHE_TIMEOUT_LONG = 60 * 60  # 1 hour
CACHE_TIMEOUT_DAY = 60 * 60 * 24  # 1 day


class CacheKeyBuilder:
    """
    Builder class để tạo cache keys nhất quán.
    """
    PREFIX = 'jobportal'
    
    @classmethod
    def build(cls, *args, **kwargs) -> str:
        """
        Build cache key từ arguments.
        
        Args:
            *args: Parts của key
            **kwargs: Additional key-value pairs
            
        Returns:
            str: Cache key
        """
        parts = [cls.PREFIX]
        parts.extend(str(arg) for arg in args)
        
        if kwargs:
            # Sort kwargs for consistency
            sorted_kwargs = sorted(kwargs.items())
            kwargs_str = '_'.join(f"{k}:{v}" for k, v in sorted_kwargs)
            parts.append(kwargs_str)
        
        key = ':'.join(parts)
        
        # Hash if too long
        if len(key) > 200:
            hash_suffix = hashlib.md5(key.encode()).hexdigest()[:12]
            key = f"{cls.PREFIX}:hashed:{hash_suffix}"
        
        return key
    
    # Predefined key patterns
    @classmethod
    def taxonomy_skills(cls, category_id: Optional[str] = None) -> str:
        """Key cho skills list."""
        if category_id:
            return cls.build('taxonomy', 'skills', 'category', category_id)
        return cls.build('taxonomy', 'skills', 'all')
    
    @classmethod
    def taxonomy_skill_categories(cls) -> str:
        """Key cho skill categories."""
        return cls.build('taxonomy', 'skill_categories', 'all')
    
    @classmethod
    def taxonomy_industries(cls) -> str:
        """Key cho industries list."""
        return cls.build('taxonomy', 'industries', 'all')
    
    @classmethod
    def taxonomy_job_categories(cls) -> str:
        """Key cho job categories."""
        return cls.build('taxonomy', 'job_categories', 'all')
    
    @classmethod
    def geography_provinces(cls) -> str:
        """Key cho provinces list."""
        return cls.build('geography', 'provinces', 'all')
    
    @classmethod
    def geography_communes(cls, province_id: str) -> str:
        """Key cho communes of a province."""
        return cls.build('geography', 'communes', 'province', province_id)
    
    @classmethod
    def subscription_plans(cls) -> str:
        """Key cho subscription plans."""
        return cls.build('billing', 'subscription_plans', 'active')
    
    @classmethod
    def company_profile(cls, company_id: str) -> str:
        """Key cho company profile."""
        return cls.build('company', 'profile', company_id)
    
    @classmethod
    def user_permissions(cls, user_id: str) -> str:
        """Key cho user permissions."""
        return cls.build('user', 'permissions', user_id)
    
    @classmethod
    def job_detail(cls, job_id: str) -> str:
        """Key cho job detail."""
        return cls.build('job', 'detail', job_id)
    
    @classmethod
    def recruiter_profile(cls, recruiter_id: str) -> str:
        """Key cho recruiter profile."""
        return cls.build('recruiter', 'profile', recruiter_id)


def cached(
    timeout: int = CACHE_TIMEOUT_MEDIUM,
    key_func: Callable = None,
    key_prefix: str = None
):
    """
    Decorator để cache kết quả của function.
    
    Args:
        timeout: Cache timeout in seconds
        key_func: Custom function để generate cache key
        key_prefix: Prefix cho cache key
        
    Usage:
        @cached(timeout=3600, key_prefix='skills')
        def get_all_skills():
            return Skill.objects.all()
    """
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        def wrapper(*args, **kwargs):
            # Generate cache key
            if key_func:
                cache_key = key_func(*args, **kwargs)
            else:
                # Auto-generate key from function name and arguments
                func_name = f"{func.__module__}.{func.__name__}"
                args_str = json.dumps([str(a) for a in args], sort_keys=True)
                kwargs_str = json.dumps({k: str(v) for k, v in kwargs.items()}, sort_keys=True)
                key_data = f"{func_name}:{args_str}:{kwargs_str}"
                
                if key_prefix:
                    cache_key = CacheKeyBuilder.build(key_prefix, hashlib.md5(key_data.encode()).hexdigest())
                else:
                    cache_key = CacheKeyBuilder.build('func', hashlib.md5(key_data.encode()).hexdigest())
            
            # Try to get from cache
            result = cache.get(cache_key)
            
            if result is not None:
                logger.debug(f"Cache HIT: {cache_key}")
                return result
            
            # Cache miss - execute function
            logger.debug(f"Cache MISS: {cache_key}")
            result = func(*args, **kwargs)
            
            # Store in cache
            if result is not None:
                cache.set(cache_key, result, timeout)
            
            return result
        
        # Add method to manually invalidate cache
        wrapper.invalidate = lambda *args, **kwargs: cache.delete(
            key_func(*args, **kwargs) if key_func 
            else CacheKeyBuilder.build('func', func.__name__)
        )
        
        return wrapper
    
    return decorator


class CacheService:
    """
    Service class cho cache operations.
    """
    
    @staticmethod
    def get(key: str, default: Any = None) -> Any:
        """Get value from cache."""
        return cache.get(key, default)
    
    @staticmethod
    def set(key: str, value: Any, timeout: int = CACHE_TIMEOUT_MEDIUM) -> bool:
        """Set value in cache."""
        try:
            cache.set(key, value, timeout)
            return True
        except Exception as e:
            logger.error(f"Cache set error for key {key}: {e}")
            return False
    
    @staticmethod
    def delete(key: str) -> bool:
        """Delete key from cache."""
        try:
            cache.delete(key)
            return True
        except Exception as e:
            logger.error(f"Cache delete error for key {key}: {e}")
            return False
    
    @staticmethod
    def delete_pattern(pattern: str) -> int:
        """
        Delete all keys matching pattern.
        Note: Requires Redis backend.
        """
        try:
            redis_conn = get_redis_connection("default")
            keys = redis_conn.keys(f"*{pattern}*")
            if keys:
                return redis_conn.delete(*keys)
            return 0
        except Exception as e:
            logger.error(f"Cache delete pattern error for {pattern}: {e}")
            return 0
    
    @staticmethod
    def get_or_set(
        key: str, 
        default_func: Callable, 
        timeout: int = CACHE_TIMEOUT_MEDIUM
    ) -> Any:
        """
        Get from cache or set using default_func.
        
        Args:
            key: Cache key
            default_func: Function to call if cache miss
            timeout: Cache timeout
            
        Returns:
            Cached or computed value
        """
        result = cache.get(key)
        
        if result is None:
            result = default_func()
            if result is not None:
                cache.set(key, result, timeout)
        
        return result
    
    @staticmethod
    def invalidate_taxonomy():
        """Invalidate all taxonomy caches."""
        keys = [
            CacheKeyBuilder.taxonomy_skills(),
            CacheKeyBuilder.taxonomy_skill_categories(),
            CacheKeyBuilder.taxonomy_industries(),
            CacheKeyBuilder.taxonomy_job_categories(),
        ]
        for key in keys:
            cache.delete(key)
        logger.info("Taxonomy cache invalidated")
    
    @staticmethod
    def invalidate_geography():
        """Invalidate all geography caches."""
        cache.delete(CacheKeyBuilder.geography_provinces())
        CacheService.delete_pattern('geography:communes')
        logger.info("Geography cache invalidated")
    
    @staticmethod
    def invalidate_company(company_id: str):
        """Invalidate company-related caches."""
        cache.delete(CacheKeyBuilder.company_profile(company_id))
        logger.info(f"Company {company_id} cache invalidated")
    
    @staticmethod
    def invalidate_job(job_id: str):
        """Invalidate job-related caches."""
        cache.delete(CacheKeyBuilder.job_detail(job_id))
        logger.info(f"Job {job_id} cache invalidated")


# Cached selectors for taxonomy data
class CachedTaxonomySelectors:
    """
    Cached versions of taxonomy selectors.
    """
    
    @staticmethod
    def get_all_skills() -> List[dict]:
        """Get all skills with caching."""
        cache_key = CacheKeyBuilder.taxonomy_skills()
        
        def fetch_skills():
            return list(Skill.objects.select_related('category').values(
                'id', 'name', 'slug', 'category__id', 'category__name'
            ))
        
        return CacheService.get_or_set(cache_key, fetch_skills, CACHE_TIMEOUT_LONG)
    
    @staticmethod
    def get_skill_categories() -> List[dict]:
        """Get skill categories with caching."""
        cache_key = CacheKeyBuilder.taxonomy_skill_categories()
        
        def fetch_categories():
            return list(SkillCategory.objects.values('id', 'name', 'slug'))
        
        return CacheService.get_or_set(cache_key, fetch_categories, CACHE_TIMEOUT_LONG)
    
    @staticmethod
    def get_industries() -> List[dict]:
        """Get industries with caching."""
        cache_key = CacheKeyBuilder.taxonomy_industries()
        
        def fetch_industries():
            return list(Industry.objects.values('id', 'name', 'slug', 'icon'))
        
        return CacheService.get_or_set(cache_key, fetch_industries, CACHE_TIMEOUT_LONG)
    
    @staticmethod
    def get_job_categories() -> List[dict]:
        """Get job categories with caching."""
        cache_key = CacheKeyBuilder.taxonomy_job_categories()
        
        def fetch_categories():
            return list(JobCategory.objects.values('id', 'name', 'slug', 'parent_id'))
        
        return CacheService.get_or_set(cache_key, fetch_categories, CACHE_TIMEOUT_LONG)


class CachedGeographySelectors:
    """
    Cached versions of geography selectors.
    """
    
    @staticmethod
    def get_provinces() -> List[dict]:
        """Get provinces with caching."""
        cache_key = CacheKeyBuilder.geography_provinces()
        
        def fetch_provinces():
            return list(Province.objects.values('id', 'name', 'code', 'name_en'))
        
        return CacheService.get_or_set(cache_key, fetch_provinces, CACHE_TIMEOUT_DAY)
    
    @staticmethod
    def get_communes_by_province(province_id: str) -> List[dict]:
        """Get communes by province with caching."""
        cache_key = CacheKeyBuilder.geography_communes(province_id)
        
        def fetch_communes():
            return list(Commune.objects.filter(
                province_id=province_id
            ).values('id', 'name', 'code', 'commune_type'))
        
        return CacheService.get_or_set(cache_key, fetch_communes, CACHE_TIMEOUT_DAY)


class CachedBillingSelectors:
    """
    Cached versions of billing selectors.
    """
    
    @staticmethod
    def get_subscription_plans() -> List[dict]:
        """Get active subscription plans with caching."""
        cache_key = CacheKeyBuilder.subscription_plans()
        
        def fetch_plans():
            return list(SubscriptionPlan.objects.filter(is_active=True).values(
                'id', 'name', 'slug', 'price', 'duration_days', 
                'max_job_posts', 'max_featured_jobs', 'features'
            ))
        
        return CacheService.get_or_set(cache_key, fetch_plans, CACHE_TIMEOUT_MEDIUM)
