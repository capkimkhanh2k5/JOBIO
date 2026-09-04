from datetime import timedelta

from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from apps.candidate.recruiters.models import Recruiter
from apps.company.companies.models import Company
from apps.company.industries.models import Industry
from apps.recruitment.applications.models import Application
from apps.recruitment.interviews.models import Interview
from apps.recruitment.interview_types.models import InterviewType
from apps.recruitment.jobs.models import Job


User = get_user_model()


class CandidateDashboardStatsTests(APITestCase):
    @classmethod
    def setUpTestData(cls):
        cls.candidate_user = User.objects.create_user(
            email="candidate-dashboard@example.com",
            password="password123",
            full_name="Candidate Dashboard",
            role="candidate",
        )
        cls.recruiter = Recruiter.objects.create(
            user=cls.candidate_user,
            profile_views_count=7,
        )
        cls.company_user = User.objects.create_user(
            email="company-dashboard-owner@example.com",
            password="password123",
            full_name="Company Owner",
            role="company",
        )
        cls.industry = Industry.objects.create(name="Tech", slug="tech-dashboard")
        cls.company = Company.objects.create(
            user=cls.company_user,
            company_name="Dashboard Company",
            slug="dashboard-company",
            industry=cls.industry,
            verification_status=Company.VerificationStatus.VERIFIED,
        )
        cls.job = Job.objects.create(
            company=cls.company,
            title="Backend Engineer",
            slug="backend-engineer-dashboard",
            job_type=Job.JobType.FULL_TIME,
            level=Job.Level.JUNIOR,
            description="Build APIs",
            requirements="Python",
            status=Job.Status.PUBLISHED,
            application_deadline=timezone.localdate() + timedelta(days=10),
            created_by=cls.company_user,
        )
        cls.applied_job = Job.objects.create(
            company=cls.company,
            title="Frontend Engineer",
            slug="frontend-engineer-dashboard",
            job_type=Job.JobType.FULL_TIME,
            level=Job.Level.JUNIOR,
            description="Build UI",
            requirements="React",
            status=Job.Status.PUBLISHED,
            application_deadline=timezone.localdate() + timedelta(days=10),
            created_by=cls.company_user,
        )
        cls.application = Application.objects.create(
            job=cls.applied_job,
            recruiter=cls.recruiter,
        )
        cls.interview_type = InterviewType.objects.create(
            name="Technical",
            description="Technical interview",
        )
        Interview.objects.create(
            application=cls.application,
            interview_type=cls.interview_type,
            scheduled_at=timezone.now() + timedelta(days=2),
            status=Interview.Status.SCHEDULED,
            created_by=cls.company_user,
        )

    def test_candidate_dashboard_stats_requires_candidate_profile(self):
        company_user = self.company_user
        self.client.force_authenticate(company_user)

        response = self.client.get("/api/dashboard/stats/candidate/")

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_candidate_dashboard_stats_returns_current_candidate_metrics(self):
        self.client.force_authenticate(self.candidate_user)

        response = self.client.get("/api/dashboard/stats/candidate/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["applied_jobs_count"], 1)
        self.assertEqual(response.data["upcoming_interviews_count"], 1)
        self.assertEqual(response.data["profile_views_count"], 7)
        self.assertEqual(response.data["matching_jobs_count"], 1)
