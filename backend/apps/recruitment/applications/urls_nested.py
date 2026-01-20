from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.recruitment.applications.views import JobApplicationViewSet

router = DefaultRouter()
router.register(r'', JobApplicationViewSet, basename='job-applications')

urlpatterns = [
    path('', include(router.urls)),
    # Filter endpoints
    path('pending/', JobApplicationViewSet.as_view({'get': 'pending'}), name='job-applications-pending'),
    path('shortlisted/', JobApplicationViewSet.as_view({'get': 'shortlisted'}), name='job-applications-shortlisted'),
    path('rejected/', JobApplicationViewSet.as_view({'get': 'rejected'}), name='job-applications-rejected'),
    path('by-rating/', JobApplicationViewSet.as_view({'get': 'by_rating'}), name='job-applications-by-rating'),
    path('search/', JobApplicationViewSet.as_view({'get': 'search'}), name='job-applications-search'),
]

# Nested interviews routes
from apps.recruitment.interviews.views import InterviewViewSet as AppInterviewViewSet
from apps.recruitment.interviews.serializers import InterviewListSerializer
from apps.recruitment.interviews.selectors.interviews import list_interviews_by_application


class ApplicationInterviewListView:
    """View cho list interviews của một application"""
    pass
