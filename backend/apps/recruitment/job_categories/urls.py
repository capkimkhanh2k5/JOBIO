from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import JobCategoryViewSet

router = DefaultRouter()
router.register(r'', JobCategoryViewSet, basename='job-categories')

app_name = 'job_categories'

urlpatterns = [
    path('', include(router.urls)),
]
