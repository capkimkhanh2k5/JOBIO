from datetime import timedelta

from django.db.models import Count, Q
from django.db.models.functions import TruncDate
from django.utils import timezone
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.company.companies.models import Company
from apps.recruitment.applications.models import Application
from apps.recruitment.interviews.models import Interview
from apps.recruitment.jobs.models import Job
from apps.recruitment.job_views.models import JobView


APPLICATION_FUNNEL_STAGES = [
    ("Ứng tuyển", None, "#2563eb"),
    ("Đang xem xét", Application.Status.REVIEWING, "#7c3aed"),
    ("Vào vòng tiếp", Application.Status.SHORTLISTED, "#a78bfa"),
    ("Phỏng vấn", Application.Status.INTERVIEW, "#f97316"),
    ("Offer", Application.Status.OFFERED, "#0ea5e9"),
    ("Nhận việc", Application.Status.ACCEPTED, "#10b981"),
]

APPLICATION_STATUS_BREAKDOWN = [
    (Application.Status.PENDING, "Chờ xử lý", "#f59e0b"),
    (Application.Status.REVIEWING, "Đang xem xét", "#6366f1"),
    (Application.Status.SHORTLISTED, "Vào vòng tiếp", "#a78bfa"),
    (Application.Status.INTERVIEW, "Phỏng vấn", "#f97316"),
    (Application.Status.OFFERED, "Đề xuất offer", "#0ea5e9"),
    (Application.Status.ACCEPTED, "Đã nhận việc", "#10b981"),
    (Application.Status.REJECTED, "Từ chối", "#ef4444"),
    (Application.Status.WITHDRAWN, "Đã rút", "#64748b"),
]


def _status_value(status):
    return status.value if hasattr(status, "value") else status


def _get_company_for_user(user):
    if getattr(user, "role", None) != "company":
        return None

    try:
        return user.company_profile
    except Company.DoesNotExist:
        return None
    except AttributeError:
        return None


def _percent_delta(current, previous):
    if previous == 0:
        return 100 if current > 0 else 0
    return round(((current - previous) / previous) * 100)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def company_dashboard_stats(request):
    company = _get_company_for_user(request.user)
    if not company:
        return Response(
            {"detail": "You do not have a company profile."},
            status=404,
        )

    now = timezone.now()
    current_start = now - timedelta(days=30)
    previous_start = now - timedelta(days=60)

    jobs_qs = Job.objects.filter(company=company)
    apps_qs = Application.objects.filter(job__company=company)
    views_qs = JobView.objects.filter(job__company=company)
    interviews_qs = Interview.objects.filter(application__job__company=company)

    active_jobs = jobs_qs.filter(status=Job.Status.PUBLISHED).count()
    previous_active_jobs = jobs_qs.filter(
        status=Job.Status.PUBLISHED,
        created_at__lt=current_start,
        created_at__gte=previous_start,
    ).count()

    new_applications = apps_qs.filter(applied_at__gte=current_start).count()
    previous_applications = apps_qs.filter(
        applied_at__lt=current_start,
        applied_at__gte=previous_start,
    ).count()

    job_views = views_qs.filter(viewed_at__gte=current_start).count()
    previous_views = views_qs.filter(
        viewed_at__lt=current_start,
        viewed_at__gte=previous_start,
    ).count()

    upcoming_interviews = interviews_qs.filter(
        status=Interview.Status.SCHEDULED,
        scheduled_at__gte=now,
    ).count()
    previous_upcoming_interviews = interviews_qs.filter(
        status=Interview.Status.SCHEDULED,
        scheduled_at__lt=now,
        scheduled_at__gte=previous_start,
    ).count()

    return Response(
        {
            "active_jobs": active_jobs,
            "active_jobs_delta": _percent_delta(active_jobs, previous_active_jobs),
            "new_applications": new_applications,
            "new_applications_delta": _percent_delta(
                new_applications, previous_applications
            ),
            "job_views": job_views,
            "job_views_delta": _percent_delta(job_views, previous_views),
            "upcoming_interviews": upcoming_interviews,
            "upcoming_interviews_delta": _percent_delta(
                upcoming_interviews, previous_upcoming_interviews
            ),
        }
    )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def company_dashboard_analytics(request):
    company = _get_company_for_user(request.user)
    if not company:
        return Response(
            {"detail": "You do not have a company profile."},
            status=404,
        )

    now = timezone.now()
    current_start = now - timedelta(days=30)
    previous_start = now - timedelta(days=60)
    series_start = now - timedelta(days=89)

    jobs_qs = Job.objects.filter(company=company)
    apps_qs = Application.objects.filter(job__company=company)
    views_qs = JobView.objects.filter(job__company=company)
    interviews_qs = Interview.objects.filter(application__job__company=company)

    total_jobs = jobs_qs.count()
    active_jobs = jobs_qs.filter(status=Job.Status.PUBLISHED).count()
    total_applications = apps_qs.count()
    new_applications_30d = apps_qs.filter(applied_at__gte=current_start).count()
    previous_applications_30d = apps_qs.filter(
        applied_at__lt=current_start,
        applied_at__gte=previous_start,
    ).count()
    total_views = views_qs.count()
    status_counts = {
        item["status"]: item["count"]
        for item in apps_qs.values("status").annotate(count=Count("id"))
    }

    def _status_count(status):
        return status_counts.get(_status_value(status), 0)

    hired_count = _status_count(Application.Status.ACCEPTED)
    interview_count = interviews_qs.filter(status=Interview.Status.SCHEDULED).count()

    hire_rate = (
        round((hired_count / total_applications) * 100) if total_applications else 0
    )

    applications_by_day = {
        item["day"]: item["count"]
        for item in apps_qs.filter(applied_at__date__gte=series_start.date())
        .annotate(day=TruncDate("applied_at"))
        .values("day")
        .annotate(count=Count("id"))
    }
    views_by_day = {
        item["day"]: item["count"]
        for item in views_qs.filter(viewed_at__date__gte=series_start.date())
        .annotate(day=TruncDate("viewed_at"))
        .values("day")
        .annotate(count=Count("id"))
    }

    time_series = []
    for offset in range(90):
        day = (series_start + timedelta(days=offset)).date()
        time_series.append(
            {
                "date": day.strftime("%d/%m"),
                "full_date": day.isoformat(),
                "applications": applications_by_day.get(day, 0),
                "views": views_by_day.get(day, 0),
            }
        )

    funnel = [
        {
            "stage": stage,
            "count": total_applications if status is None else _status_count(status),
            "color": color,
        }
        for stage, status, color in APPLICATION_FUNNEL_STAGES
    ]

    status_breakdown = [
        {
            "status": _status_value(status),
            "label": label,
            "count": _status_count(status),
            "color": color,
        }
        for status, label, color in APPLICATION_STATUS_BREAKDOWN
    ]

    top_jobs = []
    top_jobs_qs = jobs_qs.annotate(
        applications_count=Count("applications", distinct=True),
        interviews_count=Count("applications__interviews", distinct=True),
        hired_count=Count(
            "applications",
            filter=Q(applications__status=Application.Status.ACCEPTED),
            distinct=True,
        ),
        views_count=Count("views", distinct=True),
    ).order_by("-applications_count", "-views_count")[:10]
    for job in top_jobs_qs:
        conversion_rate = (
            round((job.hired_count / job.applications_count) * 100)
            if job.applications_count
            else 0
        )
        top_jobs.append(
            {
                "id": job.id,
                "title": job.title,
                "status": job.status,
                "applications": job.applications_count,
                "views": job.views_count,
                "interviews": job.interviews_count,
                "hired": job.hired_count,
                "conversion_rate": conversion_rate,
                "published_at": job.published_at,
            }
        )

    return Response(
        {
            "summary": {
                "total_jobs": total_jobs,
                "active_jobs": active_jobs,
                "total_applications": total_applications,
                "new_applications_30d": new_applications_30d,
                "applications_delta": _percent_delta(
                    new_applications_30d, previous_applications_30d
                ),
                "total_views": total_views,
                "hired_count": hired_count,
                "hire_rate": hire_rate,
                "interview_count": interview_count,
            },
            "time_series": time_series,
            "funnel": funnel,
            "status_breakdown": status_breakdown,
            "top_jobs": top_jobs,
        }
    )
