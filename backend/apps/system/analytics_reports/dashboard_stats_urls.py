from django.urls import path

from .admin_analytics_views import admin_overview_stats
from .company_dashboard_views import (
    company_dashboard_analytics,
    company_dashboard_stats,
)


urlpatterns = [
    path('admin/', admin_overview_stats, name='dashboard-admin-stats'),
    path('company/', company_dashboard_stats, name='dashboard-company-stats'),
    path('company-analytics/', company_dashboard_analytics, name='dashboard-company-analytics'),
]
