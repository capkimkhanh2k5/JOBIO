from django.db.models import Q
from typing import List
import logging

from apps.communication.job_alerts.models import JobAlert, JobAlertMatch
from apps.recruitment.jobs.models import Job
from apps.assessment.ai_matching_scores.models import AIMatchingScore


logger = logging.getLogger(__name__)


class JobMatchingService:
    """Service xử lý logic so khớp Job và JobAlert"""
    
    #TODO: Cần xem lại logic này, JobAlerts phù hợp với job cụ thể
    @staticmethod
    def find_alerts_for_job(job: Job) -> List[JobAlert]:
        """
        Tìm tất cả JobAlerts phù hợp với một Job cụ thể.
        Logic:
        1. Alert đang active
        2. Khớp Category (hoặc Alert không giới hạn category)
        3. Khớp Job Type (hoặc Alert không giới hạn)
        4. Khớp Level (hoặc Alert không giới hạn)
        5. Khớp Lương: Alert.salary_min <= Job.salary_max (hoặc Job không có max salary, hoặc Alert không set min salary)
        6. Khớp Địa điểm: Job.province nằm trong Alert.locations (hoặc Alert không giới hạn địa điểm)

        Hiệu năng hoạt động:
        - Location Filter (SQL Index) -> Giảm data.
        - FTS (In-DB) -> Lọc chính xác keyword.
        - AI (Optional) -> Chấm điểm cuối.
        """
        
        # Base Query: Active alerts
        query = JobAlert.objects.filter(is_active=True)
        
        # 1. Filter by Category
        if job.category:
            query = query.filter(
                Q(category=job.category) | Q(category__isnull=True)
            )
            
        # 2. Filter by Job Type
        if job.job_type:
            query = query.filter(
                Q(job_type=job.job_type) | Q(job_type__isnull=True)
            )
            
        # 3. Filter by Level
        if job.level:
            query = query.filter(
                Q(level=job.level) | Q(level__isnull=True)
            )
            
        # 4. Filter by Salary
        # Nếu Job có lương tối đa, thì Alert phải có lương tối thiểu <= Job.salary_max
        # Nếu Alert không set salary_min, coi như chấp nhận mọi mức lương
        if job.salary_max:
            query = query.filter(
                Q(salary_min__lte=job.salary_max) | Q(salary_min__isnull=True)
            )
            
        # 5. Filter by Location
        # Nếu Job có địa chỉ & tỉnh thành
        if job.address and job.address.province:
            query = query.filter(
                Q(locations=job.address.province) | Q(locations__isnull=True)
            ).distinct()
        # 6. Keyword Matching (Postgres FTS - Option B)
        # Reverse Search: Check if Job (Vector) matches Alert Keywords (Query)
        if job.title or job.description:
            job_text = f"{job.title} {job.description or ''}"
            
            # Filter alerts that have keywords AND match the job text
            # syntax: to_tsvector('simple', job_text) @@ websearch_to_tsquery('simple', keywords)
            # websearch_to_tsquery handles "python django" as AND, "python or django" as OR.
            # Assuming simple space logic for now.
            query = query.extra(
                where=["(keywords IS NULL OR keywords = '' OR to_tsvector('simple', %s) @@ websearch_to_tsquery('simple', keywords))"],
                params=[job_text]
            )

        # Execute query
        sql_alerts = list(query)
        
        final_alerts = []
        
        try:
            
            # Batch fetch scores for efficiency (N+1 problem)
            recruiter_ids = [alert.recruiter_id for alert in sql_alerts if alert.use_ai_matching]
            
            scores_map = {}
            if recruiter_ids:
                matches = AIMatchingScore.objects.filter(
                    job=job, 
                    recruiter_id__in=recruiter_ids
                ).values('recruiter_id', 'overall_score')
                
                scores_map = {m['recruiter_id']: m['overall_score'] for m in matches}
            
            for alert in sql_alerts:
                # 7. AI Matching
                if alert.use_ai_matching:
                    score = scores_map.get(alert.recruiter_id)
                    # Policy:
                    # 1. If score exists and < 70: REJECT (Low quality match)
                    # 2. If score is HIGH or Missing: ACCEPT
                    if score is not None and score < 70:
                        continue 
                        
                final_alerts.append(alert)
                
        except ImportError:
            logger.warning("AIMatchingScore module not found, skipping AI filtering")
            final_alerts = sql_alerts
        except Exception as e:
            logger.error(f"Error in AI filtering for job alerts: {e}")
            final_alerts = sql_alerts
            
        logger.info(f"Found {len(final_alerts)} alerts (from {len(sql_alerts)} SQL matches) matching job {job.id}")
        return final_alerts

    @staticmethod
    def record_match(job_alert: JobAlert, job: Job, is_sent: bool = False) -> JobAlertMatch:
        """Lưu lịch sử match"""
        match, created = JobAlertMatch.objects.get_or_create(
            job_alert=job_alert,
            job=job,
            defaults={'is_sent': is_sent}
        )
        if not created and is_sent and not match.is_sent:
            match.is_sent = True
            match.save()
        return match
