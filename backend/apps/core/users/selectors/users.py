from ..models import CustomUser

import django_filters

from django.db.models import QuerySet
from django.utils import timezone
from django.db.models import Count

import csv
import io

from django.db.models import Q

class UserFilter(django_filters.FilterSet):
    search = django_filters.CharFilter(method='filter_search')

    class Meta:
        model = CustomUser
        fields = {
            'role': ['exact'],
            'status': ['exact'],
            'is_active': ['exact'],
        }

    def filter_search(self, queryset, name, value):
        return queryset.filter(
            Q(email__icontains=value) | 
            Q(full_name__icontains=value)
        )

def list_users(*, filters: dict = None) -> QuerySet[CustomUser]:
    """
    Lấy toàn bộ users có hỗ trợ filter
    """
    qs = CustomUser.objects.all().order_by('-date_joined')
    
    if filters:
        return UserFilter(filters, queryset=qs).qs
        
    return qs


def get_user_by_email(*, email: str) -> CustomUser | None:
    """Lấy user theo email để authenticate"""
    return CustomUser.objects.filter(email=email).first()

def get_user_by_reset_token(*, reset_token: str) -> CustomUser | None:
    """
    Tìm user theo reset_token để reset password
    """
    return CustomUser.objects.filter(password_reset_token=reset_token).first()

def get_user_by_verification_token(*, token: str) -> CustomUser | None:
    """
    Tìm user theo email_verification_token để chức năng xác minh email
    """
    return CustomUser.objects.filter(email_verification_token=token).first()

def get_user_stats() -> dict:
    """
    Thống kê user theo trạng thái, vai trò.
    """
    
    total_users = CustomUser.objects.count()
    users_by_status = dict(CustomUser.objects.values_list('status').annotate(count=Count('id')))
    users_by_role = dict(CustomUser.objects.values_list('role').annotate(count=Count('id')))
    
    # New users today
    today = timezone.now().date()
    new_users_today = CustomUser.objects.filter(date_joined__date=today).count()
    
    return {
        "total_users": total_users,
        "by_status": users_by_status,
        "by_role": users_by_role,
        "new_users_today": new_users_today
    }

def export_users_csv() -> any:
    """
    Xuất danh sách user ra CSV.
    Returns: file-like object or http response content generator
    """
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Header
    writer.writerow(['ID', 'Email', 'Full Name', 'Phone', 'Role', 'Status', 'Date Joined', 'Last Login'])
    
    users = CustomUser.objects.all().iterator()
    for user in users:
        writer.writerow([
            user.id,
            user.email,
            user.full_name,
            user.phone or '',
            user.role,
            user.status,
            user.date_joined.strftime("%d/%m/%Y %H:%M") if user.date_joined else '',
            user.last_login.strftime("%d/%m/%Y %H:%M") if user.last_login else ''
        ])
        
    return output.getvalue()