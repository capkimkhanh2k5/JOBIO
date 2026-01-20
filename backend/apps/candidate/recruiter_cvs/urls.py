from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import RecruiterCVViewSet

router = DefaultRouter()
router.register(r'', RecruiterCVViewSet, basename='recruiter-cvs')

app_name = 'recruiter_cvs'

urlpatterns = [
    # Generate route
    path('generate/', RecruiterCVViewSet.as_view({'post': 'generate'}), name='cv-generate'),
    # Router routes
    path('', include(router.urls)),
    # Extended routes (detail actions)
    path('<int:pk>/default/', RecruiterCVViewSet.as_view({'patch': 'set_default'}), name='cv-default'),
    path('<int:pk>/download/', RecruiterCVViewSet.as_view({'post': 'download'}), name='cv-download'),
    path('<int:pk>/preview/', RecruiterCVViewSet.as_view({'post': 'preview'}), name='cv-preview'),
    path('<int:pk>/privacy/', RecruiterCVViewSet.as_view({'patch': 'set_privacy'}), name='cv-privacy'),
]
