from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import JobViewSet
from apps.assessment.ai_matching_scores.views import MatchingCandidatesView

router = DefaultRouter()
router.register(r'', JobViewSet, basename='jobs')

app_name = 'jobs'

urlpatterns = [
    path('<int:job_id>/matching-candidates', MatchingCandidatesView.as_view({'get': 'list'}), name='matching-candidates'),
    path('', include(router.urls)),
]
