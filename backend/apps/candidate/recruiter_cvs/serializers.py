from rest_framework import serializers
from .models import RecruiterCV
from apps.candidate.cv_templates.serializers import CVTemplateListSerializer


class RecruiterCVListSerializer(serializers.ModelSerializer):
    """
    Serializer cho danh sách CV
    """

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
            "is_default",
            "is_public",
            "view_count",
            "download_count",
            "pdf_generated_at",
            "parsed_at",
            "created_at",
            "updated_at",
        ]


class RecruiterCVDetailSerializer(serializers.ModelSerializer):
    """
    Serializer chi tiết CV
    """

    template = CVTemplateListSerializer(read_only=True)

    class Meta:
        model = RecruiterCV
        fields = [
            "id",
            "cv_name",
            "template",
            "cv_data",
            "cv_url",
            "is_default",
            "is_public",
            "view_count",
            "download_count",
            "pdf_generated_at",
            "parsed_at",
            "created_at",
            "updated_at",
        ]


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
        if template_id:
            validated_data["template_id"] = template_id
        return super().create(validated_data)

    def update(self, instance, validated_data):
        template_id = validated_data.pop("template_id", None)
        if template_id is not None:
            instance.template_id = template_id
        return super().update(instance, validated_data)
