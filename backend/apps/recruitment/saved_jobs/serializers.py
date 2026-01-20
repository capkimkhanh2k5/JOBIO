from rest_framework import serializers
from .models import SavedJob


class SavedJobSerializer(serializers.ModelSerializer):
    """
        Serializer cho đọc danh sách saved jobs
    """
    
    job_id = serializers.SerializerMethodField()
    job_title = serializers.SerializerMethodField()
    job_slug = serializers.SerializerMethodField()
    company_name = serializers.SerializerMethodField()
    job_type = serializers.SerializerMethodField()
    level = serializers.SerializerMethodField()
    
    class Meta:
        model = SavedJob
        fields = [
            'id', 'job_id', 'job_title', 'job_slug',
            'company_name', 'job_type', 'level',
            'folder_name', 'notes', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']
    
    def get_job_id(self, obj):
        return obj.job.id if obj.job else None
    
    def get_job_title(self, obj):
        return obj.job.title if obj.job else None
    
    def get_job_slug(self, obj):
        return obj.job.slug if obj.job else None
    
    def get_company_name(self, obj):
        return obj.job.company.company_name if obj.job and obj.job.company else None
    
    def get_job_type(self, obj):
        return obj.job.job_type if obj.job else None
    
    def get_level(self, obj):
        return obj.job.level if obj.job else None


class SavedJobUpdateSerializer(serializers.Serializer):
    """
        Serializer cho cập nhật saved job (folder/notes)
    """
    
    folder_name = serializers.CharField(max_length=100, required=False, allow_null=True, allow_blank=True)
    notes = serializers.CharField(required=False, allow_null=True, allow_blank=True)
