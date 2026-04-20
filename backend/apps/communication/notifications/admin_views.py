"""
Admin-only notification views — broadcast notifications to user groups.
"""
from django.db.models import Count, Q
from django.utils import timezone
from datetime import timedelta

from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import status

from apps.core.users.permissions import IsAdmin
from apps.core.users.models import CustomUser
from .models import Notification
from apps.communication.notification_types.models import NotificationType


@api_view(['POST'])
@permission_classes([IsAdmin])
def broadcast_notification(request):
    """
    POST /api/notifications/broadcast/
    Gửi thông báo hàng loạt cho nhóm users.

    Body:
        title (str): Tiêu đề thông báo
        message (str): Nội dung thông báo
        target (str): 'all' | 'candidate' | 'company'
        notification_type_id (int, optional): ID loại thông báo
    """
    title = request.data.get('title', '').strip()
    message = request.data.get('message', '').strip()
    target = request.data.get('target', 'all')
    notification_type_id = request.data.get('notification_type_id')

    if not title or not message:
        return Response({'detail': 'title và message là bắt buộc.'}, status=status.HTTP_400_BAD_REQUEST)

    if target not in ('all', 'candidate', 'company'):
        return Response({'detail': 'target phải là all, candidate hoặc company.'}, status=status.HTTP_400_BAD_REQUEST)

    # Lấy notification type (dùng type đầu tiên nếu không chỉ định)
    notif_type = None
    if notification_type_id:
        try:
            notif_type = NotificationType.objects.get(pk=notification_type_id)
        except NotificationType.DoesNotExist:
            return Response({'detail': 'notification_type_id không tồn tại.'}, status=status.HTTP_400_BAD_REQUEST)
    else:
        notif_type = NotificationType.objects.first()

    if not notif_type:
        return Response({'detail': 'Chưa có NotificationType nào trong DB. Tạo ít nhất 1 loại trước.'}, status=status.HTTP_400_BAD_REQUEST)

    # Lọc users theo target
    qs = CustomUser.objects.filter(is_active=True)
    if target == 'candidate':
        qs = qs.filter(role='candidate')
    elif target == 'company':
        qs = qs.filter(role='company')

    # Bulk create notifications
    notifications = [
        Notification(
            user=user,
            notification_type=notif_type,
            title=title,
            content=message,
        )
        for user in qs
    ]
    created = Notification.objects.bulk_create(notifications, batch_size=500)

    return Response({
        'detail': f'Đã gửi thành công {len(created)} thông báo.',
        'target': target,
        'count': len(created),
    }, status=status.HTTP_201_CREATED)


@api_view(['GET'])
@permission_classes([IsAdmin])
def admin_notification_stats(request):
    """
    GET /api/notifications/admin-stats/
    Thống kê tổng quan thông báo hệ thống.
    """
    now = timezone.now()
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    week_start = now - timedelta(days=7)

    total = Notification.objects.count()
    total_read = Notification.objects.filter(is_read=True).count()
    total_unread = total - total_read
    sent_today = Notification.objects.filter(created_at__gte=today_start).count()
    sent_this_week = Notification.objects.filter(created_at__gte=week_start).count()

    # Phân tích theo loại đối tượng nhận (role)
    candidate_count = Notification.objects.filter(user__role='candidate').count()
    company_count = Notification.objects.filter(user__role='company').count()

    read_rate = round((total_read / total * 100), 1) if total > 0 else 0

    return Response({
        'total': total,
        'total_read': total_read,
        'total_unread': total_unread,
        'sent_today': sent_today,
        'sent_this_week': sent_this_week,
        'candidate_count': candidate_count,
        'company_count': company_count,
        'read_rate': read_rate,
    })


@api_view(['GET'])
@permission_classes([IsAdmin])
def admin_notification_list(request):
    """
    GET /api/notifications/admin-list/?page=1&page_size=20&search=&type_id=
    Danh sách tất cả thông báo đã gửi — phân trang.
    """
    page = max(1, int(request.query_params.get('page', 1)))
    page_size = min(50, int(request.query_params.get('page_size', 20)))
    search = request.query_params.get('search', '').strip()
    type_id = request.query_params.get('type_id', '')

    qs = Notification.objects.select_related('user', 'notification_type').order_by('-created_at')

    if search:
        qs = qs.filter(Q(title__icontains=search) | Q(content__icontains=search) | Q(user__email__icontains=search))
    if type_id:
        qs = qs.filter(notification_type_id=type_id)

    total = qs.count()
    offset = (page - 1) * page_size
    items = qs[offset: offset + page_size]

    results = []
    for n in items:
        results.append({
            'id': n.id,
            'title': n.title,
            'content': n.content,
            'is_read': n.is_read,
            'created_at': n.created_at.isoformat(),
            'user_email': n.user.email if n.user else None,
            'user_name': n.user.full_name if n.user else None,
            'user_role': n.user.role if n.user else None,
            'notification_type': n.notification_type.type_name if n.notification_type else None,
        })

    return Response({
        'count': total,
        'page': page,
        'page_size': page_size,
        'results': results,
    })

