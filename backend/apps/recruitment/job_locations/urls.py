from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import JobLocationViewSet

router = DefaultRouter()
router.register(r'', JobLocationViewSet, basename='job-locations')

app_name = 'job_locations'

urlpatterns = [
    path('', include(router.urls)),
]
