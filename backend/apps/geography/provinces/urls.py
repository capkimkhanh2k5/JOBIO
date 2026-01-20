from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ProvinceViewSet
from apps.geography.communes.views import CommuneViewSet

router = DefaultRouter()
router.register(r'', ProvinceViewSet, basename='provinces')

app_name = 'provinces'

urlpatterns = [
    # Custom routes trước router
    path('by-region/<str:region>/', ProvinceViewSet.as_view({'get': 'by_region'}), name='by-region'),
    path('search/', ProvinceViewSet.as_view({'get': 'search'}), name='search'),
    # Nested communes route
    path('<int:province_id>/communes/', CommuneViewSet.as_view({'get': 'by_province'}), name='province-communes'),
    # Router routes
    path('', include(router.urls)),
]

