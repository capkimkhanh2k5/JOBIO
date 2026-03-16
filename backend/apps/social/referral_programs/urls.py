from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.social.referral_programs.views import ReferralProgramViewSet

router = DefaultRouter()
router.register(r'', ReferralProgramViewSet, basename='referral-programs')

urlpatterns = [
    path('', include(router.urls)),
]
