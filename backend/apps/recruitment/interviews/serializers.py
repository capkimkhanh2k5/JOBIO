from rest_framework import serializers
from .models import Interview

from apps.recruitment.interview_types.models import InterviewType
from apps.recruitment.applications.models import Application

class InterviewListSerializer(serializers.ModelSerializer):
    """
        Serializer compact cho danh sách interviews
    """
    
    applicant_name = serializers.CharField(source='application.recruiter.user.full_name', read_only=True)
    job_title = serializers.CharField(source='application.job.title', read_only=True)
    interview_type_name = serializers.CharField(source='interview_type.name', read_only=True)
    
    class Meta:
        model = Interview
        fields = [
            'id', 'application_id', 'job_title', 'applicant_name',
            'interview_type_name', 'round_number',
            'scheduled_at', 'duration_minutes',
            'status', 'result'
        ]


class InterviewDetailSerializer(serializers.ModelSerializer):
    """
        Serializer chi tiết cho interview
    """
    
    applicant_name = serializers.CharField(source='application.recruiter.user.full_name', read_only=True)
    applicant_email = serializers.CharField(source='application.recruiter.user.email', read_only=True)
    job_id = serializers.IntegerField(source='application.job.id', read_only=True)
    job_title = serializers.CharField(source='application.job.title', read_only=True)
    interview_type_name = serializers.CharField(source='interview_type.name', read_only=True)
    created_by_name = serializers.CharField(source='created_by.full_name', read_only=True)
    
    class Meta:
        model = Interview
        fields = [
            'id', 'application_id', 'job_id', 'job_title',
            'applicant_name', 'applicant_email',
            'interview_type_id', 'interview_type_name',
            'round_number', 'scheduled_at', 'duration_minutes',
            'address_id', 'meeting_link',
            'status', 'notes', 'feedback', 'result',
            'created_by_name', 'created_at', 'updated_at'
        ]


class InterviewCreateSerializer(serializers.Serializer):
    """
        Serializer cho tạo interview
    """
    
    application_id = serializers.IntegerField(required=True)
    interview_type_id = serializers.IntegerField(required=True)
    scheduled_at = serializers.DateTimeField(required=True)
    duration_minutes = serializers.IntegerField(required=False, default=60)
    address_id = serializers.IntegerField(required=False, allow_null=True)
    meeting_link = serializers.URLField(required=False, allow_null=True, allow_blank=True)
    notes = serializers.CharField(required=False, allow_null=True, allow_blank=True)
    
    def validate_application_id(self, value):
        if not Application.objects.filter(id=value).exists():
            raise serializers.ValidationError("Application not found!")
        return value
    
    def validate_interview_type_id(self, value):
        if not InterviewType.objects.filter(id=value).exists():
            raise serializers.ValidationError("Interview type not found!")
        return value


class InterviewUpdateSerializer(serializers.Serializer):
    """
        Serializer cho cập nhật interview
    """
    
    interview_type_id = serializers.IntegerField(required=False)
    scheduled_at = serializers.DateTimeField(required=False)
    duration_minutes = serializers.IntegerField(required=False)
    address_id = serializers.IntegerField(required=False, allow_null=True)
    meeting_link = serializers.URLField(required=False, allow_null=True, allow_blank=True)
    notes = serializers.CharField(required=False, allow_null=True, allow_blank=True)
    feedback = serializers.CharField(required=False, allow_null=True, allow_blank=True)
    result = serializers.ChoiceField(
        choices=['pass', 'fail', 'pending'],
        required=False
    )


class InterviewRescheduleSerializer(serializers.Serializer):
    """
        Serializer cho đổi lịch phỏng vấn
    """
    
    scheduled_at = serializers.DateTimeField(required=True)
    reason = serializers.CharField(required=False, allow_null=True, allow_blank=True)


class InterviewCancelSerializer(serializers.Serializer):
    """
        Serializer cho hủy lịch phỏng vấn
    """
    
    reason = serializers.CharField(required=False, allow_null=True, allow_blank=True)


class InterviewCompleteSerializer(serializers.Serializer):
    """
        Serializer cho hoàn thành phỏng vấn
    """
    
    result = serializers.ChoiceField(
        choices=['pass', 'fail'],
        required=True
    )
    feedback = serializers.CharField(required=False, allow_null=True, allow_blank=True)


class InterviewFeedbackSerializer(serializers.Serializer):
    """
        Serializer cho thêm feedback
    """
    
    feedback = serializers.CharField(required=True)


class InterviewReminderSerializer(serializers.Serializer):
    """
        Serializer cho gửi nhắc nhở
    """
    
    message = serializers.CharField(required=False, allow_null=True, allow_blank=True)
