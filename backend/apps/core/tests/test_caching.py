from django.core.cache import cache
from django.test import TestCase

from apps.billing.models import SubscriptionPlan
from apps.core.caching import (
    CacheKeyBuilder,
    CacheService,
    CachedBillingSelectors,
    CachedGeographySelectors,
)
from apps.geography.provinces.models import Province


class CacheHelpersTest(TestCase):
    def setUp(self):
        cache.clear()

    def tearDown(self):
        cache.clear()

    def test_cache_keys_are_versioned(self):
        key = CacheKeyBuilder.geography_provinces()
        self.assertTrue(key.startswith("jobportal:v1:"))

    def test_get_or_set_reuses_cached_value(self):
        calls = {"count": 0}

        def fetch_value():
            calls["count"] += 1
            return {"value": calls["count"]}

        key = CacheKeyBuilder.build("test", "get_or_set")

        self.assertEqual(CacheService.get_or_set(key, fetch_value), {"value": 1})
        self.assertEqual(CacheService.get_or_set(key, fetch_value), {"value": 1})
        self.assertEqual(calls["count"], 1)

    def test_lock_does_not_delete_reacquired_lock(self):
        lock_key = CacheKeyBuilder.task_lock("unit", "token")

        with CacheService.lock(lock_key, timeout=30) as acquired:
            self.assertTrue(acquired)
            original_token = cache.get(lock_key)
            cache.delete(lock_key)
            self.assertTrue(CacheService.add(lock_key, "other-token", timeout=30))
            self.assertNotEqual(cache.get(lock_key), original_token)

        self.assertEqual(cache.get(lock_key), "other-token")

    def test_geography_selector_uses_correct_model_fields(self):
        Province.objects.create(
            province_name="Ha Noi",
            province_type=Province.ProvinceType.MUNICIPALITY,
            region=Province.Region.NORTH,
            is_active=True,
        )
        Province.objects.create(
            province_name="Inactive",
            province_type=Province.ProvinceType.PROVINCE,
            region=Province.Region.NORTH,
            is_active=False,
        )

        data = CachedGeographySelectors.get_provinces(region=Province.Region.NORTH)

        self.assertEqual(len(data), 1)
        self.assertEqual(data[0]["province_name"], "Ha Noi")
        self.assertEqual(data[0]["province_type"], Province.ProvinceType.MUNICIPALITY)

    def test_billing_selector_is_json_safe(self):
        SubscriptionPlan.objects.create(
            name="Pro",
            slug="pro",
            price=1000000,
            currency="VND",
            duration_days=30,
            features={"job_post_limit": 5},
        )

        data = CachedBillingSelectors.get_subscription_plans()

        self.assertEqual(data[0]["slug"], "pro")
        self.assertEqual(data[0]["price"], "1000000.00")
        self.assertEqual(data[0]["features"]["job_post_limit"], 5)
