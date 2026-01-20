from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CommuneViewSet

router = DefaultRouter()
router.register(r'', CommuneViewSet, basename='communes')

app_name = 'communes'

urlpatterns = [
    path('', include(router.urls)),
]
