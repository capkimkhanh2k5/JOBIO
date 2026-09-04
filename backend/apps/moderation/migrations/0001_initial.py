# Generated manually for JOBIO moderation policy.

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):
    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="ModerationAudit",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("entity_type", models.CharField(db_index=True, max_length=80)),
                (
                    "entity_id",
                    models.PositiveIntegerField(blank=True, db_index=True, null=True),
                ),
                ("purpose", models.CharField(db_index=True, max_length=80)),
                (
                    "decision",
                    models.CharField(
                        choices=[
                            ("approved", "Approved"),
                            ("rejected", "Rejected"),
                            ("needs_review", "Needs review"),
                            ("error", "Error"),
                            ("skipped", "Skipped"),
                        ],
                        default="needs_review",
                        max_length=30,
                    ),
                ),
                (
                    "severity",
                    models.CharField(
                        choices=[
                            ("none", "None"),
                            ("low", "Low"),
                            ("medium", "Medium"),
                            ("high", "High"),
                            ("critical", "Critical"),
                        ],
                        default="none",
                        max_length=20,
                    ),
                ),
                ("reasons", models.JSONField(blank=True, default=list)),
                ("blocked_fields", models.JSONField(blank=True, default=list)),
                ("provider", models.CharField(default="rule", max_length=80)),
                ("confidence", models.FloatField(default=0.0)),
                (
                    "content_hash",
                    models.CharField(blank=True, db_index=True, default="", max_length=64),
                ),
                ("metadata", models.JSONField(blank=True, default=dict)),
                ("created_at", models.DateTimeField(auto_now_add=True, db_index=True)),
                (
                    "created_by",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="moderation_audits",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                "verbose_name": "Moderation audit",
                "verbose_name_plural": "Moderation audits",
                "db_table": "moderation_audits",
                "indexes": [
                    models.Index(
                        fields=["entity_type", "entity_id", "-created_at"],
                        name="idx_mod_entity_created",
                    ),
                    models.Index(
                        fields=["decision", "-created_at"],
                        name="idx_mod_decision",
                    ),
                ],
            },
        ),
    ]
