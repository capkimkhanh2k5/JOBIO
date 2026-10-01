from django.contrib import admin
from django.conf import settings
from django.core.cache import cache
from django.db import connection
from django.http import HttpResponse, JsonResponse
from django.urls import path, include
from django.utils import timezone
from urllib.parse import urljoin
from xml.sax.saxutils import escape
from rest_framework.permissions import AllowAny
from rest_framework.routers import DefaultRouter
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularRedocView,
    SpectacularSwaggerView,
)

from apps.billing.views import CompanySubscriptionViewSet
from apps.core.users.token_views import (
    ThrottledTokenObtainPairView,
    ThrottledTokenRefreshView,
)


router = DefaultRouter()


def health_check(_request):
    return JsonResponse({"status": "ok"})


def _healthcheck_allowed(request) -> bool:
    token = getattr(settings, "HEALTHCHECK_TOKEN", "")
    if not token:
        return bool(settings.DEBUG)
    return request.headers.get("X-Healthcheck-Token") == token


def _check_database():
    with connection.cursor() as cursor:
        cursor.execute("SELECT 1")
        cursor.fetchone()
    return {"ok": True}


def _check_cache():
    key = "healthcheck:redis-cache"
    cache.set(key, "ok", timeout=10)
    ok = cache.get(key) == "ok"
    cache.delete(key)
    return {"ok": ok}


def _check_celery_broker():
    from config.celery import app as celery_app

    with celery_app.connection_for_read() as connection_for_read:
        connection_for_read.ensure_connection(max_retries=1)
    return {"ok": True}


def _check_celery_workers():
    from config.celery import app as celery_app

    replies = celery_app.control.ping(timeout=1.0) or []
    return {"ok": bool(replies), "workers": len(replies)}


def _check_celery_beat():
    schedule = getattr(settings, "CELERY_BEAT_SCHEDULE", {}) or {}
    return {"ok": bool(schedule), "entries": sorted(schedule.keys())}


def _check_pgvector():
    if connection.vendor != "postgresql":
        return {"ok": True, "backend": connection.vendor, "extension": "not_required"}
    with connection.cursor() as cursor:
        cursor.execute(
            "SELECT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'vector')"
        )
        extension_installed = bool(cursor.fetchone()[0])
    return {
        "ok": extension_installed,
        "backend": "postgresql",
        "extension_installed": extension_installed,
    }


def _run_health_check(check):
    try:
        return check()
    except Exception as exc:
        return {"ok": False, "error": str(exc)[:200]}


def deep_health_check(request):
    if not _healthcheck_allowed(request):
        return JsonResponse({"status": "forbidden"}, status=403)

    checks = {
        "database": _run_health_check(_check_database),
        "redis_cache": _run_health_check(_check_cache),
        "celery_broker": _run_health_check(_check_celery_broker),
        "celery_workers": _run_health_check(_check_celery_workers),
        "celery_beat": _run_health_check(_check_celery_beat),
    }
    if getattr(settings, "RECOMMENDATION_VECTOR_STORE", "").lower() == "pgvector":
        checks["pgvector"] = _run_health_check(_check_pgvector)

    ok = all(item.get("ok") for item in checks.values())
    return JsonResponse(
        {"status": "ok" if ok else "degraded", "checks": checks},
        status=200 if ok else 503,
    )


def _site_url(path: str) -> str:
    base_url = (
        f"{getattr(settings, 'FRONTEND_URL', 'http://localhost:4000').rstrip('/')}/"
    )
    return urljoin(base_url, path.lstrip("/"))


def _sitemap_url(location: str, lastmod=None, changefreq="weekly", priority="0.7"):
    lastmod_value = lastmod or timezone.now()
    if hasattr(lastmod_value, "date"):
        lastmod_text = lastmod_value.date().isoformat()
    else:
        lastmod_text = str(lastmod_value)
    return (
        "  <url>"
        f"<loc>{escape(location)}</loc>"
        f"<lastmod>{escape(lastmod_text)}</lastmod>"
        f"<changefreq>{changefreq}</changefreq>"
        f"<priority>{priority}</priority>"
        "</url>"
    )


def sitemap_xml(_request):
    from apps.blog.models import Post
    from apps.company.companies.models import Company
    from apps.recruitment.jobs.selectors.jobs import publicly_available_jobs

    urls = [
        _sitemap_url(_site_url("/"), timezone.now(), "daily", "1.0"),
        _sitemap_url(_site_url("/jobs"), timezone.now(), "daily", "0.9"),
        _sitemap_url(_site_url("/companies"), timezone.now(), "weekly", "0.8"),
        _sitemap_url(_site_url("/blog"), timezone.now(), "weekly", "0.7"),
    ]

    jobs = publicly_available_jobs().only("id", "slug", "updated_at", "published_at")
    for job in jobs.iterator():
        identifier = job.slug or job.id
        urls.append(
            _sitemap_url(
                _site_url(f"/jobs/{identifier}"),
                job.updated_at or job.published_at,
                "weekly",
                "0.8",
            )
        )

    companies = Company.objects.filter(
        verification_status=Company.VerificationStatus.VERIFIED
    ).only("id", "slug", "updated_at")
    for company in companies.iterator():
        identifier = company.slug or company.id
        urls.append(
            _sitemap_url(
                _site_url(f"/companies/{identifier}"),
                company.updated_at,
                "weekly",
                "0.7",
            )
        )

    posts = Post.objects.filter(status=Post.Status.PUBLISHED).only(
        "slug", "updated_at", "published_at"
    )
    for post in posts.iterator():
        urls.append(
            _sitemap_url(
                _site_url(f"/blog/{post.slug}"),
                post.updated_at or post.published_at,
                "weekly",
                "0.6",
            )
        )

    xml = (
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
        + "\n".join(urls)
        + "\n</urlset>\n"
    )
    return HttpResponse(xml, content_type="application/xml")


urlpatterns = [
    path("health/", health_check, name="health-check"),
    path("health/deep/", deep_health_check, name="deep-health-check"),
    path("sitemap.xml", sitemap_xml, name="sitemap-xml"),
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path(
        "api/docs/",
        SpectacularSwaggerView.as_view(url_name="schema"),
        name="swagger-ui",
    ),
    path("api/redoc/", SpectacularRedocView.as_view(url_name="schema"), name="redoc"),
    path("django-admin/", admin.site.urls),
    path("api/", include(router.urls)),
    # Users app routes (login, logout, register, user management)
    path("api/users/", include("apps.core.users.urls")),
    path("api/moderation/", include("apps.moderation.urls")),
    # Company app routes (includes nested benefits)
    # Company Followers routes (must be before generic company routes)
    path("api/companies/", include("apps.social.company_followers.urls")),
    path("api/companies/", include("apps.company.companies.urls")),
    # Company Media nested routes
    path("api/companies/", include("apps.company.company_media.urls")),
    # Jobs routes (Module 4 - CRITICAL)
    path("api/jobs/", include("apps.recruitment.jobs.urls")),
    # Candidate app routes
    path("api/candidates/", include("apps.candidate.recruiters.urls")),
    # Candidate Education nested routes
    path(
        "api/candidates/<int:recruiter_id>/education/",
        include("apps.candidate.recruiter_education.urls"),
    ),
    # Candidate Experience nested routes
    path(
        "api/candidates/<int:recruiter_id>/experience/",
        include("apps.candidate.recruiter_experience.urls"),
    ),
    # Candidate Skills nested routes
    path(
        "api/candidates/<int:recruiter_id>/skills/",
        include("apps.candidate.recruiter_skills.urls"),
    ),
    # Candidate Certifications nested routes
    path(
        "api/candidates/<int:recruiter_id>/certifications/",
        include("apps.candidate.recruiter_certifications.urls"),
    ),
    # Candidate Languages nested routes
    path(
        "api/candidates/<int:recruiter_id>/languages/",
        include("apps.candidate.recruiter_languages.urls"),
    ),
    # Candidate Projects nested routes
    path(
        "api/candidates/<int:recruiter_id>/projects/",
        include("apps.candidate.recruiter_projects.urls"),
    ),
    # Languages public routes
    path("api/languages/", include("apps.candidate.languages.urls")),
    path("api/applications/", include("apps.recruitment.applications.urls")),
    path("api/", include("apps.recruitment.application_status_history.urls")),
    # Billing routes
    path("api/billing/", include("apps.billing.urls")),
    # Job Applications nested routes
    path(
        "api/jobs/<int:job_id>/applications/",
        include("apps.recruitment.applications.urls_nested"),
    ),
    # Job Skills nested routes
    path("api/jobs/<int:job_id>/skills/", include("apps.recruitment.job_skills.urls")),
    # Email routes
    # Blog routes
    path("api/blog/", include("apps.blog.urls")),
    # System Domaintions nested routes
    path(
        "api/jobs/<int:job_id>/locations/",
        include("apps.recruitment.job_locations.urls"),
    ),
    # Saved Jobs routes
    path("api/saved-jobs/", include("apps.recruitment.saved_jobs.urls")),
    # Candidate Saved Jobs nested routes
    path(
        "api/candidates/<int:recruiter_id>/saved-jobs/",
        include("apps.recruitment.saved_jobs.urls_nested"),
    ),
    # Interviews routes
    path("api/interviews/", include("apps.recruitment.interviews.urls")),
    # Interview Types routes
    path("api/interview-types/", include("apps.recruitment.interview_types.urls")),
    # CV Templates routes (CV Builder Module)
    path("api/cv-templates/", include("apps.candidate.cv_templates.urls")),
    # Candidate CVs nested routes
    path(
        "api/candidates/<int:recruiter_id>/cvs/",
        include("apps.candidate.recruiter_cvs.urls"),
    ),
    # Industries routes (Taxonomy)
    path("api/industries/", include("apps.company.industries.urls")),
    # Job Categories routes (Taxonomy)
    path("api/job-categories/", include("apps.recruitment.job_categories.urls")),
    # Skills routes (Taxonomy)
    path("api/skills/", include("apps.candidate.skills.urls")),
    # Benefit Categories routes
    path("api/benefit-categories/", include("apps.company.benefit_categories.urls")),
    # Geography routes
    path("api/provinces/", include("apps.geography.provinces.urls")),
    path("api/communes/", include("apps.geography.communes.urls")),
    path("api/addresses/", include("apps.geography.addresses.urls")),
    # Notifications
    path("api/notifications/", include("apps.communication.notifications.urls")),
    path(
        "api/notification-types/",
        include("apps.communication.notification_types.urls"),
    ),
    # Job Alerts
    path("api/", include("apps.communication.job_alerts.urls")),
    # JWT Token endpoints (built-in)
    path(
        "api/token/", ThrottledTokenObtainPairView.as_view(), name="token_obtain_pair"
    ),
    path(
        "api/token/refresh/",
        ThrottledTokenRefreshView.as_view(),
        name="token_refresh",
    ),
    # System App routes
    path("api/system/settings/", include("apps.system.system_settings.urls")),
    path("api/system/reports/", include("apps.system.reports.urls")),
    path("api/activity-logs/", include("apps.system.activity_logs.urls")),
    path("api/file-uploads/", include("apps.system.file_uploads.urls")),
    path("api/contact/", include("apps.system.contact.urls")),
    # Admin Analytics (time-series charts, funnel, top jobs, etc.)
    path("api/analytics/", include("apps.system.analytics_reports.analytics_urls")),
    path(
        "api/dashboard/stats/",
        include("apps.system.analytics_reports.dashboard_stats_urls"),
    ),
    # Media Types
    path("api/media-types/", include("apps.company.media_types.urls")),
    # VNPay Return friendly URL
    path(
        "billing/payment-return",
        CompanySubscriptionViewSet.as_view(
            {"get": "payment_return"},
            permission_classes=[AllowAny],
            authentication_classes=[],
        ),
        name="vnpay-return-friendly",
    ),
]
