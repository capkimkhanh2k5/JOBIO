from django.dispatch import receiver
from django.db.models.signals import post_save, m2m_changed
from django.db import transaction
from apps.candidate.recruiters.models import Recruiter
from apps.recruitment.jobs.models import Job
from apps.assessment.ai_matching_scores.tasks import calculate_candidate_matches_task, calculate_job_matches_task

@receiver(post_save, sender=Recruiter)
def trigger_candidate_matching(sender, instance, created, **kwargs):
    """
    Trigger AI matching when a Recruiter profile is created or updated.
    """
    transaction.on_commit(lambda: calculate_candidate_matches_task.delay(instance.id))

@receiver(m2m_changed, sender=Recruiter.skills.through)
def trigger_candidate_matching_skills(sender, instance, action, **kwargs):
    """
    Trigger AI matching when Recruiter skills are added/removed.
    """
    if action in ["post_add", "post_remove", "post_clear"]:
        transaction.on_commit(lambda: calculate_candidate_matches_task.delay(instance.id))

@receiver(post_save, sender=Job)
def trigger_job_matching(sender, instance, created, **kwargs):
    """
    Trigger AI matching when a Job is created or updated.
    """
    if instance.status == 'published':
        transaction.on_commit(lambda: calculate_job_matches_task.delay(instance.id))

@receiver(m2m_changed, sender=Job.required_skills.through)
def trigger_job_matching_skills(sender, instance, action, **kwargs):
    """
    Trigger AI matching when Job skills are added/removed.
    """
    if action in ["post_add", "post_remove", "post_clear"] and instance.status == 'published':
        transaction.on_commit(lambda: calculate_job_matches_task.delay(instance.id))

# m2m changed: Bất kỳ thay đổi nhỏ nào về bảng skills hay job đều sẽ kích hoạt tính lại điểm ngay lập tức.