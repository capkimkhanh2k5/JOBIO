from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import InterviewViewSet

router = DefaultRouter()
router.register(r'', InterviewViewSet, basename='interviews')

app_name = 'interviews'

urlpatterns = [
    # Custom routes without pk must be before router.urls
    path('calendar/', InterviewViewSet.as_view({'get': 'calendar'}), name='interview-calendar'),
    path('upcoming/', InterviewViewSet.as_view({'get': 'upcoming'}), name='interview-upcoming'),
    
    # Custom routes with pk
    path('<int:pk>/reschedule/', InterviewViewSet.as_view({'patch': 'reschedule'}), name='interview-reschedule'),
    path('<int:pk>/cancel/', InterviewViewSet.as_view({'patch': 'cancel'}), name='interview-cancel'),
    path('<int:pk>/complete/', InterviewViewSet.as_view({'patch': 'complete'}), name='interview-complete'),
    path('<int:pk>/feedback/', InterviewViewSet.as_view({'post': 'add_feedback'}), name='interview-feedback'),
    path('<int:pk>/send-reminder/', InterviewViewSet.as_view({'post': 'send_reminder_action'}), name='interview-reminder'),
    
    # Router urls last
    path('', include(router.urls)),
]
