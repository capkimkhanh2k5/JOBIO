from datetime import timedelta

from django.test import TestCase
from django.utils import timezone

from apps.candidate.skill_categories.models import SkillCategory
from apps.candidate.skills.models import Skill
from apps.company.companies.models import Company
from apps.core.users.models import CustomUser
from apps.recruitment.job_categories.models import JobCategory
from apps.recruitment.jobs.models import CanonicalTitle, Job, JobTitleAlias
from apps.recruitment.jobs.services.normalization import (
    extract_skills,
    normalize_key,
    process_job_recommendation_profile,
)


class RecommendationNormalizationTests(TestCase):
    def setUp(self):
        self.company_user = CustomUser.objects.create_user(
            email="company-normalization@example.test",
            password="password123",
            full_name="Company",
            role="company",
        )
        self.company = Company.objects.create(
            user=self.company_user,
            company_name="JOBIO Labs",
            description="Hiring engineers",
            verification_status=Company.VerificationStatus.VERIFIED,
        )
        self.category = JobCategory.objects.create(
            name="Engineering", slug="engineering"
        )
        self.skill_category = SkillCategory.objects.create(
            name="Programming", slug="programming"
        )
        Skill.objects.create(
            name="Java", slug="java", category=self.skill_category, is_active=True
        )
        backend_title, _ = CanonicalTitle.objects.get_or_create(
            name="Backend Developer",
            defaults={
                "description": "Builds server-side APIs and business logic.",
                "category": "Software Engineering",
            },
        )
        JobTitleAlias.objects.get_or_create(
            normalized_alias=normalize_key("BE Developer"),
            canonical_title=backend_title,
            defaults={"alias_name": "BE Developer", "weight": 1.0},
        )
        CanonicalTitle.objects.get_or_create(
            name="Software Engineer",
            defaults={
                "description": "General software engineering role.",
                "category": "Software Engineering",
            },
        )

    def test_job_title_normalization_extracts_plan_example(self):
        job = Job.objects.create(
            company=self.company,
            title="Senior Java BE Developer - Remote HCM",
            slug="senior-java-be-developer-remote-hcm",
            category=self.category,
            job_type="full-time",
            level="senior",
            description="Build REST APIs and backend services.",
            requirements="Java and Spring Boot experience.",
            application_deadline=timezone.localdate() + timedelta(days=30),
            status=Job.Status.PUBLISHED,
            created_by=self.company_user,
            published_at=timezone.now(),
            is_remote=True,
        )

        profile = process_job_recommendation_profile(job)

        self.assertEqual(profile.seniority, "senior")
        self.assertEqual(profile.workplace_type, "remote")
        self.assertEqual(profile.location_city, "Ho Chi Minh")
        self.assertEqual(profile.title_core, "BE Developer")
        self.assertEqual(profile.canonical_title.name, "Backend Developer")
        self.assertIn("Java", profile.skills_required)

    def test_vietnamese_diacritics_are_normalized_for_title_noise(self):
        job = Job.objects.create(
            company=self.company,
            title="Thực tập sinh Backend - Hồ Chí Minh văn phòng",
            slug="thuc-tap-sinh-backend-ho-chi-minh",
            category=self.category,
            job_type="internship",
            level="intern",
            description="Hỗ trợ phát triển API.",
            requirements="",
            application_deadline=timezone.localdate() + timedelta(days=30),
            status=Job.Status.PUBLISHED,
            created_by=self.company_user,
            published_at=timezone.now(),
        )

        profile = process_job_recommendation_profile(job)

        self.assertEqual(profile.seniority, "intern")
        self.assertEqual(profile.workplace_type, "onsite")
        self.assertEqual(profile.location_city, "Ho Chi Minh")
        self.assertEqual(profile.title_core, "Backend")

    def test_intermediate_software_engineer_uses_skill_context(self):
        job = Job.objects.create(
            company=self.company,
            title="Software Engineer - Java Spring Boot",
            slug="software-engineer-java-spring-boot",
            category=self.category,
            job_type="full-time",
            level="middle",
            description="Build REST API services.",
            requirements="Java Spring Boot REST API",
            application_deadline=timezone.localdate() + timedelta(days=30),
            status=Job.Status.PUBLISHED,
            created_by=self.company_user,
            published_at=timezone.now(),
        )

        profile = process_job_recommendation_profile(job)

        self.assertEqual(profile.title_core, "Software Engineer")
        self.assertEqual(profile.canonical_title.name, "Backend Developer")
        self.assertEqual(profile.title_normalization_method, "skill_context")

    def test_skill_alias_uses_token_boundary(self):
        self.assertIn("Node.js", extract_skills("Need Node and Express"))
        self.assertNotIn("Node.js", extract_skills("This is a standalone word"))
