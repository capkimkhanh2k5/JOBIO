from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CustomUserViewSet
from .token_views import ThrottledTokenRefreshView

router = DefaultRouter()
router.register(r"", CustomUserViewSet, basename="user")

app_name = "users"

urlpatterns = [
    path("", include(router.urls)),
    # Token refresh vẫn sử dụng simplejwt view
    path(
        "auth/refresh-token/",
        ThrottledTokenRefreshView.as_view(),
        name="token-refresh",
    ),
]
