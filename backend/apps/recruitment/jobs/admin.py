from django.contrib import admin
from django.contrib import messages

from .models import (
    CandidateRecommendationEmbedding,
    CandidateRecommendationProfile,
    CanonicalTitle,
    JobTitleAlias,
    Job,
    JobEmbedding,
    JobRecommendationProfile,
    JobRecommendationEvent,
    RecommendationProcessingLog,
    SkillAlias,
)
from .services.recommendations import (
    generate_candidate_embedding,
    remove_job_from_vector_store,
    schedule_job_embedding_refresh,
)


@admin.register(Job)
class JobAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "title",
        "company",
        "status",
        "domain_status",
        "moderation_status",
        "published_at",
        "updated_at",
    )
    list_filter = (
        "status",
        "domain_status",
        "moderation_status",
        "job_type",
        "level",
        "featured",
    )
    search_fields = ("title", "company__company_name")
    readonly_fields = ("moderation_reasons", "last_moderated_at")
    actions = ("enqueue_vector_rebuild", "remove_vectors")

    @admin.action(description="Enqueue vector rebuild for selected jobs")
    def enqueue_vector_rebuild(self, request, queryset):
        count = 0
        for job_id in queryset.values_list("id", flat=True):
            schedule_job_embedding_refresh(job_id)
            count += 1
        self.message_user(
            request,
            f"Queued vector rebuild for {count} job(s).",
            messages.SUCCESS,
        )

    @admin.action(description="Remove selected job vectors")
    def remove_vectors(self, request, queryset):
        count = 0
        for job_id in queryset.values_list("id", flat=True):
            remove_job_from_vector_store(job_id)
            count += 1
        self.message_user(
            request,
            f"Removed {count} job vector(s).",
            messages.WARNING,
        )


@admin.register(JobEmbedding)
class JobEmbeddingAdmin(admin.ModelAdmin):
    list_display = (
        "job",
        "status",
        "model",
        "source_hash_short",
        "generated_at",
        "updated_at",
    )
    list_filter = ("status", "model")
    search_fields = ("job__title", "error")
    readonly_fields = ("source_hash", "error", "generated_at", "created_at", "updated_at")
    actions = ("enqueue_rebuild", "remove_vectors")

    @admin.display(description="Source hash")
    def source_hash_short(self, obj):
        return (obj.source_hash or "")[:12]

    @admin.action(description="Enqueue rebuild for selected job embeddings")
    def enqueue_rebuild(self, request, queryset):
        count = 0
        for job_id in queryset.values_list("job_id", flat=True):
            schedule_job_embedding_refresh(job_id)
            count += 1
        self.message_user(request, f"Queued {count} job embedding rebuild(s).")

    @admin.action(description="Remove selected job vectors")
    def remove_vectors(self, request, queryset):
        count = 0
        for job_id in queryset.values_list("job_id", flat=True):
            remove_job_from_vector_store(job_id)
            count += 1
        self.message_user(
            request,
            f"Removed {count} job vector(s).",
            messages.WARNING,
        )


@admin.register(CandidateRecommendationEmbedding)
class CandidateRecommendationEmbeddingAdmin(admin.ModelAdmin):
    list_display = (
        "recruiter",
        "source_type",
        "cv",
        "status",
        "model",
        "source_hash_short",
        "generated_at",
    )
    list_filter = ("source_type", "status", "model")
    search_fields = ("recruiter__user__email", "recruiter__user__full_name", "error")
    readonly_fields = ("source_hash", "error", "generated_at", "created_at", "updated_at")
    actions = ("rebuild_now",)

    @admin.display(description="Source hash")
    def source_hash_short(self, obj):
        return (obj.source_hash or "")[:12]

    @admin.action(description="Rebuild selected candidate vectors now")
    def rebuild_now(self, request, queryset):
        ready = failed = 0
        for record in queryset.select_related("recruiter", "cv"):
            result = generate_candidate_embedding(
                record.recruiter_id,
                record.cv_id,
                record.source_type,
            )
            if result.get("status") in {"ready", "skipped"}:
                ready += 1
            else:
                failed += 1
        level = messages.SUCCESS if failed == 0 else messages.WARNING
        self.message_user(
            request,
            f"Candidate vector rebuild finished: ready/skipped={ready}, failed={failed}.",
            level,
        )


@admin.register(CanonicalTitle)
class CanonicalTitleAdmin(admin.ModelAdmin):
    list_display = ("name", "category", "is_active", "updated_at")
    list_filter = ("category", "is_active")
    search_fields = ("name", "description")


@admin.register(JobTitleAlias)
class JobTitleAliasAdmin(admin.ModelAdmin):
    list_display = ("alias_name", "canonical_title", "language", "weight")
    list_filter = ("language", "canonical_title")
    search_fields = ("alias_name", "normalized_alias", "canonical_title__name")


@admin.register(SkillAlias)
class SkillAliasAdmin(admin.ModelAdmin):
    list_display = ("alias_name", "skill")
    search_fields = ("alias_name", "normalized_alias", "skill__name")


@admin.register(JobRecommendationProfile)
class JobRecommendationProfileAdmin(admin.ModelAdmin):
    list_display = (
        "job",
        "canonical_title",
        "seniority",
        "workplace_type",
        "status",
        "processed_at",
    )
    list_filter = ("status", "seniority", "workplace_type", "canonical_title")
    search_fields = ("job__title", "title_core", "location_city")
    readonly_fields = ("processed_at", "created_at", "updated_at")


@admin.register(CandidateRecommendationProfile)
class CandidateRecommendationProfileAdmin(admin.ModelAdmin):
    list_display = (
        "recruiter",
        "current_title_canonical",
        "years_experience",
        "status",
        "processed_at",
    )
    list_filter = ("status", "current_title_canonical")
    search_fields = (
        "recruiter__user__email",
        "recruiter__user__full_name",
        "current_title_raw",
    )
    readonly_fields = ("processed_at", "created_at", "updated_at")


@admin.register(RecommendationProcessingLog)
class RecommendationProcessingLogAdmin(admin.ModelAdmin):
    list_display = (
        "entity_type",
        "entity_id",
        "step",
        "status",
        "confidence",
        "created_at",
    )
    list_filter = ("entity_type", "step", "status")
    search_fields = ("input_text", "error_message")
    readonly_fields = ("created_at",)


@admin.register(JobRecommendationEvent)
class JobRecommendationEventAdmin(admin.ModelAdmin):
    list_display = ("recruiter", "job", "event_type", "score", "rank", "created_at")
    list_filter = ("event_type", "source_type", "created_at")
    search_fields = ("recruiter__user__email", "job__title", "request_id")
