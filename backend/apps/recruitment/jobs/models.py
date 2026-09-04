from django.db import models
from django.contrib.postgres.indexes import GinIndex
from pgvector.django import VectorField


RECOMMENDATION_EMBEDDING_MODEL = "BAAI/bge-m3"
RECOMMENDATION_EMBEDDING_DIMENSIONS = 1024


class Job(models.Model):
    """Bảng Jobs - Tin tuyển dụng"""

    class JobType(models.TextChoices):
        FULL_TIME = "full-time", "Toàn thời gian"
        PART_TIME = "part-time", "Bán thời gian"
        CONTRACT = "contract", "Hợp đồng"
        INTERNSHIP = "internship", "Thực tập"
        FREELANCE = "freelance", "Tự do"

    class Level(models.TextChoices):
        INTERN = "intern", "Thực tập sinh"
        FRESHER = "fresher", "Fresher"
        JUNIOR = "junior", "Junior"
        MIDDLE = "middle", "Middle"
        SENIOR = "senior", "Senior"
        LEAD = "lead", "Team Lead"
        MANAGER = "manager", "Manager"
        DIRECTOR = "director", "Director"

    class SalaryType(models.TextChoices):
        MONTHLY = "monthly", "Theo tháng"
        YEARLY = "yearly", "Theo năm"
        HOURLY = "hourly", "Theo giờ"
        PROJECT = "project", "Theo dự án"

    class Status(models.TextChoices):
        DRAFT = "draft", "Bản nháp"
        PUBLISHED = "published", "Đã đăng"
        CLOSED = "closed", "Đã đóng"
        EXPIRED = "expired", "Hết hạn"

    class DomainStatus(models.TextChoices):
        IT_APPROVED = "it_approved", "IT approved"
        NEEDS_REVIEW = "needs_review", "Needs review"
        NON_IT = "non_it", "Non IT"

    class ModerationStatus(models.TextChoices):
        APPROVED = "approved", "Approved"
        NEEDS_REVIEW = "needs_review", "Needs review"
        REJECTED = "rejected", "Rejected"

    company = models.ForeignKey(
        "company_companies.Company",
        on_delete=models.CASCADE,
        related_name="jobs",
        db_index=True,
        verbose_name="Công ty",
    )
    title = models.CharField(max_length=255, verbose_name="Tiêu đề")
    slug = models.SlugField(
        max_length=255, unique=True, db_index=True, verbose_name="Slug"
    )
    category = models.ForeignKey(
        "recruitment_job_categories.JobCategory",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="jobs",
        db_index=True,
        verbose_name="Danh mục",
    )
    job_type = models.CharField(
        max_length=20,
        choices=JobType.choices,
        db_index=True,
        verbose_name="Loại công việc",
    )
    level = models.CharField(
        max_length=20, choices=Level.choices, db_index=True, verbose_name="Cấp bậc"
    )
    experience_years_min = models.IntegerField(
        default=0, verbose_name="Kinh nghiệm tối thiểu (năm)"
    )
    experience_years_max = models.IntegerField(
        null=True, blank=True, verbose_name="Kinh nghiệm tối đa (năm)"
    )
    salary_min = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        null=True,
        blank=True,
        verbose_name="Mức lương tối thiểu",
    )
    salary_max = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        null=True,
        blank=True,
        verbose_name="Mức lương tối đa",
    )
    salary_currency = models.CharField(
        max_length=10, default="VND", verbose_name="Đơn vị tiền tệ"
    )
    salary_type = models.CharField(
        max_length=20,
        choices=SalaryType.choices,
        default=SalaryType.MONTHLY,
        verbose_name="Loại lương",
    )
    is_salary_negotiable = models.BooleanField(
        default=False, verbose_name="Lương thỏa thuận"
    )
    number_of_positions = models.IntegerField(default=1, verbose_name="Số lượng tuyển")
    description = models.TextField(verbose_name="Mô tả công việc")
    requirements = models.TextField(verbose_name="Yêu cầu")
    benefits = models.TextField(null=True, blank=True, verbose_name="Quyền lợi")
    seo_title = models.CharField(
        max_length=70, blank=True, default="", verbose_name="SEO title"
    )
    seo_description = models.CharField(
        max_length=160, blank=True, default="", verbose_name="SEO description"
    )
    seo_keywords = models.JSONField(
        default=list, blank=True, verbose_name="SEO keywords"
    )
    address = models.ForeignKey(
        "geography_addresses.Address",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="jobs",
        verbose_name="Địa chỉ",
    )
    is_remote = models.BooleanField(default=False, verbose_name="Làm việc từ xa")
    application_deadline = models.DateField(
        null=True, blank=True, db_index=True, verbose_name="Hạn nộp hồ sơ"
    )
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.DRAFT,
        db_index=True,
        verbose_name="Trạng thái",
    )
    domain_status = models.CharField(
        max_length=30,
        choices=DomainStatus.choices,
        default=DomainStatus.IT_APPROVED,
        db_index=True,
        verbose_name="Trạng thái domain IT",
    )
    moderation_status = models.CharField(
        max_length=30,
        choices=ModerationStatus.choices,
        default=ModerationStatus.APPROVED,
        db_index=True,
        verbose_name="Trạng thái kiểm duyệt",
    )
    moderation_reasons = models.JSONField(
        default=list, blank=True, verbose_name="Lý do kiểm duyệt"
    )
    last_moderated_at = models.DateTimeField(
        null=True, blank=True, verbose_name="Lần kiểm duyệt gần nhất"
    )
    view_count = models.IntegerField(default=0, verbose_name="Lượt xem")
    application_count = models.IntegerField(default=0, verbose_name="Số đơn ứng tuyển")
    featured = models.BooleanField(default=False, verbose_name="Tin nổi bật")
    featured_until = models.DateField(null=True, blank=True, verbose_name="Nổi bật đến")
    published_at = models.DateTimeField(
        null=True, blank=True, db_index=True, verbose_name="Ngày đăng"
    )
    created_by = models.ForeignKey(
        "core_users.CustomUser",
        on_delete=models.CASCADE,
        related_name="created_jobs",
        verbose_name="Người tạo",
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Ngày tạo")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Ngày cập nhật")

    class Meta:
        db_table = "jobs"
        verbose_name = "Việc làm"
        verbose_name_plural = "Việc làm"
        indexes = [
            models.Index(fields=["company", "status"], name="idx_jobs_company_status"),
            models.Index(
                fields=["category", "status"], name="idx_jobs_category_status"
            ),
            models.Index(
                fields=["status", "domain_status", "moderation_status"],
                name="idx_jobs_public_policy",
            ),
            models.Index(
                fields=[
                    "status",
                    "domain_status",
                    "moderation_status",
                    "application_deadline",
                    "published_at",
                ],
                name="idx_jobs_public_deadline",
            ),
            models.Index(
                fields=["company", "status", "created_at"],
                name="idx_jobs_co_stat_created",
            ),
            # FTS Index
            GinIndex(
                fields=["title", "description"],
                name="idx_jobs_title_desc_gin",
                opclasses=["gin_trgm_ops", "gin_trgm_ops"],
            ),
        ]

    def __str__(self):
        return self.title


class CanonicalTitle(models.Model):
    name = models.CharField(max_length=120, unique=True)
    description = models.TextField(blank=True, default="")
    category = models.CharField(max_length=80, blank=True, default="")
    is_active = models.BooleanField(default=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "canonical_titles"
        ordering = ["name"]

    def __str__(self):
        return self.name


class JobTitleAlias(models.Model):
    alias_name = models.CharField(max_length=160)
    normalized_alias = models.CharField(max_length=160, db_index=True)
    canonical_title = models.ForeignKey(
        "recruitment_jobs.CanonicalTitle",
        on_delete=models.CASCADE,
        related_name="aliases",
    )
    language = models.CharField(max_length=20, default="en")
    weight = models.FloatField(default=1.0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "job_title_aliases"
        indexes = [
            models.Index(fields=["normalized_alias"], name="idx_title_alias_norm"),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=["normalized_alias", "canonical_title"],
                name="uq_title_alias_canonical",
            )
        ]

    def __str__(self):
        return f"{self.alias_name} -> {self.canonical_title_id}"


class SkillAlias(models.Model):
    alias_name = models.CharField(max_length=120)
    normalized_alias = models.CharField(max_length=120, db_index=True)
    skill = models.ForeignKey(
        "candidate_skills.Skill",
        on_delete=models.CASCADE,
        related_name="recommendation_aliases",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "skill_aliases"
        indexes = [
            models.Index(fields=["normalized_alias"], name="idx_skill_alias_norm"),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=["normalized_alias", "skill"],
                name="uq_skill_alias_skill",
            )
        ]

    def __str__(self):
        return f"{self.alias_name} -> {self.skill_id}"


class JobRecommendationProfile(models.Model):
    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        PROCESSED = "processed", "Processed"
        FAILED = "failed", "Failed"

    job = models.OneToOneField(
        "recruitment_jobs.Job",
        on_delete=models.CASCADE,
        related_name="recommendation_profile",
    )
    title_raw = models.CharField(max_length=255, blank=True, default="")
    title_core = models.CharField(max_length=255, blank=True, default="")
    canonical_title = models.ForeignKey(
        "recruitment_jobs.CanonicalTitle",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="job_profiles",
    )
    title_confidence = models.FloatField(default=0.0)
    title_normalization_method = models.CharField(max_length=40, blank=True, default="")
    description_clean = models.TextField(blank=True, default="")
    skills_required = models.JSONField(default=list, blank=True)
    skills_preferred = models.JSONField(default=list, blank=True)
    seniority = models.CharField(max_length=30, blank=True, default="unknown")
    workplace_type = models.CharField(max_length=30, blank=True, default="unknown")
    location_city = models.CharField(max_length=120, blank=True, default="")
    status = models.CharField(
        max_length=20, choices=Status.choices, default=Status.PENDING, db_index=True
    )
    processed_at = models.DateTimeField(null=True, blank=True)
    error = models.TextField(blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "job_recommendation_profiles"
        indexes = [
            models.Index(fields=["status"], name="idx_job_rec_profile_status"),
            models.Index(fields=["canonical_title"], name="idx_job_rec_profile_title"),
        ]

    def __str__(self):
        return f"{self.job_id} - {self.status}"


class CandidateRecommendationProfile(models.Model):
    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        PROCESSED = "processed", "Processed"
        FAILED = "failed", "Failed"

    recruiter = models.OneToOneField(
        "candidate_recruiters.Recruiter",
        on_delete=models.CASCADE,
        related_name="recommendation_profile",
    )
    current_title_raw = models.CharField(max_length=255, blank=True, default="")
    current_title_core = models.CharField(max_length=255, blank=True, default="")
    current_title_canonical = models.ForeignKey(
        "recruitment_jobs.CanonicalTitle",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="candidate_profiles",
    )
    title_confidence = models.FloatField(default=0.0)
    title_normalization_method = models.CharField(max_length=40, blank=True, default="")
    skills = models.JSONField(default=list, blank=True)
    years_experience = models.IntegerField(default=0)
    preferred_locations = models.JSONField(default=list, blank=True)
    preferred_workplace_type = models.CharField(max_length=30, blank=True, default="")
    status = models.CharField(
        max_length=20, choices=Status.choices, default=Status.PENDING, db_index=True
    )
    processed_at = models.DateTimeField(null=True, blank=True)
    error = models.TextField(blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "candidate_recommendation_profiles"
        indexes = [
            models.Index(fields=["status"], name="idx_cand_rec_prof_status"),
            models.Index(
                fields=["current_title_canonical"],
                name="idx_cand_rec_prof_title",
            ),
        ]

    def __str__(self):
        return f"{self.recruiter_id} - {self.status}"


class RecommendationProcessingLog(models.Model):
    class EntityType(models.TextChoices):
        JOB = "job", "Job"
        CANDIDATE = "candidate", "Candidate"

    entity_type = models.CharField(max_length=20, choices=EntityType.choices)
    entity_id = models.PositiveIntegerField(db_index=True)
    step = models.CharField(max_length=80)
    input_text = models.TextField(blank=True, default="")
    output_json = models.JSONField(default=dict, blank=True)
    confidence = models.FloatField(null=True, blank=True)
    status = models.CharField(max_length=20, default="processed", db_index=True)
    error_message = models.TextField(blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        db_table = "recommendation_processing_logs"
        indexes = [
            models.Index(
                fields=["entity_type", "entity_id", "created_at"],
                name="idx_rec_log_entity_created",
            ),
        ]


class JobEmbedding(models.Model):
    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        READY = "ready", "Ready"
        FAILED = "failed", "Failed"
        SKIPPED = "skipped", "Skipped"

    job = models.OneToOneField(
        "recruitment_jobs.Job",
        on_delete=models.CASCADE,
        related_name="recommendation_embedding",
    )
    source_hash = models.CharField(max_length=64, db_index=True)
    model = models.CharField(max_length=100, default=RECOMMENDATION_EMBEDDING_MODEL)
    model_version = models.CharField(
        max_length=80, blank=True, default="", db_index=True
    )
    dimensions = models.PositiveIntegerField(default=0)
    embedding = VectorField(
        dimensions=RECOMMENDATION_EMBEDDING_DIMENSIONS,
        null=True,
        blank=True,
    )
    status = models.CharField(
        max_length=20, choices=Status.choices, default=Status.PENDING, db_index=True
    )
    generated_at = models.DateTimeField(null=True, blank=True)
    error = models.TextField(blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "job_embeddings"
        verbose_name = "Job recommendation embedding"
        verbose_name_plural = "Job recommendation embeddings"

    def __str__(self):
        return f"{self.job_id} - {self.status}"


class CandidateRecommendationEmbedding(models.Model):
    class SourceType(models.TextChoices):
        PROFILE = "profile", "Profile"
        CV = "cv", "CV"

    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        READY = "ready", "Ready"
        FAILED = "failed", "Failed"
        SKIPPED = "skipped", "Skipped"

    recruiter = models.ForeignKey(
        "candidate_recruiters.Recruiter",
        on_delete=models.CASCADE,
        related_name="recommendation_embeddings",
    )
    cv = models.ForeignKey(
        "candidate_recruiter_cvs.RecruiterCV",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="recommendation_embeddings",
    )
    source_type = models.CharField(max_length=20, choices=SourceType.choices)
    source_hash = models.CharField(max_length=64, db_index=True)
    model = models.CharField(max_length=100, default=RECOMMENDATION_EMBEDDING_MODEL)
    model_version = models.CharField(
        max_length=80, blank=True, default="", db_index=True
    )
    dimensions = models.PositiveIntegerField(default=0)
    embedding = VectorField(
        dimensions=RECOMMENDATION_EMBEDDING_DIMENSIONS,
        null=True,
        blank=True,
    )
    status = models.CharField(
        max_length=20, choices=Status.choices, default=Status.PENDING, db_index=True
    )
    generated_at = models.DateTimeField(null=True, blank=True)
    error = models.TextField(blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "candidate_recommendation_embeddings"
        verbose_name = "Candidate recommendation embedding"
        verbose_name_plural = "Candidate recommendation embeddings"
        constraints = [
            models.UniqueConstraint(
                fields=["recruiter", "source_type"],
                condition=models.Q(cv__isnull=True),
                name="uq_candidate_profile_embedding",
            ),
            models.UniqueConstraint(
                fields=["recruiter", "cv", "source_type"],
                condition=models.Q(cv__isnull=False),
                name="uq_candidate_cv_embedding",
            ),
        ]

    def __str__(self):
        return f"{self.recruiter_id}:{self.source_type}:{self.cv_id or 'profile'}"


class JobRecommendationEvent(models.Model):
    class EventType(models.TextChoices):
        IMPRESSION = "impression", "Impression"
        CLICK = "click", "Click"
        SAVE = "save", "Save"
        APPLY = "apply", "Apply"
        DISMISS = "dismiss", "Dismiss"

    recruiter = models.ForeignKey(
        "candidate_recruiters.Recruiter",
        on_delete=models.CASCADE,
        related_name="job_recommendation_events",
    )
    job = models.ForeignKey(
        "recruitment_jobs.Job",
        on_delete=models.CASCADE,
        related_name="recommendation_events",
    )
    cv = models.ForeignKey(
        "candidate_recruiter_cvs.RecruiterCV",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="recommendation_events",
    )
    event_type = models.CharField(max_length=20, choices=EventType.choices)
    rank = models.PositiveIntegerField(null=True, blank=True)
    score = models.FloatField(null=True, blank=True)
    score_breakdown = models.JSONField(default=dict, blank=True)
    not_relevant_reason = models.CharField(max_length=255, blank=True, default="")
    surface = models.CharField(max_length=80, blank=True, default="")
    algorithm_version = models.CharField(max_length=80, blank=True, default="")
    source_type = models.CharField(max_length=20, default="profile")
    source_id = models.PositiveIntegerField(null=True, blank=True)
    request_id = models.CharField(max_length=64, blank=True, default="", db_index=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        db_table = "job_recommendation_events"
        verbose_name = "Job recommendation event"
        verbose_name_plural = "Job recommendation events"
        indexes = [
            models.Index(
                fields=["recruiter", "event_type", "created_at"],
                name="idx_job_rec_event_user_type",
            ),
            models.Index(fields=["job", "event_type"], name="idx_job_rec_event_job"),
        ]
