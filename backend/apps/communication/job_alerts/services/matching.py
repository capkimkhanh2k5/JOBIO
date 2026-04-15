from django.db.models import Q
from typing import List
import logging

from apps.communication.job_alerts.models import JobAlert, JobAlertMatch
from apps.recruitment.jobs.models import Job


logger = logging.getLogger(__name__)


class JobMatchingService:
    """Service xử lý logic so khớp Job và JobAlert sử dụng Django ORM Annotations"""
    
    # Scoring Weights (total = 100)
    KEYWORD_WEIGHT = 40
    SKILL_WEIGHT = 30
    LOCATION_WEIGHT = 20
    SALARY_WEIGHT = 10
    THRESHOLD = 50
    
    @classmethod
    def find_alerts_for_job(cls, job: Job) -> List[JobAlert]:
        """
        Tìm JobAlerts phù hợp sử dụng Django ORM Annotations.
        
        Scoring Algorithm (Weighted):
        - Keywords: 40% (keyword exists in job title/description)
        - Skills: 30% (overlap between alert skills and job skills)
        - Location: 20% (job location matches alert locations)
        - Salary: 10% (job salary >= alert min salary)
        
        Threshold: >= 50%
        
        Returns:
            List of JobAlert objects ordered by score descending
        """
        job_title = (job.title or '').lower()
        job_description = (getattr(job, 'description', '') or '').lower()
        job_location_id = getattr(getattr(job, 'address', None), 'province_id', None)
        job_salary_max = getattr(job, 'salary_max', None)
        job_skill_ids = []
        if hasattr(job, 'required_skills'):
            job_skill_ids = list(job.required_skills.values_list('skill_id', flat=True))

        alerts = []
        query = JobAlert.objects.filter(is_active=True).prefetch_related('skills', 'locations')
        if job.category:
            query = query.filter(Q(category=job.category) | Q(category__isnull=True))
        if job.job_type:
            query = query.filter(Q(job_type=job.job_type) | Q(job_type__isnull=True))
        if job.level:
            query = query.filter(Q(level=job.level) | Q(level__isnull=True))

        for alert in query:
            alert_keywords = (alert.keywords or '').lower().split()
            keyword_score = cls.KEYWORD_WEIGHT if not alert_keywords else 0.0
            if alert_keywords:
                haystack = f"{job_title} {job_description}"
                if all(keyword in haystack for keyword in alert_keywords):
                    keyword_score = cls.KEYWORD_WEIGHT
                elif any(keyword in haystack for keyword in alert_keywords):
                    keyword_score = cls.KEYWORD_WEIGHT * 0.5

            alert_skill_ids = list(alert.skills.values_list('id', flat=True))
            if alert_skill_ids:
                overlap = len(set(alert_skill_ids).intersection(job_skill_ids))
                if overlap == 0:
                    continue
                skill_score = cls.SKILL_WEIGHT * (overlap / len(alert_skill_ids))
            else:
                skill_score = cls.SKILL_WEIGHT

            alert_location_ids = list(alert.locations.values_list('id', flat=True))
            if not alert_location_ids:
                location_score = cls.LOCATION_WEIGHT
            else:
                location_score = cls.LOCATION_WEIGHT if job_location_id in alert_location_ids else 0.0

            if alert.salary_min is None:
                salary_score = cls.SALARY_WEIGHT
            else:
                salary_score = cls.SALARY_WEIGHT if job_salary_max is None or job_salary_max >= alert.salary_min else 0.0

            total_score = keyword_score + skill_score + location_score + salary_score
            if total_score < cls.THRESHOLD:
                continue

            alert._matching_score = float(total_score)
            alerts.append(alert)

        alerts.sort(key=lambda item: getattr(item, '_matching_score', 0.0), reverse=True)
        
        logger.info(f"Found {len(alerts)} alerts matching job {job.id} (ORM-based scoring)")
        return alerts

    @staticmethod
    def record_match(job_alert: JobAlert, job: Job, is_sent: bool = False, score: float = 0.0) -> JobAlertMatch:
        """
        Lưu lịch sử match.
        
        Args:
            job_alert: The JobAlert that matched
            job: The Job that was matched
            is_sent: Whether notification was sent
            score: Matching score (0-100)
        
        Returns:
            JobAlertMatch object
        """
        match, created = JobAlertMatch.objects.get_or_create(
            job_alert=job_alert,
            job=job,
            defaults={
                'is_sent': is_sent,
                'score': score
            }
        )
        if not created:
            # Update existing match
            updated = False
            if is_sent and not match.is_sent:
                match.is_sent = True
                updated = True
            if score > match.score:
                match.score = score
                updated = True
            if updated:
                match.save()
        return match
