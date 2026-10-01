from datetime import timedelta

from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient, APITestCase

from apps.candidate.skill_categories.models import SkillCategory
from apps.candidate.skills.models import Skill
from apps.company.companies.models import Company
from apps.core.users.models import CustomUser
from apps.moderation.models import ModerationAudit
from apps.recruitment.job_categories.models import JobCategory
from apps.recruitment.job_skills.models import JobSkill
from apps.recruitment.jobs.models import Job


class JobPublishPolicyTests(APITestCase):
    def setUp(self):
        self.user = CustomUser.objects.create_user(
            email="policy-company@example.test",
            password="password123",
            role="company",
            full_name="Policy Company",
        )
        self.company = Company.objects.create(
            user=self.user,
            company_name="Policy Labs",
            description="Software company",
            verification_status=Company.VerificationStatus.VERIFIED,
        )
        self.skill_category = SkillCategory.objects.create(
            name="Engineering", slug="engineering"
        )
        self.it_category = JobCategory.objects.create(
            name="Backend", slug="backend", domain=JobCategory.Domain.IT
        )
        self.non_it_category = JobCategory.objects.create(
            name="Accounting",
            slug="accounting",
            domain=JobCategory.Domain.OTHER,
            is_publishable=False,
        )
        self.python = Skill.objects.create(
            name="Python",
            slug="python",
            category=self.skill_category,
            is_verified=True,
            domain=Skill.Domain.IT,
        )
        self.excel = Skill.objects.create(
            name="Excel Accounting",
            slug="excel-accounting",
            category=self.skill_category,
            is_verified=True,
            domain=Skill.Domain.OTHER,
            is_publishable=False,
        )
        self.pending_skill = Skill.objects.create(
            name="Experimental Framework",
            slug="experimental-framework",
            category=self.skill_category,
            is_verified=False,
            domain=Skill.Domain.IT,
        )
        self.client.force_authenticate(self.user)

    def _job(self, **overrides):
        fields = {
            "company": self.company,
            "title": "Backend Python Developer",
            "slug": f"job-{timezone.now().timestamp()}",
            "category": self.it_category,
            "job_type": Job.JobType.FULL_TIME,
            "level": Job.Level.JUNIOR,
            "description": "Build software APIs with Python and Django.",
            "requirements": "Python, API, database experience.",
            "application_deadline": timezone.localdate() + timedelta(days=30),
            "status": Job.Status.DRAFT,
            "created_by": self.user,
        }
        fields.update(overrides)
        return Job.objects.create(**fields)

    def test_it_job_with_verified_skill_can_publish(self):
        job = self._job()
        JobSkill.objects.create(job=job, skill=self.python, is_required=True)

        response = self.client.post(f"/api/jobs/{job.id}/publish/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        job.refresh_from_db()
        self.assertEqual(job.status, Job.Status.PUBLISHED)
        self.assertEqual(job.domain_status, Job.DomainStatus.IT_APPROVED)
        self.assertEqual(job.moderation_status, Job.ModerationStatus.APPROVED)

    def test_accounting_job_is_rejected_and_keeps_draft_status(self):
        job = self._job(
            title="Kế toán tổng hợp",
            category=self.non_it_category,
            description="Tuyển kế toán xử lý hóa đơn và báo cáo tài chính.",
            requirements="Kinh nghiệm kế toán, Excel.",
        )
        JobSkill.objects.create(job=job, skill=self.excel, is_required=True)

        response = self.client.post(f"/api/jobs/{job.id}/publish/")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data["code"], "job_policy_blocked")
        error_codes = {error["code"] for error in response.data["errors"]}
        self.assertIn("non_it_category", error_codes)
        self.assertIn("non_it_job", error_codes)
        self.assertTrue(
            all(error.get("suggestion") for error in response.data["errors"])
        )
        job.refresh_from_db()
        self.assertEqual(job.status, Job.Status.DRAFT)
        self.assertEqual(job.domain_status, Job.DomainStatus.NON_IT)
        persisted_errors = {error["code"]: error for error in job.moderation_reasons}
        self.assertIn("suggestion", persisted_errors["non_it_category"])
        self.assertTrue(
            ModerationAudit.objects.filter(
                entity_type="job", entity_id=job.id, purpose="job_publish"
            ).exists()
        )

    def test_unverified_custom_skill_blocks_publish(self):
        job = self._job()
        JobSkill.objects.create(job=job, skill=self.pending_skill, is_required=True)

        response = self.client.post(f"/api/jobs/{job.id}/validate-for-publish/")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        error_codes = {error["code"] for error in response.data["errors"]}
        self.assertIn("missing_verified_it_skill", error_codes)
        self.assertIn("unapproved_skill", error_codes)
        unapproved = next(
            error
            for error in response.data["errors"]
            if error["code"] == "unapproved_skill"
        )
        self.assertIn("Experimental Framework", unapproved["suggestion"])

    def test_draft_create_allows_policy_violations_for_later_fix(self):
        response = self.client.post(
            "/api/jobs/",
            {
                "company_id": self.company.id,
                "title": "Marketing Executive",
                "category_id": self.non_it_category.id,
                "job_type": Job.JobType.FULL_TIME,
                "level": Job.Level.JUNIOR,
                "description": "Chạy chiến dịch marketing và bán hàng.",
                "requirements": "Marketing, sales.",
                "status": Job.Status.DRAFT,
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["status"], Job.Status.DRAFT)

    def test_public_approved_job_content_update_requires_review(self):
        job = self._job(
            status=Job.Status.PUBLISHED,
            published_at=timezone.now(),
            domain_status=Job.DomainStatus.IT_APPROVED,
            moderation_status=Job.ModerationStatus.APPROVED,
        )
        JobSkill.objects.create(job=job, skill=self.python, is_required=True)

        response = self.client.patch(
            f"/api/jobs/{job.id}/",
            {
                "description": "Build backend software APIs with Python, Django, and AWS."
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        job.refresh_from_db()
        self.assertEqual(job.status, Job.Status.PUBLISHED)
        self.assertEqual(job.domain_status, Job.DomainStatus.NEEDS_REVIEW)
        self.assertEqual(job.moderation_status, Job.ModerationStatus.NEEDS_REVIEW)
        self.assertEqual(job.moderation_reasons[0]["code"], "job_content_updated")

        public_response = APIClient().get(f"/api/jobs/{job.id}/")
        self.assertEqual(public_response.status_code, status.HTTP_404_NOT_FOUND)

        owner_response = self.client.get(f"/api/jobs/{job.id}/")
        self.assertEqual(owner_response.status_code, status.HTTP_200_OK)
