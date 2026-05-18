from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .admin_views import AdminReportViewSet

router = DefaultRouter()
router.register(r"admin-reports", AdminReportViewSet, basename="admin-reports")

app_name = "reports"

urlpatterns = [
    path("", include(router.urls)),
]
