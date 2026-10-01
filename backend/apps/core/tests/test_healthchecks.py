from unittest.mock import patch

from django.test import Client, SimpleTestCase, override_settings


class DeepHealthCheckTests(SimpleTestCase):
    @override_settings(HEALTHCHECK_TOKEN="secret")
    def test_deep_health_requires_token_when_configured(self):
        response = Client().get("/health/deep/")

        self.assertEqual(response.status_code, 403)
        self.assertEqual(response.json()["status"], "forbidden")

    @override_settings(HEALTHCHECK_TOKEN="secret")
    def test_deep_health_rejects_query_string_token(self):
        response = Client().get("/health/deep/?token=secret")

        self.assertEqual(response.status_code, 403)
        self.assertEqual(response.json()["status"], "forbidden")

    @override_settings(
        DEBUG=False,
        HEALTHCHECK_TOKEN="",
        RECOMMENDATION_VECTOR_STORE="pgvector",
    )
    def test_deep_health_requires_token_in_production(self):
        response = Client().get("/health/deep/")

        self.assertEqual(response.status_code, 403)
        self.assertEqual(response.json()["status"], "forbidden")

    @override_settings(
        HEALTHCHECK_TOKEN="secret",
        RECOMMENDATION_VECTOR_STORE="pgvector",
        CELERY_BEAT_SCHEDULE={"cleanup": {"task": "cleanup", "schedule": 60}},
    )
    def test_deep_health_returns_ok_payload_when_checks_pass(self):
        with (
            patch("config.urls._check_database", return_value={"ok": True}),
            patch("config.urls._check_cache", return_value={"ok": True}),
            patch("config.urls._check_celery_broker", return_value={"ok": True}),
            patch(
                "config.urls._check_celery_workers",
                return_value={"ok": True, "workers": 1},
            ),
            patch(
                "config.urls._check_celery_beat",
                return_value={"ok": True, "entries": ["cleanup"]},
            ),
            patch("config.urls._check_pgvector", return_value={"ok": True}),
        ):
            response = Client().get(
                "/health/deep/",
                HTTP_X_HEALTHCHECK_TOKEN="secret",
            )

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(payload["status"], "ok")
        self.assertEqual(payload["checks"]["celery_workers"]["workers"], 1)

    @override_settings(
        DEBUG=True, HEALTHCHECK_TOKEN="", RECOMMENDATION_VECTOR_STORE="pgvector"
    )
    def test_deep_health_returns_503_when_required_check_fails(self):
        with (
            patch("config.urls._check_database", return_value={"ok": True}),
            patch("config.urls._check_cache", return_value={"ok": False}),
            patch("config.urls._check_celery_broker", return_value={"ok": True}),
            patch(
                "config.urls._check_celery_workers",
                return_value={"ok": True, "workers": 1},
            ),
            patch("config.urls._check_celery_beat", return_value={"ok": True}),
            patch("config.urls._check_pgvector", return_value={"ok": True}),
        ):
            response = Client().get("/health/deep/")

        self.assertEqual(response.status_code, 503)
        self.assertEqual(response.json()["status"], "degraded")
