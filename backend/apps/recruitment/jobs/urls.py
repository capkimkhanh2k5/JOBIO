from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import JobViewSet
from .admin_views import (
    AdminCanonicalTitleViewSet,
    AdminJobTitleAliasViewSet,
    AdminJobViewSet,
    AdminSkillAliasViewSet,
)

router = DefaultRouter()
router.register(
    r"admin-canonical-titles",
    AdminCanonicalTitleViewSet,
    basename="admin-canonical-titles",
)
router.register(
    r"admin-job-title-aliases",
    AdminJobTitleAliasViewSet,
    basename="admin-job-title-aliases",
)
router.register(
    r"admin-skill-aliases",
    AdminSkillAliasViewSet,
    basename="admin-skill-aliases",
)
router.register(r"admin-jobs", AdminJobViewSet, basename="admin-jobs")
router.register(r"", JobViewSet, basename="jobs")

app_name = "jobs"

urlpatterns = [
    path("", include(router.urls)),
]
