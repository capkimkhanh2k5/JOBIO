from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from datetime import datetime

from .models import Interview
from apps.recruitment.applications.models import Application

from .serializers import (
    InterviewListSerializer, InterviewDetailSerializer,
    InterviewCreateSerializer, InterviewUpdateSerializer,
    InterviewRescheduleSerializer, InterviewCancelSerializer
)


from .services.interviews import (
    send_reminder,
    add_feedback,
    complete_interview,
    cancel_interview,
    reschedule_interview,
    delete_interview,
    update_interview,
    create_interview,
    InterviewUpdateInput,
    InterviewCreateInput,
)

from .selectors.interviews import (
    get_upcoming_interviews,
    get_calendar_interviews,
)
from .serializers import (
    InterviewReminderSerializer,
    InterviewFeedbackSerializer,
    InterviewCompleteSerializer,
)


class InterviewViewSet(viewsets.GenericViewSet):
    """
        ViewSet cho quản lý interviews.
        URL: /api/interviews/
    """
    permission_classes = [IsAuthenticated]

    def _ensure_verified_company(self, request, company):
        if getattr(request.user, 'role', None) != 'company':
            return None

        if company.verification_status != 'verified':
            return Response(
                {"detail": "Công ty chưa được xác thực. Bạn chưa thể đăng hoặc quản lý nội dung tuyển dụng."},
                status=status.HTTP_403_FORBIDDEN
            )

        return None
    
    def list(self, request):
        """
            GET /api/interviews/
            Danh sách lịch phỏng vấn
        """
        user = request.user
        
        # Nếu là ứng viên: Lấy lịch phỏng vấn của chính họ
        if hasattr(user, 'role') and user.role == 'candidate':
            queryset = Interview.objects.filter(application__recruiter__user=user)
        # Nếu là nhà tuyển dụng: Lấy lịch phỏng vấn của các job họ quản lý
        elif hasattr(user, 'role') and user.role == 'company':
            queryset = Interview.objects.filter(application__job__company__user=user)
        else:
            queryset = Interview.objects.none()

        queryset = queryset.select_related(
            'application__recruiter__user',
            'application__job__company__address__province',
            'application__job__company__address__commune',
            'application__job__address__province',
            'application__job__address__commune',
            'interview_type',
            'address__province',
            'address__commune',
            'interviewer',
            'created_by',
        )

        # Filters
        status_filter = request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)
            
        queryset = queryset.order_by('scheduled_at')
        
        # Pagination
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = InterviewListSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = InterviewListSerializer(queryset, many=True)
        return Response(serializer.data)
    
    def _is_job_owner(self, request, interview):
        """
            Kiểm tra nếu user sở hữu job
        """
        return interview.application.job.company.user == request.user
    
    def _is_applicant(self, request, interview):
        """
            Kiểm tra nếu user là người ứng tuyển
        """
        return interview.application.recruiter.user == request.user
    
    def _get_interview_or_404(self, pk):
        """
            Lấy interview hoặc trả về 404
        """
        from .selectors.interviews import get_interview_by_id
        interview = get_interview_by_id(pk)
        if not interview:
            return None, Response(
                {"detail": "Interview not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        return interview, None
    
    def create(self, request):
        """
            POST /api/interviews/
            Tạo lịch phỏng vấn
        """
        serializer = InterviewCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        try:
            application = Application.objects.select_related(
                'job__company'
            ).get(id=serializer.validated_data['application_id'])
        except Application.DoesNotExist:
            return Response(
                {"detail": "Application not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        
        if application.job.company.user != request.user:
            return Response(
                {"detail": "Permission denied"},
                status=status.HTTP_403_FORBIDDEN
            )

        permission_error = self._ensure_verified_company(request, application.job.company)
        if permission_error:
            return permission_error
        
        try:
            input_data = InterviewCreateInput(**serializer.validated_data)
            interview = create_interview(input_data, request.user)
            return Response(
                InterviewDetailSerializer(interview).data,
                status=status.HTTP_201_CREATED
            )
        except ValueError as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)
    
    def retrieve(self, request, pk=None):
        """
            GET /api/interviews/:id/
            Chi tiết lịch phỏng vấn
        """
        interview, error = self._get_interview_or_404(pk)
        if error:
            return error
        
        # Cả owner và applicant có quyền xem
        if not self._is_job_owner(request, interview) and not self._is_applicant(request, interview):
            return Response(
                {"detail": "Permission denied"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        return Response(InterviewDetailSerializer(interview).data)
    
    def update(self, request, pk=None):
        """
            PUT /api/interviews/:id/
            Cập nhật lịch phỏng vấn
        """
        
        interview, error = self._get_interview_or_404(pk)
        if error:
            return error
        
        if not self._is_job_owner(request, interview):
            return Response(
                {"detail": "Permission denied"},
                status=status.HTTP_403_FORBIDDEN
            )

        permission_error = self._ensure_verified_company(request, interview.application.job.company)
        if permission_error:
            return permission_error
        
        serializer = InterviewUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        try:
            input_data = InterviewUpdateInput(**serializer.validated_data)
            updated = update_interview(interview, input_data)
            return Response(InterviewDetailSerializer(updated).data)
        except ValueError as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)
            
    def partial_update(self, request, pk=None):
        """
            PATCH /api/interviews/:id/
            Cập nhật một phần lịch phỏng vấn
        """
        return self.update(request, pk)
    
    def destroy(self, request, pk=None):
        """
            DELETE /api/interviews/:id/
            Xóa lịch phỏng vấn
        """
        
        interview, error = self._get_interview_or_404(pk)
        if error:
            return error
        
        if not self._is_job_owner(request, interview):
            return Response(
                {"detail": "Permission denied"},
                status=status.HTTP_403_FORBIDDEN
            )

        permission_error = self._ensure_verified_company(request, interview.application.job.company)
        if permission_error:
            return permission_error
        
        try:
            delete_interview(interview)
            return Response(status=status.HTTP_204_NO_CONTENT)
        except ValueError as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)
    
    def reschedule(self, request, pk=None):
        """
            PATCH /api/interviews/:id/reschedule/
            Đổi lịch phỏng vấn
        """
        
        interview, error = self._get_interview_or_404(pk)
        if error:
            return error
        
        if not self._is_job_owner(request, interview):
            return Response(
                {"detail": "Permission denied"},
                status=status.HTTP_403_FORBIDDEN
            )

        permission_error = self._ensure_verified_company(request, interview.application.job.company)
        if permission_error:
            return permission_error
        
        serializer = InterviewRescheduleSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        try:
            updated = reschedule_interview(
                interview,
                serializer.validated_data['scheduled_at'],
                serializer.validated_data.get('reason')
            )
            return Response(InterviewDetailSerializer(updated).data)
        except ValueError as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)
    
    def cancel(self, request, pk=None):
        """
            PATCH /api/interviews/:id/cancel/
            Hủy lịch phỏng vấn
        """
        
        interview, error = self._get_interview_or_404(pk)
        if error:
            return error
        
        # Cả owner và applicant có quyền hủy
        if not self._is_job_owner(request, interview) and not self._is_applicant(request, interview):
            return Response(
                {"detail": "Permission denied"},
                status=status.HTTP_403_FORBIDDEN
            )

        permission_error = self._ensure_verified_company(request, interview.application.job.company)
        if permission_error:
            return permission_error
        
        serializer = InterviewCancelSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        try:
            updated = cancel_interview(
                interview,
                serializer.validated_data.get('reason')
            )
            return Response(InterviewDetailSerializer(updated).data)
        except ValueError as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)
    
    def complete(self, request, pk=None):
        """
            PATCH /api/interviews/:id/complete/
            Hoàn thành phỏng vấn
        """
        
        interview, error = self._get_interview_or_404(pk)
        if error:
            return error
        
        if not self._is_job_owner(request, interview):
            return Response(
                {"detail": "Permission denied"},
                status=status.HTTP_403_FORBIDDEN
            )

        permission_error = self._ensure_verified_company(request, interview.application.job.company)
        if permission_error:
            return permission_error
        
        serializer = InterviewCompleteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        try:
            updated = complete_interview(
                interview,
                serializer.validated_data['result'],
                serializer.validated_data.get('feedback'),
                serializer.validated_data.get('rating')
            )
            return Response(InterviewDetailSerializer(updated).data)
        except ValueError as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)
    
    def add_feedback(self, request, pk=None):
        """
            POST /api/interviews/:id/feedback/
            Thêm feedback
        """
        
        interview, error = self._get_interview_or_404(pk)
        if error:
            return error
        
        if not self._is_job_owner(request, interview):
            return Response(
                {"detail": "Permission denied"},
                status=status.HTTP_403_FORBIDDEN
            )

        permission_error = self._ensure_verified_company(request, interview.application.job.company)
        if permission_error:
            return permission_error
        
        serializer = InterviewFeedbackSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        updated = add_feedback(interview, serializer.validated_data['feedback'])
        return Response(InterviewDetailSerializer(updated).data)
    
    def send_reminder_action(self, request, pk=None):
        """
            POST /api/interviews/:id/send-reminder/
            Gửi nhắc nhở
        """
        
        interview, error = self._get_interview_or_404(pk)
        if error:
            return error
        
        if not self._is_job_owner(request, interview):
            return Response(
                {"detail": "Permission denied"},
                status=status.HTTP_403_FORBIDDEN
            )

        permission_error = self._ensure_verified_company(request, interview.application.job.company)
        if permission_error:
            return permission_error
        
        serializer = InterviewReminderSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        try:
            result = send_reminder(interview, serializer.validated_data.get('message'))
            return Response(result)
        except ValueError as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)
    
    def calendar(self, request):
        """
            GET /api/interviews/calendar/
            Calendar view
        """
        
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        
        if not start_date or not end_date:
            return Response(
                {"detail": "start_date & end_date is required!"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            start = datetime.strptime(start_date, '%Y-%m-%d').date()
            end = datetime.strptime(end_date, '%Y-%m-%d').date()
        except ValueError:
            return Response(
                {"detail": "Format date must be YYYY-MM-DD"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        calendar_data = get_calendar_interviews(request.user, start, end)
        return Response(calendar_data)
    
    def upcoming(self, request):
        """
            GET /api/interviews/upcoming/
            Danh sách phỏng vấn sắp tới
        """
        
        days = request.query_params.get('days', 7)
        try:
            days = int(days)
        except ValueError:
            days = 7
        
        interviews = get_upcoming_interviews(request.user, days)
        return Response(InterviewListSerializer(interviews, many=True).data)
