from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import IndustryViewSet

router = DefaultRouter()
router.register(r'', IndustryViewSet, basename='industries')

app_name = 'industries'

urlpatterns = [
    path('', include(router.urls)),
]
