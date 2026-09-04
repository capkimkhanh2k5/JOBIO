from rest_framework.routers import DefaultRouter

from .views import ModerationAuditViewSet

router = DefaultRouter()
router.register("audits", ModerationAuditViewSet, basename="moderation-audits")

urlpatterns = router.urls
