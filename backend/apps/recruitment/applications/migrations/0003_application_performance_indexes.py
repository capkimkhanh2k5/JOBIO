from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("recruitment_applications", "0002_initial"),
    ]

    operations = [
        migrations.AddIndex(
            model_name="application",
            index=models.Index(
                fields=["job", "status", "applied_at"],
                name="idx_app_job_status_applied",
            ),
        ),
        migrations.AddIndex(
            model_name="application",
            index=models.Index(
                fields=["recruiter", "status", "applied_at"],
                name="idx_app_rec_status_applied",
            ),
        ),
    ]
