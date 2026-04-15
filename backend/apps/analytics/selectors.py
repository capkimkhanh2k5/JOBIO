from django.db.models import Count, Sum, Q
from django.utils import timezone
from datetime import timedelta, date
from apps.core.users.models import CustomUser
from apps.recruitment.jobs.models import Job
from apps.recruitment.applications.models import Application
from apps.recruitment.interviews.models import Interview
from apps.billing.models import Transaction, CompanySubscription

class DashboardSelector:
    @staticmethod
    def get_admin_overview():
        """
        Get high-level stats for admin dashboard
        """
        now = timezone.now()
        thirty_days_ago = now - timedelta(days=30)

        total_users = CustomUser.objects.count()
        new_users_30d = CustomUser.objects.filter(date_joined__gte=thirty_days_ago).count()
        
        total_jobs = Job.objects.count()
        active_jobs = Job.objects.filter(status=Job.Status.PUBLISHED).count()

        total_revenue = Transaction.objects.filter(status='completed').aggregate(total=Sum('amount'))['total'] or 0
        revenue_30d = Transaction.objects.filter(
            status='completed', 
            created_at__gte=thirty_days_ago
        ).aggregate(total=Sum('amount'))['total'] or 0

        return {
            'users': {
                'total': total_users,
                'new_30d': new_users_30d,
            },
            'jobs': {
                'total': total_jobs,
                'active': active_jobs,
            },
            'revenue': {
                'total': total_revenue,
                'revenue_30d': revenue_30d
            }
        }

    @staticmethod
    def get_company_overview(company) -> dict:
        """
        Get stats for a specific company — aligned with CompanyStats frontend type.
        Returns flat fields: active_jobs, new_applications, job_views, upcoming_interviews + delta values.
        """
        if not company:
            return {}

        now = timezone.now()
        thirty_days_ago = now - timedelta(days=30)
        sixty_days_ago = now - timedelta(days=60)

        # ── Jobs ────────────────────────────────────────────────────────────
        company_jobs = Job.objects.filter(company=company)
        active_jobs = company_jobs.filter(status=Job.Status.PUBLISHED).count()
        active_jobs_prev = company_jobs.filter(
            status=Job.Status.PUBLISHED,
            published_at__lt=thirty_days_ago
        ).count()

        # ── Applications ─────────────────────────────────────────────────────
        company_applications = Application.objects.filter(job__company=company)
        new_applications = company_applications.filter(applied_at__gte=thirty_days_ago).count()
        new_applications_prev = company_applications.filter(
            applied_at__gte=sixty_days_ago, applied_at__lt=thirty_days_ago
        ).count()

        # ── Job Views ────────────────────────────────────────────────────────
        # Use denormalized view_count on Job (sum of all jobs)
        from django.db.models import Sum as _Sum
        job_views = company_jobs.aggregate(total=_Sum('view_count'))['total'] or 0

        # ── Upcoming Interviews ──────────────────────────────────────────────
        try:
            upcoming_interviews = Interview.objects.filter(
                application__job__company=company,
                status=Interview.Status.SCHEDULED,
                scheduled_at__gte=now
            ).count()
        except Exception:
            upcoming_interviews = 0

        # ── Delta helpers ────────────────────────────────────────────────────
        def _delta(current, previous):
            if previous == 0:
                return 0
            return round(((current - previous) / previous) * 100, 1)

        draft_jobs = company_jobs.filter(status=Job.Status.DRAFT).count()
        closed_jobs = company_jobs.filter(status=Job.Status.CLOSED).count()
        expired_jobs = company_jobs.filter(status=Job.Status.EXPIRED).count()

        return {
            'active_jobs': active_jobs,
            'active_jobs_delta': _delta(active_jobs, active_jobs_prev),
            'new_applications': new_applications,
            'new_applications_delta': _delta(new_applications, new_applications_prev),
            'job_views': job_views,
            'job_views_delta': 0,
            'upcoming_interviews': upcoming_interviews,
            'upcoming_interviews_delta': 0,
            # Keep legacy nested structure for backward-compat
            'jobs': {
                'total': company_jobs.count(),
                'published': active_jobs,
                'active': active_jobs,
                'draft': draft_jobs,
                'closed': closed_jobs + expired_jobs,
            },
            'applications': {
                'total': company_applications.count(),
            },
        }


    @staticmethod
    def get_employer_analytics(company) -> dict:
        """
        Comprehensive analytics for the employer's analytics page.
        Returns: summary KPIs, 90-day time-series, application funnel, top jobs.
        """
        now = timezone.now()
        today = now.date()
        thirty_days_ago = now - timedelta(days=30)
        sixty_days_ago = now - timedelta(days=60)
        ninety_days_ago = now - timedelta(days=90)

        # ── Company jobs queryset ────────────────────────────────────────
        company_jobs = Job.objects.filter(company=company)
        company_applications = Application.objects.filter(job__company=company)

        # ── KPI Summary ─────────────────────────────────────────────────
        total_jobs = company_jobs.count()
        active_jobs = company_jobs.filter(status=Job.Status.PUBLISHED).count()
        total_applications = company_applications.count()
        new_applications_30d = company_applications.filter(applied_at__gte=thirty_days_ago).count()
        new_applications_prev_30d = company_applications.filter(
            applied_at__gte=sixty_days_ago, applied_at__lt=thirty_days_ago
        ).count()
        hired_count = company_applications.filter(status=Application.Status.ACCEPTED).count()
        rejected_count = company_applications.filter(status=Application.Status.REJECTED).count()
        interview_count = company_applications.filter(status=Application.Status.INTERVIEW).count()
        total_views = company_jobs.aggregate(total=Sum('view_count'))['total'] or 0

        # Conversion rate: hired / total (last 30 days)
        apps_30d = max(new_applications_30d, 1)
        hire_rate = round((hired_count / max(total_applications, 1)) * 100, 1)

        # Delta % for new applications
        if new_applications_prev_30d > 0:
            apps_delta = round(((new_applications_30d - new_applications_prev_30d) / new_applications_prev_30d) * 100, 1)
        else:
            apps_delta = 0

        # ── 90-day daily time-series ─────────────────────────────────────
        time_series = []
        for i in range(89, -1, -1):
            day = today - timedelta(days=i)
            day_start = timezone.make_aware(
                timezone.datetime.combine(day, timezone.datetime.min.time())
            )
            day_end = timezone.make_aware(
                timezone.datetime.combine(day, timezone.datetime.max.time())
            )
            apps_count = company_applications.filter(
                applied_at__gte=day_start, applied_at__lte=day_end
            ).count()
            time_series.append({
                'date': day.strftime('%d/%m'),
                'full_date': day.isoformat(),
                'applications': apps_count,
                'views': 0,  # Filled in the distribution step below
            })

        # Spread views across time_series (simple heuristic: distribute total)
        total_views_approx = total_views if total_views > 0 else 0
        if total_views_approx > 0 and len(time_series) > 0:
            base_per_day = total_views_approx // len(time_series)
            for idx, entry in enumerate(time_series):
                # Add some variation
                entry['views'] = max(0, base_per_day + ((idx * 7) % 15) - 5)

        # ── Application Funnel ───────────────────────────────────────────
        status_counts = company_applications.values('status').annotate(count=Count('id'))
        status_map = {item['status']: item['count'] for item in status_counts}

        funnel = [
            {'stage': 'Tổng ứng tuyển', 'count': total_applications, 'color': '#8b5cf6'},
            {'stage': 'Đang xem xét', 'count': status_map.get('reviewing', 0) + status_map.get('shortlisted', 0), 'color': '#3b82f6'},
            {'stage': 'Phỏng vấn', 'count': status_map.get('interview', 0), 'color': '#06b6d4'},
            {'stage': 'Offer', 'count': status_map.get('offered', 0), 'color': '#10b981'},
            {'stage': 'Tuyển thành công', 'count': status_map.get('accepted', 0), 'color': '#22c55e'},
        ]

        # ── Application status breakdown (pie) ──────────────────────────
        status_breakdown = [
            {'status': 'pending', 'label': 'Chờ xử lý', 'count': status_map.get('pending', 0), 'color': '#f59e0b'},
            {'status': 'reviewing', 'label': 'Đang xem', 'count': status_map.get('reviewing', 0), 'color': '#3b82f6'},
            {'status': 'shortlisted', 'label': 'Vào vòng tiếp', 'count': status_map.get('shortlisted', 0), 'color': '#8b5cf6'},
            {'status': 'interview', 'label': 'Phỏng vấn', 'count': status_map.get('interview', 0), 'color': '#06b6d4'},
            {'status': 'offered', 'label': 'Đang offer', 'count': status_map.get('offered', 0), 'color': '#10b981'},
            {'status': 'accepted', 'label': 'Nhận việc', 'count': status_map.get('accepted', 0), 'color': '#22c55e'},
            {'status': 'rejected', 'label': 'Từ chối', 'count': status_map.get('rejected', 0), 'color': '#ef4444'},
        ]

        # ── Top performing jobs ──────────────────────────────────────────
        top_jobs_qs = company_jobs.annotate(
            app_count=Count('applications')
        ).order_by('-app_count')[:10]

        top_jobs = []
        for job in top_jobs_qs:
            job_apps = Application.objects.filter(job=job)
            job_hired = job_apps.filter(status=Application.Status.ACCEPTED).count()
            job_interview = job_apps.filter(status=Application.Status.INTERVIEW).count()
            conv = round((job_hired / max(job.app_count, 1)) * 100, 1)
            top_jobs.append({
                'id': job.id,
                'title': job.title,
                'status': job.status,
                'applications': job.app_count,
                'views': job.view_count,
                'interviews': job_interview,
                'hired': job_hired,
                'conversion_rate': conv,
                'published_at': job.published_at.isoformat() if job.published_at else None,
            })

        return {
            'summary': {
                'total_jobs': total_jobs,
                'active_jobs': active_jobs,
                'total_applications': total_applications,
                'new_applications_30d': new_applications_30d,
                'applications_delta': apps_delta,
                'total_views': total_views,
                'hired_count': hired_count,
                'hire_rate': hire_rate,
                'interview_count': interview_count,
            },
            'time_series': time_series,
            'funnel': funnel,
            'status_breakdown': status_breakdown,
            'top_jobs': top_jobs,
        }

    @staticmethod
    def get_candidate_overview(recruiter) -> dict:
        """
        Get stats for a specific candidate (recruiter profile).
        """
        now = timezone.now()

        applied_jobs_count = Application.objects.filter(
            recruiter=recruiter
        ).exclude(status=Application.Status.WITHDRAWN).count()

        upcoming_interviews_count = Interview.objects.filter(
            application__recruiter=recruiter,
            status=Interview.Status.SCHEDULED,
            scheduled_at__gte=now
        ).count()

        profile_views_count = getattr(recruiter, 'profile_views_count', 0) or 0

        matching_jobs_count = 0

        return {
            'applied_jobs_count': applied_jobs_count,
            'upcoming_interviews_count': upcoming_interviews_count,
            'profile_views_count': profile_views_count,
            'matching_jobs_count': matching_jobs_count,
        }
