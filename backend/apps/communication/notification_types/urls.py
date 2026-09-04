from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import NotificationTypeViewSet


router = DefaultRouter()
router.register(r"", NotificationTypeViewSet, basename="notification-type")

app_name = "notification_types"

urlpatterns = [
    path("", include(router.urls)),
]
