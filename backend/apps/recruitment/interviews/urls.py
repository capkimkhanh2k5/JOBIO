from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import InterviewViewSet

router = DefaultRouter()
router.register(r'', InterviewViewSet, basename='interviews')

app_name = 'interviews'

urlpatterns = [
    path('', include(router.urls)),
    # Custom routes
    path('<int:pk>/reschedule/', InterviewViewSet.as_view({'patch': 'reschedule'}), name='interview-reschedule'),
    path('<int:pk>/cancel/', InterviewViewSet.as_view({'patch': 'cancel'}), name='interview-cancel'),
    # Extended routes
    path('<int:pk>/complete/', InterviewViewSet.as_view({'patch': 'complete'}), name='interview-complete'),
    path('<int:pk>/feedback/', InterviewViewSet.as_view({'post': 'add_feedback'}), name='interview-feedback'),
    path('<int:pk>/send-reminder/', InterviewViewSet.as_view({'post': 'send_reminder_action'}), name='interview-reminder'),
    path('calendar/', InterviewViewSet.as_view({'get': 'calendar'}), name='interview-calendar'),
    path('upcoming/', InterviewViewSet.as_view({'get': 'upcoming'}), name='interview-upcoming'),
    # Interviewers routes
    path('<int:pk>/interviewers/', InterviewViewSet.as_view({'get': 'list_interviewers', 'post': 'add_interviewer'}), name='interview-interviewers'),
    path('<int:pk>/interviewers/<int:user_id>/', InterviewViewSet.as_view({'delete': 'remove_interviewer'}), name='interview-interviewer-remove'),
    path('<int:pk>/interviewers/<int:user_id>/feedback/', InterviewViewSet.as_view({'post': 'interviewer_feedback'}), name='interview-interviewer-feedback'),
]
