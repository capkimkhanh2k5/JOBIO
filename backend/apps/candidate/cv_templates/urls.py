from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CVTemplateViewSet

router = DefaultRouter()
router.register(r'', CVTemplateViewSet, basename='cv-templates')

app_name = 'cv_templates'

urlpatterns = [
    path('', include(router.urls)),
]
