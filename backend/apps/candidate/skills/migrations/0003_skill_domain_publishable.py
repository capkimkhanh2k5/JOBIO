# Generated manually for JOBIO IT-only taxonomy.

from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("candidate_skills", "0002_skill_is_active_skill_updated_at"),
    ]

    operations = [
        migrations.AddField(
            model_name="skill",
            name="domain",
            field=models.CharField(
                choices=[
                    ("it", "Công nghệ thông tin"),
                    ("other", "Ngoài công nghệ thông tin"),
                ],
                db_index=True,
                default="it",
                max_length=20,
                verbose_name="Domain kỹ năng",
            ),
        ),
        migrations.AddField(
            model_name="skill",
            name="is_publishable",
            field=models.BooleanField(
                db_index=True,
                default=True,
                verbose_name="Cho phép dùng khi đăng tuyển",
            ),
        ),
    ]
