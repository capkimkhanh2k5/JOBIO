from django.apps import apps as django_apps
from django.utils.html import strip_tags
from rest_framework import serializers

from apps.system.report_types.models import ReportType

from .models import Report


REPORT_ENTITY_MODELS = {
    "user": ("core_users", "CustomUser"),
    "candidate": ("core_users", "CustomUser"),
    "recruiter": ("core_users", "CustomUser"),
    "company": ("company_companies", "Company"),
    "job": ("recruitment_jobs", "Job"),
}


class ReportCreateSerializer(serializers.ModelSerializer):
    """
    Serializer cho người dùng gửi báo cáo vi phạm.
    """

    report_type = serializers.PrimaryKeyRelatedField(
        queryset=ReportType.objects.filter(is_active=True)
    )
    entity_type = serializers.ChoiceField(choices=sorted(REPORT_ENTITY_MODELS))
    entity_id = serializers.IntegerField(min_value=1)
    description = serializers.CharField(
        min_length=10,
        max_length=2000,
        trim_whitespace=True,
    )
    report_type_name = serializers.CharField(
        source="report_type.type_name", read_only=True
    )

    class Meta:
        model = Report
        fields = [
            "id",
            "report_type",
            "report_type_name",
            "entity_type",
            "entity_id",
            "description",
            "status",
            "created_at",
        ]
        read_only_fields = ["id", "report_type_name", "status", "created_at"]

    def validate_description(self, value):
        clean_value = strip_tags(value).strip()
        if len(clean_value) < 10:
            raise serializers.ValidationError("Mô tả báo cáo cần ít nhất 10 ký tự.")
        return clean_value

    def validate(self, attrs):
        entity_type = attrs["entity_type"]
        app_label, model_name = REPORT_ENTITY_MODELS[entity_type]
        model = django_apps.get_model(app_label, model_name)
        if not model.objects.filter(id=attrs["entity_id"]).exists():
            raise serializers.ValidationError(
                {"entity_id": "Đối tượng bị báo cáo không tồn tại."}
            )
        return attrs


class AdminReportSerializer(serializers.ModelSerializer):
    """
    Serializer cho danh sách báo cáo vi phạm phía Admin
    """

    reporter_email = serializers.CharField(source="reporter.email", read_only=True)
    reporter_name = serializers.CharField(source="reporter.full_name", read_only=True)
    report_type_name = serializers.CharField(
        source="report_type.type_name", read_only=True
    )
    resolved_by_email = serializers.CharField(
        source="resolved_by.email", read_only=True, allow_null=True
    )

    class Meta:
        model = Report
        fields = [
            "id",
            "entity_type",
            "entity_id",
            "description",
            "status",
            "resolution_notes",
            "created_at",
            "resolved_at",
            "reporter_email",
            "reporter_name",
            "report_type_name",
            "resolved_by_email",
        ]


class AdminReportStatusUpdateSerializer(serializers.Serializer):
    """
    Serializer để cập nhật trạng thái báo cáo
    """

    status = serializers.ChoiceField(
        choices=[Report.Status.RESOLVED, Report.Status.REJECTED], required=True
    )
    resolution_notes = serializers.CharField(required=False, allow_blank=True)


class ReportResolutionSerializer(serializers.Serializer):
    """
    Serializer cho chức năng xử lý báo cáo vi phạm (Ban, Hide, Warn, Reject)
    """

    action = serializers.ChoiceField(
        choices=["ban", "hide_content", "warn", "reject"], required=True
    )
    reporter_note = serializers.CharField(required=False, allow_blank=True)
    violator_note = serializers.CharField(required=False, allow_blank=True)
