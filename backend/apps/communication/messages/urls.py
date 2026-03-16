from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import MessageViewSet

router = DefaultRouter()
router.register(r'', MessageViewSet, basename='message')

app_name = 'messages'

urlpatterns = [
    path('unread-count/', MessageViewSet.as_view({'get': 'unread_count'})),
    path('recipients/', MessageViewSet.as_view({'get': 'recipients'})),
    path('upload-attachment/', MessageViewSet.as_view({'post': 'upload_attachment_action'})),
    path('', include(router.urls)),
]
