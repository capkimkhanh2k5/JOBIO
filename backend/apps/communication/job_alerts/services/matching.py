import re
import logging
from typing import List, Set

from django.db.models import Prefetch, Q

from apps.candidate.skills.models import Skill
from apps.communication.job_alerts.models import JobAlert, JobAlertMatch
from apps.geography.provinces.models import Province
from apps.recruitment.jobs.models import Job


logger = logging.getLogger(__name__)

_TOKEN_PATTERN = re.compile(r"[a-z0-9]+")


def _tokenize(text: str) -> Set[str]:
    """Normalize text into a stable set of lowercase tokens."""
    if not text:
        return set()
    return set(_TOKEN_PATTERN.findall(text.lower()))


def _coverage_score(required: Set[str], available: Set[str]) -> float:
    """Return how much of the required set is covered by the available set."""
    if not required:
        return 1.0
    if not available:
        return 0.0
    return len(required & available) / len(required)


def _salary_similarity_score(
    alert_salary_min, job_salary_min, job_salary_max, is_salary_negotiable: bool
) -> float:
    """Return a 0.0-1.0 salary similarity score."""
    if alert_salary_min is None:
        return 1.0

    if is_salary_negotiable:
        return 0.5

    salary_candidates = [
        value for value in (job_salary_max, job_salary_min) if value is not None
    ]
    if not salary_candidates:
        return 0.5

    best_offer = max(salary_candidates)
    if best_offer >= alert_salary_min:
        return 1.0

    try:
        return max(0.0, float(best_offer) / float(alert_salary_min))
    except (TypeError, ZeroDivisionError, ValueError):
        return 0.0


class JobMatchingService:
    """Service xử lý logic so khớp Job và JobAlert sử dụng scoring nhiều tiêu chí."""

    # Scoring Weights (total = 100)
    KEYWORD_WEIGHT = 40
    SKILL_WEIGHT = 30
    LOCATION_WEIGHT = 20
    SALARY_WEIGHT = 10
    THRESHOLD = 50

    @classmethod
    def find_alerts_for_job(cls, job: Job) -> List[JobAlert]:
        """
        Tìm JobAlerts phù hợp dựa trên độ tương đồng tổng hợp.

        Scoring Algorithm (Weighted):
        - Keywords: 40% (độ phủ của keyword alert trên title/description/requirements)
        - Skills: 30% (độ phủ kỹ năng alert trên kỹ năng của job)
        - Location: 20% (tỉnh/thành match)
        - Salary: 10% (độ tương thích mức lương)

        Threshold: >= 50%

        Returns:
            List of JobAlert objects ordered by score descending
        """
        job_location_id = getattr(getattr(job, "address", None), "province_id", None)
        job_salary_min = getattr(job, "salary_min", None)
        job_salary_max = getattr(job, "salary_max", None)
        job_is_salary_negotiable = getattr(job, "is_salary_negotiable", False)
        job_text_tokens = _tokenize(
            " ".join(
                value
                for value in (
                    getattr(job, "title", "") or "",
                    getattr(job, "description", "") or "",
                    getattr(job, "requirements", "") or "",
                    getattr(job, "benefits", "") or "",
                )
                if value
            )
        )
        job_skill_ids = set()
        if hasattr(job, "required_skills"):
            job_skill_ids = set(job.required_skills.values_list("skill_id", flat=True))

        alerts = []
        query = JobAlert.objects.filter(is_active=True).prefetch_related(
            Prefetch("skills", queryset=Skill.objects.only("id")),
            Prefetch("locations", queryset=Province.objects.only("id")),
        )
        if job.category:
            query = query.filter(Q(category=job.category) | Q(category__isnull=True))
        if job.job_type:
            query = query.filter(Q(job_type=job.job_type) | Q(job_type__isnull=True))
        if job.level:
            query = query.filter(Q(level=job.level) | Q(level__isnull=True))

        for alert in query:
            alert_keyword_tokens = _tokenize(alert.keywords or "")
            keyword_score = cls.KEYWORD_WEIGHT * _coverage_score(
                alert_keyword_tokens, job_text_tokens
            )

            alert_skill_ids = {skill.id for skill in alert.skills.all()}
            if alert_skill_ids:
                skill_score = cls.SKILL_WEIGHT * _coverage_score(
                    alert_skill_ids, job_skill_ids
                )
            else:
                skill_score = cls.SKILL_WEIGHT

            alert_location_ids = {location.id for location in alert.locations.all()}
            if alert_location_ids:
                location_score = (
                    cls.LOCATION_WEIGHT
                    if job_location_id in alert_location_ids
                    else 0.0
                )
            else:
                location_score = cls.LOCATION_WEIGHT

            salary_score = cls.SALARY_WEIGHT * _salary_similarity_score(
                alert.salary_min,
                job_salary_min,
                job_salary_max,
                job_is_salary_negotiable,
            )

            total_score = keyword_score + skill_score + location_score + salary_score
            if total_score < cls.THRESHOLD:
                continue

            alert._matching_score = float(total_score)
            alerts.append(alert)

        alerts.sort(
            key=lambda item: getattr(item, "_matching_score", 0.0), reverse=True
        )

        logger.info(
            f"Found {len(alerts)} alerts matching job {job.id} (ORM-based scoring)"
        )
        return alerts

    @staticmethod
    def record_match(
        job_alert: JobAlert, job: Job, is_sent: bool = False, score: float = 0.0
    ) -> JobAlertMatch:
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
            job_alert=job_alert, job=job, defaults={"is_sent": is_sent, "score": score}
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
