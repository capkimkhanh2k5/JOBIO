from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("recruitment_interviews", "0004_alter_interview_status"),
    ]

    operations = [
        migrations.AddField(
            model_name="interview",
            name="scorecard",
            field=models.JSONField(
                blank=True,
                default=dict,
                verbose_name="Scorecard phỏng vấn",
            ),
        ),
    ]
