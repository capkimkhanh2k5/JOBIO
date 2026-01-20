from typing import Optional
from django.db.models import QuerySet

from collections import defaultdict

from apps.recruitment.interviews.models import Interview
from apps.recruitment.jobs.models import Job


def get_interview_by_id(interview_id: int) -> Optional[Interview]:
    """
        Lấy interview theo ID.
    """
    try:
        return Interview.objects.select_related(
            'application', 'application__recruiter', 'application__recruiter__user',
            'application__job', 'application__job__company',
            'interview_type', 'created_by'
        ).get(id=interview_id)
    except Interview.DoesNotExist:
        return None


def list_interviews_by_application(application_id: int) -> QuerySet[Interview]:
    """
        Lấy danh sách interviews theo application_id.
    """
    return Interview.objects.filter(
        application_id=application_id
    ).select_related(
        'interview_type', 'created_by'
    ).order_by('scheduled_at')


def get_calendar_interviews(user, start_date, end_date) -> dict:
    """
        Lấy interviews cho calendar view, grouped by date.
    """

    owned_jobs = Job.objects.filter(company__user=user)
    
    interviews = Interview.objects.filter(
        application__job__in=owned_jobs,
        scheduled_at__date__gte=start_date,
        scheduled_at__date__lte=end_date,
        status__in=['scheduled', 'rescheduled']
    ).select_related(
        'application__recruiter__user', 'application__job', 'interview_type'
    ).order_by('scheduled_at')
    
    # Group by date
    calendar = defaultdict(list)
    for interview in interviews:
        date_key = interview.scheduled_at.strftime('%Y-%m-%d')
        calendar[date_key].append({
            'id': interview.id,
            'time': interview.scheduled_at.strftime('%H:%M'),
            'applicant': interview.application.recruiter.user.full_name,
            'job_title': interview.application.job.title,
            'type': interview.interview_type.name,
            'duration': interview.duration_minutes,
            'status': interview.status
        })
    
    return dict(calendar)


def get_upcoming_interviews(user, days: int = 7) -> QuerySet[Interview]:
    """
        Lấy danh sách interviews sắp tới trong N ngày.
    """
    from datetime import timedelta
    from django.utils import timezone
    
    now = timezone.now()
    end_date = now + timedelta(days=days)
    
    # Lấy các job được user sở hữu
    owned_jobs = Job.objects.filter(company__user=user)
    
    return Interview.objects.filter(
        application__job__in=owned_jobs,
        scheduled_at__gte=now,
        scheduled_at__lte=end_date,
        status__in=['scheduled', 'rescheduled']
    ).select_related(
        'application__recruiter__user', 'application__job', 'interview_type'
    ).order_by('scheduled_at')
