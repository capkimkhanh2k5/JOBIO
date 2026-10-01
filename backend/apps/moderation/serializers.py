from rest_framework import serializers

from .models import ModerationAudit


class ModerationAuditSerializer(serializers.ModelSerializer):
    created_by_email = serializers.CharField(source="created_by.email", read_only=True)

    class Meta:
        model = ModerationAudit
        fields = [
            "id",
            "entity_type",
            "entity_id",
            "purpose",
            "decision",
            "severity",
            "reasons",
            "blocked_fields",
            "provider",
            "confidence",
            "content_hash",
            "metadata",
            "created_by",
            "created_by_email",
            "created_at",
        ]
        read_only_fields = fields
