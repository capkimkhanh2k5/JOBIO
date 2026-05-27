from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("candidate_recruiter_cvs", "0006_alter_recruitercv_parsed_at"),
    ]

    operations = [
        migrations.AddField(
            model_name="recruitercv",
            name="pdf_generated_at",
            field=models.DateTimeField(
                blank=True, null=True, verbose_name="Thời điểm tạo PDF"
            ),
        ),
    ]
