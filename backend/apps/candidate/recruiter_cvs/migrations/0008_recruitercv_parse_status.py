from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("candidate_recruiter_cvs", "0007_recruitercv_pdf_generated_at"),
    ]

    operations = [
        migrations.AddField(
            model_name="recruitercv",
            name="parse_status",
            field=models.CharField(
                choices=[
                    ("none", "Không cần parse"),
                    ("queued", "Đang chờ xử lý"),
                    ("parsing", "Đang xử lý"),
                    ("parsed", "Đã xử lý"),
                    ("not_resume", "Không phải CV"),
                    ("blocked", "Bị chặn bởi kiểm duyệt"),
                    ("failed", "Xử lý thất bại"),
                ],
                db_index=True,
                default="none",
                max_length=20,
                verbose_name="Trạng thái xử lý CV",
            ),
        ),
        migrations.AddField(
            model_name="recruitercv",
            name="parse_error_code",
            field=models.CharField(
                blank=True,
                max_length=80,
                null=True,
                verbose_name="Mã lỗi xử lý CV",
            ),
        ),
        migrations.AddField(
            model_name="recruitercv",
            name="parse_error_message",
            field=models.CharField(
                blank=True,
                max_length=255,
                null=True,
                verbose_name="Thông báo lỗi xử lý CV",
            ),
        ),
    ]
