from rest_framework import serializers
from .models import Report

class AdminReportSerializer(serializers.ModelSerializer):
    """
    Serializer cho danh sách báo cáo vi phạm phía Admin
    """
    reporter_email = serializers.CharField(source='reporter.email', read_only=True)
    reporter_name = serializers.CharField(source='reporter.full_name', read_only=True)
    report_type_name = serializers.CharField(source='report_type.type_name', read_only=True)
    resolved_by_email = serializers.CharField(source='resolved_by.email', read_only=True, allow_null=True)

    class Meta:
        model = Report
        fields = [
            'id', 'entity_type', 'entity_id', 'description',
            'status', 'resolution_notes', 'created_at', 'resolved_at',
            'reporter_email', 'reporter_name', 'report_type_name', 'resolved_by_email'
        ]

class AdminReportStatusUpdateSerializer(serializers.Serializer):
    """
    Serializer để cập nhật trạng thái báo cáo
    """
    status = serializers.ChoiceField(choices=[Report.Status.RESOLVED, Report.Status.REJECTED], required=True)
    resolution_notes = serializers.CharField(required=False, allow_blank=True)

class ReportResolutionSerializer(serializers.Serializer):
    """
    Serializer cho chức năng xử lý báo cáo vi phạm (Ban, Hide, Warn, Reject)
    """
    action = serializers.ChoiceField(choices=['ban', 'hide_content', 'warn', 'reject'], required=True)
    reporter_note = serializers.CharField(required=False, allow_blank=True)
    violator_note = serializers.CharField(required=False, allow_blank=True)
