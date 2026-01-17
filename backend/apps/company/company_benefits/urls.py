from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CompanyBenefitViewSet

router = DefaultRouter()
router.register(r'', CompanyBenefitViewSet, basename='company-benefit')

app_name = 'company_benefits'

urlpatterns = [
    path('', include(router.urls)),
]
