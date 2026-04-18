from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.billing.views import SubscriptionPlanViewSet, CompanySubscriptionViewSet, TransactionViewSet
from apps.billing.admin_views import AdminFinancialViewSet

router = DefaultRouter()
router.register(r'subscription-plans', SubscriptionPlanViewSet, basename='subscription-plans')
router.register(r'company-subscriptions', CompanySubscriptionViewSet, basename='company-subscriptions')
router.register(r'transactions', TransactionViewSet, basename='transactions')
router.register(r'admin-finance', AdminFinancialViewSet, basename='admin-finance')

urlpatterns = [
    path('', include(router.urls)),
]
