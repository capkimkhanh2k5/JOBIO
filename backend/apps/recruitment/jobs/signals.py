from django.db import transaction
from django.db.models.signals import post_delete, post_save
from django.dispatch import receiver

from apps.candidate.recruiter_certifications.models import RecruiterCertification
from apps.candidate.recruiter_cvs.models import RecruiterCV
from apps.candidate.recruiter_education.models import RecruiterEducation
from apps.candidate.recruiter_experience.models import RecruiterExperience
from apps.candidate.recruiter_languages.models import RecruiterLanguage
from apps.candidate.recruiter_projects.models import RecruiterProject
from apps.candidate.recruiter_skills.models import RecruiterSkill
from apps.candidate.recruiters.models import Recruiter
from apps.recruitment.job_locations.models import JobLocation
from apps.recruitment.job_skills.models import JobSkill
from apps.recruitment.jobs.models import Job


def _schedule_job(job_id):
    from apps.recruitment.jobs.services.recommendations import (
        invalidate_recommendations_cache,
        schedule_job_embedding_refresh,
    )

    schedule_job_embedding_refresh(job_id)
    invalidate_recommendations_cache()


def _remove_job_vector(job_id):
    from apps.recruitment.jobs.services.recommendations import (
        invalidate_recommendations_cache,
        remove_job_from_vector_store,
    )

    remove_job_from_vector_store(job_id)
    invalidate_recommendations_cache()


def _job_embedding_eligible(job):
    return (
        job.status == Job.Status.PUBLISHED
        and job.domain_status == Job.DomainStatus.IT_APPROVED
        and job.moderation_status == Job.ModerationStatus.APPROVED
    )


def _schedule_profile(recruiter_id):
    from apps.recruitment.jobs.services.recommendations import (
        invalidate_recommendations_cache,
        schedule_candidate_embedding_refresh,
    )

    schedule_candidate_embedding_refresh(recruiter_id)
    invalidate_recommendations_cache(recruiter_id)


def _schedule_cv(recruiter_id, cv_id):
    from apps.recruitment.jobs.services.recommendations import (
        invalidate_recommendations_cache,
        schedule_candidate_embedding_refresh,
    )

    schedule_candidate_embedding_refresh(
        recruiter_id,
        cv_id,
        source_type="cv",
    )
    invalidate_recommendations_cache(recruiter_id)


@receiver(post_save, sender=Job)
def refresh_job_embedding_after_save(sender, instance, **kwargs):
    transaction.on_commit(lambda: _schedule_job(instance.id))


@receiver(post_delete, sender=Job)
def remove_job_embedding_after_delete(sender, instance, **kwargs):
    job_id = instance.id
    transaction.on_commit(lambda: _remove_job_vector(job_id))


@receiver(post_save, sender=JobSkill)
@receiver(post_delete, sender=JobSkill)
def refresh_job_embedding_after_skill_change(sender, instance, **kwargs):
    if _job_embedding_eligible(instance.job):
        transaction.on_commit(lambda: _schedule_job(instance.job_id))


@receiver(post_save, sender=JobLocation)
@receiver(post_delete, sender=JobLocation)
def refresh_job_embedding_after_location_change(sender, instance, **kwargs):
    if _job_embedding_eligible(instance.job):
        transaction.on_commit(lambda: _schedule_job(instance.job_id))


@receiver(post_save, sender=Recruiter)
def refresh_candidate_embedding_after_profile_change(sender, instance, **kwargs):
    transaction.on_commit(lambda: _schedule_profile(instance.id))


@receiver(post_save, sender=RecruiterSkill)
@receiver(post_delete, sender=RecruiterSkill)
@receiver(post_save, sender=RecruiterExperience)
@receiver(post_delete, sender=RecruiterExperience)
@receiver(post_save, sender=RecruiterEducation)
@receiver(post_delete, sender=RecruiterEducation)
@receiver(post_save, sender=RecruiterProject)
@receiver(post_delete, sender=RecruiterProject)
@receiver(post_save, sender=RecruiterCertification)
@receiver(post_delete, sender=RecruiterCertification)
@receiver(post_save, sender=RecruiterLanguage)
@receiver(post_delete, sender=RecruiterLanguage)
def refresh_candidate_embedding_after_profile_sections_change(
    sender, instance, **kwargs
):
    transaction.on_commit(lambda: _schedule_profile(instance.recruiter_id))


@receiver(post_save, sender=RecruiterCV)
def refresh_candidate_embedding_after_cv_change(sender, instance, **kwargs):
    if instance.cv_data:
        transaction.on_commit(lambda: _schedule_cv(instance.recruiter_id, instance.id))
