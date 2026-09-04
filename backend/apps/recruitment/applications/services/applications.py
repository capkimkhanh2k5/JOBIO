from typing import Optional
from pydantic import BaseModel
from django.db import transaction
from django.db.models import Case, F, IntegerField, Value, When

from apps.candidate.recruiters.models import Recruiter
from apps.candidate.recruiter_cvs.models import RecruiterCV
from apps.company.companies.permissions import can_manage_company_jobs
from apps.recruitment.jobs.models import Job
from apps.recruitment.jobs.selectors.jobs import ensure_job_publicly_available
from apps.recruitment.applications.models import Application
from apps.recruitment.application_status_history.services.application_status_history import (
    log_status_history,
)
from apps.email.services import EmailService
from apps.recruitment.applications.state_machine import (
    ApplicationStateMachine,
    ApplicationStatus,
    InvalidTransitionError,
    validate_status_transition,
)


class ApplicationCreateInput(BaseModel):
    """
    Pydantic input model cho tạo application
    """

    job_id: int
    cv_id: Optional[int] = None
    cover_letter: Optional[str] = None


class ApplicationUpdateInput(BaseModel):
    """
    Pydantic input model cho cập nhật application
    """

    cv_id: Optional[int] = None
    cover_letter: Optional[str] = None


WITHDRAWABLE_STATUSES = {"pending", "reviewing"}


def _ensure_recruiter_owns_cv(recruiter: Recruiter, cv_id: int | None) -> None:
    if cv_id is None:
        return

    if not RecruiterCV.objects.filter(id=cv_id, recruiter=recruiter).exists():
        raise ValueError("CV not found!")


def _resolve_application_cv(recruiter: Recruiter, cv_id: int | None) -> RecruiterCV:
    if cv_id is not None:
        cv = RecruiterCV.objects.filter(id=cv_id, recruiter=recruiter).first()
        if not cv:
            raise ValueError("CV not found!")
        return cv

    cv = (
        RecruiterCV.objects.filter(recruiter=recruiter)
        .order_by("-is_default", "-updated_at")
        .first()
    )
    if not cv:
        raise ValueError("Bạn cần tạo hoặc tải lên ít nhất một CV trước khi ứng tuyển.")
    return cv


def _increment_job_application_count(job_id: int) -> None:
    Job.objects.filter(id=job_id).update(application_count=F("application_count") + 1)


def _decrement_job_application_count(job_id: int) -> None:
    Job.objects.filter(id=job_id).update(
        application_count=Case(
            When(application_count__gt=0, then=F("application_count") - 1),
            default=Value(0),
            output_field=IntegerField(),
        )
    )


def _cancel_open_interviews(application: Application) -> None:
    from apps.recruitment.interviews.models import Interview

    Interview.objects.filter(
        application=application,
        status__in=[
            Interview.Status.SCHEDULED,
            Interview.Status.CONFIRMED,
            Interview.Status.RESCHEDULED,
        ],
    ).update(status=Interview.Status.CANCELLED)


@transaction.atomic
def create_application(
    recruiter: Recruiter, data: ApplicationCreateInput
) -> Application:
    """
    Tạo đơn ứng tuyển mới.
    Raise ValueError nếu đã ứng tuyển rồi.
    """
    # Kiểm tra trùng lặp
    if Application.objects.filter(recruiter=recruiter, job_id=data.job_id).exists():
        raise ValueError("You have already applied for this job!")

    # Lấy job
    job = Job.objects.get(id=data.job_id)

    ensure_job_publicly_available(job)

    cv = _resolve_application_cv(recruiter, data.cv_id)

    match_score = None
    score_breakdown = {}
    try:
        from apps.recruitment.jobs.services.recommendations import score_candidate_job

        match_result = score_candidate_job(recruiter, job, cv)
        match_score = match_result.get("match_score")
        score_breakdown = match_result.get("score_breakdown", {})
    except Exception:
        pass

    application = Application.objects.create(
        recruiter=recruiter,
        job=job,
        cv=cv,
        cover_letter=data.cover_letter,
        status="pending",
        match_score=match_score,
        score_breakdown=score_breakdown,
    )

    log_status_history(
        application, None, "pending", recruiter.user, "Ứng viên đã gửi đơn ứng tuyển"
    )

    _increment_job_application_count(data.job_id)

    return application


@transaction.atomic
def update_application(
    application: Application, data: ApplicationUpdateInput
) -> Application:
    """
    Cập nhật đơn ứng tuyển (bởi ứng viên).
    Chỉ cho cập nhật khi status = pending
    """
    if application.status not in ["pending", "reviewing"]:
        raise ValueError("You cannot update this application!")

    cv_changed = False
    if data.cv_id is not None and data.cv_id != application.cv_id:
        _ensure_recruiter_owns_cv(application.recruiter, data.cv_id)
        application.cv_id = data.cv_id
        cv_changed = True

    if data.cover_letter is not None:
        application.cover_letter = data.cover_letter if data.cover_letter else None

    if cv_changed:
        try:
            from apps.recruitment.jobs.services.recommendations import (
                score_candidate_job,
            )

            match_result = score_candidate_job(
                application.recruiter, application.job, application.cv
            )
            application.match_score = match_result.get("match_score")
            application.score_breakdown = match_result.get("score_breakdown", {})
        except Exception:
            pass

    application.save()
    return application


@transaction.atomic
def withdraw_application(application: Application) -> None:
    """
    Rút đơn ứng tuyển (bởi ứng viên).
    """
    if application.status not in WITHDRAWABLE_STATUSES:
        raise ValueError("You cannot withdraw this application!")

    application.status = "withdrawn"
    application.save()
    _cancel_open_interviews(application)

    _decrement_job_application_count(application.job_id)


@transaction.atomic
def change_application_status(
    application: Application, status: str, reviewed_by, notes: str = None
) -> Application:
    """
    Đổi trạng thái đơn ứng tuyển (bởi job owner).
    Sử dụng State Machine để validate transition.
    """
    # Validate transition using state machine
    is_valid, error_msg = validate_status_transition(application.status, status)
    if not is_valid:
        raise ValueError(error_msg)

    # Use state machine for transition
    state_machine = ApplicationStateMachine(application)

    try:
        target_status = ApplicationStatus(status)
        result = state_machine.transition_to(
            target_status, performed_by=reviewed_by, notes=notes
        )
        application = result.application
    except InvalidTransitionError as e:
        raise ValueError(str(e))

    # Send Status Update Email
    status_display = status.capitalize()

    EmailService.send_email(
        recipient=application.recruiter_cv.email
        if hasattr(application, "recruiter_cv") and application.recruiter_cv
        else (
            application.recruiter.user.email
            if hasattr(application.recruiter, "user")
            else None
        ),
        subject=f"[JobPortal] Cập nhật trạng thái ứng tuyển: {application.job.title}",
        template_path="emails/recruitment/application_status.html",
        context={
            "candidate_name": application.recruiter.user.full_name,
            "job_title": application.job.title,
            "company_name": application.job.company.company_name,
            "status_class": status,
            "status_display": status_display,
            "notes": notes,
            "recruiter_name": application.job.company.user.full_name,
        },
    )

    return application


def get_available_status_transitions(application: Application) -> list:
    """
    Lấy danh sách các trạng thái có thể chuyển đến.
    Dùng cho frontend hiển thị các action buttons.
    """
    state_machine = ApplicationStateMachine(application)
    available = state_machine.get_available_transitions()
    return [s.value for s in available]


@transaction.atomic
def rate_application(
    application: Application, rating: int, notes: str = None
) -> Application:
    """
    Đánh giá ứng viên (bởi job owner).
    """
    if not 1 <= rating <= 5:
        raise ValueError("Rating must be between 1 and 5!")

    application.rating = rating

    if notes:
        application.notes = notes

    application.save()
    return application


@transaction.atomic
def send_offer(
    application: Application,
    offer_details: str,
    user,
    salary: str = None,
    start_date=None,
) -> Application:
    """
    Gửi offer cho ứng viên (bởi job owner).
    """
    # Build notes with offer details
    offer_notes = f"Offer: {offer_details}"
    if salary:
        offer_notes += f"\nSalary: {salary}"
    if start_date:
        offer_notes += f"\nStart date: {start_date}"

    application = change_application_status(
        application=application,
        status=ApplicationStatus.OFFERED.value,
        reviewed_by=user,
        notes=offer_notes,
    )

    # Send Offer Email
    EmailService.send_email(
        recipient=application.recruiter.user.email,
        subject=f"[JobPortal] Thư mời nhận việc: {application.job.title}",
        template_path="emails/recruitment/offer_letter.html",
        context={
            "candidate_name": application.recruiter.user.full_name,
            "job_title": application.job.title,
            "company_name": application.job.company.company_name,
            "header_image_url": application.job.company.banner_url or "",
            "salary": salary,
            "start_date": start_date,
            "offer_details": offer_details,
            "recruiter_name": user.full_name,
        },
    )

    return application


@transaction.atomic
def applicant_withdraw(application: Application, reason: str = None) -> Application:
    """
    Ứng viên rút đơn ứng tuyển.
    """

    if application.status not in WITHDRAWABLE_STATUSES:
        raise ValueError("You cannot withdraw this application!")

    old_status = application.status
    application.status = "withdrawn"

    if reason:
        application.notes = f"Reason: {reason}"

    application.save()
    _cancel_open_interviews(application)

    # Log history
    log_status_history(
        application,
        old_status,
        "withdrawn",
        application.recruiter.user,
        reason or "Applicant withdrew the application",
    )

    _decrement_job_application_count(application.job_id)

    return application


@transaction.atomic
def bulk_action(application_ids: list, action: str, user, notes: str = None) -> dict:
    """
    Thực hiện thao tác hàng loạt trên nhiều applications.
    """

    # Get applications và validate ownership at object level.
    applications = Application.objects.filter(id__in=application_ids).select_related(
        "job__company"
    )

    if applications.count() != len(application_ids):
        raise ValueError(
            "Some applications do not exist or you do not have permission!"
        )

    for application in applications:
        if not can_manage_company_jobs(application.job.company, user):
            raise ValueError(
                "Some applications do not exist or you do not have permission!"
            )
        if application.job.company.verification_status != "verified":
            raise ValueError("Company must be verified before processing applications.")

    processed = 0
    errors = []

    for app in applications:
        try:
            if action == "reject":
                change_application_status(app, "rejected", user, notes or "Bulk reject")

            elif action == "shortlist":
                change_application_status(
                    app, "shortlisted", user, notes or "Bulk shortlist"
                )

            elif action == "delete":
                job_id = app.job_id
                app.delete()
                _decrement_job_application_count(job_id)

            processed += 1

        except Exception as e:
            errors.append({"id": app.id, "error": str(e)})

    return {"processed": processed, "errors": errors}
