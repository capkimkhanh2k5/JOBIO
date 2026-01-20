from django.db import transaction
from apps.recruitment.interview_interviewers.models import InterviewInterviewer
from apps.recruitment.interviews.models import Interview


@transaction.atomic
def add_interviewer(interview: Interview, user_id: int, role: str = None) -> InterviewInterviewer:
    """
        Thêm người phỏng vấn vào interview.
    """
    # Check if already exists
    if InterviewInterviewer.objects.filter(
        interview=interview, 
        interviewer_id=user_id
    ).exists():
        raise ValueError("Interviewer already exists!")
    
    return InterviewInterviewer.objects.create(
        interview=interview,
        interviewer_id=user_id,
        role=role if role else None
    )


@transaction.atomic
def remove_interviewer(interview: Interview, user_id: int) -> None:
    """
        Xóa người phỏng vấn khỏi interview.
    """
    try:
        interviewer = InterviewInterviewer.objects.get(
            interview=interview,
            interviewer_id=user_id
        )
        interviewer.delete()
    except InterviewInterviewer.DoesNotExist:
        raise ValueError("Interviewer not found!")


@transaction.atomic
def save_interviewer_feedback(
    interview: Interview, 
    user_id: int, 
    feedback: str = None, 
    rating: int = None
) -> InterviewInterviewer:
    """
        Lưu feedback của interviewer.
    """
    try:
        interviewer = InterviewInterviewer.objects.get(
            interview=interview,
            interviewer_id=user_id
        )
    except InterviewInterviewer.DoesNotExist:
        raise ValueError("Interviewer not found!")
    
    if feedback is not None:
        interviewer.feedback = feedback if feedback else None
    
    if rating is not None:
        interviewer.rating = rating
    
    interviewer.save()
    return interviewer
