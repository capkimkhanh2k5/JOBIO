import os
from datetime import timedelta
from pathlib import Path
from tempfile import TemporaryDirectory
from unittest.mock import patch

from django.test import SimpleTestCase, override_settings
from django.utils import timezone
from rest_framework.test import APITestCase

from apps.candidate.languages.models import Language
from apps.candidate.recruiter_certifications.models import RecruiterCertification
from apps.candidate.recruiter_cvs.models import RecruiterCV
from apps.candidate.recruiter_languages.models import RecruiterLanguage
from apps.candidate.recruiter_skills.models import RecruiterSkill
from apps.candidate.recruiters.models import Recruiter
from apps.candidate.skill_categories.models import SkillCategory
from apps.candidate.skills.models import Skill
from apps.company.companies.models import Company
from apps.core.users.models import CustomUser
from apps.recruitment.applications.models import Application
from apps.recruitment.job_categories.models import JobCategory
from apps.recruitment.job_skills.models import JobSkill
from apps.recruitment.jobs.models import (
    CandidateRecommendationEmbedding,
    Job,
    JobEmbedding,
    JobRecommendationEvent,
)


class EmbeddingModelCacheIntegrityTests(SimpleTestCase):
    @override_settings(RECOMMENDATION_EMBEDDING_PROVIDER="local")
    def test_missing_model_cache_is_not_blocking_first_download(self):
        from apps.recruitment.jobs.services import recommendations

        with TemporaryDirectory() as temp_dir, patch.dict(
            os.environ,
            {
                "HF_HOME": temp_dir,
                "HUGGINGFACE_HUB_CACHE": str(Path(temp_dir) / "hub"),
            },
            clear=False,
        ):
            result = recommendations.verify_embedding_model_cache_integrity(
                "BAAI/bge-m3"
            )

        self.assertTrue(result["ok"])
        self.assertEqual(result["reason"], "model_not_cached")

    @override_settings(RECOMMENDATION_EMBEDDING_PROVIDER="local")
    def test_safetensors_cache_is_accepted(self):
        from apps.recruitment.jobs.services import recommendations

        with TemporaryDirectory() as temp_dir, patch.dict(
            os.environ,
            {
                "HF_HOME": temp_dir,
                "HUGGINGFACE_HUB_CACHE": str(Path(temp_dir) / "hub"),
            },
            clear=False,
        ):
            model_dir = Path(temp_dir) / "hub" / "models--BAAI--bge-m3"
            snapshot_dir = model_dir / "snapshots" / "abc"
            snapshot_dir.mkdir(parents=True)
            (snapshot_dir / "model.safetensors").write_bytes(b"safe")

            result = recommendations.verify_embedding_model_cache_integrity(
                "BAAI/bge-m3"
            )

        self.assertTrue(result["ok"])
        self.assertEqual(result["reason"], "safetensors_available")
        self.assertEqual(len(result["safe_weight_files"]), 1)

    @override_settings(RECOMMENDATION_EMBEDDING_PROVIDER="local")
    def test_pickle_only_cache_is_marked_unsafe(self):
        from apps.recruitment.jobs.services import recommendations

        with TemporaryDirectory() as temp_dir, patch.dict(
            os.environ,
            {
                "HF_HOME": temp_dir,
                "HUGGINGFACE_HUB_CACHE": str(Path(temp_dir) / "hub"),
            },
            clear=False,
        ):
            model_dir = Path(temp_dir) / "hub" / "models--BAAI--bge-m3"
            snapshot_dir = model_dir / "snapshots" / "abc"
            snapshot_dir.mkdir(parents=True)
            (snapshot_dir / "pytorch_model.bin").write_bytes(b"pickle")

            result = recommendations.verify_embedding_model_cache_integrity(
                "BAAI/bge-m3"
            )

        self.assertFalse(result["ok"])
        self.assertEqual(result["reason"], "pickle_weight_cache_without_safetensors")
        self.assertEqual(len(result["risky_weight_files"]), 1)


@override_settings(RECOMMENDATION_SEMANTIC_ENABLED=False)
class HybridRecommendationApiTests(APITestCase):
    def setUp(self):
        from django.core.cache import cache

        cache.clear()
        self.company_user = CustomUser.objects.create_user(
            email="company@example.test",
            password="password123",
            full_name="Company",
            role="company",
        )
        self.candidate_user = CustomUser.objects.create_user(
            email="candidate@example.test",
            password="password123",
            full_name="Candidate",
            role="candidate",
        )
        self.other_user = CustomUser.objects.create_user(
            email="other-candidate@example.test",
            password="password123",
            full_name="Other Candidate",
            role="candidate",
        )
        self.company = Company.objects.create(
            user=self.company_user,
            company_name="JOBIO Labs",
            slug="jobio-labs",
            description="Hiring engineers",
            verification_status=Company.VerificationStatus.VERIFIED,
        )
        self.recruiter = Recruiter.objects.create(
            user=self.candidate_user,
            current_position="Python Developer",
            years_of_experience=3,
            profile_completeness_score=90,
        )
        self.other_recruiter = Recruiter.objects.create(user=self.other_user)
        self.category = JobCategory.objects.create(
            name="Engineering", slug="engineering"
        )
        self.skill_category = SkillCategory.objects.create(
            name="Programming", slug="programming"
        )
        self.python = Skill.objects.create(
            name="Python", slug="python", category=self.skill_category, is_active=True
        )
        self.django = Skill.objects.create(
            name="Django", slug="django", category=self.skill_category, is_active=True
        )
        RecruiterSkill.objects.create(recruiter=self.recruiter, skill=self.python)
        self.cv = RecruiterCV.objects.create(
            recruiter=self.recruiter,
            cv_name="Python CV",
            cv_data={"skills": [{"name": "Python"}]},
        )
        self.other_cv = RecruiterCV.objects.create(
            recruiter=self.other_recruiter,
            cv_name="Other CV",
            cv_data={"skills": [{"name": "Django"}]},
        )
        self.matching_job = self._job("Backend Python Developer", "python-backend")
        JobSkill.objects.create(
            job=self.matching_job, skill=self.python, is_required=True
        )
        self.expired_job = self._job(
            "Expired Python Developer",
            "expired-python",
            deadline=timezone.localdate() - timedelta(days=1),
        )
        JobSkill.objects.create(
            job=self.expired_job, skill=self.python, is_required=True
        )
        self.applied_job = self._job("Applied Python Developer", "applied-python")
        JobSkill.objects.create(
            job=self.applied_job, skill=self.python, is_required=True
        )
        Application.objects.create(
            recruiter=self.recruiter, job=self.applied_job, cv=self.cv
        )
        self.client.force_authenticate(self.candidate_user)

    def _job(self, title, slug, deadline=None):
        return Job.objects.create(
            company=self.company,
            title=title,
            slug=slug,
            category=self.category,
            job_type="full-time",
            level="junior",
            description=f"{title} description",
            requirements="Python APIs",
            application_deadline=deadline or timezone.localdate() + timedelta(days=30),
            status=Job.Status.PUBLISHED,
            created_by=self.company_user,
            published_at=timezone.now(),
        )

    def test_recommendations_return_v2_envelope_with_rule_based_fallback(self):
        response = self.client.get(f"/api/jobs/recommendations/?cv_id={self.cv.id}")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["source"], "cv")
        self.assertEqual(response.data["semantic_status"], "disabled")
        self.assertEqual(response.data["model_version"], "hybrid-v2-1024")
        self.assertGreaterEqual(len(response.data["results"]), 1)
        result_ids = {item["id"] for item in response.data["results"]}
        self.assertIn(self.matching_job.id, result_ids)
        self.assertNotIn(self.expired_job.id, result_ids)
        self.assertNotIn(self.applied_job.id, result_ids)
        first = response.data["results"][0]
        self.assertIn("match_score", first)
        self.assertIn("score_breakdown", first)
        self.assertIn("matched_skills", first)

    def test_cv_must_belong_to_authenticated_candidate(self):
        response = self.client.get(
            f"/api/jobs/recommendations/?cv_id={self.other_cv.id}"
        )

        self.assertEqual(response.status_code, 404)

    def test_invalid_cv_id_returns_400(self):
        response = self.client.get("/api/jobs/recommendations/?cv_id=abc")

        self.assertEqual(response.status_code, 400)

    def test_recommendation_events_are_logged(self):
        response = self.client.post(
            "/api/jobs/recommendations/events/",
            {
                "events": [
                    {
                        "job_id": self.matching_job.id,
                        "event_type": "impression",
                        "rank_position": 1,
                        "match_score_at_time": 80,
                        "score_breakdown": {"skill": 25},
                        "surface": "candidate_suggested_jobs_cv",
                        "algorithm_version": "hybrid-v2-1024",
                        "source_type": "cv",
                        "source_id": self.cv.id,
                        "request_id": "test-request",
                    }
                ]
            },
            format="json",
        )

        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data["created"], 1)
        event = JobRecommendationEvent.objects.get()
        self.assertEqual(event.job, self.matching_job)
        self.assertEqual(event.cv, self.cv)
        self.assertEqual(event.event_type, "impression")
        self.assertEqual(event.rank, 1)
        self.assertEqual(event.score, 80)
        self.assertEqual(event.surface, "candidate_suggested_jobs_cv")
        self.assertEqual(event.algorithm_version, "hybrid-v2-1024")

    @override_settings(RECOMMENDATION_EVENT_BATCH_LIMIT=2)
    def test_recommendation_events_rejects_oversized_batch(self):
        response = self.client.post(
            "/api/jobs/recommendations/events/",
            {
                "events": [
                    {"job_id": self.matching_job.id, "event_type": "impression"},
                    {"job_id": self.matching_job.id, "event_type": "click"},
                    {"job_id": self.matching_job.id, "event_type": "save"},
                ]
            },
            format="json",
        )

        self.assertEqual(response.status_code, 400)
        self.assertEqual(JobRecommendationEvent.objects.count(), 0)

    def test_recommendation_events_ignore_non_public_or_malformed_items(self):
        draft_job = self._job("Draft Python Developer", "draft-python")
        draft_job.status = Job.Status.DRAFT
        draft_job.save(update_fields=["status"])

        response = self.client.post(
            "/api/jobs/recommendations/events/",
            {
                "events": [
                    {
                        "job_id": draft_job.id,
                        "event_type": "impression",
                        "rank_position": 1,
                    },
                    {
                        "job_id": self.matching_job.id,
                        "event_type": "click",
                        "rank_position": "not-a-number",
                        "match_score_at_time": "bad-score",
                        "score_breakdown": "bad-breakdown",
                        "source_id": "bad-source",
                    },
                    "bad-event",
                ]
            },
            format="json",
        )

        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data["created"], 1)
        event = JobRecommendationEvent.objects.get()
        self.assertEqual(event.job_id, self.matching_job.id)
        self.assertEqual(event.event_type, "click")
        self.assertIsNone(event.rank)
        self.assertIsNone(event.score)
        self.assertEqual(event.score_breakdown, {})

    def test_job_embedding_text_prioritizes_match_signals_before_low_signal_fields(
        self,
    ):
        long_description = "Build backend APIs and authentication. " * 80
        long_benefits = "Lunch allowance and team activities. " * 80
        job = self._job("Senior Backend Developer", "senior-backend-text-order")
        job.level = "senior"
        job.description = long_description
        job.benefits = long_benefits
        job.is_remote = True
        job.save(
            update_fields=[
                "level",
                "description",
                "benefits",
                "is_remote",
                "updated_at",
            ]
        )
        JobSkill.objects.create(job=job, skill=self.python, is_required=True)

        from apps.recruitment.jobs.services import recommendations

        text = recommendations.build_job_recommendation_text(job)

        self.assertLess(text.index("Title:"), text.index("Required skills:"))
        self.assertLess(text.index("Required skills:"), text.index("Seniority:"))
        self.assertLess(text.index("Seniority:"), text.index("Workplace:"))
        self.assertLess(text.index("Workplace:"), text.index("Responsibilities:"))
        self.assertLess(text.index("Responsibilities:"), text.index("Benefits:"))
        self.assertLessEqual(len(text.split("Benefits: ", 1)[1]), 520)


@override_settings(
    RECOMMENDATION_SEMANTIC_ENABLED=True,
    RECOMMENDATION_EMBEDDING_PROVIDER="fake",
    RECOMMENDATION_SYNC_EMBEDDINGS=True,
)
class HybridRecommendationEmbeddingTests(APITestCase):
    def test_fake_provider_generates_candidate_embedding_without_openai_key(self):
        user = CustomUser.objects.create_user(
            email="semantic@example.test",
            password="password123",
            full_name="Semantic Candidate",
            role="candidate",
        )
        recruiter = Recruiter.objects.create(user=user, bio="Data engineer with Python")

        from apps.recruitment.jobs.services.recommendations import (
            generate_candidate_embedding,
        )

        result = generate_candidate_embedding(recruiter.id)

        self.assertEqual(result["status"], "ready")
        record = CandidateRecommendationEmbedding.objects.get(recruiter=recruiter)
        self.assertEqual(record.status, "ready")
        self.assertEqual(record.model, "fake-embedding")
        self.assertEqual(record.model_version, "hybrid-v2-1024")
        self.assertEqual(record.dimensions, 1024)
        self.assertEqual(len(record.embedding), 1024)

    def test_embedding_generation_rejects_wrong_dimension(self):
        user = CustomUser.objects.create_user(
            email="wrong-dimension@example.test",
            password="password123",
            full_name="Wrong Dimension",
            role="candidate",
        )
        recruiter = Recruiter.objects.create(user=user, bio="Python engineer")

        from apps.recruitment.jobs.services import recommendations

        class WrongDimensionProvider:
            def embed(self, text):
                return recommendations.EmbeddingResult(
                    vector=[0.1, 0.2, 0.3],
                    model="wrong-dimension",
                )

        with patch.object(
            recommendations,
            "get_embedding_provider",
            return_value=WrongDimensionProvider(),
        ):
            result = recommendations.generate_candidate_embedding(recruiter.id)

        self.assertEqual(result["status"], "failed")
        self.assertIn("embedding_dimension_mismatch", result["reason"])
        record = CandidateRecommendationEmbedding.objects.get(recruiter=recruiter)
        self.assertEqual(record.status, CandidateRecommendationEmbedding.Status.FAILED)

    def test_candidate_embeddings_are_separated_by_profile_and_each_cv(self):
        user = CustomUser.objects.create_user(
            email="multi-cv@example.test",
            password="password123",
            full_name="Multi CV",
            role="candidate",
        )
        recruiter = Recruiter.objects.create(user=user, bio="Backend engineer")
        cv_backend = RecruiterCV.objects.create(
            recruiter=recruiter,
            cv_name="Backend CV",
            cv_data={"skills": [{"name": "Python"}]},
        )
        cv_frontend = RecruiterCV.objects.create(
            recruiter=recruiter,
            cv_name="Frontend CV",
            cv_data={"skills": [{"name": "React.js"}]},
        )

        from apps.recruitment.jobs.services import recommendations

        recommendations.generate_candidate_embedding(recruiter.id)
        recommendations.generate_candidate_embedding(recruiter.id, cv_backend.id)
        recommendations.generate_candidate_embedding(recruiter.id, cv_frontend.id)

        self.assertEqual(
            CandidateRecommendationEmbedding.objects.filter(
                recruiter=recruiter
            ).count(),
            3,
        )
        profile_record = CandidateRecommendationEmbedding.objects.get(
            recruiter=recruiter,
            source_type=CandidateRecommendationEmbedding.SourceType.PROFILE,
            cv__isnull=True,
        )
        backend_record = CandidateRecommendationEmbedding.objects.get(
            recruiter=recruiter,
            source_type=CandidateRecommendationEmbedding.SourceType.CV,
            cv=cv_backend,
        )
        frontend_record = CandidateRecommendationEmbedding.objects.get(
            recruiter=recruiter,
            source_type=CandidateRecommendationEmbedding.SourceType.CV,
            cv=cv_frontend,
        )
        self.assertIsNone(profile_record.cv_id)
        self.assertEqual(backend_record.cv_id, cv_backend.id)
        self.assertEqual(frontend_record.cv_id, cv_frontend.id)
        self.assertEqual(len(profile_record.embedding), 1024)
        self.assertEqual(len(backend_record.embedding), 1024)
        self.assertEqual(len(frontend_record.embedding), 1024)
        self.assertTrue(profile_record.source_hash)

    def test_featured_is_not_counted_inside_freshness_score(self):
        from apps.recruitment.jobs.services import recommendations

        job = Job(
            title="Old featured job",
            featured=True,
            published_at=timezone.now() - timedelta(days=60),
        )
        job.active_featured = 1

        self.assertEqual(recommendations._freshness_score(job), 1)


@override_settings(RECOMMENDATION_VECTOR_STORE="pgvector")
class PGVectorRecommendationRecallTests(APITestCase):
    def test_pgvector_recall_is_filtered_by_postgres_eligibility(self):
        company_user = CustomUser.objects.create_user(
            email="pgvector-company@example.test",
            password="password123",
            full_name="Company",
            role="company",
        )
        candidate_user = CustomUser.objects.create_user(
            email="pgvector-candidate@example.test",
            password="password123",
            full_name="Candidate",
            role="candidate",
        )
        company = Company.objects.create(
            user=company_user,
            company_name="PGVector Labs",
            verification_status=Company.VerificationStatus.VERIFIED,
        )
        recruiter = Recruiter.objects.create(user=candidate_user)
        category = JobCategory.objects.create(
            name="PGVector Engineering", slug="pgvector-eng"
        )
        allowed_job = Job.objects.create(
            company=company,
            title="Allowed Job",
            slug="allowed-pgvector-job",
            category=category,
            job_type="full-time",
            level="junior",
            description="Allowed",
            requirements="Python",
            status=Job.Status.PUBLISHED,
            published_at=timezone.now(),
            created_by=company_user,
        )
        rejected_job = Job.objects.create(
            company=company,
            title="Rejected Job",
            slug="rejected-pgvector-job",
            category=category,
            job_type="full-time",
            level="junior",
            description="Rejected",
            requirements="Python",
            status=Job.Status.PUBLISHED,
            moderation_status=Job.ModerationStatus.REJECTED,
            published_at=timezone.now(),
            created_by=company_user,
        )
        from apps.recruitment.jobs.services import recommendations

        candidate_vector = [1.0] + [0.0] * 1023
        record = CandidateRecommendationEmbedding.objects.create(
            recruiter=recruiter,
            source_type=CandidateRecommendationEmbedding.SourceType.PROFILE,
            source_hash="candidate-hash",
            status=CandidateRecommendationEmbedding.Status.READY,
            model="fake-embedding",
            model_version=recommendations.MODEL_VERSION,
            dimensions=1024,
            embedding=candidate_vector,
        )
        JobEmbedding.objects.create(
            job=allowed_job,
            source_hash="allowed-hash",
            status=JobEmbedding.Status.READY,
            model="fake-embedding",
            model_version=recommendations.MODEL_VERSION,
            dimensions=1024,
            embedding=[0.9, 0.1] + [0.0] * 1022,
        )
        JobEmbedding.objects.create(
            job=rejected_job,
            source_hash="rejected-hash",
            status=JobEmbedding.Status.READY,
            model="fake-embedding",
            model_version=recommendations.MODEL_VERSION,
            dimensions=1024,
            embedding=[1.0] + [0.0] * 1023,
        )

        result = recommendations._semantic_recall(recruiter, record)

        self.assertIn(allowed_job.id, result)
        self.assertNotIn(rejected_job.id, result)

    @override_settings(
        RECOMMENDATION_EMBEDDING_PROVIDER="fake",
        RECOMMENDATION_SEMANTIC_ENABLED=True,
    )
    def test_job_embedding_task_is_idempotent_and_skips_when_pgvector_is_fresh(self):
        company_user = CustomUser.objects.create_user(
            email="pgvector-idempotent-company@example.test",
            password="password123",
            full_name="Company",
            role="company",
        )
        company = Company.objects.create(
            user=company_user,
            company_name="Idempotent Labs",
            verification_status=Company.VerificationStatus.VERIFIED,
        )
        category = JobCategory.objects.create(
            name="Idempotent Engineering", slug="idempotent-eng"
        )
        job = Job.objects.create(
            company=company,
            title="Backend Developer",
            slug="idempotent-backend-job",
            category=category,
            job_type="full-time",
            level="junior",
            description="Build APIs",
            requirements="Python",
            status=Job.Status.PUBLISHED,
            published_at=timezone.now(),
            created_by=company_user,
        )

        from apps.recruitment.jobs.services import recommendations

        first = recommendations.generate_job_embedding(job.id)
        second = recommendations.generate_job_embedding(job.id)

        self.assertEqual(first["status"], "ready")
        self.assertEqual(second["status"], "skipped")
        self.assertEqual(JobEmbedding.objects.filter(job=job).count(), 1)
        record = JobEmbedding.objects.get(job=job)
        self.assertEqual(record.model_version, recommendations.MODEL_VERSION)
        self.assertEqual(record.dimensions, 1024)
        self.assertEqual(len(record.embedding), 1024)

    @override_settings(
        RECOMMENDATION_EMBEDDING_PROVIDER="fake",
        RECOMMENDATION_SEMANTIC_ENABLED=True,
    )
    def test_job_embedding_rebuilds_when_pgvector_vector_is_missing(self):
        company_user = CustomUser.objects.create_user(
            email="pgvector-missing-company@example.test",
            password="password123",
            full_name="Company",
            role="company",
        )
        company = Company.objects.create(
            user=company_user,
            company_name="Missing Vector Labs",
            verification_status=Company.VerificationStatus.VERIFIED,
        )
        category = JobCategory.objects.create(
            name="Missing Engineering", slug="missing-eng"
        )
        job = Job.objects.create(
            company=company,
            title="Backend Developer",
            slug="missing-vector-backend-job",
            category=category,
            job_type="full-time",
            level="junior",
            description="Build APIs",
            requirements="Python",
            status=Job.Status.PUBLISHED,
            published_at=timezone.now(),
            created_by=company_user,
        )

        from apps.recruitment.jobs.services import recommendations

        first = recommendations.generate_job_embedding(job.id)
        JobEmbedding.objects.filter(job=job).update(embedding=None)
        second = recommendations.generate_job_embedding(job.id)

        self.assertEqual(first["status"], "ready")
        self.assertEqual(second["status"], "ready")
        self.assertEqual(len(JobEmbedding.objects.get(job=job).embedding), 1024)


class EmbeddingTaskEnqueueLockTests(APITestCase):
    def test_duplicate_candidate_enqueue_is_skipped(self):
        from apps.recruitment.jobs.services import recommendations

        with (
            patch("apps.core.caching.CacheService.add", return_value=False),
            patch(
                "apps.recruitment.jobs.tasks.generate_candidate_embedding_task.delay"
            ) as delay,
        ):
            recommendations._safe_delay_candidate(
                recruiter_id=123,
                cv_id=None,
                source_type=CandidateRecommendationEmbedding.SourceType.PROFILE,
            )

        delay.assert_not_called()

    def test_candidate_enqueue_lock_is_released_when_delay_fails(self):
        from apps.recruitment.jobs.services import recommendations

        with (
            patch("apps.core.caching.CacheService.add", return_value=True),
            patch("apps.core.caching.CacheService.delete") as delete,
            patch(
                "apps.recruitment.jobs.tasks.generate_candidate_embedding_task.delay",
                side_effect=RuntimeError("broker down"),
            ),
        ):
            recommendations._safe_delay_candidate(
                recruiter_id=123,
                cv_id=None,
                source_type=CandidateRecommendationEmbedding.SourceType.PROFILE,
            )

        delete.assert_called_once()


class PgVectorQueryTuningTests(SimpleTestCase):
    @override_settings(RECOMMENDATION_PGVECTOR_EF_SEARCH=120)
    def test_semantic_recall_sets_hnsw_ef_search_before_query(self):
        from apps.recruitment.jobs.services import recommendations

        class FakeCursor:
            def __init__(self):
                self.calls = []

            def __enter__(self):
                return self

            def __exit__(self, exc_type, exc, tb):
                return False

            def execute(self, sql, params=None):
                self.calls.append((sql, params))

        class FakeConnection:
            vendor = "postgresql"

            def __init__(self, cursor):
                self._cursor = cursor

            def cursor(self):
                return self._cursor

        class FakeAtomic:
            def __enter__(self):
                return self

            def __exit__(self, exc_type, exc, tb):
                return False

        class EmptyRecords:
            def annotate(self, *args, **kwargs):
                return self

            def order_by(self, *args):
                return self

            def __getitem__(self, value):
                return []

        cursor = FakeCursor()
        with (
            patch.object(recommendations, "connection", FakeConnection(cursor)),
            patch.object(recommendations.transaction, "atomic", lambda: FakeAtomic()),
            patch.object(
                recommendations,
                "_semantic_job_embedding_queryset",
                return_value=EmptyRecords(),
            ),
        ):
            result = recommendations._semantic_recall_pgvector(
                recruiter=None,
                embedding=[0.0] * 1024,
                model="fake-embedding",
            )

        self.assertEqual(result, {})
        self.assertEqual(
            cursor.calls,
            [("SET LOCAL hnsw.ef_search = %s", [120])],
        )


class RecommendationSignalCoverageTests(APITestCase):
    def setUp(self):
        self.user = CustomUser.objects.create_user(
            email="signal-candidate@example.test",
            password="password123",
            full_name="Signal Candidate",
            role="candidate",
        )
        self.recruiter = Recruiter.objects.create(user=self.user)
        self.company_user = CustomUser.objects.create_user(
            email="signal-company@example.test",
            password="password123",
            full_name="Signal Company",
            role="company",
        )
        self.company = Company.objects.create(
            user=self.company_user,
            company_name="Signal Labs",
            verification_status=Company.VerificationStatus.VERIFIED,
        )
        self.category = JobCategory.objects.create(
            name="Signal Engineering", slug="signal-engineering"
        )

    def test_certification_change_refreshes_profile_embedding(self):
        from apps.recruitment.jobs.services import recommendations

        with (
            patch.object(
                recommendations, "schedule_candidate_embedding_refresh"
            ) as schedule,
            self.captureOnCommitCallbacks(execute=True),
        ):
            RecruiterCertification.objects.create(
                recruiter=self.recruiter,
                certification_name="AWS Certified Developer",
                issuing_organization="AWS",
            )

        schedule.assert_called_with(self.recruiter.id)

    def test_language_change_refreshes_profile_embedding(self):
        language = Language.objects.create(
            language_code="en",
            language_name="English",
        )
        from apps.recruitment.jobs.services import recommendations

        with (
            patch.object(
                recommendations, "schedule_candidate_embedding_refresh"
            ) as schedule,
            self.captureOnCommitCallbacks(execute=True),
        ):
            RecruiterLanguage.objects.create(
                recruiter=self.recruiter,
                language=language,
                proficiency_level="advanced",
            )

        schedule.assert_called_with(self.recruiter.id)

    def test_cv_data_change_refreshes_cv_embedding(self):
        from apps.recruitment.jobs.services import recommendations

        with (
            patch.object(
                recommendations, "schedule_candidate_embedding_refresh"
            ) as schedule,
            self.captureOnCommitCallbacks(execute=True),
        ):
            cv = RecruiterCV.objects.create(
                recruiter=self.recruiter,
                cv_name="Parsed CV",
                cv_data={"skills": [{"name": "Python"}]},
            )

        schedule.assert_called_with(self.recruiter.id, cv.id, source_type="cv")

    def test_inactive_job_save_still_schedules_embedding_cleanup(self):
        job = Job.objects.create(
            company=self.company,
            title="Draft backend job",
            slug="draft-backend-job-signal",
            category=self.category,
            job_type="full-time",
            level="junior",
            description="Draft",
            requirements="Python",
            status=Job.Status.PUBLISHED,
            published_at=timezone.now(),
            created_by=self.company_user,
        )

        from apps.recruitment.jobs.services import recommendations

        with (
            patch.object(recommendations, "schedule_job_embedding_refresh") as schedule,
            self.captureOnCommitCallbacks(execute=True),
        ):
            job.status = Job.Status.CLOSED
            job.save(update_fields=["status"])

        schedule.assert_called_with(job.id)

    def test_job_delete_removes_vector_after_commit(self):
        job = Job.objects.create(
            company=self.company,
            title="Deleted backend job",
            slug="deleted-backend-job-signal",
            category=self.category,
            job_type="full-time",
            level="junior",
            description="Delete",
            requirements="Python",
            status=Job.Status.PUBLISHED,
            published_at=timezone.now(),
            created_by=self.company_user,
        )
        job_id = job.id

        from apps.recruitment.jobs.services import recommendations

        with (
            patch.object(recommendations, "remove_job_from_vector_store") as remove,
            self.captureOnCommitCallbacks(execute=True),
        ):
            job.delete()

        remove.assert_called_with(job_id)


class CalibrationAndPenaltyUnitTests(SimpleTestCase):
    def test_calibrated_semantic_score_scaling(self):
        from apps.recruitment.jobs.services.recommendations import (
            _calibrated_semantic_score,
        )

        self.assertEqual(_calibrated_semantic_score(None), 0)
        self.assertEqual(_calibrated_semantic_score(-0.2), 0)
        self.assertEqual(_calibrated_semantic_score(0.0), 0)
        # Below baseline (0.55): max 25% of 50 = ~12 points
        self.assertLessEqual(_calibrated_semantic_score(0.50), 12)
        # Mid-high: 0.75 is well scaled
        mid_score = _calibrated_semantic_score(0.75)
        self.assertGreater(mid_score, 25)
        self.assertLess(mid_score, 50)
        # 0.90 or above reaches max 50
        self.assertEqual(_calibrated_semantic_score(0.90), 50)
        self.assertEqual(_calibrated_semantic_score(0.95), 50)

    def test_penalty_multiplier_for_experience_deficit(self):
        from apps.recruitment.jobs.services.recommendations import (
            _calculate_penalty_multiplier,
        )

        job = Job(experience_years_min=5, is_remote=True)
        # Intern with 0 years applying for 5-year job (deficit = 5 >= 4) -> 0.60
        candidate_intern = {"years_of_experience": 0}
        self.assertAlmostEqual(
            _calculate_penalty_multiplier(candidate_intern, job, {}), 0.60
        )

        # Junior with 2 years (deficit = 3) -> 0.75
        candidate_junior = {"years_of_experience": 2}
        self.assertAlmostEqual(
            _calculate_penalty_multiplier(candidate_junior, job, {}), 0.75
        )

        # Senior with 5 years (no deficit) -> 1.0
        candidate_senior = {"years_of_experience": 5}
        self.assertAlmostEqual(
            _calculate_penalty_multiplier(candidate_senior, job, {}), 1.0
        )

    def test_penalty_multiplier_for_onsite_location_mismatch(self):
        from apps.recruitment.jobs.services.recommendations import (
            _calculate_penalty_multiplier,
        )

        job_onsite = Job(experience_years_min=2, is_remote=False)
        candidate = {"years_of_experience": 2}
        # Location match = 0.0 -> penalty 0.75
        self.assertAlmostEqual(
            _calculate_penalty_multiplier(candidate, job_onsite, {"location": 0.0}),
            0.75,
        )
        # Location match > 0 -> no location penalty
        self.assertAlmostEqual(
            _calculate_penalty_multiplier(candidate, job_onsite, {"location": 1.0}),
            1.0,
        )


@override_settings(RECOMMENDATION_SEMANTIC_ENABLED=False)
class EnhancedRecommendationFlowTests(APITestCase):
    def setUp(self):
        from django.core.cache import cache

        cache.clear()
        self.company_user = CustomUser.objects.create_user(
            email="enh-company@example.test",
            password="password123",
            full_name="Enh Company",
            role="company",
        )
        self.candidate_user = CustomUser.objects.create_user(
            email="enh-candidate@example.test",
            password="password123",
            full_name="Enh Candidate",
            role="candidate",
        )
        self.company = Company.objects.create(
            user=self.company_user,
            company_name="Enh Labs",
            slug="enh-labs",
            verification_status=Company.VerificationStatus.VERIFIED,
        )
        self.recruiter = Recruiter.objects.create(
            user=self.candidate_user,
            current_position="Python Backend Developer",
            years_of_experience=3,
        )
        self.category = JobCategory.objects.create(name="IT", slug="it-enh")
        self.skill_category = SkillCategory.objects.create(
            name="Programming", slug="prog-enh"
        )
        self.python = Skill.objects.create(
            name="Python", slug="python-enh", category=self.skill_category, is_active=True
        )
        RecruiterSkill.objects.create(recruiter=self.recruiter, skill=self.python)
        self.cv = RecruiterCV.objects.create(
            recruiter=self.recruiter,
            cv_name="Python CV",
            cv_data={"skills": [{"name": "Python"}]},
        )
        self.job1 = Job.objects.create(
            company=self.company,
            title="Backend Python Developer 1",
            slug="py-job-1",
            category=self.category,
            job_type="full-time",
            level="junior",
            status=Job.Status.PUBLISHED,
            created_by=self.company_user,
            published_at=timezone.now(),
        )
        JobSkill.objects.create(job=self.job1, skill=self.python, is_required=True)

        self.job2 = Job.objects.create(
            company=self.company,
            title="Backend Python Developer 2",
            slug="py-job-2",
            category=self.category,
            job_type="full-time",
            level="junior",
            status=Job.Status.PUBLISHED,
            created_by=self.company_user,
            published_at=timezone.now(),
        )
        JobSkill.objects.create(job=self.job2, skill=self.python, is_required=True)
        self.client.force_authenticate(self.candidate_user)

    def test_dismissed_job_is_excluded_from_recommendations(self):
        from apps.recruitment.jobs.services.recommendations import (
            recommend_jobs_for_recruiter,
        )

        # Initially both jobs recommended
        res1 = recommend_jobs_for_recruiter(self.recruiter, cv_id=self.cv.id, bypass_cache=True)
        job_ids_1 = [item["job"].id for item in res1["results"]]
        self.assertIn(self.job1.id, job_ids_1)
        self.assertIn(self.job2.id, job_ids_1)

        # Candidate dismisses job1
        JobRecommendationEvent.objects.create(
            recruiter=self.recruiter,
            job=self.job1,
            event_type=JobRecommendationEvent.EventType.DISMISS,
        )

        # Subsequent recommendation should exclude job1
        res2 = recommend_jobs_for_recruiter(self.recruiter, cv_id=self.cv.id, bypass_cache=True)
        job_ids_2 = [item["job"].id for item in res2["results"]]
        self.assertNotIn(self.job1.id, job_ids_2)
        self.assertIn(self.job2.id, job_ids_2)

    def test_score_candidate_job_returns_unified_breakdown(self):
        from apps.recruitment.jobs.services.recommendations import (
            score_candidate_job,
        )

        result = score_candidate_job(self.recruiter, self.job1, self.cv)
        self.assertIn("match_score", result)
        self.assertIn("score_breakdown", result)
        self.assertIn("matched_skills", result)
        self.assertIn("penalty_multiplier", result["score_breakdown"])
        self.assertIn("Python", result["matched_skills"])

    def test_application_creation_stores_match_score_snapshot(self):
        from apps.recruitment.applications.services.applications import (
            ApplicationCreateInput,
            create_application,
        )

        app = create_application(
            self.recruiter,
            ApplicationCreateInput(job_id=self.job1.id, cv_id=self.cv.id),
        )
        self.assertIsNotNone(app.match_score)
        self.assertGreater(app.match_score, 0)
        self.assertIn("skill", app.score_breakdown)

