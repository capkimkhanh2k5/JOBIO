from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.recruitment.saved_jobs.views import RecruiterSavedJobViewSet

router = DefaultRouter()
router.register(r'', RecruiterSavedJobViewSet, basename='recruiter-saved-jobs')

urlpatterns = [
    path('', include(router.urls)),
]
