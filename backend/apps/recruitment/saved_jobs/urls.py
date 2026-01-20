from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import RecruiterSavedJobViewSet, SavedJobViewSet

# Router cho SavedJobViewSet (flat routes)
router = DefaultRouter()
router.register(r'', SavedJobViewSet, basename='saved-jobs')

# Router cho RecruiterSavedJobViewSet (nested)
recruiter_router = DefaultRouter()
recruiter_router.register(r'', RecruiterSavedJobViewSet, basename='recruiter-saved-jobs')

app_name = 'saved_jobs'

# Flat routes: /api/saved-jobs/
urlpatterns = [
    path('', include(router.urls)),
]
