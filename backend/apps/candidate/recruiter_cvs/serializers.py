from rest_framework import serializers
from django.utils import timezone

from .models import RecruiterCV
from apps.candidate.cv_templates.serializers import CVTemplateListSerializer


class RecruiterCVListSerializer(serializers.ModelSerializer):
    """
    Serializer cho danh sách CV
    """

    cv_url = serializers.SerializerMethodField()
    cv_file_url = serializers.SerializerMethodField()
    template_name = serializers.CharField(
        source="template.name", read_only=True, allow_null=True
    )
    thumbnail_url = serializers.URLField(
        source="template.thumbnail_url", read_only=True, allow_null=True
    )

    class Meta:
        model = RecruiterCV
        fields = [
            "id",
            "cv_name",
            "template_id",
            "template_name",
            "thumbnail_url",
            "cv_url",
            "cv_file_url",
            "is_default",
            "is_public",
            "view_count",
            "download_count",
            "pdf_generated_at",
            "parsed_at",
            "parse_status",
            "parse_error_code",
            "parse_error_message",
            "created_at",
            "updated_at",
        ]

    def get_cv_file_url(self, obj) -> str | None:
        if not obj.cv_url:
            return None
        path = f"/api/candidates/{obj.recruiter_id}/cvs/{obj.id}/file/"
        request = self.context.get("request")
        return request.build_absolute_uri(path) if request else path

    def get_cv_url(self, obj) -> str | None:
        return self.get_cv_file_url(obj)


class RecruiterCVDetailSerializer(serializers.ModelSerializer):
    """
    Serializer chi tiết CV
    """

    cv_url = serializers.SerializerMethodField()
    cv_file_url = serializers.SerializerMethodField()
    template = CVTemplateListSerializer(read_only=True)

    class Meta:
        model = RecruiterCV
        fields = [
            "id",
            "cv_name",
            "template",
            "cv_data",
            "cv_url",
            "cv_file_url",
            "is_default",
            "is_public",
            "view_count",
            "download_count",
            "pdf_generated_at",
            "parsed_at",
            "parse_status",
            "parse_error_code",
            "parse_error_message",
            "created_at",
            "updated_at",
        ]

    def get_cv_file_url(self, obj) -> str | None:
        if not obj.cv_url:
            return None
        path = f"/api/candidates/{obj.recruiter_id}/cvs/{obj.id}/file/"
        request = self.context.get("request")
        return request.build_absolute_uri(path) if request else path

    def get_cv_url(self, obj) -> str | None:
        return self.get_cv_file_url(obj)


class RecruiterCVCreateSerializer(serializers.ModelSerializer):
    """
    Serializer cho tạo/cập nhật CV
    """

    template_id = serializers.IntegerField(required=False, allow_null=True)
    cv_data = serializers.JSONField(required=False, default=dict)

    class Meta:
        model = RecruiterCV
        fields = ["id", "cv_name", "template_id", "cv_data", "is_default", "is_public"]
        read_only_fields = ["id"]

    def validate_template_id(self, value):
        if value:
            from apps.candidate.cv_templates.models import CVTemplate

            if not CVTemplate.objects.filter(id=value, is_active=True).exists():
                raise serializers.ValidationError("Template không tồn tại!")
        return value

    def create(self, validated_data):
        template_id = validated_data.pop("template_id", None)
        # Ensure cv_data has a default value
        if "cv_data" not in validated_data or validated_data["cv_data"] is None:
            validated_data["cv_data"] = {}
        if validated_data["cv_data"]:
            validated_data.setdefault("parse_status", RecruiterCV.ParseStatus.PARSED)
            validated_data.setdefault("parsed_at", timezone.now())
            validated_data.setdefault("parse_error_code", None)
            validated_data.setdefault("parse_error_message", None)
        if template_id:
            validated_data["template_id"] = template_id
        return super().create(validated_data)

    def update(self, instance, validated_data):
        template_id = validated_data.pop("template_id", None)
        if template_id is not None:
            instance.template_id = template_id
        if validated_data.get("cv_data"):
            instance.parse_status = RecruiterCV.ParseStatus.PARSED
            instance.parsed_at = timezone.now()
            instance.parse_error_code = None
            instance.parse_error_message = None
        return super().update(instance, validated_data)
