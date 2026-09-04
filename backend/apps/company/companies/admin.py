from django.contrib import admin

from .models import Company, CompanyMember


@admin.register(Company)
class CompanyAdmin(admin.ModelAdmin):
    list_display = ("company_name", "user", "verification_status", "job_count")
    list_filter = ("verification_status", "company_size")
    search_fields = ("company_name", "user__email", "tax_code")


@admin.register(CompanyMember)
class CompanyMemberAdmin(admin.ModelAdmin):
    list_display = ("company", "user", "role", "status", "invited_by", "updated_at")
    list_filter = ("role", "status")
    search_fields = ("company__company_name", "user__email", "user__full_name")
