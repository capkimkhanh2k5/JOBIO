from datetime import timedelta
from pathlib import Path

from django.conf import settings
from django.http import HttpResponse
from django.test import SimpleTestCase
from django.urls import resolve

from apps.core.security_headers import SecurityHeadersMiddleware
from apps.core.throttles import (
    ApplicationSubmitRateThrottle,
    JobSearchRateThrottle,
    PaymentRateThrottle,
    NotificationStreamRateThrottle,
    ReportCreateRateThrottle,
    TwoFactorVerifyRateThrottle,
)
from apps.core.users.token_views import (
    ThrottledTokenObtainPairView,
    ThrottledTokenRefreshView,
)
from apps.billing.views import CompanySubscriptionViewSet
from apps.recruitment.applications.views import ApplicationViewSet
from apps.recruitment.jobs.views import JobViewSet


class SecurityConfigTests(SimpleTestCase):
    def test_simple_jwt_rotates_and_blacklists_refresh_tokens(self):
        jwt_settings = settings.SIMPLE_JWT

        self.assertLessEqual(
            jwt_settings["ACCESS_TOKEN_LIFETIME"], timedelta(minutes=15)
        )
        self.assertTrue(jwt_settings["ROTATE_REFRESH_TOKENS"])
        self.assertTrue(jwt_settings["BLACKLIST_AFTER_ROTATION"])
        self.assertEqual(jwt_settings["AUTH_HEADER_TYPES"], ("Bearer",))

    def test_token_endpoints_use_throttled_views(self):
        self.assertIs(
            resolve("/api/token/").func.view_class,
            ThrottledTokenObtainPairView,
        )
        self.assertIs(
            resolve("/api/token/refresh/").func.view_class,
            ThrottledTokenRefreshView,
        )
        self.assertIs(
            resolve("/api/users/auth/refresh-token/").func.view_class,
            ThrottledTokenRefreshView,
        )

    def test_openapi_docs_are_mounted(self):
        self.assertEqual(resolve("/api/schema/").url_name, "schema")
        self.assertEqual(resolve("/api/docs/").url_name, "swagger-ui")

    def test_security_headers_middleware_is_configured(self):
        self.assertIn(
            "apps.core.security_headers.SecurityHeadersMiddleware",
            settings.MIDDLEWARE,
        )

        middleware = SecurityHeadersMiddleware(lambda request: HttpResponse("ok"))
        response = middleware(None)

        self.assertEqual(
            response["Content-Security-Policy"], settings.CONTENT_SECURITY_POLICY
        )
        self.assertEqual(
            response["Permissions-Policy"],
            "camera=(), microphone=(), geolocation=(), payment=()",
        )
        self.assertEqual(response["Cross-Origin-Opener-Policy"], "same-origin")

    def test_cors_credentials_do_not_allow_all_origins(self):
        self.assertTrue(settings.CORS_ALLOW_CREDENTIALS)
        self.assertFalse(settings.CORS_ALLOW_ALL_ORIGINS)
        self.assertTrue(settings.CORS_ALLOWED_ORIGINS)
        self.assertTrue(settings.CSRF_TRUSTED_ORIGINS)

    def test_caddy_sets_edge_security_headers_and_proxies_media(self):
        caddyfile = (Path(settings.BASE_DIR).parent / "Caddyfile").read_text()

        self.assertIn(
            'Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"',
            caddyfile,
        )
        self.assertIn('X-Content-Type-Options "nosniff"', caddyfile)
        self.assertIn('X-Frame-Options "DENY"', caddyfile)
        self.assertIn('Referrer-Policy "strict-origin-when-cross-origin"', caddyfile)
        self.assertIn(
            'Permissions-Policy "camera=(), microphone=(), geolocation=(), payment=()"',
            caddyfile,
        )
        self.assertIn("handle /media/*", caddyfile)
        self.assertIn("reverse_proxy backend:8000", caddyfile)

    def test_production_compose_passes_secure_proxy_and_origin_env(self):
        compose = (
            Path(settings.BASE_DIR).parent / "docker-compose.prod.yml"
        ).read_text()

        self.assertIn("USE_X_FORWARDED_PROTO=1", compose)
        self.assertIn(
            "DJANGO_ALLOWED_HOSTS=${DJANGO_ALLOWED_HOSTS:-jobio.id.vn}", compose
        )
        self.assertIn(
            "CORS_ALLOWED_ORIGINS=${CORS_ALLOWED_ORIGINS:-https://jobio.id.vn}",
            compose,
        )
        self.assertIn(
            "CSRF_TRUSTED_ORIGINS=${CSRF_TRUSTED_ORIGINS:-https://jobio.id.vn}",
            compose,
        )

    def test_sensitive_business_actions_have_scoped_throttles(self):
        throttle_rates = settings.REST_FRAMEWORK["DEFAULT_THROTTLE_RATES"]
        self.assertEqual(throttle_rates["job_search"], "10000/hour")
        self.assertEqual(throttle_rates["application_submit"], "10000/hour")
        self.assertEqual(throttle_rates["notification_stream"], "10000/hour")
        self.assertEqual(throttle_rates["payment"], "10000/hour")
        self.assertEqual(throttle_rates["two_factor_verify"], "10000/hour")
        self.assertEqual(throttle_rates["report_create"], "10000/hour")

        job_view = JobViewSet()
        job_view.action = "list"
        self.assertTrue(
            any(
                isinstance(throttle, JobSearchRateThrottle)
                for throttle in job_view.get_throttles()
            )
        )

        application_view = ApplicationViewSet()
        application_view.action = "create"
        self.assertTrue(
            any(
                isinstance(throttle, ApplicationSubmitRateThrottle)
                for throttle in application_view.get_throttles()
            )
        )

        subscription_view = CompanySubscriptionViewSet()
        subscription_view.action = "subscribe"
        self.assertTrue(
            any(
                isinstance(throttle, PaymentRateThrottle)
                for throttle in subscription_view.get_throttles()
            )
        )

        two_factor_match = resolve("/api/users/auth/verify-2fa/")
        self.assertEqual(
            two_factor_match.func.initkwargs["throttle_classes"],
            [TwoFactorVerifyRateThrottle],
        )
        report_create_match = resolve("/api/system/reports/")
        self.assertEqual(
            report_create_match.func.view_class.throttle_classes,
            [ReportCreateRateThrottle],
        )
        self.assertEqual(NotificationStreamRateThrottle.scope, "notification_stream")
        self.assertEqual(TwoFactorVerifyRateThrottle.scope, "two_factor_verify")
        self.assertEqual(ReportCreateRateThrottle.scope, "report_create")
