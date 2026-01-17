from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView
from .views import CustomUserViewSet

router = DefaultRouter()
router.register(r'', CustomUserViewSet, basename='user')

app_name = 'users'

urlpatterns = [
    path('', include(router.urls)),
    
    # Token refresh vẫn sử dụng simplejwt view
    path('auth/refresh-token/', TokenRefreshView.as_view(), name='token-refresh'),
]
