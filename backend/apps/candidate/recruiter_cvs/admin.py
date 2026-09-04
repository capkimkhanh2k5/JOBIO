from django.contrib import admin
from django.utils import timezone

from .models import RecruiterCV


@admin.register(RecruiterCV)
class RecruiterCVAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "cv_name",
        "candidate_email",
        "template",
        "is_default",
        "is_public",
        "parse_status",
        "pdf_generated_at",
        "updated_at",
    )
    list_filter = (
        "parse_status",
        "is_default",
        "is_public",
        "template",
        "created_at",
        "updated_at",
    )
    search_fields = (
        "cv_name",
        "recruiter__user__email",
        "recruiter__user__full_name",
        "parse_error_code",
        "parse_error_message",
    )
    readonly_fields = (
        "view_count",
        "download_count",
        "pdf_generated_at",
        "parsed_at",
        "created_at",
        "updated_at",
    )
    raw_id_fields = ("recruiter", "template")
    actions = ("mark_as_parsed", "mark_as_failed", "make_public", "make_private")

    @admin.display(description="Candidate email", ordering="recruiter__user__email")
    def candidate_email(self, obj):
        return getattr(obj.recruiter.user, "email", "")

    @admin.action(description="Mark selected CVs as parsed")
    def mark_as_parsed(self, request, queryset):
        queryset.update(
            parse_status=RecruiterCV.ParseStatus.PARSED,
            parsed_at=timezone.now(),
            parse_error_code=None,
            parse_error_message=None,
        )

    @admin.action(description="Mark selected CVs as failed")
    def mark_as_failed(self, request, queryset):
        queryset.update(parse_status=RecruiterCV.ParseStatus.FAILED)

    @admin.action(description="Make selected CVs public")
    def make_public(self, request, queryset):
        queryset.update(is_public=True)

    @admin.action(description="Make selected CVs private")
    def make_private(self, request, queryset):
        queryset.update(is_public=False)
