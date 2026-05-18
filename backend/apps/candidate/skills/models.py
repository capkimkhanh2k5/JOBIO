from django.db import models
from apps.core.utils import slugify_vietnamese as slugify


class Skill(models.Model):
    """Bảng Skills - Kỹ năng (đã normalize với category)"""

    name = models.CharField(max_length=100, unique=True, verbose_name="Tên kỹ năng")
    slug = models.SlugField(
        max_length=100, unique=True, db_index=True, verbose_name="Slug"
    )
    category = models.ForeignKey(
        "candidate_skill_categories.SkillCategory",
        on_delete=models.CASCADE,
        related_name="skills",
        db_index=True,
        verbose_name="Danh mục",
    )
    description = models.TextField(null=True, blank=True, verbose_name="Mô tả")
    is_verified = models.BooleanField(default=False, verbose_name="Đã xác minh")
    usage_count = models.IntegerField(default=0, verbose_name="Số lần sử dụng")
    is_active = models.BooleanField(default=True, verbose_name="Đang hoạt động")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Ngày tạo")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Ngày cập nhật")

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        else:
            self.slug = slugify(self.slug)
        super().save(*args, **kwargs)

    class Meta:
        db_table = "skills"
        verbose_name = "Kỹ năng"
        verbose_name_plural = "Kỹ năng"

    def __str__(self):
        return self.name
