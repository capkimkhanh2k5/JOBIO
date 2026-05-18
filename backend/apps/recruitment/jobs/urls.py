from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import JobViewSet
from .admin_views import AdminJobViewSet

router = DefaultRouter()
router.register(r"admin-jobs", AdminJobViewSet, basename="admin-jobs")
router.register(r"", JobViewSet, basename="jobs")

app_name = "jobs"

urlpatterns = [
    path("", include(router.urls)),
]
