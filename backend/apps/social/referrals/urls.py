from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.social.referrals.views import ReferralViewSet

router = DefaultRouter()
router.register(r'', ReferralViewSet, basename='referrals')

urlpatterns = [
    path('', include(router.urls)),
]
