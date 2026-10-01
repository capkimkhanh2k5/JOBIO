# Generated manually for JOBIO IT-only moderation policy.

from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("recruitment_jobs", "0005_recommendation_embeddings"),
    ]

    operations = [
        migrations.AddField(
            model_name="job",
            name="domain_status",
            field=models.CharField(
                choices=[
                    ("it_approved", "IT approved"),
                    ("needs_review", "Needs review"),
                    ("non_it", "Non IT"),
                ],
                db_index=True,
                default="it_approved",
                max_length=30,
                verbose_name="Trạng thái domain IT",
            ),
        ),
        migrations.AddField(
            model_name="job",
            name="moderation_status",
            field=models.CharField(
                choices=[
                    ("approved", "Approved"),
                    ("needs_review", "Needs review"),
                    ("rejected", "Rejected"),
                ],
                db_index=True,
                default="approved",
                max_length=30,
                verbose_name="Trạng thái kiểm duyệt",
            ),
        ),
        migrations.AddField(
            model_name="job",
            name="moderation_reasons",
            field=models.JSONField(
                blank=True, default=list, verbose_name="Lý do kiểm duyệt"
            ),
        ),
        migrations.AddField(
            model_name="job",
            name="last_moderated_at",
            field=models.DateTimeField(
                blank=True,
                null=True,
                verbose_name="Lần kiểm duyệt gần nhất",
            ),
        ),
        migrations.AddIndex(
            model_name="job",
            index=models.Index(
                fields=["status", "domain_status", "moderation_status"],
                name="idx_jobs_public_policy",
            ),
        ),
    ]
