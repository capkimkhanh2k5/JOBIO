# Generated manually for JOBIO IT-only taxonomy.

from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("recruitment_job_categories", "0002_jobcategory_updated_at"),
    ]

    operations = [
        migrations.AddField(
            model_name="jobcategory",
            name="domain",
            field=models.CharField(
                choices=[
                    ("it", "Công nghệ thông tin"),
                    ("other", "Ngoài công nghệ thông tin"),
                ],
                db_index=True,
                default="it",
                max_length=20,
                verbose_name="Domain tuyển dụng",
            ),
        ),
        migrations.AddField(
            model_name="jobcategory",
            name="is_publishable",
            field=models.BooleanField(
                db_index=True,
                default=True,
                verbose_name="Cho phép đăng tuyển",
            ),
        ),
    ]
