from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("recruitment_jobs", "0003_alter_job_job_type_alter_job_level"),
    ]

    operations = [
        migrations.AddField(
            model_name="job",
            name="seo_description",
            field=models.CharField(
                blank=True, default="", max_length=160, verbose_name="SEO description"
            ),
        ),
        migrations.AddField(
            model_name="job",
            name="seo_keywords",
            field=models.JSONField(
                blank=True, default=list, verbose_name="SEO keywords"
            ),
        ),
        migrations.AddField(
            model_name="job",
            name="seo_title",
            field=models.CharField(
                blank=True, default="", max_length=70, verbose_name="SEO title"
            ),
        ),
    ]
