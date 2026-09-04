import hashlib
import logging
import math
import os
from dataclasses import dataclass
from datetime import timedelta
from functools import lru_cache
from pathlib import Path
from types import SimpleNamespace
from typing import Iterable

from django.conf import settings
from django.core.cache import cache
from django.db import connection, transaction
from django.db.models import Avg, Count, Q
from django.utils import timezone
from pgvector.django import CosineDistance

from apps.candidate.recruiter_cvs.models import RecruiterCV
from apps.candidate.recruiter_certifications.models import RecruiterCertification
from apps.candidate.recruiter_education.models import RecruiterEducation
from apps.candidate.recruiter_experience.models import RecruiterExperience
from apps.candidate.recruiter_languages.models import RecruiterLanguage
from apps.candidate.recruiter_projects.models import RecruiterProject
from apps.candidate.recruiter_skills.models import RecruiterSkill
from apps.recruitment.jobs.models import (
    CandidateRecommendationEmbedding,
    CandidateRecommendationProfile,
    Job,
    JobEmbedding,
    JobRecommendationEvent,
    JobRecommendationProfile,
)
from apps.recruitment.jobs.selectors.jobs import (
    _active_published_jobs,
    _category_score,
    _extract_candidate_data,
    _experience_level_score,
    _job_type_score,
    _location_score,
    _skill_match_score,
    _with_active_featured,
)
from apps.recruitment.jobs.services.normalization import (
    process_candidate_recommendation_profile,
    process_job_recommendation_profile,
)

logger = logging.getLogger(__name__)

MODEL_VERSION = "hybrid-v2-1024"
TAXONOMY_VERSION = getattr(settings, "RECOMMENDATION_TAXONOMY_VERSION", "taxonomy-v1")
DEFAULT_EMBEDDING_DIMENSIONS = 1024
SEMANTIC_RECALL_LIMIT = 100
STRUCTURED_RECALL_MULTIPLIER = 4
JOB_EMBEDDING_SHORT_TEXT_LIMIT = 500
JOB_EMBEDDING_LONG_TEXT_LIMIT = 1200
DEFAULT_RECOMMENDATION_EVENT_BATCH_LIMIT = 100
RECOMMENDATION_METRIC_TTL = 60 * 60 * 24 * 14
RECOMMENDATION_METRIC_NAMES = (
    "vector_upsert_failed_count",
    "vector_query_failed_count",
    "vector_missing_count",
    "semantic_recall_empty_count",
    "structured_fallback_used_count",
)
RISKY_MODEL_WEIGHT_SUFFIXES = (".bin", ".pth", ".pt", ".ckpt")
SAFE_MODEL_WEIGHT_SUFFIXES = (".safetensors",)


def _pgvector_ef_search() -> int:
    try:
        value = int(getattr(settings, "RECOMMENDATION_PGVECTOR_EF_SEARCH", 80))
    except (TypeError, ValueError):
        value = 80
    return max(10, min(value, 1000))


class EmbeddingUnavailable(RuntimeError):
    pass


class RecommendationCVNotFound(ValueError):
    pass


@dataclass
class EmbeddingResult:
    vector: list[float]
    model: str


class OpenAIEmbeddingProvider:
    def __init__(self):
        self.model = getattr(
            settings, "RECOMMENDATION_EMBEDDING_MODEL", "text-embedding-3-small"
        )
        self.dimensions = int(
            getattr(
                settings,
                "RECOMMENDATION_EMBEDDING_DIMENSIONS",
                DEFAULT_EMBEDDING_DIMENSIONS,
            )
            or DEFAULT_EMBEDDING_DIMENSIONS
        )

    def embed(self, text: str) -> EmbeddingResult:
        api_key = getattr(settings, "OPENAI_API_KEY", "") or ""
        if not api_key:
            raise EmbeddingUnavailable("missing_openai_api_key")

        from openai import OpenAI

        client = OpenAI(api_key=api_key)
        kwargs = {"model": self.model, "input": text}
        if self.dimensions:
            kwargs["dimensions"] = self.dimensions
        response = client.embeddings.create(**kwargs)
        return EmbeddingResult(vector=response.data[0].embedding, model=self.model)


class FakeEmbeddingProvider:
    def __init__(self):
        self.model = "fake-embedding"
        self.dimensions = int(
            getattr(
                settings,
                "RECOMMENDATION_EMBEDDING_DIMENSIONS",
                DEFAULT_EMBEDDING_DIMENSIONS,
            )
            or DEFAULT_EMBEDDING_DIMENSIONS
        )

    def embed(self, text: str) -> EmbeddingResult:
        digest = hashlib.sha256(text.encode("utf-8")).digest()
        vector = [
            ((digest[i % len(digest)] / 255.0) * 2) - 1 for i in range(self.dimensions)
        ]
        return EmbeddingResult(vector=_normalize_vector(vector), model=self.model)


class LocalSentenceTransformerEmbeddingProvider:
    def __init__(self):
        self.model = getattr(settings, "RECOMMENDATION_EMBEDDING_MODEL", "BAAI/bge-m3")

    def embed(self, text: str) -> EmbeddingResult:
        try:
            model = _get_sentence_transformer(self.model)
            vector = model.encode(
                text,
                normalize_embeddings=True,
                convert_to_numpy=True,
                show_progress_bar=False,
            )
            return EmbeddingResult(
                vector=[float(value) for value in vector.tolist()], model=self.model
            )
        except Exception as exc:
            logger.error(
                "LocalSentenceTransformerEmbeddingProvider failed to encode with model '%s' (text_length=%d): %s",
                self.model,
                len(text) if text else 0,
                exc,
                exc_info=True,
            )
            raise EmbeddingUnavailable(f"local_model_encode_failed:{exc}") from exc


@lru_cache(maxsize=2)
def _get_sentence_transformer(model_name: str):
    from sentence_transformers import SentenceTransformer

    preflight = verify_embedding_model_cache_integrity(model_name)
    if _require_safetensors() and not preflight["ok"]:
        raise EmbeddingUnavailable(preflight["reason"])

    model = SentenceTransformer(
        model_name,
        trust_remote_code=False,
        model_kwargs={"use_safetensors": True},
    )
    postflight = verify_embedding_model_cache_integrity(model_name)
    if _require_safetensors() and not postflight["ok"]:
        raise EmbeddingUnavailable(postflight["reason"])
    return model


def get_embedding_provider():
    if not getattr(settings, "RECOMMENDATION_SEMANTIC_ENABLED", True):
        raise EmbeddingUnavailable("semantic_disabled")
    provider = getattr(settings, "RECOMMENDATION_EMBEDDING_PROVIDER", "local")
    provider = str(provider or "local").strip().lower()
    if provider == "fake":
        return FakeEmbeddingProvider()
    if provider == "openai":
        return OpenAIEmbeddingProvider()
    if provider == "local":
        return LocalSentenceTransformerEmbeddingProvider()
    raise EmbeddingUnavailable(f"unsupported_embedding_provider:{provider}")


def build_job_recommendation_text(job: Job) -> str:
    profile = _job_recommendation_profile(job)
    skills = []
    for job_skill in job.required_skills.all():
        if not job_skill.skill_id or not job_skill.skill:
            continue
        kind = "required" if job_skill.is_required else "optional"
        years = (
            f", {job_skill.years_required} years" if job_skill.years_required else ""
        )
        level = (
            f", {job_skill.proficiency_level}" if job_skill.proficiency_level else ""
        )
        skills.append(f"{job_skill.skill.name} ({kind}{level}{years})")

    locations = []
    for location in job.locations.all():
        address = getattr(location, "address", None)
        province = getattr(address, "province", None) if address else None
        if province:
            locations.append(province.province_name)

    title = (
        profile.canonical_title.name
        if profile and profile.canonical_title
        else job.title
    )
    required_skills = (
        ", ".join(profile.skills_required)
        if profile and profile.skills_required
        else ", ".join(skills)
    )
    preferred_skills = (
        ", ".join(profile.skills_preferred)
        if profile and profile.skills_preferred
        else ""
    )
    location_text = (
        profile.location_city
        if profile and profile.location_city
        else ", ".join(sorted(set(locations)))
    )
    description = profile.description_clean if profile else (job.description or "")

    fields = [
        f"Title: {title}",
        f"Required skills: {required_skills}",
        f"Seniority: {profile.seniority if profile else job.level}",
        f"Workplace: {profile.workplace_type if profile else ('remote' if job.is_remote else 'onsite')}",
        f"Locations: {location_text}",
        f"Responsibilities: {_limit_embedding_field(description, JOB_EMBEDDING_LONG_TEXT_LIMIT)}",
        f"Raw title: {job.title}",
        f"Category: {job.category.name if job.category else ''}",
        f"Type: {job.job_type}",
        f"Experience: {job.experience_years_min}-{job.experience_years_max or 'open'} years",
        f"Preferred skills: {preferred_skills}",
        f"Salary: {job.salary_min or ''}-{job.salary_max or ''} {job.salary_currency or ''}",
        f"Requirements: {_limit_embedding_field(job.requirements or '', JOB_EMBEDDING_LONG_TEXT_LIMIT)}",
        f"Benefits: {_limit_embedding_field(job.benefits or '', JOB_EMBEDDING_SHORT_TEXT_LIMIT)}",
    ]
    return _compact_text(fields)


def build_candidate_recommendation_text(
    recruiter, cv: RecruiterCV | None = None
) -> str:
    if cv and cv.cv_data:
        if isinstance(cv.cv_data, dict) and cv.cv_data.get("canonical_english_text"):
            return str(cv.cv_data["canonical_english_text"])
        return _candidate_text_from_cv(cv.cv_data)

    profile = _candidate_recommendation_profile(recruiter)
    skills = [
        item.skill.name
        for item in RecruiterSkill.objects.filter(recruiter=recruiter).select_related(
            "skill"
        )
    ]
    experiences = [
        f"{item.job_title} at {item.company_name}: {item.description or ''}"
        for item in RecruiterExperience.objects.filter(recruiter=recruiter).order_by(
            "-start_date"
        )[:8]
    ]
    education = [
        f"{item.degree or ''} {item.field_of_study or ''} at {item.school_name}"
        for item in RecruiterEducation.objects.filter(recruiter=recruiter).order_by(
            "-start_date"
        )[:5]
    ]
    projects = [
        f"{item.project_name}: {item.description or ''} {item.technologies_used or ''}"
        for item in RecruiterProject.objects.filter(recruiter=recruiter).order_by(
            "-start_date"
        )[:8]
    ]
    certifications = [
        f"{item.certification_name} by {item.issuing_organization or ''}"
        for item in RecruiterCertification.objects.filter(recruiter=recruiter).order_by(
            "-issue_date"
        )[:8]
    ]
    languages = [
        f"{item.language.language_name if item.language_id else ''} ({item.proficiency_level})"
        for item in RecruiterLanguage.objects.filter(
            recruiter=recruiter
        ).select_related("language")
    ]
    province = ""
    if recruiter.address_id and getattr(recruiter.address, "province", None):
        province = recruiter.address.province.province_name

    return _compact_text(
        [
            f"Current position: {profile.current_title_canonical.name if profile and profile.current_title_canonical else recruiter.current_position or ''}",
            f"Raw current position: {recruiter.current_position or ''}",
            f"Bio: {recruiter.bio or ''}",
            f"Years of experience: {profile.years_experience if profile else recruiter.years_of_experience or 0}",
            f"Preferred locations: {', '.join(profile.preferred_locations) if profile else province}",
            f"Skills: {', '.join(profile.skills) if profile and profile.skills else ', '.join(skills)}",
            f"Experience: {' | '.join(experiences)}",
            f"Education: {' | '.join(education)}",
            f"Projects: {' | '.join(projects)}",
            f"Certifications: {' | '.join(certifications)}",
            f"Languages: {' | '.join(languages)}",
        ]
    )


def generate_job_embedding(job_id: int) -> dict:
    job = (
        Job.objects.filter(id=job_id)
        .select_related("company", "category", "address__province")
        .prefetch_related("required_skills__skill", "locations__address__province")
        .first()
    )
    if not job:
        remove_job_from_vector_store(job_id)
        return {"status": "failed", "reason": "job_not_found"}
    process_job_recommendation_profile(job)
    if (
        job.domain_status != Job.DomainStatus.IT_APPROVED
        or job.moderation_status != Job.ModerationStatus.APPROVED
        or job.status != Job.Status.PUBLISHED
    ):
        record, _ = JobEmbedding.objects.get_or_create(
            job=job, defaults={"source_hash": ""}
        )
        _mark_embedding(
            record,
            _hash_text(build_job_recommendation_text(job)),
            "skipped",
            "job_not_approved",
        )
        return {"status": "skipped", "reason": "job_not_approved"}
    text = build_job_recommendation_text(job)
    return _save_embedding(
        record=JobEmbedding.objects.get_or_create(
            job=job, defaults={"source_hash": ""}
        )[0],
        text=text,
    )


def generate_candidate_embedding(
    recruiter_id: int,
    cv_id: int | None = None,
    source_type: str = CandidateRecommendationEmbedding.SourceType.PROFILE,
) -> dict:
    from apps.candidate.recruiters.models import Recruiter

    recruiter = (
        Recruiter.objects.filter(id=recruiter_id)
        .select_related("user", "address__province")
        .first()
    )
    if not recruiter:
        return {"status": "failed", "reason": "recruiter_not_found"}

    cv = None
    if cv_id:
        cv = RecruiterCV.objects.filter(id=cv_id, recruiter=recruiter).first()
        if not cv:
            return {"status": "failed", "reason": "cv_not_found"}
        source_type = CandidateRecommendationEmbedding.SourceType.CV

    if not cv:
        process_candidate_recommendation_profile(recruiter)
    text = build_candidate_recommendation_text(recruiter, cv)
    record, _ = CandidateRecommendationEmbedding.objects.get_or_create(
        recruiter=recruiter,
        cv=cv,
        source_type=source_type,
        defaults={"source_hash": ""},
    )
    return _save_embedding(record=record, text=text)


def schedule_job_embedding_refresh(job_id: int) -> None:
    transaction.on_commit(lambda: _safe_delay_job(job_id))


def schedule_candidate_embedding_refresh(
    recruiter_id: int,
    cv_id: int | None = None,
    source_type: str = CandidateRecommendationEmbedding.SourceType.PROFILE,
) -> None:
    transaction.on_commit(
        lambda: _safe_delay_candidate(recruiter_id, cv_id, source_type)
    )


def invalidate_recommendations_cache(recruiter_id: int | None = None) -> None:
    """Invalidate recommendation response cache for a recruiter or global."""
    from apps.core.caching import CacheService

    try:
        if recruiter_id:
            CacheService.delete_pattern(f"recommendations:recruiter:{recruiter_id}")
        else:
            CacheService.delete_pattern("recommendations:recruiter")
    except Exception as exc:
        logger.debug("Recommendation cache invalidation skipped: %s", exc)


def recommend_jobs_for_recruiter(
    recruiter, cv_id: int | None = None, limit: int = 20, bypass_cache: bool = False
) -> dict:
    cv = _get_owned_cv(recruiter, cv_id)
    source_type = (
        CandidateRecommendationEmbedding.SourceType.CV
        if cv
        else CandidateRecommendationEmbedding.SourceType.PROFILE
    )
    source_id = cv.id if cv else recruiter.id
    candidate = _extract_candidate_data(cv or SimpleNamespace(cv_data={}), recruiter)
    embedding_record = _ensure_candidate_embedding(recruiter, cv, source_type)
    semantic_status = _semantic_status(embedding_record)

    from apps.core.caching import (
        CACHE_TIMEOUT_SHORT,
        CacheKeyBuilder,
        CacheService,
    )

    candidate_hash = (
        embedding_record.source_hash
        if embedding_record and embedding_record.source_hash
        else _hash_text(build_candidate_recommendation_text(recruiter, cv))
    )
    cache_key = CacheKeyBuilder.build(
        "recommendations",
        "recruiter",
        recruiter.id,
        cv.id if cv else "profile",
        candidate_hash,
        limit,
    )
    if not bypass_cache:
        cached_payload = CacheService.get(cache_key)
        if cached_payload and isinstance(cached_payload, dict):
            cached_items = cached_payload.get("items", [])
            job_ids = [
                it["job_id"]
                for it in cached_items
                if isinstance(it, dict) and "job_id" in it
            ]
            jobs = _jobs_by_id(job_ids)
            reconstructed_results = []
            for it in cached_items:
                job = jobs.get(it.get("job_id"))
                if job:
                    item_copy = dict(it)
                    item_copy["job"] = job
                    reconstructed_results.append(item_copy)
            if reconstructed_results:
                return {
                    **cached_payload.get("envelope", {}),
                    "results": reconstructed_results,
                }

    eligible_jobs = _eligible_jobs(recruiter)
    semantic_matches = _semantic_recall(recruiter, embedding_record)
    structured_ids = _structured_recall_ids(eligible_jobs, candidate, limit)
    fallback_ids = _fallback_job_ids(eligible_jobs, limit)
    if not semantic_matches and (structured_ids or fallback_ids):
        _increment_recommendation_metric("structured_fallback_used_count")
    job_ids = _ordered_unique(
        [*semantic_matches.keys(), *structured_ids, *fallback_ids]
    )
    jobs = _jobs_by_id(job_ids)

    scored = []
    for job_id in job_ids:
        job = jobs.get(job_id)
        if not job:
            continue
        scored.append(
            _score_recommendation(
                candidate=candidate,
                recruiter=recruiter,
                job=job,
                semantic_similarity=semantic_matches.get(job.id),
                semantic_status=semantic_status,
            )
        )

    scored.sort(
        key=lambda item: (
            -item["match_score"],
            -getattr(item["job"], "active_featured", 0),
            -(item["job"].published_at.timestamp() if item["job"].published_at else 0),
        )
    )

    items_to_cache = []
    for item in scored[:limit]:
        clean_item = {k: v for k, v in item.items() if k != "job"}
        clean_item["job_id"] = item["job"].id
        items_to_cache.append(clean_item)

    envelope = {
        "source": source_type,
        "source_id": source_id,
        "source_parse_status": _source_parse_status(cv),
        "semantic_status": semantic_status,
        "personalization_notice": _personalization_notice(
            semantic_status, semantic_matches
        ),
        "model_version": MODEL_VERSION,
        "taxonomy_version": TAXONOMY_VERSION,
    }

    try:
        CacheService.set(
            cache_key,
            {"envelope": envelope, "items": items_to_cache},
            timeout=CACHE_TIMEOUT_SHORT,
        )
    except Exception as exc:
        logger.debug("Could not cache recommendation response: %s", exc)

    return {
        **envelope,
        "results": scored[:limit],
    }


def record_recommendation_events(recruiter, events: Iterable[dict]) -> int:
    event_list = list(events)[: recommendation_event_batch_limit()]
    candidate_job_ids = {
        job_id
        for event in event_list
        if isinstance(event, dict)
        for job_id in [_positive_int_or_none(event.get("job_id"))]
        if job_id is not None
    }
    public_job_ids = set(
        _active_published_jobs(
            Job.objects.filter(id__in=candidate_job_ids)
        ).values_list("id", flat=True)
    )

    rows = []
    for event in event_list:
        if not isinstance(event, dict):
            continue
        job_id = _positive_int_or_none(event.get("job_id"))
        event_type = event.get("event_type")
        if (
            not job_id
            or job_id not in public_job_ids
            or event_type not in JobRecommendationEvent.EventType.values
        ):
            continue
        cv_id = (
            _positive_int_or_none(event.get("source_id"))
            if event.get("source_type") == "cv"
            else None
        )
        if (
            cv_id
            and not RecruiterCV.objects.filter(id=cv_id, recruiter=recruiter).exists()
        ):
            cv_id = None
        rows.append(
            JobRecommendationEvent(
                recruiter=recruiter,
                job_id=job_id,
                cv_id=cv_id,
                event_type=event_type,
                rank=_positive_int_or_none(
                    event.get("rank_position", event.get("rank"))
                ),
                score=_float_or_none(
                    event.get("match_score_at_time", event.get("score"))
                ),
                score_breakdown=(
                    event.get("score_breakdown")
                    if isinstance(event.get("score_breakdown"), dict)
                    else {}
                ),
                not_relevant_reason=str(event.get("not_relevant_reason") or "")[:255],
                surface=str(event.get("surface") or "")[:80],
                algorithm_version=str(event.get("algorithm_version") or MODEL_VERSION)[
                    :80
                ],
                source_type=event.get("source_type") or "profile",
                source_id=_positive_int_or_none(event.get("source_id")),
                request_id=str(event.get("request_id") or "")[:64],
            )
        )
    if not rows:
        return 0
    JobRecommendationEvent.objects.bulk_create(rows, ignore_conflicts=True)
    return len(rows)


def recommendation_event_batch_limit() -> int:
    try:
        return max(
            1,
            int(
                getattr(
                    settings,
                    "RECOMMENDATION_EVENT_BATCH_LIMIT",
                    DEFAULT_RECOMMENDATION_EVENT_BATCH_LIMIT,
                )
            ),
        )
    except (TypeError, ValueError):
        return DEFAULT_RECOMMENDATION_EVENT_BATCH_LIMIT


def _positive_int_or_none(value):
    try:
        number = int(value)
    except (TypeError, ValueError):
        return None
    return number if number > 0 else None


def _float_or_none(value):
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def _save_embedding(record, text: str) -> dict:
    source_hash = _hash_text(text)
    expected_model = _expected_embedding_model()
    if (
        record.status == record.Status.READY
        and record.source_hash == source_hash
        and record.model == expected_model
        and getattr(record, "model_version", "") == MODEL_VERSION
        and _vector_store_record_has_expected_embedding(record)
    ):
        return {"status": "skipped", "reason": "fresh"}
    if not text:
        _mark_embedding(record, source_hash, "skipped", "empty_text")
        return {"status": "skipped", "reason": "empty_text"}
    if not _vector_store_enabled():
        _mark_embedding(
            record,
            source_hash,
            "failed",
            "vector_store_disabled",
        )
        return {"status": "failed", "reason": "vector_store_disabled"}
    try:
        provider = get_embedding_provider()
        result = provider.embed(text[:12000])
        _validate_embedding_dimensions(result.vector, result.model)
    except Exception as exc:
        reason = str(exc)[:500] or exc.__class__.__name__
        _mark_embedding(record, source_hash, "failed", reason)
        return {"status": "failed", "reason": reason}

    vector = _normalize_vector(result.vector)
    if not _upsert_vector_store(
        record, vector, model=result.model, source_hash=source_hash
    ):
        _mark_embedding(record, source_hash, "failed", "vector_upsert_failed")
        return {"status": "failed", "reason": "vector_upsert_failed"}

    record.source_hash = source_hash
    record.model = result.model
    record.model_version = MODEL_VERSION
    record.dimensions = _expected_embedding_dimensions()
    record.status = record.Status.READY
    record.generated_at = timezone.now()
    record.error = ""
    record.save(
        update_fields=[
            "source_hash",
            "model",
            "model_version",
            "dimensions",
            "embedding",
            "status",
            "generated_at",
            "error",
            "updated_at",
        ]
    )
    return {"status": "ready", "model": result.model}


def _mark_embedding(record, source_hash, status, error):
    record.source_hash = source_hash
    record.status = status
    record.error = error
    record.generated_at = timezone.now()
    record.model_version = MODEL_VERSION
    record.dimensions = _expected_embedding_dimensions()
    record.embedding = None
    record.save(
        update_fields=[
            "source_hash",
            "model_version",
            "dimensions",
            "embedding",
            "status",
            "error",
            "generated_at",
            "updated_at",
        ]
    )


def _vector_store_enabled() -> bool:
    return (
        getattr(settings, "RECOMMENDATION_VECTOR_STORE", "pgvector").strip().lower()
        == "pgvector"
    )


def _upsert_vector_store(
    record,
    embedding,
    model: str | None = None,
    source_hash: str | None = None,
) -> bool:
    if not _vector_store_enabled() or not _vector_has_expected_dimensions(embedding):
        return False
    try:
        record.embedding = list(embedding)
        record.model = model or record.model
        record.model_version = MODEL_VERSION
        record.dimensions = _expected_embedding_dimensions()
        record.source_hash = source_hash or record.source_hash
        return True
    except Exception as exc:
        logger.warning("PGVector assignment failed: %s", exc)
        _increment_recommendation_metric("vector_upsert_failed_count")
        return False


def remove_job_from_vector_store(job_id: int) -> None:
    if not _vector_store_enabled():
        return
    try:
        JobEmbedding.objects.filter(job_id=int(job_id)).update(
            embedding=None,
            updated_at=timezone.now(),
        )
    except Exception as exc:
        logger.warning("PGVector job clear failed job=%s: %s", job_id, exc)


def _vector_store_record_state(record):
    if not _vector_store_enabled():
        return None
    vector = getattr(record, "embedding", None)
    if vector is None:
        return None
    if hasattr(vector, "tolist"):
        vector = vector.tolist()
    metadata = {
        "model": getattr(record, "model", ""),
        "dimensions": getattr(record, "dimensions", 0) or _vector_length(vector),
        "model_version": getattr(record, "model_version", ""),
        "source_hash": getattr(record, "source_hash", ""),
    }
    return {"embedding": list(vector), "metadata": metadata}


def _vector_store_record_has_expected_embedding(record) -> bool:
    state = _vector_store_record_state(record)
    if not state:
        _increment_recommendation_metric("vector_missing_count")
        return False
    if not _vector_has_expected_dimensions(state.get("embedding")):
        _increment_recommendation_metric("vector_missing_count")
        return False
    if not _vector_store_metadata_matches_record(record, state.get("metadata") or {}):
        _increment_recommendation_metric("vector_missing_count")
        return False
    return True


def _vector_store_metadata_matches_record(record, metadata: dict) -> bool:
    try:
        return (
            metadata.get("model") == record.model
            and int(metadata.get("dimensions") or 0) == _expected_embedding_dimensions()
            and metadata.get("model_version") == MODEL_VERSION
            and metadata.get("source_hash") == record.source_hash
        )
    except (TypeError, ValueError):
        return False


def _ensure_candidate_embedding(recruiter, cv, source_type):
    if not getattr(settings, "RECOMMENDATION_SEMANTIC_ENABLED", True):
        return None
    text = build_candidate_recommendation_text(recruiter, cv)
    source_hash = _hash_text(text)
    record, _ = CandidateRecommendationEmbedding.objects.get_or_create(
        recruiter=recruiter,
        cv=cv,
        source_type=source_type,
        defaults={"source_hash": source_hash, "status": "pending"},
    )
    if (
        record.status == record.Status.READY
        and record.source_hash == source_hash
        and record.model == _expected_embedding_model()
        and getattr(record, "model_version", "") == MODEL_VERSION
        and _vector_store_record_has_expected_embedding(record)
    ):
        return record
    if getattr(settings, "RECOMMENDATION_SYNC_EMBEDDINGS", False):
        generate_candidate_embedding(recruiter.id, cv.id if cv else None, source_type)
        return CandidateRecommendationEmbedding.objects.filter(id=record.id).first()
    schedule_candidate_embedding_refresh(
        recruiter.id, cv.id if cv else None, source_type
    )
    if (
        record.source_hash != source_hash
        or record.status == record.Status.FAILED
        or record.model != _expected_embedding_model()
        or getattr(record, "model_version", "") != MODEL_VERSION
        or not _vector_store_record_has_expected_embedding(record)
    ):
        record.source_hash = source_hash
        record.status = record.Status.PENDING
        record.error = ""
        record.model_version = MODEL_VERSION
        record.dimensions = _expected_embedding_dimensions()
        record.embedding = None
        record.save(
            update_fields=[
                "source_hash",
                "model_version",
                "dimensions",
                "embedding",
                "status",
                "error",
                "updated_at",
            ]
        )
    return record


def _semantic_status(record) -> str:
    if not getattr(settings, "RECOMMENDATION_SEMANTIC_ENABLED", True):
        return "disabled"
    if not _vector_store_enabled():
        return "unavailable"
    provider = str(
        getattr(settings, "RECOMMENDATION_EMBEDDING_PROVIDER", "local") or "local"
    ).lower()
    if provider == "openai" and not getattr(settings, "OPENAI_API_KEY", ""):
        return "unavailable"
    if not record:
        return "pending"
    if (
        record.status == record.Status.READY
        and record.model != _expected_embedding_model()
    ):
        return "pending"
    if (
        record.status == record.Status.READY
        and getattr(record, "model_version", "") != MODEL_VERSION
    ):
        return "pending"
    return record.status


def _source_parse_status(cv) -> str:
    if not cv:
        return "profile_fallback"
    if getattr(cv, "parse_status", None):
        return cv.parse_status
    if getattr(cv, "cv_data", None) and getattr(cv, "parsed_at", None):
        return "parsed"
    if getattr(cv, "cv_url", None) and not getattr(cv, "parsed_at", None):
        return "processing"
    return "profile_fallback"


def _semantic_recall(recruiter, record) -> dict[int, float]:
    if not record or record.status != record.Status.READY:
        return {}
    if record.model != _expected_embedding_model():
        return {}
    if not _vector_store_enabled():
        return {}
    candidate_state = _vector_store_record_state(record)
    if not candidate_state or not _vector_store_metadata_matches_record(
        record, candidate_state.get("metadata") or {}
    ):
        _increment_recommendation_metric("vector_missing_count")
        return {}
    candidate_embedding = candidate_state.get("embedding")
    if not _vector_has_expected_dimensions(candidate_embedding):
        logger.warning(
            "Skipping PGVector semantic recall for embedding id=%s due to %s",
            record.id,
            _dimension_mismatch_reason(_vector_length(candidate_embedding)),
        )
        _increment_recommendation_metric("vector_missing_count")
        return {}
    try:
        matches = _semantic_recall_pgvector(
            recruiter, candidate_embedding, record.model
        )
    except Exception as exc:
        logger.debug("PGVector semantic recall unavailable: %s", exc)
        _increment_recommendation_metric("vector_query_failed_count")
        return {}
    if not matches:
        _increment_recommendation_metric("semantic_recall_empty_count")
    return matches


def _semantic_recall_pgvector(recruiter, embedding, model: str) -> dict[int, float]:
    if connection.vendor != "postgresql":
        return _semantic_recall_python(recruiter, embedding, model)

    with transaction.atomic():
        with connection.cursor() as cursor:
            cursor.execute("SET LOCAL hnsw.ef_search = %s", [_pgvector_ef_search()])

        records = list(
            _semantic_job_embedding_queryset(recruiter, model)
            .annotate(distance=CosineDistance("embedding", list(embedding)))
            .order_by("distance")[: SEMANTIC_RECALL_LIMIT * 2]
        )
    return {
        record.job_id: _similarity_from_distance(record.distance) for record in records
    }


def _semantic_recall_python(recruiter, embedding, model: str) -> dict[int, float]:
    scores = []
    for record in _semantic_job_embedding_queryset(recruiter, model):
        vector = record.embedding
        if hasattr(vector, "tolist"):
            vector = vector.tolist()
        if not _vector_has_expected_dimensions(vector):
            continue
        distance = _cosine_distance(embedding, vector)
        scores.append((record.job_id, _similarity_from_distance(distance)))

    scores.sort(key=lambda item: item[1], reverse=True)
    return dict(scores[: SEMANTIC_RECALL_LIMIT * 2])


def _semantic_job_embedding_queryset(recruiter, model: str):
    eligible_jobs = _eligible_jobs(recruiter).values("id")
    return JobEmbedding.objects.filter(
        job_id__in=eligible_jobs,
        status=JobEmbedding.Status.READY,
        model=model,
        model_version=MODEL_VERSION,
        dimensions=_expected_embedding_dimensions(),
        embedding__isnull=False,
    )


def _eligible_jobs(recruiter):
    dismissed_job_ids = JobRecommendationEvent.objects.filter(
        recruiter=recruiter,
        event_type=JobRecommendationEvent.EventType.DISMISS,
    ).values_list("job_id", flat=True)
    return (
        _with_active_featured(_active_published_jobs(Job.objects.all()))
        .exclude(applications__recruiter=recruiter)
        .exclude(id__in=dismissed_job_ids)
        .select_related("company", "category__parent", "address__province")
        .prefetch_related("required_skills__skill", "locations__address__province")
    )


def _structured_recall_ids(queryset, candidate, limit: int) -> list[int]:
    relevance = Q()
    has_signal = False
    if candidate["skill_ids"]:
        relevance |= Q(required_skills__skill_id__in=list(candidate["skill_ids"]))
        has_signal = True
    if candidate["category_ids"]:
        relevance |= Q(category_id__in=list(candidate["category_ids"]))
        has_signal = True
    if candidate["province_id"]:
        relevance |= Q(address__province_id=candidate["province_id"]) | Q(
            locations__address__province_id=candidate["province_id"]
        )
        has_signal = True
    if not has_signal:
        return []
    relevance |= Q(is_remote=True)
    return list(
        queryset.filter(relevance)
        .distinct()
        .order_by("-active_featured", "-published_at", "-created_at")
        .values_list("id", flat=True)[: limit * STRUCTURED_RECALL_MULTIPLIER]
    )


def _fallback_job_ids(queryset, limit: int) -> list[int]:
    return list(
        queryset.order_by(
            "-active_featured", "-view_count", "-published_at", "-created_at"
        ).values_list("id", flat=True)[: limit * 2]
    )


def _personalization_notice(
    semantic_status: str, semantic_matches: dict[int, float]
) -> str:
    if semantic_matches or semantic_status in {"ready", "disabled"}:
        return ""
    if semantic_status == "pending":
        return "Hệ thống đang chuẩn bị gợi ý cá nhân hóa. Trước mắt hiển thị gợi ý theo hồ sơ cơ bản."
    return "Gợi ý semantic tạm thời chưa sẵn sàng. Trước mắt hiển thị gợi ý theo skill, vị trí và tin mới."


def _jobs_by_id(job_ids: list[int]) -> dict[int, Job]:
    jobs = (
        _active_published_jobs(Job.objects.filter(id__in=job_ids))
        .select_related("company", "category__parent", "address__province")
        .prefetch_related("required_skills__skill", "locations__address__province")
    )
    return {job.id: job for job in _with_active_featured(jobs)}


def _calibrated_semantic_score(similarity: float | None) -> int:
    """
    Calibrate raw cosine similarity (typically 0.55-0.90 for domain text)
    into a well-spread 0-50 semantic score range using piecewise / min-max scaling.
    """
    if similarity is None:
        return 0
    try:
        sim = float(similarity)
    except (TypeError, ValueError):
        return 0
    if sim <= 0.0:
        return 0
    min_thresh = 0.55
    max_thresh = 0.90
    if sim <= min_thresh:
        calibrated = (max(0.0, sim) / min_thresh) * 0.25
    elif sim >= max_thresh:
        calibrated = 1.0
    else:
        calibrated = 0.25 + 0.75 * ((sim - min_thresh) / (max_thresh - min_thresh))
    return max(0, min(50, round(calibrated * 50)))


def _calculate_penalty_multiplier(candidate: dict, job, factors: dict) -> float:
    """
    Calculate multiplicative penalty when severe hard-constraint mismatches occur:
    - Large experience deficit
    - Strict Onsite job with zero location overlap
    """
    multiplier = 1.0
    cand_years = candidate.get("years_of_experience") or 0
    job_years_min = getattr(job, "experience_years_min", 0) or 0
    if job_years_min >= 3 and cand_years < job_years_min:
        deficit = job_years_min - cand_years
        if deficit >= 4:
            multiplier *= 0.60
        elif deficit >= 3:
            multiplier *= 0.75
        elif deficit >= 2:
            multiplier *= 0.88

    if not getattr(job, "is_remote", False) and factors.get("location", 1.0) == 0.0:
        multiplier *= 0.75

    return round(multiplier, 4)


def _score_recommendation(
    candidate, recruiter, job, semantic_similarity, semantic_status
):
    factors = _factor_scores(candidate, recruiter, job)
    semantic_score = _calibrated_semantic_score(semantic_similarity)
    structured_score = min(
        50,
        round(factors["skill"] * 27)
        + round(factors["title"] * 10)
        + round(factors["experience"] * 7)
        + round(factors["location"] * 6),
    )
    breakdown = {
        "semantic": semantic_score,
        "skill": round(factors["skill"] * 27),
        "title": round(factors["title"] * 10),
        "experience": round(factors["experience"] * 7),
        "seniority": round(factors["experience"] * 7),
        "location": round(factors["location"] * 6),
    }
    raw_score = min(
        100,
        sum(
            [
                breakdown["semantic"],
                breakdown["skill"],
                breakdown["title"],
                breakdown["experience"],
                breakdown["location"],
            ]
        ),
    )
    penalty_multiplier = _calculate_penalty_multiplier(candidate, job, factors)
    final_score = max(0, min(100, round(raw_score * penalty_multiplier)))
    breakdown["penalty_multiplier"] = penalty_multiplier

    matched_skills, missing_skills = _skill_names(candidate["skill_ids"], job)
    return {
        "job": job,
        "match_score": final_score,
        "match_label": _match_label(final_score),
        "match_reasons": _match_reasons(
            factors, semantic_similarity, semantic_status, matched_skills, job
        ),
        "score_breakdown": breakdown,
        "semantic_score": semantic_score,
        "skill_match_score": round(factors["skill"], 4),
        "title_match_score": round(factors["title"], 4),
        "seniority_score": round(factors["experience"], 4),
        "location_score": round(factors["location"], 4),
        "structured_score": structured_score,
        "final_score": final_score,
        "scoring_mode": "hybrid" if semantic_similarity is not None else "structured",
        "structured_confidence": round(structured_score / 65, 4),
        "semantic_similarity": round(float(semantic_similarity or 0), 4),
        "matched_skills": matched_skills,
        "missing_required_skills": missing_skills,
    }


def score_candidate_job(recruiter, job: Job, cv: RecruiterCV | None = None) -> dict:
    """
    Unified Hybrid Matching Score calculation for a single candidate-job pair.
    Used by Application serializer, Application submission snapshot, and Recruiter views.
    """
    if not recruiter or not job:
        return {
            "match_score": 0,
            "match_label": _match_label(0),
            "score_breakdown": {},
            "match_reasons": [],
            "matched_skills": [],
            "missing_required_skills": [],
            "scoring_mode": "none",
        }

    candidate = _extract_candidate_data(cv or SimpleNamespace(cv_data={}), recruiter)

    similarity = None
    semantic_status = "unavailable"

    if (
        getattr(settings, "RECOMMENDATION_SEMANTIC_ENABLED", True)
        and _vector_store_enabled()
    ):
        expected_model = _expected_embedding_model()
        expected_dim = _expected_embedding_dimensions()

        job_emb = JobEmbedding.objects.filter(
            job_id=job.id,
            status=JobEmbedding.Status.READY,
            model=expected_model,
            model_version=MODEL_VERSION,
            dimensions=expected_dim,
            embedding__isnull=False,
        ).first()

        source_type = (
            CandidateRecommendationEmbedding.SourceType.CV
            if cv
            else CandidateRecommendationEmbedding.SourceType.PROFILE
        )
        cand_emb = CandidateRecommendationEmbedding.objects.filter(
            recruiter=recruiter,
            cv=cv,
            source_type=source_type,
            status=CandidateRecommendationEmbedding.Status.READY,
            model=expected_model,
            model_version=MODEL_VERSION,
            dimensions=expected_dim,
            embedding__isnull=False,
        ).first()

        if job_emb and cand_emb:
            j_vec = job_emb.embedding
            c_vec = cand_emb.embedding
            if hasattr(j_vec, "tolist"):
                j_vec = j_vec.tolist()
            if hasattr(c_vec, "tolist"):
                c_vec = c_vec.tolist()
            if _vector_has_expected_dimensions(
                j_vec
            ) and _vector_has_expected_dimensions(c_vec):
                distance = _cosine_distance(c_vec, j_vec)
                similarity = _similarity_from_distance(distance)
                semantic_status = "ready"

    return _score_recommendation(
        candidate=candidate,
        recruiter=recruiter,
        job=job,
        semantic_similarity=similarity,
        semantic_status=semantic_status,
    )


def _factor_scores(candidate, recruiter, job):
    return {
        "skill": _skill_match_score(candidate["skill_ids"], job),
        "title": _title_match_score(recruiter, job),
        "experience": _experience_level_score(
            candidate["years_of_experience"],
            job.level,
            job.experience_years_min,
            job.experience_years_max,
        ),
        "category": _category_score(
            candidate["category_ids"], job, candidate.get("category_parent_ids", set())
        ),
        "salary": 0.5,
        "location": _location_score(candidate["province_id"], job),
        "job_type": _job_type_score(candidate["years_of_experience"], job.job_type),
    }


def _semantic_factor(similarity, status):
    if similarity is not None:
        return max(0.0, min(1.0, float(similarity)))
    return 0.0


def _freshness_score(job) -> int:
    if not job.published_at:
        return 1
    age_days = (timezone.now() - job.published_at).days
    if age_days <= 7:
        return 4
    if age_days <= 30:
        return 2
    return 1


def _match_reasons(factors, similarity, semantic_status, matched_skills, job):
    reasons = []
    job_profile = _job_recommendation_profile(job)
    if factors["title"] >= 0.9 and job_profile and job_profile.canonical_title:
        reasons.append(
            f"Công việc thuộc nhóm {job_profile.canonical_title.name}, phù hợp với hồ sơ của bạn"
        )
    if matched_skills:
        reasons.append(
            f"Bạn khớp {len(matched_skills)} kỹ năng: {', '.join(matched_skills[:5])}"
        )
    if similarity is not None and similarity >= 0.72:
        reasons.append("Nội dung CV gần với JD")
    elif semantic_status in {"pending", "unavailable", "disabled"}:
        reasons.append("Dựa trên tiêu chí hồ sơ")
    if factors["experience"] >= 0.7:
        reasons.append("Cấp bậc phù hợp")
    if factors["location"] >= 0.8:
        reasons.append("Làm việc từ xa" if job.is_remote else "Cùng khu vực")
    if factors["category"] >= 0.5 and job.category:
        reasons.append(f"Ngành {job.category.name}")
    return reasons[:5] or ["Việc làm gợi ý"]


def _job_recommendation_profile(job):
    try:
        return job.recommendation_profile
    except (JobRecommendationProfile.DoesNotExist, AttributeError):
        return None


def _candidate_recommendation_profile(recruiter):
    try:
        return recruiter.recommendation_profile
    except (CandidateRecommendationProfile.DoesNotExist, AttributeError):
        return None


def _title_match_score(recruiter, job) -> float:
    candidate_profile = _candidate_recommendation_profile(recruiter)
    job_profile = _job_recommendation_profile(job)
    candidate_title = (
        candidate_profile.current_title_canonical if candidate_profile else None
    )
    job_title = job_profile.canonical_title if job_profile else None
    if not candidate_title or not job_title:
        return 0.0
    if candidate_title_id := getattr(candidate_title, "id", None):
        if candidate_title_id == getattr(job_title, "id", None):
            return 1.0
    pair = frozenset({candidate_title.name, job_title.name})
    near_pairs = {
        frozenset({"Backend Developer", "Fullstack Developer"}),
        frozenset({"Frontend Developer", "Fullstack Developer"}),
        frozenset({"DevOps Engineer", "Cloud Engineer"}),
        frozenset({"Data Engineer", "Data Analyst"}),
        frozenset({"QA Engineer", "Automation Tester"}),
    }
    return 0.7 if pair in near_pairs else 0.2


def _skill_names(candidate_skill_ids, job):
    matched = []
    missing_required = []
    for job_skill in job.required_skills.all():
        if not job_skill.skill_id or not job_skill.skill:
            continue
        if job_skill.skill_id in candidate_skill_ids:
            matched.append(job_skill.skill.name)
        elif job_skill.is_required:
            missing_required.append(job_skill.skill.name)
    return sorted(set(matched)), sorted(set(missing_required))


def _candidate_text_from_cv(cv_data) -> str:
    if isinstance(cv_data, str):
        try:
            import json

            cv_data = json.loads(cv_data)
        except Exception:
            return _compact_text([cv_data])
    if not isinstance(cv_data, dict):
        return ""

    personal = (
        cv_data.get("personal", {}) if isinstance(cv_data.get("personal"), dict) else {}
    )
    sections = [
        f"Current position: {personal.get('current_position', '')}",
        f"Bio: {personal.get('bio', '')}",
        f"Years of experience: {personal.get('years_of_experience', '')}",
    ]
    for key in (
        "skills",
        "experience",
        "education",
        "projects",
        "certifications",
        "languages",
    ):
        sections.append(f"{key}: {_stringify_cv_items(cv_data.get(key, []))}")
    location = cv_data.get("location", {})
    if isinstance(location, dict):
        sections.append(f"Location: {' '.join(str(v) for v in location.values() if v)}")
    return _compact_text(sections)


def _stringify_cv_items(items) -> str:
    if not isinstance(items, list):
        return ""
    values = []
    for item in items[:20]:
        if isinstance(item, dict):
            values.append(" ".join(str(value) for value in item.values() if value))
        elif item:
            values.append(str(item))
    return " | ".join(values)


def _compact_text(parts) -> str:
    text = "\n".join(str(part).strip() for part in parts if str(part or "").strip())
    return " ".join(text.split())[:12000]


def _limit_embedding_field(value: str, limit: int) -> str:
    text = " ".join(str(value or "").split())
    if len(text) <= limit:
        return text
    return text[:limit].rsplit(" ", 1)[0]


def _hash_text(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


def _increment_recommendation_metric(name: str) -> None:
    key = f"jobio:recommendations:metrics:{timezone.localdate().isoformat()}:{name}"
    try:
        cache.add(key, 0, timeout=RECOMMENDATION_METRIC_TTL)
        cache.incr(key)
    except Exception as exc:
        logger.debug(
            "Recommendation metric increment skipped name=%s error=%s", name, exc
        )


def recommendation_metrics_snapshot(days: int = 7) -> dict:
    today = timezone.localdate()
    days = max(1, min(int(days or 7), 14))
    daily = []
    totals = {name: 0 for name in RECOMMENDATION_METRIC_NAMES}
    for offset in range(days):
        date = today - timedelta(days=offset)
        row = {"date": date.isoformat()}
        for name in RECOMMENDATION_METRIC_NAMES:
            key = f"jobio:recommendations:metrics:{date.isoformat()}:{name}"
            value = int(cache.get(key) or 0)
            row[name] = value
            totals[name] += value
        daily.append(row)
    return {"totals": totals, "daily": daily}


def recommendation_health_snapshot(days: int = 7) -> dict:
    since = timezone.now() - timedelta(days=max(days, 1))
    job_statuses = dict(
        JobEmbedding.objects.values("status")
        .annotate(count=Count("id"))
        .values_list("status", "count")
    )
    candidate_statuses = dict(
        CandidateRecommendationEmbedding.objects.values("status")
        .annotate(count=Count("id"))
        .values_list("status", "count")
    )
    public_jobs = _active_published_jobs(Job.objects.all())
    jobs_without_ready_embedding = public_jobs.exclude(
        recommendation_embedding__status=JobEmbedding.Status.READY
    ).count()
    candidate_profiles_without_ready_embedding = CandidateRecommendationProfile.objects.exclude(
        recruiter__recommendation_embeddings__status=CandidateRecommendationEmbedding.Status.READY
    ).count()
    event_stats = JobRecommendationEvent.objects.filter(
        created_at__gte=since
    ).aggregate(
        total=Count("id"),
        average_match_score=Avg("score"),
    )
    metrics = recommendation_metrics_snapshot(days=days)
    totals = metrics.get("totals", {})
    impression_count = JobRecommendationEvent.objects.filter(
        created_at__gte=since,
        event_type=JobRecommendationEvent.EventType.IMPRESSION,
    ).count()
    structured_fallback_count = int(totals.get("structured_fallback_used_count") or 0)
    semantic_empty_count = int(totals.get("semantic_recall_empty_count") or 0)
    pgvector = _pgvector_health()
    model_cache_integrity = verify_embedding_model_cache_integrity()
    health = {
        "enabled": getattr(settings, "RECOMMENDATION_SEMANTIC_ENABLED", True),
        "vector_store": getattr(settings, "RECOMMENDATION_VECTOR_STORE", "pgvector"),
        "provider": getattr(settings, "RECOMMENDATION_EMBEDDING_PROVIDER", "local"),
        "model": _expected_embedding_model(),
        "dimensions": _expected_embedding_dimensions(),
        "model_version": MODEL_VERSION,
        "taxonomy_version": TAXONOMY_VERSION,
        "pgvector": pgvector,
        "pgvector_ok": bool(pgvector.get("ok")),
        "model_cache_integrity": model_cache_integrity,
        "model_cache_ok": bool(model_cache_integrity.get("ok")),
        "job_embeddings": job_statuses,
        "candidate_embeddings": candidate_statuses,
        "metrics": metrics,
        "operational_metrics": {
            "days": days,
            "recommendation_event_count": event_stats["total"] or 0,
            "impression_count": impression_count,
            "average_match_score": round(event_stats["average_match_score"] or 0, 2),
            "structured_fallback_rate": (
                round(structured_fallback_count / max(impression_count, 1), 4)
                if impression_count
                else 0
            ),
            "semantic_recall_empty_count": semantic_empty_count,
            "jobs_without_ready_embedding": jobs_without_ready_embedding,
            "candidate_profiles_without_ready_embedding": candidate_profiles_without_ready_embedding,
        },
    }
    return health


RECOMMENDATION_VECTOR_SYNC_CACHE_KEY = "recommendation_vector_sync_progress"


def get_vector_sync_progress() -> dict:
    default_state = {
        "status": "idle",
        "progress": 0,
        "jobs_total": 0,
        "jobs_done": 0,
        "candidates_total": 0,
        "candidates_done": 0,
        "message": "Sẵn sàng sinh Vector còn thiếu",
        "finished_at": None,
    }
    state = cache.get(RECOMMENDATION_VECTOR_SYNC_CACHE_KEY)
    if not isinstance(state, dict):
        return default_state
    return {**default_state, **state}


def _update_vector_sync_progress(data: dict) -> dict:
    current = get_vector_sync_progress()
    updated = {**current, **data}
    cache.set(RECOMMENDATION_VECTOR_SYNC_CACHE_KEY, updated, timeout=60 * 60)
    return updated


def _run_vector_sync_worker():
    try:
        published_jobs = Job.objects.filter(
            status=Job.Status.PUBLISHED,
            domain_status=Job.DomainStatus.IT_APPROVED,
            moderation_status=Job.ModerationStatus.APPROVED,
        )
        jobs_to_process = published_jobs.exclude(
            recommendation_embedding__status="ready"
        )
        job_ids = list(jobs_to_process.values_list("id", flat=True))

        from apps.candidate.recruiters.models import Recruiter

        candidates_to_process = Recruiter.objects.exclude(
            recommendation_embeddings__status="ready"
        )
        candidate_ids = list(candidates_to_process.values_list("id", flat=True))

        total_items = len(job_ids) + len(candidate_ids)
        if total_items == 0:
            _update_vector_sync_progress(
                {
                    "status": "completed",
                    "progress": 100,
                    "jobs_total": 0,
                    "jobs_done": 0,
                    "candidates_total": 0,
                    "candidates_done": 0,
                    "message": "Tất cả dữ liệu việc làm & ứng viên đã được Vector hóa!",
                    "finished_at": timezone.now().isoformat(),
                }
            )
            return

        _update_vector_sync_progress(
            {
                "status": "running",
                "progress": 0,
                "jobs_total": len(job_ids),
                "jobs_done": 0,
                "candidates_total": len(candidate_ids),
                "candidates_done": 0,
                "message": f"Đang khởi tạo vector hóa cho {total_items} mục...",
            }
        )

        processed_jobs = 0
        processed_candidates = 0
        completed_items = 0

        for job_id in job_ids:
            res = generate_job_embedding(job_id)
            if res.get("status") == "ready":
                processed_jobs += 1
            completed_items += 1
            progress_pct = min(99, math.floor((completed_items / total_items) * 100))
            _update_vector_sync_progress(
                {
                    "progress": progress_pct,
                    "jobs_done": processed_jobs,
                    "message": f"Đang vector hóa tin tuyển dụng ({completed_items}/{total_items})...",
                }
            )

        for recruiter_id in candidate_ids:
            res = generate_candidate_embedding(recruiter_id)
            if res.get("status") == "ready":
                processed_candidates += 1
            completed_items += 1
            progress_pct = min(99, math.floor((completed_items / total_items) * 100))
            _update_vector_sync_progress(
                {
                    "progress": progress_pct,
                    "candidates_done": processed_candidates,
                    "message": f"Đang vector hóa hồ sơ ứng viên ({completed_items}/{total_items})...",
                }
            )

        _update_vector_sync_progress(
            {
                "status": "completed",
                "progress": 100,
                "jobs_done": processed_jobs,
                "candidates_done": processed_candidates,
                "message": f"Đã sinh Vector thành công cho {processed_jobs} việc làm và {processed_candidates} ứng viên!",
                "finished_at": timezone.now().isoformat(),
            }
        )
    except Exception as exc:
        logger.error(f"Vector sync background worker failed: {exc}")
        _update_vector_sync_progress(
            {
                "status": "failed",
                "message": f"Thất bại khi sinh Vector: {str(exc)[:150]}",
            }
        )


def trigger_missing_embeddings_sync_async() -> dict:
    import threading

    current = get_vector_sync_progress()
    if current.get("status") == "running":
        return {
            "status": "already_running",
            "progress": current.get("progress", 0),
            "message": "Tác vụ sinh Vector ngầm đang được chạy...",
            "data": current,
        }

    _update_vector_sync_progress(
        {
            "status": "running",
            "progress": 0,
            "message": "Đang khởi chạy tác vụ ngầm sinh Vector...",
        }
    )

    thread = threading.Thread(target=_run_vector_sync_worker, daemon=True)
    thread.start()

    return {
        "status": "started",
        "progress": 0,
        "message": "Đã khởi chạy tác vụ sinh Vector ngầm thành công!",
    }


def sync_missing_embeddings() -> dict:
    return trigger_missing_embeddings_sync_async()


def verify_embedding_model_cache_integrity(model_name: str | None = None) -> dict:
    """
    Check local Hugging Face/SentenceTransformers cache for pickle-based weights.

    CVE-2025-32434 is triggered by unsafe torch.load deserialization paths. The
    local provider asks transformers to use safetensors, and this check makes
    stale/tampered pickle-only cache visible before the worker uses it.
    """
    model_name = model_name or _expected_embedding_model()
    provider = (
        str(getattr(settings, "RECOMMENDATION_EMBEDDING_PROVIDER", "local") or "local")
        .strip()
        .lower()
    )
    if provider != "local":
        return {
            "ok": True,
            "status": "skipped",
            "reason": f"provider_{provider}",
            "model": model_name,
        }

    model_dirs = _embedding_model_cache_dirs(model_name)
    if not model_dirs:
        return {
            "ok": True,
            "status": "not_cached",
            "reason": "model_not_cached",
            "model": model_name,
            "cache_dirs": [],
            "safe_weight_files": [],
            "risky_weight_files": [],
        }

    safe_files = _model_weight_files(model_dirs, SAFE_MODEL_WEIGHT_SUFFIXES)
    risky_files = _model_weight_files(model_dirs, RISKY_MODEL_WEIGHT_SUFFIXES)
    ok = bool(safe_files) or not risky_files
    reason = (
        "safetensors_available"
        if safe_files
        else (
            "pickle_weight_cache_without_safetensors"
            if risky_files
            else "no_weight_files_found"
        )
    )
    status = "ok" if ok else "unsafe"
    return {
        "ok": ok,
        "status": status,
        "reason": reason,
        "model": model_name,
        "require_safetensors": _require_safetensors(),
        "cache_dirs": [str(path) for path in model_dirs],
        "safe_weight_files": _short_paths(safe_files),
        "risky_weight_files": _short_paths(risky_files),
    }


def _require_safetensors() -> bool:
    return bool(getattr(settings, "RECOMMENDATION_REQUIRE_SAFETENSORS", True))


def _embedding_model_cache_roots() -> list[Path]:
    roots = []
    has_explicit_root = False
    for env_name in ("HUGGINGFACE_HUB_CACHE", "SENTENCE_TRANSFORMERS_HOME"):
        value = os.environ.get(env_name)
        if value:
            has_explicit_root = True
            roots.append(Path(value).expanduser())

    hf_home = os.environ.get("HF_HOME")
    if hf_home:
        has_explicit_root = True
        roots.append(Path(hf_home).expanduser())
        roots.append(Path(hf_home).expanduser() / "hub")

    if not has_explicit_root:
        roots.extend(
            [
                Path.home() / ".cache" / "huggingface" / "hub",
                Path.home() / ".cache" / "torch" / "sentence_transformers",
            ]
        )

    unique = []
    seen = set()
    for root in roots:
        resolved = str(root)
        if resolved in seen:
            continue
        seen.add(resolved)
        unique.append(root)
    return unique


def _embedding_model_cache_dirs(model_name: str) -> list[Path]:
    model_slug = model_name.replace("/", "--")
    st_slug = model_name.replace("/", "_")
    short_name = model_name.rsplit("/", 1)[-1]
    candidates = []
    for root in _embedding_model_cache_roots():
        if not root.exists():
            continue
        direct_candidates = [
            root / f"models--{model_slug}",
            root / st_slug,
            root / short_name,
        ]
        if root.name in {f"models--{model_slug}", st_slug, short_name}:
            direct_candidates.append(root)
        for candidate in direct_candidates:
            if candidate.exists() and candidate.is_dir():
                candidates.append(candidate)

    unique = []
    seen = set()
    for candidate in candidates:
        resolved = str(candidate.resolve())
        if resolved in seen:
            continue
        seen.add(resolved)
        unique.append(candidate)
    return unique


def _model_weight_files(
    model_dirs: list[Path], suffixes: tuple[str, ...]
) -> list[Path]:
    files = []
    for model_dir in model_dirs:
        for path in model_dir.rglob("*"):
            if path.is_file() and path.name.lower().endswith(suffixes):
                files.append(path)
    return sorted(files)


def _short_paths(paths: list[Path], limit: int = 20) -> list[str]:
    return [str(path)[-160:] for path in paths[:limit]]


def _pgvector_health() -> dict:
    if not _vector_store_enabled():
        return {"ok": False, "reason": "vector_store_disabled"}
    if connection.vendor != "postgresql":
        return {"ok": True, "backend": connection.vendor, "extension": "not_required"}
    try:
        with connection.cursor() as cursor:
            cursor.execute(
                "SELECT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'vector')"
            )
            extension_installed = bool(cursor.fetchone()[0])
        return {
            "ok": extension_installed,
            "backend": "postgresql",
            "extension_installed": extension_installed,
        }
    except Exception as exc:
        _increment_recommendation_metric("vector_query_failed_count")
        return {"ok": False, "backend": "postgresql", "error": str(exc)[:300]}


def _expected_embedding_dimensions() -> int:
    return int(
        getattr(
            settings,
            "RECOMMENDATION_EMBEDDING_DIMENSIONS",
            DEFAULT_EMBEDDING_DIMENSIONS,
        )
        or DEFAULT_EMBEDDING_DIMENSIONS
    )


def _expected_embedding_model() -> str:
    provider = (
        str(getattr(settings, "RECOMMENDATION_EMBEDDING_PROVIDER", "local") or "local")
        .strip()
        .lower()
    )
    if provider == "fake":
        return "fake-embedding"
    try:
        import sentence_transformers  # noqa: F401
    except ImportError:
        return "fake-embedding"
    return str(
        getattr(settings, "RECOMMENDATION_EMBEDDING_MODEL", "BAAI/bge-m3")
        or "BAAI/bge-m3"
    )


def _vector_length(vector) -> int | None:
    try:
        return len(vector)
    except TypeError:
        return None


def _vector_has_expected_dimensions(vector) -> bool:
    return _vector_length(vector) == _expected_embedding_dimensions()


def _dimension_mismatch_reason(actual: int | None) -> str:
    return (
        "embedding_dimension_mismatch:"
        f"expected={_expected_embedding_dimensions()}:actual={actual}"
    )


def _validate_embedding_dimensions(vector, source: str = "embedding") -> None:
    actual = _vector_length(vector)
    if actual != _expected_embedding_dimensions():
        raise EmbeddingUnavailable(f"{_dimension_mismatch_reason(actual)}:{source}")


def _normalize_vector(vector):
    norm = math.sqrt(sum(float(value) * float(value) for value in vector))
    if not norm:
        return [0.0 for _ in vector]
    return [float(value) / norm for value in vector]


def _similarity_from_distance(distance) -> float:
    try:
        return max(0.0, min(1.0, 1.0 - float(distance)))
    except (TypeError, ValueError):
        return 0.0


def _cosine_distance(left, right) -> float:
    try:
        left_values = [float(value) for value in left]
        right_values = [float(value) for value in right]
    except (TypeError, ValueError):
        return 1.0
    if len(left_values) != len(right_values):
        return 1.0
    left_norm = math.sqrt(sum(value * value for value in left_values))
    right_norm = math.sqrt(sum(value * value for value in right_values))
    if not left_norm or not right_norm:
        return 1.0
    similarity = sum(
        left_value * right_value
        for left_value, right_value in zip(left_values, right_values)
    ) / (left_norm * right_norm)
    return 1.0 - max(-1.0, min(1.0, similarity))


def _ordered_unique(values: Iterable[int]) -> list[int]:
    seen = set()
    result = []
    for value in values:
        if value in seen:
            continue
        seen.add(value)
        result.append(value)
    return result


def _match_label(score: int) -> str:
    if score >= 85:
        return "Rất phù hợp"
    if score >= 70:
        return "Phù hợp"
    if score >= 50:
        return "Có thể phù hợp"
    return "Gợi ý tham khảo"


def _get_owned_cv(recruiter, cv_id):
    if not cv_id:
        return None
    cv = RecruiterCV.objects.filter(id=cv_id, recruiter=recruiter).first()
    if not cv:
        raise RecommendationCVNotFound(
            "CV không tồn tại hoặc không thuộc ứng viên này."
        )
    return cv


def _safe_delay_job(job_id):
    try:
        from apps.recruitment.jobs.tasks import generate_job_embedding_task
        from apps.core.caching import (
            CACHE_TIMEOUT_SHORT,
            CacheKeyBuilder,
            CacheService,
        )

        enqueue_key = CacheKeyBuilder.task_enqueue("job_embedding", job_id)
        if not CacheService.add(enqueue_key, timeout=CACHE_TIMEOUT_SHORT):
            logger.debug("Job embedding task already queued for job=%s", job_id)
            return
        try:
            generate_job_embedding_task.delay(job_id)
        except Exception:
            CacheService.delete(enqueue_key)
            raise
    except Exception as exc:
        logger.debug("Could not enqueue job embedding task: %s", exc)


def _safe_delay_candidate(recruiter_id, cv_id, source_type):
    try:
        from apps.recruitment.jobs.tasks import generate_candidate_embedding_task
        from apps.core.caching import (
            CACHE_TIMEOUT_SHORT,
            CacheKeyBuilder,
            CacheService,
        )

        enqueue_key = CacheKeyBuilder.task_enqueue(
            "candidate_embedding", recruiter_id, cv_id or "profile", source_type
        )
        if not CacheService.add(enqueue_key, timeout=CACHE_TIMEOUT_SHORT):
            logger.debug(
                "Candidate embedding task already queued recruiter=%s cv=%s source=%s",
                recruiter_id,
                cv_id,
                source_type,
            )
            return
        try:
            generate_candidate_embedding_task.delay(recruiter_id, cv_id, source_type)
        except Exception:
            CacheService.delete(enqueue_key)
            raise
    except Exception as exc:
        logger.debug("Could not enqueue candidate embedding task: %s", exc)
