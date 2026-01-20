from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import JobSkillViewSet

router = DefaultRouter()
router.register(r'', JobSkillViewSet, basename='job-skills')

app_name = 'job_skills'

urlpatterns = [
    path('', include(router.urls)),
]
