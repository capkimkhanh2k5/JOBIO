from django.contrib import admin

from .models import CVTemplateCategory


@admin.register(CVTemplateCategory)
class CVTemplateCategoryAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "name",
        "slug",
        "is_active",
        "display_order",
        "template_count",
        "updated_at",
    )
    list_filter = ("is_active",)
    search_fields = ("name", "slug", "description")
    prepopulated_fields = {"slug": ("name",)}
    readonly_fields = ("created_at", "updated_at")
    ordering = ("display_order", "name")

    @admin.display(description="Templates")
    def template_count(self, obj):
        return obj.templates.count()
