from django.db import models


class RecruiterCV(models.Model):
    """Bảng Recruiter_CVs - CV được tạo bởi người tìm việc"""

    class ParseStatus(models.TextChoices):
        NONE = "none", "Không cần parse"
        QUEUED = "queued", "Đang chờ xử lý"
        PARSING = "parsing", "Đang xử lý"
        PARSED = "parsed", "Đã xử lý"
        NOT_RESUME = "not_resume", "Không phải CV"
        BLOCKED = "blocked", "Bị chặn bởi kiểm duyệt"
        FAILED = "failed", "Xử lý thất bại"

    recruiter = models.ForeignKey(
        "candidate_recruiters.Recruiter",
        on_delete=models.CASCADE,
        related_name="cvs",
        db_index=True,
        verbose_name="Ứng viên",
    )
    template = models.ForeignKey(
        "candidate_cv_templates.CVTemplate",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="recruiter_cvs",
        verbose_name="Mẫu CV",
    )
    cv_name = models.CharField(max_length=255, verbose_name="Tên CV")
    cv_data = models.JSONField(default=dict, verbose_name="Dữ liệu CV")
    cv_url = models.URLField(
        max_length=500, null=True, blank=True, verbose_name="URL CV"
    )
    is_default = models.BooleanField(
        default=False, db_index=True, verbose_name="CV mặc định"
    )
    is_public = models.BooleanField(default=True, verbose_name="CV công khai")
    view_count = models.IntegerField(default=0, verbose_name="Lượt xem")
    download_count = models.IntegerField(default=0, verbose_name="Lượt tải")
    pdf_generated_at = models.DateTimeField(
        null=True, blank=True, verbose_name="Thời điểm tạo PDF"
    )
    parsed_at = models.DateTimeField(
        null=True, blank=True, verbose_name="Thời điểm xử lý"
    )
    parse_status = models.CharField(
        max_length=20,
        choices=ParseStatus.choices,
        default=ParseStatus.NONE,
        db_index=True,
        verbose_name="Trạng thái xử lý CV",
    )
    parse_error_code = models.CharField(
        max_length=80,
        null=True,
        blank=True,
        verbose_name="Mã lỗi xử lý CV",
    )
    parse_error_message = models.CharField(
        max_length=255,
        null=True,
        blank=True,
        verbose_name="Thông báo lỗi xử lý CV",
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Ngày tạo")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Ngày cập nhật")

    class Meta:
        db_table = "recruiter_cvs"
        verbose_name = "CV ứng viên"
        verbose_name_plural = "CV ứng viên"

    def __str__(self):
        return f"{self.cv_name} - {self.recruiter.user.full_name}"

    @property
    def is_parsed(self) -> bool:
        """CV đã được parse thành công (có cv_data)."""
        return self.parse_status == self.ParseStatus.PARSED or bool(self.cv_data)
