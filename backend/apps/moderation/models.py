from django.conf import settings
from django.db import models


class ModerationAudit(models.Model):
    class Decision(models.TextChoices):
        APPROVED = "approved", "Approved"
        REJECTED = "rejected", "Rejected"
        NEEDS_REVIEW = "needs_review", "Needs review"
        ERROR = "error", "Error"
        SKIPPED = "skipped", "Skipped"

    class Severity(models.TextChoices):
        NONE = "none", "None"
        LOW = "low", "Low"
        MEDIUM = "medium", "Medium"
        HIGH = "high", "High"
        CRITICAL = "critical", "Critical"

    entity_type = models.CharField(max_length=80, db_index=True)
    entity_id = models.PositiveIntegerField(null=True, blank=True, db_index=True)
    purpose = models.CharField(max_length=80, db_index=True)
    decision = models.CharField(
        max_length=30, choices=Decision.choices, default=Decision.NEEDS_REVIEW
    )
    severity = models.CharField(
        max_length=20, choices=Severity.choices, default=Severity.NONE
    )
    reasons = models.JSONField(default=list, blank=True)
    blocked_fields = models.JSONField(default=list, blank=True)
    provider = models.CharField(max_length=80, default="rule")
    confidence = models.FloatField(default=0.0)
    content_hash = models.CharField(
        max_length=64, blank=True, default="", db_index=True
    )
    metadata = models.JSONField(default=dict, blank=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="moderation_audits",
    )
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        db_table = "moderation_audits"
        verbose_name = "Moderation audit"
        verbose_name_plural = "Moderation audits"
        indexes = [
            models.Index(
                fields=["entity_type", "entity_id", "-created_at"],
                name="idx_mod_entity_created",
            ),
            models.Index(fields=["decision", "-created_at"], name="idx_mod_decision"),
        ]

    def __str__(self):
        return f"{self.entity_type}:{self.entity_id or '-'}:{self.decision}"
