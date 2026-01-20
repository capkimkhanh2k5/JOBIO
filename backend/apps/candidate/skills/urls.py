from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import SkillViewSet

router = DefaultRouter()
router.register(r'', SkillViewSet, basename='skills')

app_name = 'skills'

urlpatterns = [
    # Custom actions trước router để tránh conflict
    path('search/', SkillViewSet.as_view({'get': 'search'}), name='skill-search'),
    path('popular/', SkillViewSet.as_view({'get': 'popular'}), name='skill-popular'),
    path('categories/', SkillViewSet.as_view({'get': 'categories'}), name='skill-categories'),
    # Router routes
    path('', include(router.urls)),
]
