# Generated manually for JOBIO upload moderation.

from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("system_file_uploads", "0002_fileupload_updated_at"),
    ]

    operations = [
        migrations.AddField(
            model_name="fileupload",
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
            model_name="fileupload",
            name="moderation_reasons",
            field=models.JSONField(
                blank=True, default=list, verbose_name="Lý do kiểm duyệt"
            ),
        ),
        migrations.AddField(
            model_name="fileupload",
            name="safe_preview_url",
            field=models.CharField(
                blank=True,
                max_length=500,
                null=True,
                verbose_name="URL preview an toàn",
            ),
        ),
    ]
