from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("recruitment_applications", "0003_application_performance_indexes"),
    ]

    operations = [
        migrations.AddField(
            model_name="application",
            name="match_score",
            field=models.IntegerField(
                blank=True, null=True, verbose_name="Điểm phù hợp"
            ),
        ),
        migrations.AddField(
            model_name="application",
            name="score_breakdown",
            field=models.JSONField(
                blank=True, default=dict, verbose_name="Chi tiết điểm"
            ),
        ),
    ]
