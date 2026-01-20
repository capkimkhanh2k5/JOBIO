from rest_framework import serializers
from .models import Application

from apps.recruitment.jobs.models import Job
from apps.candidate.recruiter_cvs.models import RecruiterCV

class ApplicationListSerializer(serializers.ModelSerializer):
    """
        Serializer compact cho danh sách applications
    """
    
    recruiter_id = serializers.IntegerField(source='recruiter.id', read_only=True)
    recruiter_name = serializers.CharField(source='recruiter.user.full_name', read_only=True)
    recruiter_email = serializers.CharField(source='recruiter.user.email', read_only=True)
    job_title = serializers.CharField(source='job.title', read_only=True)
    
    class Meta:
        model = Application
        fields = [
            'id', 'job_id', 'job_title',
            'recruiter_id', 'recruiter_name', 'recruiter_email',
            'status', 'rating', 'applied_at', 'updated_at'
        ]
        read_only_fields = ['id', 'applied_at', 'updated_at']


class ApplicationDetailSerializer(serializers.ModelSerializer):
    """
        Serializer chi tiết cho application
    """
    
    recruiter_id = serializers.IntegerField(source='recruiter.id', read_only=True)
    recruiter_name = serializers.CharField(source='recruiter.user.full_name', read_only=True)
    recruiter_email = serializers.CharField(source='recruiter.user.email', read_only=True)
    job_id = serializers.IntegerField(source='job.id', read_only=True)
    job_title = serializers.CharField(source='job.title', read_only=True)
    cv_url = serializers.CharField(source='cv.file_url', read_only=True, allow_null=True)
    reviewed_by_name = serializers.CharField(source='reviewed_by.full_name', read_only=True, allow_null=True)
    
    class Meta:
        model = Application
        fields = [
            'id', 'job_id', 'job_title',
            'recruiter_id', 'recruiter_name', 'recruiter_email',
            'cv_url', 'cover_letter',
            'status', 'rating', 'notes',
            'applied_at', 'updated_at',
            'reviewed_by_name', 'reviewed_at'
        ]
        read_only_fields = ['id', 'applied_at', 'updated_at']


class ApplicationCreateSerializer(serializers.Serializer):
    """
        Serializer cho tạo application (nộp đơn ứng tuyển)
    """
    
    job_id = serializers.IntegerField(required=True)
    cv_id = serializers.IntegerField(required=False, allow_null=True)
    cover_letter = serializers.CharField(required=False, allow_null=True, allow_blank=True)
    
    def validate_job_id(self, value):
        try:
            job = Job.objects.get(id=value)
            if job.status != 'published':
                raise serializers.ValidationError("This job is not available!")
            return value
        except Job.DoesNotExist:
            raise serializers.ValidationError("Job not found!")
    
    def validate_cv_id(self, value):
        if value is None:
            return value
    
        if not RecruiterCV.objects.filter(id=value).exists():
            raise serializers.ValidationError("CV not found!")
        return value


class ApplicationUpdateSerializer(serializers.Serializer):
    """
        Serializer cho cập nhật application (bởi ứng viên)
    """
    
    cv_id = serializers.IntegerField(required=False, allow_null=True)
    cover_letter = serializers.CharField(required=False, allow_null=True, allow_blank=True)
    
    def validate_cv_id(self, value):
        if value is None:
            return value
        
        if not RecruiterCV.objects.filter(id=value).exists():
            raise serializers.ValidationError("CV not found!")
        return value


class ApplicationStatusSerializer(serializers.Serializer):
    """
        Serializer cho thay đổi status (bởi job owner)
    """
    
    status = serializers.ChoiceField(
        choices=[
            ('reviewing', 'Đang xem xét'),
            ('shortlisted', 'Vào vòng tiếp'),
            ('interview', 'Phỏng vấn'),
            ('offered', 'Đề xuất offer'),
            ('rejected', 'Từ chối'),
            ('accepted', 'Đã nhận việc')
        ],
        required=True
    )
    notes = serializers.CharField(required=False, allow_null=True, allow_blank=True)


class ApplicationRatingSerializer(serializers.Serializer):
    """
        Serializer cho đánh giá ứng viên (bởi job owner)
    """
    
    rating = serializers.IntegerField(
        min_value=1,
        max_value=5,
        required=True
    )
    notes = serializers.CharField(required=False, allow_null=True, allow_blank=True)


class ApplicationNotesSerializer(serializers.Serializer):
    """
        Serializer cho thêm ghi chú vào application
    """
    
    notes = serializers.CharField(required=True, allow_blank=False)


class ApplicationRejectSerializer(serializers.Serializer):
    """
        Serializer cho từ chối ứng viên
    """
    
    reason = serializers.CharField(required=False, allow_null=True, allow_blank=True)


class ApplicationOfferSerializer(serializers.Serializer):
    """
        Serializer cho gửi offer
    """
    
    offer_details = serializers.CharField(required=True)
    salary = serializers.CharField(required=False, allow_null=True, allow_blank=True)
    start_date = serializers.DateField(required=False, allow_null=True)


class ApplicationWithdrawSerializer(serializers.Serializer):
    """
        Serializer cho ứng viên rút đơn
    """
    
    reason = serializers.CharField(required=False, allow_null=True, allow_blank=True)


class ApplicationBulkActionSerializer(serializers.Serializer):
    """
        Serializer cho thao tác hàng loạt
    """
    
    application_ids = serializers.ListField(
        child=serializers.IntegerField(),
        required=True,
        min_length=1
    )
    action = serializers.ChoiceField(
        choices=['reject', 'shortlist', 'delete'],
        required=True
    )
    notes = serializers.CharField(required=False, allow_null=True, allow_blank=True)
