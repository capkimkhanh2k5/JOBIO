"""
Admin Analytics Views — Cung cấp các endpoint thống kê & time-series cho Admin Dashboard.
Dựa trực tiếp trên dữ liệu thực từ DB (không dùng bảng analytics đã xoá).
"""

from datetime import timedelta

from django.db.models import Count, Sum
from django.db.models.functions import TruncMonth, TruncDate
from django.utils import timezone
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response

from apps.core.users.permissions import IsAdmin
from apps.core.users.models import CustomUser
from apps.recruitment.jobs.models import Job
from apps.recruitment.applications.models import Application
from apps.recruitment.interviews.models import Interview
from apps.billing.models import Transaction
from apps.company.companies.models import Company
from apps.system.reports.models import Report


# ─── Helpers ──────────────────────────────────────────────────────────────────

MONTH_VI = ["T1", "T2", "T3", "T4", "T5", "T6", "T7", "T8", "T9", "T10", "T11", "T12"]
DAY_VI = ["Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7", "Chủ nhật"]

INDUSTRY_COLORS = [
    "#7c3aed",
    "#a78bfa",
    "#f97316",
    "#fb923c",
    "#c084fc",
    "#06b6d4",
    "#10b981",
    "#f59e0b",
    "#ef4444",
    "#6366f1",
]


def _parse_limited_int(raw_value, default: int, min_value: int, max_value: int) -> int:
    try:
        parsed = int(raw_value)
    except (TypeError, ValueError):
        return default
    return max(min_value, min(parsed, max_value))


def _month_sequence(now, months: int):
    base_year = now.year
    base_month = now.month
    sequence = []
    for offset in range(months - 1, -1, -1):
        month = base_month - offset
        year = base_year
        while month <= 0:
            month += 12
            year -= 1
        sequence.append((year, month))
    return sequence


# ─── Endpoints ────────────────────────────────────────────────────────────────


@api_view(["GET"])
@permission_classes([IsAdmin])
def user_growth(request):
    """
    GET /api/analytics/user-growth/?months=7
    Trả về số lượng users + jobs mới theo từng tháng.
    """
    months = _parse_limited_int(
        request.query_params.get("months", 7), default=7, min_value=1, max_value=12
    )
    now = timezone.now()
    months_seq = _month_sequence(now, months)
    start_year, start_month = months_seq[0]
    start = now.replace(
        year=start_year,
        month=start_month,
        day=1,
        hour=0,
        minute=0,
        second=0,
        microsecond=0,
    )

    # Users per month
    users_qs = (
        CustomUser.objects.filter(date_joined__gte=start)
        .annotate(month=TruncMonth("date_joined"))
        .values("month")
        .annotate(count=Count("id"))
        .order_by("month")
    )
    users_map = {e["month"].strftime("%Y-%m"): e["count"] for e in users_qs}

    # Jobs per month
    jobs_qs = (
        Job.objects.filter(created_at__gte=start)
        .annotate(month=TruncMonth("created_at"))
        .values("month")
        .annotate(count=Count("id"))
        .order_by("month")
    )
    jobs_map = {e["month"].strftime("%Y-%m"): e["count"] for e in jobs_qs}

    # Build result for last N months
    result = []
    for year, month in months_seq:
        key = f"{year:04d}-{month:02d}"
        result.append(
            {
                "month": MONTH_VI[month - 1],
                "users": users_map.get(key, 0),
                "jobs": jobs_map.get(key, 0),
            }
        )

    return Response(result)


@api_view(["GET"])
@permission_classes([IsAdmin])
def industry_distribution(request):
    """
    GET /api/analytics/industry-distribution/
    Phân bổ công ty theo ngành nghề.
    """
    qs = (
        Company.objects.filter(industry__isnull=False)
        .values("industry__name")
        .annotate(count=Count("id"))
        .order_by("-count")[:10]
    )
    total = sum(item["count"] for item in qs) or 1
    result = []
    for i, item in enumerate(qs):
        pct = round(item["count"] / total * 100, 1)
        result.append(
            {
                "name": item["industry__name"],
                "value": pct,
                "count": item["count"],
                "color": INDUSTRY_COLORS[i % len(INDUSTRY_COLORS)],
            }
        )
    return Response(result)


@api_view(["GET"])
@permission_classes([IsAdmin])
def revenue_trend(request):
    """
    GET /api/analytics/revenue-trend/?days=7
    Doanh thu theo ngày trong N ngày gần nhất.
    """
    days = _parse_limited_int(
        request.query_params.get("days", 7), default=7, min_value=1, max_value=30
    )
    now = timezone.now()
    start = now - timedelta(days=days - 1)

    qs = (
        Transaction.objects.filter(
            status=Transaction.Status.COMPLETED, created_at__gte=start
        )
        .annotate(day=TruncDate("created_at"))
        .values("day")
        .annotate(revenue=Sum("amount"))
        .order_by("day")
    )
    rev_map = {str(e["day"]): float(e["revenue"] or 0) for e in qs}

    result = []
    for i in range(days):
        dt = (now - timedelta(days=days - 1 - i)).date()
        key = str(dt)
        dow = dt.weekday()  # 0=Mon
        result.append(
            {
                "day": DAY_VI[dow] if days <= 7 else dt.strftime("%d/%m"),
                "revenue": rev_map.get(key, 0),
            }
        )
    return Response(result)


@api_view(["GET"])
@permission_classes([IsAdmin])
def application_stats(request):
    """
    GET /api/analytics/application-stats/
    Thống kê đơn ứng tuyển + phỏng vấn (tổng quan + funnel).
    """
    # Applications tổng
    total_apps = Application.objects.count()
    pending_apps = Application.objects.filter(status=Application.Status.PENDING).count()
    reviewing_apps = Application.objects.filter(
        status=Application.Status.REVIEWING
    ).count()
    shortlisted_apps = Application.objects.filter(
        status=Application.Status.SHORTLISTED
    ).count()
    interview_apps = Application.objects.filter(
        status=Application.Status.INTERVIEW
    ).count()
    offered_apps = Application.objects.filter(status=Application.Status.OFFERED).count()
    accepted_apps = Application.objects.filter(
        status=Application.Status.ACCEPTED
    ).count()
    rejected_apps = Application.objects.filter(
        status=Application.Status.REJECTED
    ).count()

    # Mới trong 30 ngày
    thirty_days_ago = timezone.now() - timedelta(days=30)
    new_30d = Application.objects.filter(applied_at__gte=thirty_days_ago).count()

    # Interviews
    total_interviews = Interview.objects.count()
    scheduled_interviews = Interview.objects.filter(
        status=Interview.Status.SCHEDULED
    ).count()
    completed_interviews = Interview.objects.filter(
        status=Interview.Status.COMPLETED
    ).count()
    cancelled_interviews = Interview.objects.filter(
        status=Interview.Status.CANCELLED
    ).count()

    # Funnel data for charts
    funnel = [
        {"stage": "Ứng tuyển", "count": total_apps, "color": "#7c3aed"},
        {
            "stage": "Xem xét",
            "count": reviewing_apps + shortlisted_apps,
            "color": "#a78bfa",
        },
        {"stage": "Phỏng vấn", "count": interview_apps, "color": "#f97316"},
        {"stage": "Offer", "count": offered_apps, "color": "#10b981"},
        {"stage": "Nhận việc", "count": accepted_apps, "color": "#06b6d4"},
    ]

    # Status breakdown
    status_breakdown = [
        {
            "status": "pending",
            "label": "Chờ xử lý",
            "count": pending_apps,
            "color": "#f59e0b",
        },
        {
            "status": "reviewing",
            "label": "Đang xem xét",
            "count": reviewing_apps,
            "color": "#6366f1",
        },
        {
            "status": "shortlisted",
            "label": "Vòng tiếp",
            "count": shortlisted_apps,
            "color": "#a78bfa",
        },
        {
            "status": "interview",
            "label": "Phỏng vấn",
            "count": interview_apps,
            "color": "#f97316",
        },
        {
            "status": "accepted",
            "label": "Nhận việc",
            "count": accepted_apps,
            "color": "#10b981",
        },
        {
            "status": "rejected",
            "label": "Từ chối",
            "count": rejected_apps,
            "color": "#ef4444",
        },
    ]

    return Response(
        {
            "applications": {
                "total": total_apps,
                "new_30d": new_30d,
                "pending": pending_apps,
                "accepted": accepted_apps,
                "rejected": rejected_apps,
            },
            "interviews": {
                "total": total_interviews,
                "scheduled": scheduled_interviews,
                "completed": completed_interviews,
                "cancelled": cancelled_interviews,
            },
            "funnel": funnel,
            "status_breakdown": status_breakdown,
        }
    )


@api_view(["GET"])
@permission_classes([IsAdmin])
def top_jobs(request):
    """
    GET /api/analytics/top-jobs/?limit=10
    Top jobs theo lượt xem + ứng tuyển (sử dụng trường cache trên model Job).
    """
    limit = _parse_limited_int(
        request.query_params.get("limit", 10), default=10, min_value=1, max_value=50
    )

    jobs = (
        Job.objects.select_related("company")
        .annotate(
            real_views=Count("views", distinct=True),
            real_saves=Count("saved_by", distinct=True),
            real_applications=Count("applications", distinct=True),
        )
        .order_by("-real_views", "-real_applications", "-real_saves", "-created_at")[
            :limit
        ]
    )

    result = []
    for job in jobs:
        result.append(
            {
                "id": job.id,
                "title": job.title,
                "company": job.company.company_name if job.company else "—",
                "status": job.status,
                "views": job.real_views,
                "saves": job.real_saves,
                "applications": job.real_applications,
            }
        )
    return Response(result)


@api_view(["GET"])
@permission_classes([IsAdmin])
def violation_breakdown(request):
    """
    GET /api/analytics/violation-breakdown/
    Phân loại vi phạm theo report_type.
    """
    COLORS = ["#ef4444", "#f97316", "#7c3aed", "#f59e0b", "#6366f1", "#10b981"]
    qs = (
        Report.objects.filter(report_type__isnull=False)
        .values("report_type__type_name")
        .annotate(count=Count("id"))
        .order_by("-count")[:6]
    )
    total = sum(item["count"] for item in qs) or 1
    result = []
    for i, item in enumerate(qs):
        result.append(
            {
                "name": item["report_type__type_name"],
                "value": round(item["count"] / total * 100, 1),
                "count": item["count"],
                "color": COLORS[i % len(COLORS)],
            }
        )
    return Response(result)


@api_view(["GET"])
@permission_classes([IsAdmin])
def admin_overview_stats(request):
    """
    GET /api/analytics/overview/
    Thống kê tổng quan nhanh cho Dashboard (mở rộng từ stats hiện có).
    """
    now = timezone.now()
    thirty_ago = now - timedelta(days=30)

    return Response(
        {
            "users": {
                "total": CustomUser.objects.count(),
                "new_30d": CustomUser.objects.filter(
                    date_joined__gte=thirty_ago
                ).count(),
                "by_role": {
                    "candidate": CustomUser.objects.filter(role="candidate").count(),
                    "company": CustomUser.objects.filter(role="company").count(),
                },
            },
            "jobs": {
                "total": Job.objects.count(),
                "active": Job.objects.filter(status=Job.Status.PUBLISHED).count(),
            },
            "applications": {
                "total": Application.objects.count(),
                "new_30d": Application.objects.filter(
                    applied_at__gte=thirty_ago
                ).count(),
                "pending": Application.objects.filter(
                    status=Application.Status.PENDING
                ).count(),
                "accepted": Application.objects.filter(
                    status=Application.Status.ACCEPTED
                ).count(),
            },
            "interviews": {
                "total": Interview.objects.count(),
                "scheduled": Interview.objects.filter(
                    status=Interview.Status.SCHEDULED
                ).count(),
                "completed": Interview.objects.filter(
                    status=Interview.Status.COMPLETED
                ).count(),
            },
            "revenue": {
                "total": float(
                    Transaction.objects.filter(
                        status=Transaction.Status.COMPLETED
                    ).aggregate(t=Sum("amount"))["t"]
                    or 0
                ),
                "monthly": float(
                    Transaction.objects.filter(
                        status=Transaction.Status.COMPLETED,
                        created_at__gte=now.replace(day=1, hour=0, minute=0, second=0),
                    ).aggregate(t=Sum("amount"))["t"]
                    or 0
                ),
            },
            "reports": {
                "total": Report.objects.count(),
                "pending": Report.objects.filter(status=Report.Status.PENDING).count(),
            },
            "companies": {
                "total": Company.objects.count(),
                "pending_verification": Company.objects.filter(
                    verification_status=Company.VerificationStatus.PENDING
                ).count(),
            },
        }
    )
