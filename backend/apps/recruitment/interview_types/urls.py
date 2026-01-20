from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import InterviewTypeViewSet

router = DefaultRouter()
router.register(r'', InterviewTypeViewSet, basename='interview-types')

app_name = 'interview_types'

urlpatterns = [
    path('', include(router.urls)),
]
