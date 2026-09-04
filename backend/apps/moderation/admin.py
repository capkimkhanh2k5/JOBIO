from django.contrib import admin

from .models import ModerationAudit


@admin.register(ModerationAudit)
class ModerationAuditAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "entity_type",
        "entity_id",
        "purpose",
        "decision",
        "severity",
        "provider",
        "confidence",
        "created_at",
    )
    list_filter = ("decision", "severity", "provider", "entity_type", "purpose")
    search_fields = ("entity_type", "entity_id", "purpose", "content_hash")
    readonly_fields = (
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
        "created_at",
    )
