from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("recruitment_jobs", "0008_drop_pgvector_artifacts"),
    ]

    operations = [
        migrations.AddField(
            model_name="jobrecommendationevent",
            name="algorithm_version",
            field=models.CharField(blank=True, default="", max_length=80),
        ),
        migrations.AddField(
            model_name="jobrecommendationevent",
            name="not_relevant_reason",
            field=models.CharField(blank=True, default="", max_length=255),
        ),
        migrations.AddField(
            model_name="jobrecommendationevent",
            name="surface",
            field=models.CharField(blank=True, default="", max_length=80),
        ),
    ]
