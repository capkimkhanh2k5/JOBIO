from django.urls import path
from .admin_analytics_views import (
    user_growth,
    industry_distribution,
    revenue_trend,
    application_stats,
    top_jobs,
    violation_breakdown,
    admin_overview_stats,
)

urlpatterns = [
    path("user-growth/", user_growth, name="analytics-user-growth"),
    path(
        "industry-distribution/", industry_distribution, name="analytics-industry-dist"
    ),
    path("revenue-trend/", revenue_trend, name="analytics-revenue-trend"),
    path("application-stats/", application_stats, name="analytics-application-stats"),
    path("top-jobs/", top_jobs, name="analytics-top-jobs"),
    path(
        "violation-breakdown/",
        violation_breakdown,
        name="analytics-violation-breakdown",
    ),
    path("overview/", admin_overview_stats, name="analytics-overview"),
]
