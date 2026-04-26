from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import NotificationViewSet
from .admin_views import (
    broadcast_notification,
    admin_notification_stats,
    admin_notification_list,
    admin_mark_as_read,
    admin_bulk_mark_as_read,
    admin_delete_notification,
)

router = DefaultRouter()
router.register(r'', NotificationViewSet, basename='notification')

app_name = 'notifications'

urlpatterns = [
    path('broadcast/', broadcast_notification, name='notification-broadcast'),
    path('admin-stats/', admin_notification_stats, name='admin-notification-stats'),
    path('admin-list/', admin_notification_list, name='admin-notification-list'),
    path('admin-list/<int:pk>/mark-as-read/', admin_mark_as_read, name='admin-notification-mark-as-read'),
    path('admin-list/bulk-mark-as-read/', admin_bulk_mark_as_read, name='admin-notification-bulk-mark-as-read'),
    path('admin-list/<int:pk>/delete/', admin_delete_notification, name='admin-notification-delete'),
    path('', include(router.urls)),
]
