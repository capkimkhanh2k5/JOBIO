from django.contrib import admin

from .models import CVTemplate


class TemplateAssetStatusFilter(admin.SimpleListFilter):
    title = "asset status"
    parameter_name = "asset_status"

    def lookups(self, request, model_admin):
        return (
            ("complete", "Complete"),
            ("missing_thumbnail", "Missing thumbnail"),
            ("missing_preview", "Missing preview"),
            ("missing_file", "Missing file name"),
        )

    def queryset(self, request, queryset):
        value = self.value()
        if value == "complete":
            return queryset.exclude(thumbnail_url__isnull=True).exclude(
                thumbnail_url=""
            ).exclude(preview_url__isnull=True).exclude(preview_url="").exclude(
                file_name__isnull=True
            ).exclude(file_name="")
        if value == "missing_thumbnail":
            return queryset.filter(thumbnail_url__in=[""]) | queryset.filter(
                thumbnail_url__isnull=True
            )
        if value == "missing_preview":
            return queryset.filter(preview_url__in=[""]) | queryset.filter(
                preview_url__isnull=True
            )
        if value == "missing_file":
            return queryset.filter(file_name__in=[""]) | queryset.filter(
                file_name__isnull=True
            )
        return queryset


@admin.register(CVTemplate)
class CVTemplateAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "name",
        "file_name",
        "category",
        "is_active",
        "is_premium",
        "asset_status",
        "price",
        "usage_count",
        "rating",
        "updated_at",
    )
    list_filter = (
        TemplateAssetStatusFilter,
        "is_active",
        "is_premium",
        "category",
        "created_at",
        "updated_at",
    )
    search_fields = ("name", "file_name", "template_data")
    readonly_fields = ("usage_count", "rating", "created_at", "updated_at")
    autocomplete_fields = ("category",)
    actions = ("activate_templates", "deactivate_templates", "mark_premium")

    @admin.display(description="Assets")
    def asset_status(self, obj):
        missing = []
        if not obj.file_name:
            missing.append("file")
        if not obj.thumbnail_url:
            missing.append("thumbnail")
        if not obj.preview_url:
            missing.append("preview")
        return "Complete" if not missing else f"Missing {', '.join(missing)}"

    @admin.action(description="Activate selected templates")
    def activate_templates(self, request, queryset):
        queryset.update(is_active=True)

    @admin.action(description="Deactivate selected templates")
    def deactivate_templates(self, request, queryset):
        queryset.update(is_active=False)

    @admin.action(description="Mark selected templates as premium")
    def mark_premium(self, request, queryset):
        queryset.update(is_premium=True)
