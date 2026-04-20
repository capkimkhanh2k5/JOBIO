from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import NotificationViewSet
from .admin_views import broadcast_notification, admin_notification_stats, admin_notification_list

router = DefaultRouter()
router.register(r'', NotificationViewSet, basename='notification')

app_name = 'notifications'

urlpatterns = [
    path('', include(router.urls)),
    path('broadcast/', broadcast_notification, name='notification-broadcast'),
    path('admin-stats/', admin_notification_stats, name='admin-notification-stats'),
    path('admin-list/', admin_notification_list, name='admin-notification-list'),
]
