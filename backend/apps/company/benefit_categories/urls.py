from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import BenefitCategoryViewSet

router = DefaultRouter()
router.register(r'', BenefitCategoryViewSet, basename='benefit-categories')

app_name = 'benefit_categories'

urlpatterns = [
    # Reorder action trước router
    path('reorder/', BenefitCategoryViewSet.as_view({'patch': 'reorder'}), name='reorder'),
    # Router routes
    path('', include(router.urls)),
]
