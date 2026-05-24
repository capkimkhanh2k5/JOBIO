"""
Admin-only notification views — broadcast notifications to user groups.
"""

import math
from django.db.models import Q
from django.utils import timezone
from datetime import timedelta
from re import sub

from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import status

from apps.core.users.permissions import IsAdmin
from apps.core.users.models import CustomUser
from .models import Notification
from apps.communication.notification_types.models import NotificationType


def _parse_int_param(raw_value, default: int, min_value: int, max_value: int) -> int:
    try:
        parsed = int(raw_value)
    except (TypeError, ValueError):
        return default
    return max(min_value, min(parsed, max_value))


def _normalize_type_name(value: str) -> str:
    return sub(r"[^a-z0-9]+", "_", (value or "").strip().lower()).strip("_")


@api_view(["POST"])
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
    title = request.data.get("title", "").strip()
    message = request.data.get("message", "").strip()
    target = request.data.get("target", "all")
    notification_type_id = request.data.get("notification_type_id")

    if not title or not message:
        return Response(
            {"detail": "title và message là bắt buộc."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if target not in ("all", "candidate", "company"):
        return Response(
            {"detail": "target phải là all, candidate hoặc company."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # Lấy notification type (dùng type đầu tiên nếu không chỉ định)
    notif_type = None
    if notification_type_id:
        try:
            notif_type = NotificationType.objects.get(pk=notification_type_id)
        except NotificationType.DoesNotExist:
            return Response(
                {"detail": "notification_type_id không tồn tại."},
                status=status.HTTP_400_BAD_REQUEST,
            )
    else:
        notif_type = NotificationType.objects.first()

    if not notif_type:
        return Response(
            {
                "detail": "Chưa có NotificationType nào trong DB. Tạo ít nhất 1 loại trước."
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    # Lọc users theo target
    qs = CustomUser.objects.filter(is_active=True)
    if target == "candidate":
        qs = qs.filter(role="candidate")
    elif target == "company":
        qs = qs.filter(role="company")

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

    return Response(
        {
            "detail": f"Đã gửi thành công {len(created)} thông báo.",
            "target": target,
            "count": len(created),
        },
        status=status.HTTP_201_CREATED,
    )


@api_view(["GET"])
@permission_classes([IsAdmin])
def admin_notification_stats(request):
    """
    GET /api/notifications/admin-stats/
    Thống kê thông báo của admin đang đăng nhập.
    """
    now = timezone.now()
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    week_start = now - timedelta(days=7)

    admin_qs = Notification.objects.filter(user=request.user)

    total = admin_qs.count()
    total_read = admin_qs.filter(is_read=True).count()
    total_unread = total - total_read
    sent_today = admin_qs.filter(created_at__gte=today_start).count()
    sent_this_week = admin_qs.filter(created_at__gte=week_start).count()

    # Phân tích theo loại đối tượng nhận (role) — toàn hệ thống
    candidate_count = Notification.objects.filter(user__role="candidate").count()
    company_count = Notification.objects.filter(user__role="company").count()

    read_rate = round((total_read / total * 100), 1) if total > 0 else 0

    return Response(
        {
            "total": total,
            "total_read": total_read,
            "total_unread": total_unread,
            "sent_today": sent_today,
            "sent_this_week": sent_this_week,
            "candidate_count": candidate_count,
            "company_count": company_count,
            "read_rate": read_rate,
        }
    )


@api_view(["GET"])
@permission_classes([IsAdmin])
def admin_notification_list(request):
    """
    GET /api/notifications/admin-list/?page=1&page_size=20&search=&type=&type_id=&is_read=
    Danh sách thông báo của admin đang đăng nhập — phân trang.
    """
    page = _parse_int_param(
        request.query_params.get("page", 1), default=1, min_value=1, max_value=100000
    )
    page_size = _parse_int_param(
        request.query_params.get("page_size", 20), default=20, min_value=1, max_value=50
    )
    search = request.query_params.get("search", "").strip()
    notif_type = request.query_params.get("type", "").strip()
    type_id = request.query_params.get("type_id", "")
    is_read = request.query_params.get("is_read", None)

    qs = (
        Notification.objects.select_related("user", "notification_type")
        .filter(user=request.user)
        .order_by("-created_at")
    )

    if search:
        qs = qs.filter(
            Q(title__icontains=search)
            | Q(content__icontains=search)
            | Q(user__email__icontains=search)
        )
    if is_read is not None:
        is_read_value = str(is_read).strip().lower()
        if is_read_value in ("1", "true", "yes"):
            qs = qs.filter(is_read=True)
        elif is_read_value in ("0", "false", "no"):
            qs = qs.filter(is_read=False)
        else:
            return Response(
                {"detail": "is_read phải là true/false."},
                status=status.HTTP_400_BAD_REQUEST,
            )
    if notif_type:
        notif_type_normalized = _normalize_type_name(notif_type)
        matched_type_ids = [
            t.id
            for t in NotificationType.objects.filter(is_active=True).only(
                "id", "type_name"
            )
            if _normalize_type_name(t.type_name) == notif_type_normalized
        ]
        if matched_type_ids:
            qs = qs.filter(notification_type_id__in=matched_type_ids)
        else:
            qs = qs.none()

    if type_id:
        try:
            qs = qs.filter(notification_type_id=int(type_id))
        except (TypeError, ValueError):
            return Response(
                {"detail": "type_id phải là số nguyên."},
                status=status.HTTP_400_BAD_REQUEST,
            )

    total = qs.count()
    offset = (page - 1) * page_size
    items = qs[offset : offset + page_size]

    results = []
    for n in items:
        results.append(
            {
                "id": n.id,
                "title": n.title,
                "content": n.content,
                "is_read": n.is_read,
                "created_at": n.created_at.isoformat(),
                "read_at": n.read_at.isoformat() if n.read_at else None,
                "link": n.link,
                "entity_type": n.entity_type,
                "entity_id": n.entity_id,
                "user_email": n.user.email if n.user else None,
                "user_name": n.user.full_name if n.user else None,
                "user_role": n.user.role if n.user else None,
                "notification_type": {
                    "id": n.notification_type.id,
                    "type_name": n.notification_type.type_name,
                }
                if n.notification_type
                else None,
                "notification_type_name": n.notification_type.type_name
                if n.notification_type
                else None,
            }
        )

    return Response(
        {
            "count": total,
            "page": page,
            "current_page": page,
            "page_size": page_size,
            "total_pages": math.ceil(total / page_size) if total > 0 else 1,
            "results": results,
        }
    )


@api_view(["PATCH"])
@permission_classes([IsAdmin])
def admin_mark_as_read(request, pk):
    """
    PATCH /api/notifications/admin-list/:id/mark-as-read/
    Đánh dấu 1 thông báo là đã đọc.
    """
    try:
        notification = Notification.objects.get(pk=pk, user=request.user)
    except Notification.DoesNotExist:
        return Response(
            {"detail": "Thông báo không tồn tại."}, status=status.HTTP_404_NOT_FOUND
        )

    notification.is_read = True
    notification.read_at = timezone.now()
    notification.save(update_fields=["is_read", "read_at"])
    return Response({"detail": "Đã đánh dấu là đã đọc."})


@api_view(["POST"])
@permission_classes([IsAdmin])
def admin_bulk_mark_as_read(request):
    """
    POST /api/notifications/admin-list/bulk-mark-as-read/
    Đánh dấu nhiều thông báo là đã đọc.
    """
    ids = request.data.get("ids", [])
    if not isinstance(ids, list):
        return Response(
            {"detail": "ids phải là danh sách."}, status=status.HTTP_400_BAD_REQUEST
        )

    if ids:
        count = Notification.objects.filter(
            id__in=ids, user=request.user, is_read=False
        ).update(is_read=True, read_at=timezone.now())
    else:
        count = Notification.objects.filter(user=request.user, is_read=False).update(
            is_read=True, read_at=timezone.now()
        )
    return Response({"detail": f"Đã đánh dấu {count} thông báo là đã đọc."})


@api_view(["DELETE"])
@permission_classes([IsAdmin])
def admin_delete_notification(request, pk):
    """
    DELETE /api/notifications/admin-list/:id/delete/
    Xóa 1 thông báo bất kỳ trong danh sách admin.
    """
    deleted, _ = Notification.objects.filter(pk=pk, user=request.user).delete()
    if deleted == 0:
        return Response(
            {"detail": "Thông báo không tồn tại."}, status=status.HTTP_404_NOT_FOUND
        )
    return Response(status=status.HTTP_204_NO_CONTENT)
