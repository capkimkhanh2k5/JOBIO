from django.urls import path

from .company_dashboard_views import (
    company_dashboard_analytics,
    company_dashboard_stats,
)


urlpatterns = [
    path('company/', company_dashboard_stats, name='dashboard-company-stats'),
    path('company-analytics/', company_dashboard_analytics, name='dashboard-company-analytics'),
]
