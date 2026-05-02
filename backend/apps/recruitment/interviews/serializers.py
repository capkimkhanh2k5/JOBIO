from rest_framework import serializers
from .models import Interview

from apps.recruitment.interview_types.models import InterviewType
from apps.recruitment.applications.models import Application
from apps.geography.addresses.serializers import AddressDetailSerializer


def _format_address(address):
    if not address:
        return None

    parts = [
        getattr(address, 'address_line', None),
        getattr(getattr(address, 'commune', None), 'commune_name', None),
        getattr(getattr(address, 'province', None), 'province_name', None),
    ]
    return ', '.join(part for part in parts if part)


def _extract_location_from_notes(notes):
    marker = 'Địa điểm phỏng vấn:'
    if not notes or marker not in notes:
        return None

    location = notes.split(marker, 1)[1].strip().splitlines()[0].strip()
    return location or None


def _infer_interview_mode(interview):
    type_name = (getattr(interview.interview_type, 'name', '') or '').lower()
    meeting_link = (interview.meeting_link or '').strip().lower()

    if any(keyword in type_name for keyword in ['phone', 'điện thoại', 'gọi']):
        return 'phone'
    if any(keyword in type_name for keyword in ['onsite', 'offline', 'trực tiếp', 'tại công ty']):
        return 'onsite'
    if any(keyword in type_name for keyword in ['video', 'online', 'zoom', 'meet']):
        return 'video'

    if meeting_link:
        return 'video' if meeting_link.startswith(('http://', 'https://')) else 'phone'
    if interview.address_id:
        return 'onsite'

    return 'video'


class InterviewDisplayMixin(serializers.ModelSerializer):
    job_id = serializers.IntegerField(source='application.job.id', read_only=True)
    job_title = serializers.CharField(source='application.job.title', read_only=True)
    company_id = serializers.IntegerField(source='application.job.company.id', read_only=True)
    company_name = serializers.CharField(source='application.job.company.company_name', read_only=True)
    company_slug = serializers.CharField(source='application.job.company.slug', read_only=True, allow_null=True)
    company_logo = serializers.CharField(source='application.job.company.logo_url', read_only=True, allow_null=True)
    interview_type_name = serializers.CharField(source='interview_type.name', read_only=True)
    interview_type = serializers.SerializerMethodField()
    type = serializers.SerializerMethodField()
    address = AddressDetailSerializer(read_only=True)
    location = serializers.SerializerMethodField()
    interviewer_name = serializers.CharField(source='interviewer.full_name', read_only=True, allow_null=True)
    interviewer_avatar = serializers.CharField(source='interviewer.avatar_url', read_only=True, allow_null=True)
    interviewers = serializers.SerializerMethodField()

    def get_interview_type(self, obj):
        if not obj.interview_type_id:
            return None

        return {
            'id': obj.interview_type_id,
            'name': obj.interview_type.name,
            'description': obj.interview_type.description,
            'icon_url': obj.interview_type.icon_url,
        }

    def get_type(self, obj):
        return _infer_interview_mode(obj)

    def get_location(self, obj):
        return (
            _format_address(obj.address)
            or _extract_location_from_notes(obj.notes)
            or _format_address(getattr(obj.application.job, 'address', None))
            or getattr(obj.application.job.company, 'headquarters', None)
            or _format_address(getattr(obj.application.job.company, 'address', None))
        )

    def get_interviewers(self, obj):
        if not obj.interviewer_id:
            return []

        return [{
            'id': obj.interviewer_id,
            'name': obj.interviewer.full_name,
            'avatar': obj.interviewer.avatar_url,
        }]


class InterviewListSerializer(InterviewDisplayMixin):
    """
        Serializer compact cho danh sách interviews
    """
    
    applicant_name = serializers.CharField(source='application.recruiter.user.full_name', read_only=True)
    applicant_avatar = serializers.URLField(source='application.recruiter.user.avatar_url', read_only=True)

    class Meta:
        model = Interview
        fields = [
            'id', 'application_id', 'job_id', 'job_title',
            'company_id', 'company_name', 'company_slug', 'company_logo',
            'applicant_name', 'applicant_avatar',
            'interview_type_id', 'interview_type_name', 'interview_type', 'type',
            'round_number', 'scheduled_at', 'duration_minutes',
            'address_id', 'address', 'location', 'meeting_link',
            'status', 'notes', 'result', 'rating',
            'interviewer', 'interviewer_name', 'interviewer_avatar', 'interviewers'
        ]


class InterviewDetailSerializer(InterviewDisplayMixin):
    """
        Serializer chi tiết cho interview
    """
    
    applicant_name = serializers.CharField(source='application.recruiter.user.full_name', read_only=True)
    applicant_email = serializers.CharField(source='application.recruiter.user.email', read_only=True)
    created_by_name = serializers.CharField(source='created_by.full_name', read_only=True)
    
    class Meta:
        model = Interview
        fields = [
            'id', 'application_id', 'job_id', 'job_title',
            'company_id', 'company_name', 'company_slug', 'company_logo',
            'applicant_name', 'applicant_email',
            'interview_type_id', 'interview_type_name', 'interview_type', 'type',
            'round_number', 'scheduled_at', 'duration_minutes',
            'address_id', 'address', 'location', 'meeting_link',
            'status', 'notes', 'feedback', 'result', 'rating',
            'interviewer', 'interviewer_name', 'interviewer_avatar', 'interviewers',
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
    meeting_link = serializers.CharField(required=False, allow_null=True, allow_blank=True)
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
    meeting_link = serializers.CharField(required=False, allow_null=True, allow_blank=True)
    notes = serializers.CharField(required=False, allow_null=True, allow_blank=True)
    feedback = serializers.CharField(required=False, allow_null=True, allow_blank=True)
    status = serializers.ChoiceField(
        choices=['scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'rescheduled', 'no_show'],
        required=False
    )
    result = serializers.ChoiceField(
        choices=['pass', 'fail', 'pending'],
        required=False
    )
    interviewer_id = serializers.IntegerField(required=False, allow_null=True)
    rating = serializers.IntegerField(required=False, allow_null=True, min_value=1, max_value=5)


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
    rating = serializers.IntegerField(required=False, allow_null=True, min_value=1, max_value=5)


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
