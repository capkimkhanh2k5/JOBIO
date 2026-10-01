from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [
        ("candidate_recruiter_cvs", "0004_add_parsed_status_fields"),
        ("candidate_recruiters", "0004_remove_job_search_status_and_is_profile_public"),
        ("recruitment_jobs", "0004_job_seo_fields"),
    ]

    operations = [
        migrations.CreateModel(
            name="CandidateRecommendationEmbedding",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                (
                    "source_type",
                    models.CharField(
                        choices=[("profile", "Profile"), ("cv", "CV")], max_length=20
                    ),
                ),
                ("source_hash", models.CharField(db_index=True, max_length=64)),
                ("model", models.CharField(default="BAAI/bge-m3", max_length=100)),
                (
                    "status",
                    models.CharField(
                        choices=[
                            ("pending", "Pending"),
                            ("ready", "Ready"),
                            ("failed", "Failed"),
                            ("skipped", "Skipped"),
                        ],
                        db_index=True,
                        default="pending",
                        max_length=20,
                    ),
                ),
                ("generated_at", models.DateTimeField(blank=True, null=True)),
                ("error", models.TextField(blank=True, default="")),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "cv",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="recommendation_embeddings",
                        to="candidate_recruiter_cvs.recruitercv",
                    ),
                ),
                (
                    "recruiter",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="recommendation_embeddings",
                        to="candidate_recruiters.recruiter",
                    ),
                ),
            ],
            options={
                "verbose_name": "Candidate recommendation embedding",
                "verbose_name_plural": "Candidate recommendation embeddings",
                "db_table": "candidate_recommendation_embeddings",
            },
        ),
        migrations.CreateModel(
            name="JobEmbedding",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("source_hash", models.CharField(db_index=True, max_length=64)),
                ("model", models.CharField(default="BAAI/bge-m3", max_length=100)),
                (
                    "status",
                    models.CharField(
                        choices=[
                            ("pending", "Pending"),
                            ("ready", "Ready"),
                            ("failed", "Failed"),
                            ("skipped", "Skipped"),
                        ],
                        db_index=True,
                        default="pending",
                        max_length=20,
                    ),
                ),
                ("generated_at", models.DateTimeField(blank=True, null=True)),
                ("error", models.TextField(blank=True, default="")),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "job",
                    models.OneToOneField(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="recommendation_embedding",
                        to="recruitment_jobs.job",
                    ),
                ),
            ],
            options={
                "verbose_name": "Job recommendation embedding",
                "verbose_name_plural": "Job recommendation embeddings",
                "db_table": "job_embeddings",
            },
        ),
        migrations.CreateModel(
            name="JobRecommendationEvent",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                (
                    "event_type",
                    models.CharField(
                        choices=[
                            ("impression", "Impression"),
                            ("click", "Click"),
                            ("save", "Save"),
                            ("apply", "Apply"),
                            ("dismiss", "Dismiss"),
                        ],
                        max_length=20,
                    ),
                ),
                ("rank", models.PositiveIntegerField(blank=True, null=True)),
                ("score", models.FloatField(blank=True, null=True)),
                ("score_breakdown", models.JSONField(blank=True, default=dict)),
                ("source_type", models.CharField(default="profile", max_length=20)),
                ("source_id", models.PositiveIntegerField(blank=True, null=True)),
                (
                    "request_id",
                    models.CharField(
                        blank=True, db_index=True, default="", max_length=64
                    ),
                ),
                ("created_at", models.DateTimeField(auto_now_add=True, db_index=True)),
                (
                    "cv",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="recommendation_events",
                        to="candidate_recruiter_cvs.recruitercv",
                    ),
                ),
                (
                    "job",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="recommendation_events",
                        to="recruitment_jobs.job",
                    ),
                ),
                (
                    "recruiter",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="job_recommendation_events",
                        to="candidate_recruiters.recruiter",
                    ),
                ),
            ],
            options={
                "verbose_name": "Job recommendation event",
                "verbose_name_plural": "Job recommendation events",
                "db_table": "job_recommendation_events",
            },
        ),
        migrations.AddConstraint(
            model_name="candidaterecommendationembedding",
            constraint=models.UniqueConstraint(
                condition=models.Q(("cv__isnull", True)),
                fields=("recruiter", "source_type"),
                name="uq_candidate_profile_embedding",
            ),
        ),
        migrations.AddConstraint(
            model_name="candidaterecommendationembedding",
            constraint=models.UniqueConstraint(
                condition=models.Q(("cv__isnull", False)),
                fields=("recruiter", "cv", "source_type"),
                name="uq_candidate_cv_embedding",
            ),
        ),
        migrations.AddIndex(
            model_name="jobrecommendationevent",
            index=models.Index(
                fields=["recruiter", "event_type", "created_at"],
                name="idx_job_rec_event_user_type",
            ),
        ),
        migrations.AddIndex(
            model_name="jobrecommendationevent",
            index=models.Index(
                fields=["job", "event_type"], name="idx_job_rec_event_job"
            ),
        ),
    ]
