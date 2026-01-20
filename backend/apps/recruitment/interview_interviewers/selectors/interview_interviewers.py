from typing import Optional
from django.db.models import QuerySet
from apps.recruitment.interview_interviewers.models import InterviewInterviewer


def list_interviewers(interview_id: int) -> QuerySet[InterviewInterviewer]:
    """
    Lấy danh sách người phỏng vấn của một interview.
    """
    return InterviewInterviewer.objects.filter(
        interview_id=interview_id
    ).select_related('interviewer').order_by('created_at')


def get_interviewer(interview_id: int, user_id: int) -> Optional[InterviewInterviewer]:
    """
    Lấy một interviewer cụ thể theo interview và user.
    """
    try:
        return InterviewInterviewer.objects.select_related(
            'interviewer', 'interview'
        ).get(interview_id=interview_id, interviewer_id=user_id)
    except InterviewInterviewer.DoesNotExist:
        return None
