from rest_framework import permissions
from .models import CustomUser


def is_admin_user(user) -> bool:
    """
    Admin thống nhất cho API nội bộ: chấp nhận staff, superuser hoặc role=admin.
    """
    return bool(
        user
        and user.is_authenticated
        and (
            user.is_staff
            or user.is_superuser
            or getattr(user, "role", None) == CustomUser.Role.ADMIN
        )
    )


class IsAdmin(permissions.BasePermission):
    """
    Chỉ cho phép Admin truy cập
    """

    def has_permission(self, request, view):
        return is_admin_user(request.user)


class IsAdminOrOwner(permissions.BasePermission):
    """
    Admin có quyền tất cả.
    User thường chỉ có quyền trên object của chính mình.
    """

    def has_object_permission(self, request, view, obj):
        if request.user.role == CustomUser.Role.ADMIN:
            return True
        return obj == request.user
