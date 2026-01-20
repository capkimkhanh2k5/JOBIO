from typing import Optional
from datetime import date, timedelta
from django.db.models import Count, Q
from django.db.models.functions import TruncDate
from django.utils import timezone
from urllib.parse import urlparse

import re

from apps.recruitment.job_views.models import JobView


def get_view_stats(job_id: int) -> dict:
    """
        Lấy thống kê tổng hợp lượt xem cho job.
        
        Returns:
            {
                "total_views": int,
                "unique_views": int,
                "views_today": int,
                "views_this_week": int,
                "views_this_month": int
            }
    """
    today = timezone.now().date()
    week_ago = today - timedelta(days=7)
    month_ago = today - timedelta(days=30)
    
    queryset = JobView.objects.filter(job_id=job_id)
    
    # Tổng lượt xem
    total_views = queryset.count()
    
    # Lượt xem duy nhất (bởi user hoặc IP)
    unique_by_user = queryset.exclude(user__isnull=True).values('user').distinct().count()
    unique_by_ip = queryset.filter(user__isnull=True).values('ip_address').distinct().count()
    unique_views = unique_by_user + unique_by_ip
    
    # Lượt xem hôm nay
    views_today = queryset.filter(viewed_at__date=today).count()
    
    # Lượt xem tuần này
    views_this_week = queryset.filter(viewed_at__date__gte=week_ago).count()
    
    # Lượt xem tháng này
    views_this_month = queryset.filter(viewed_at__date__gte=month_ago).count()
    
    return {
        "total_views": total_views,
        "unique_views": unique_views,
        "views_today": views_today,
        "views_this_week": views_this_week,
        "views_this_month": views_this_month
    }


def get_view_chart_data(job_id: int, period: str = '7d') -> dict:
    """
        Lấy dữ liệu biểu đồ lượt xem theo thời gian.
        
        Args:
            job_id: ID của job
            period: '7d', '30d', hoặc '90d'
        
        Returns:
            {
                "period": str,
                "data": [{"date": "YYYY-MM-DD", "views": int}, ...]
            }
    """
    # Quá trình chuyển đổi period thành số ngày
    days_map = {'7d': 7, '30d': 30, '90d': 90}
    days = days_map.get(period, 7)
    
    start_date = timezone.now().date() - timedelta(days=days - 1)
    
    # Lấy lượt xem theo ngày
    queryset = JobView.objects.filter(
        job_id=job_id,
        viewed_at__date__gte=start_date
    ).annotate(
        date=TruncDate('viewed_at')
    ).values('date').annotate(
        views=Count('id')
    ).order_by('date')
    
    # Chuyển đổi thành list và điền các ngày thiếu
    views_by_date = {item['date']: item['views'] for item in queryset}
    
    data = []
    current_date = start_date
    end_date = timezone.now().date()
    
    while current_date <= end_date:
        data.append({
            "date": current_date.isoformat(),
            "views": views_by_date.get(current_date, 0)
        })
        current_date += timedelta(days=1)
    
    return {
        "period": period,
        "data": data
    }


def get_viewer_demographics(job_id: int) -> dict:
    """
        Lấy thống kê demographics của người xem.
        
        Returns:
            {
                "by_referrer": [{"source": str, "count": int}, ...],
                "by_device": [{"device": str, "count": int}, ...],
                "authenticated_ratio": {"logged_in": int, "anonymous": int}
            }
    """
    queryset = JobView.objects.filter(job_id=job_id)
    
    # Thống kê theo referrer
    referrer_counts = {}
    for view in queryset.exclude(referrer__isnull=True).exclude(referrer=''):
        try:
            parsed = urlparse(view.referrer)
            domain = parsed.netloc or 'direct'
            # Loại bỏ prefix www
            if domain.startswith('www.'):
                domain = domain[4:]
            referrer_counts[domain] = referrer_counts.get(domain, 0) + 1
        except:
            referrer_counts['other'] = referrer_counts.get('other', 0) + 1
    
    # Thêm traffic trực tiếp
    direct_count = queryset.filter(Q(referrer__isnull=True) | Q(referrer='')).count()
    if direct_count > 0:
        referrer_counts['direct'] = direct_count
    
    by_referrer = sorted(
        [{"source": k, "count": v} for k, v in referrer_counts.items()],
        key=lambda x: x['count'],
        reverse=True
    )[:10]  # Top 10
    
    # Thống kê theo device (parse user_agent)
    device_counts = {"mobile": 0, "desktop": 0, "tablet": 0, "other": 0}
    
    for view in queryset.exclude(user_agent__isnull=True).exclude(user_agent=''):
        ua = view.user_agent.lower()
        if 'mobile' in ua or 'android' in ua or 'iphone' in ua:
            device_counts['mobile'] += 1
        elif 'tablet' in ua or 'ipad' in ua:
            device_counts['tablet'] += 1
        elif 'windows' in ua or 'macintosh' in ua or 'linux' in ua:
            device_counts['desktop'] += 1
        else:
            device_counts['other'] += 1
    
    by_device = [{"device": k, "count": v} for k, v in device_counts.items() if v > 0]
    
    # Tỷ lệ người dùng đã đăng nhập
    logged_in = queryset.exclude(user__isnull=True).count()
    anonymous = queryset.filter(user__isnull=True).count()
    
    return {
        "by_referrer": by_referrer,
        "by_device": by_device,
        "authenticated_ratio": {
            "logged_in": logged_in,
            "anonymous": anonymous
        }
    }
