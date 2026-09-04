from datetime import timedelta
from unittest.mock import patch

from django.test import TestCase
from django.utils import timezone

from apps.company.companies.models import Company
from apps.core.users.models import CustomUser
from apps.recruitment.jobs.models import Job
from apps.recruitment.jobs.tasks import expire_published_jobs_task


class JobTaskTests(TestCase):
    def setUp(self):
        self.user = CustomUser.objects.create_user(
            email="job-task-company@example.com",
            password="password123",
            role="company",
        )
        self.company = Company.objects.create(
            user=self.user,
            company_name="Job Task Company",
            verification_status=Company.VerificationStatus.VERIFIED,
        )

    def _job(self, **overrides):
        today = timezone.localdate()
        data = {
            "company": self.company,
            "created_by": self.user,
            "title": "Backend Developer",
            "slug": f"backend-developer-{Job.objects.count()}",
            "job_type": Job.JobType.FULL_TIME,
            "level": Job.Level.JUNIOR,
            "description": "Build APIs",
            "requirements": "Python",
            "status": Job.Status.PUBLISHED,
            "application_deadline": today + timedelta(days=7),
        }
        data.update(overrides)
        return Job.objects.create(**data)

    @patch(
        "apps.recruitment.jobs.services.recommendations.remove_job_from_vector_store"
    )
    def test_expire_published_jobs_task_closes_deadline_expired_jobs(self, remove_vector):
        today = timezone.localdate()
        expired = self._job(
            slug="expired-job-task-test",
            application_deadline=today - timedelta(days=1),
            featured=True,
            featured_until=today + timedelta(days=5),
        )
        active = self._job(
            slug="active-job-task-test",
            application_deadline=today + timedelta(days=1),
            featured=True,
            featured_until=today + timedelta(days=5),
        )

        result = expire_published_jobs_task()

        self.assertEqual(result, {"status": "success", "expired_count": 1})
        expired.refresh_from_db()
        active.refresh_from_db()
        self.assertEqual(expired.status, Job.Status.EXPIRED)
        self.assertFalse(expired.featured)
        self.assertIsNone(expired.featured_until)
        self.assertEqual(active.status, Job.Status.PUBLISHED)
        self.assertTrue(active.featured)
        remove_vector.assert_called_once_with(expired.id)
