"""
State Machine cho Application workflow.

Sử dụng django-fsm pattern để quản lý trạng thái Application một cách an toàn.
Đảm bảo state transitions hợp lệ và tracking history.
"""
from typing import List, Optional, Tuple
from dataclasses import dataclass
from enum import Enum
from django.db import transaction
from django.utils import timezone
import logging

from apps.system.activity_logs.models import ActivityLog
from apps.recruitment.applications.models import Application
from apps.recruitment.application_status_history.models import ApplicationStatusHistory

logger = logging.getLogger(__name__)


class ApplicationStatus(str, Enum):
    """Enum cho các trạng thái của Application."""
    PENDING = 'pending'
    REVIEWING = 'reviewing'
    SHORTLISTED = 'shortlisted'
    INTERVIEW = 'interview'
    OFFERED = 'offered'
    REJECTED = 'rejected'
    WITHDRAWN = 'withdrawn'
    ACCEPTED = 'accepted'


# Định nghĩa các transitions hợp lệ: (from_state, to_state)
VALID_TRANSITIONS = {
    # From PENDING
    (ApplicationStatus.PENDING, ApplicationStatus.REVIEWING),
    (ApplicationStatus.PENDING, ApplicationStatus.REJECTED),
    (ApplicationStatus.PENDING, ApplicationStatus.WITHDRAWN),
    
    # From REVIEWING
    (ApplicationStatus.REVIEWING, ApplicationStatus.SHORTLISTED),
    (ApplicationStatus.REVIEWING, ApplicationStatus.REJECTED),
    (ApplicationStatus.REVIEWING, ApplicationStatus.WITHDRAWN),
    
    # From SHORTLISTED
    (ApplicationStatus.SHORTLISTED, ApplicationStatus.INTERVIEW),
    (ApplicationStatus.SHORTLISTED, ApplicationStatus.REJECTED),
    (ApplicationStatus.SHORTLISTED, ApplicationStatus.WITHDRAWN),
    
    # From INTERVIEW
    (ApplicationStatus.INTERVIEW, ApplicationStatus.OFFERED),
    (ApplicationStatus.INTERVIEW, ApplicationStatus.REJECTED),
    (ApplicationStatus.INTERVIEW, ApplicationStatus.WITHDRAWN),
    
    # From OFFERED
    (ApplicationStatus.OFFERED, ApplicationStatus.ACCEPTED),
    (ApplicationStatus.OFFERED, ApplicationStatus.REJECTED),
    (ApplicationStatus.OFFERED, ApplicationStatus.WITHDRAWN),
}


class InvalidTransitionError(Exception):
    """Raised when an invalid state transition is attempted."""
    
    def __init__(self, from_state: str, to_state: str, message: str = None):
        self.from_state = from_state
        self.to_state = to_state
        self.message = message or f"Không thể chuyển trạng thái từ '{from_state}' sang '{to_state}'"
        super().__init__(self.message)


@dataclass
class TransitionResult:
    """Kết quả của một transition."""
    success: bool
    from_state: str
    to_state: str
    message: str
    application: 'Application' = None
    

class ApplicationStateMachine:
    """
    State Machine cho Application workflow.
    
    Quản lý các transitions và đảm bảo tính toàn vẹn dữ liệu.
    """
    
    def __init__(self, application):
        """
        Initialize với Application instance.
        
        Args:
            application: Application model instance
        """
        self.application = application
    
    @property
    def current_state(self) -> ApplicationStatus:
        """Trả về trạng thái hiện tại."""
        return ApplicationStatus(self.application.status)
    
    def can_transition_to(self, target_state: ApplicationStatus) -> bool:
        """
        Kiểm tra xem có thể chuyển sang trạng thái mới không.
        
        Args:
            target_state: Trạng thái đích
            
        Returns:
            bool: True nếu transition hợp lệ
        """
        return (self.current_state, target_state) in VALID_TRANSITIONS
    
    def get_available_transitions(self) -> List[ApplicationStatus]:
        """
        Lấy danh sách các trạng thái có thể chuyển đến.
        
        Returns:
            List[ApplicationStatus]: Danh sách trạng thái khả dụng
        """
        available = []
        for from_state, to_state in VALID_TRANSITIONS:
            if from_state == self.current_state:
                available.append(to_state)
        return available
    
    @transaction.atomic
    def transition_to(
        self, 
        target_state: ApplicationStatus,
        performed_by = None,
        notes: str = None,
        force: bool = False
    ) -> TransitionResult:
        """
        Thực hiện chuyển trạng thái.
        
        Args:
            target_state: Trạng thái đích
            performed_by: User thực hiện action
            notes: Ghi chú cho transition
            force: Bỏ qua validation (chỉ dùng cho admin)
            
        Returns:
            TransitionResult
            
        Raises:
            InvalidTransitionError: Nếu transition không hợp lệ
        """
        from_state = self.current_state
        
        # Validate transition
        if not force and not self.can_transition_to(target_state):
            logger.warning(
                f"Invalid transition attempt: {from_state} -> {target_state} "
                f"for Application {self.application.id}"
            )
            raise InvalidTransitionError(from_state.value, target_state.value)
        
        # Lock application for update
        application = type(self.application).objects.select_for_update().get(
            id=self.application.id
        )
        
        # Update status
        old_status = application.status
        application.status = target_state.value
        
        # Update reviewer info if applicable
        if performed_by and target_state in [
            ApplicationStatus.REVIEWING, 
            ApplicationStatus.SHORTLISTED,
            ApplicationStatus.REJECTED
        ]:
            application.reviewed_by = performed_by
            application.reviewed_at = timezone.now()
        
        # Add notes if provided
        if notes:
            existing_notes = application.notes or ''
            timestamp = timezone.now().strftime('%Y-%m-%d %H:%M')
            new_note = f"[{timestamp}] {target_state.value}: {notes}"
            application.notes = f"{existing_notes}\n{new_note}".strip()
        
        application.save()
        
        # Log transition
        self._log_transition(from_state, target_state, performed_by)
        
        # Create status history record
        self._create_status_history(from_state, target_state, performed_by, notes)
        
        logger.info(
            f"Application {application.id} transitioned: "
            f"{from_state.value} -> {target_state.value}"
        )
        
        # Update instance reference
        self.application = application
        
        return TransitionResult(
            success=True,
            from_state=from_state.value,
            to_state=target_state.value,
            message=f"Đã chuyển trạng thái thành công",
            application=application
        )
    
    def _log_transition(
        self, 
        from_state: ApplicationStatus, 
        to_state: ApplicationStatus,
        performed_by = None
    ):
        """Log transition to activity logs."""
        try:
            ActivityLog.objects.create(
                user=performed_by,
                action='application_status_change',
                description=f"Application {self.application.id}: {from_state.value} -> {to_state.value}",
                metadata={
                    'application_id': str(self.application.id),
                    'from_status': from_state.value,
                    'to_status': to_state.value,
                    'job_id': str(self.application.job_id),
                    'recruiter_id': str(self.application.recruiter_id)
                }
            )
        except Exception as e:
            logger.error(f"Failed to log transition: {e}")
    
    def _create_status_history(
        self,
        from_state: ApplicationStatus,
        to_state: ApplicationStatus,
        performed_by = None,
        notes: str = None
    ):
        """Create status history record."""
        try:
            
            ApplicationStatusHistory.objects.create(
                application=self.application,
                from_status=from_state.value,
                to_status=to_state.value,
                changed_by=performed_by,
                notes=notes
            )
        except Exception as e:
            logger.error(f"Failed to create status history: {e}")
    
    # Convenience methods for common transitions
    def start_review(self, reviewer, notes: str = None) -> TransitionResult:
        """Bắt đầu review application."""
        return self.transition_to(ApplicationStatus.REVIEWING, reviewer, notes)
    
    def shortlist(self, reviewer, notes: str = None) -> TransitionResult:
        """Đưa vào shortlist."""
        return self.transition_to(ApplicationStatus.SHORTLISTED, reviewer, notes)
    
    def schedule_interview(self, reviewer, notes: str = None) -> TransitionResult:
        """Lên lịch phỏng vấn."""
        return self.transition_to(ApplicationStatus.INTERVIEW, reviewer, notes)
    
    def send_offer(self, reviewer, notes: str = None) -> TransitionResult:
        """Gửi offer."""
        return self.transition_to(ApplicationStatus.OFFERED, reviewer, notes)
    
    def accept_offer(self, notes: str = None) -> TransitionResult:
        """Chấp nhận offer."""
        return self.transition_to(ApplicationStatus.ACCEPTED, notes=notes)
    
    def reject(self, reviewer, notes: str = None) -> TransitionResult:
        """Từ chối application."""
        return self.transition_to(ApplicationStatus.REJECTED, reviewer, notes)
    
    def withdraw(self, notes: str = None) -> TransitionResult:
        """Ứng viên rút đơn."""
        return self.transition_to(ApplicationStatus.WITHDRAWN, notes=notes)


# Helper functions for use in views/services
def get_application_state_machine(application_id):
    """
    Factory function để tạo state machine từ application ID.
    
    Args:
        application_id: UUID của application
        
    Returns:
        ApplicationStateMachine instance
    """
    
    application = Application.objects.get(id=application_id)
    return ApplicationStateMachine(application)


def validate_status_transition(
    current_status: str, 
    target_status: str
) -> Tuple[bool, str]:
    """
    Validate một status transition.
    
    Args:
        current_status: Trạng thái hiện tại
        target_status: Trạng thái đích
        
    Returns:
        Tuple[bool, str]: (is_valid, error_message)
    """
    try:
        from_state = ApplicationStatus(current_status)
        to_state = ApplicationStatus(target_status)
    except ValueError as e:
        return False, f"Trạng thái không hợp lệ: {e}"
    
    if (from_state, to_state) in VALID_TRANSITIONS:
        return True, ""
    
    # Get available transitions for helpful error message
    available = []
    for f, t in VALID_TRANSITIONS:
        if f == from_state:
            available.append(t.value)
    
    if available:
        return False, f"Từ trạng thái '{current_status}' chỉ có thể chuyển sang: {', '.join(available)}"
    
    return False, f"Trạng thái '{current_status}' không thể chuyển đổi"
