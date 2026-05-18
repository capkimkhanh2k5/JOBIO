from rest_framework import serializers
from .models import SavedJob


class SavedJobSerializer(serializers.ModelSerializer):
    """
    Serializer cho đọc danh sách saved jobs
    """

    job_id = serializers.SerializerMethodField()
    job_title = serializers.SerializerMethodField()
    job_slug = serializers.SerializerMethodField()
    company_id = serializers.SerializerMethodField()
    company_name = serializers.SerializerMethodField()
    company_slug = serializers.SerializerMethodField()
    logo_url = serializers.SerializerMethodField()
    job_type = serializers.SerializerMethodField()
    level = serializers.SerializerMethodField()
    status = serializers.SerializerMethodField()
    locations = serializers.SerializerMethodField()
    salary_min = serializers.SerializerMethodField()
    salary_max = serializers.SerializerMethodField()
    salary_currency = serializers.SerializerMethodField()
    salary_negotiable = serializers.SerializerMethodField()
    is_salary_visible = serializers.SerializerMethodField()
    deadline = serializers.SerializerMethodField()
    saved_at = serializers.DateTimeField(source="created_at", read_only=True)

    class Meta:
        model = SavedJob
        fields = [
            "id",
            "job_id",
            "job_title",
            "job_slug",
            "company_id",
            "company_name",
            "company_slug",
            "logo_url",
            "job_type",
            "level",
            "status",
            "locations",
            "salary_min",
            "salary_max",
            "salary_currency",
            "salary_negotiable",
            "is_salary_visible",
            "deadline",
            "folder_name",
            "notes",
            "created_at",
            "saved_at",
        ]
        read_only_fields = ["id", "created_at"]

    def get_job_id(self, obj):
        return obj.job.id if obj.job else None

    def get_job_title(self, obj):
        return obj.job.title if obj.job else None

    def get_job_slug(self, obj):
        return obj.job.slug if obj.job else None

    def get_company_id(self, obj):
        return obj.job.company.id if obj.job and obj.job.company else None

    def get_company_name(self, obj):
        return obj.job.company.company_name if obj.job and obj.job.company else None

    def get_company_slug(self, obj):
        return obj.job.company.slug if obj.job and obj.job.company else None

    def get_logo_url(self, obj):
        return obj.job.company.logo_url if obj.job and obj.job.company else None

    def get_job_type(self, obj):
        return obj.job.job_type if obj.job else None

    def get_level(self, obj):
        return obj.job.level if obj.job else None

    def get_status(self, obj):
        return obj.job.status if obj.job else None

    def get_locations(self, obj):
        if obj.job and obj.job.address and getattr(obj.job.address, "province", None):
            return obj.job.address.province.province_name
        return "Toan quoc"

    def get_salary_min(self, obj):
        return obj.job.salary_min if obj.job else None

    def get_salary_max(self, obj):
        return obj.job.salary_max if obj.job else None

    def get_salary_currency(self, obj):
        return obj.job.salary_currency if obj.job else None

    def get_salary_negotiable(self, obj):
        return obj.job.is_salary_negotiable if obj.job else True

    def get_is_salary_visible(self, obj):
        if not obj.job:
            return False
        return not obj.job.is_salary_negotiable and (
            obj.job.salary_min is not None or obj.job.salary_max is not None
        )

    def get_deadline(self, obj):
        return obj.job.application_deadline if obj.job else None


class SavedJobUpdateSerializer(serializers.Serializer):
    """
    Serializer cho cập nhật saved job (folder/notes)
    """

    folder_name = serializers.CharField(
        max_length=100, required=False, allow_null=True, allow_blank=True
    )
    notes = serializers.CharField(required=False, allow_null=True, allow_blank=True)


class SavedJobCreateSerializer(serializers.Serializer):
    """
    Serializer cho tạo saved job mới
    """

    job_id = serializers.IntegerField()
    folder_name = serializers.CharField(
        max_length=100, required=False, allow_null=True, allow_blank=True
    )
    notes = serializers.CharField(required=False, allow_null=True, allow_blank=True)
