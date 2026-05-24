from types import SimpleNamespace

from django.test import TestCase

from apps.core.users.models import CustomUser
from apps.candidate.recruiter_cvs.models import RecruiterCV
from apps.candidate.recruiters.models import Recruiter
from apps.candidate.skill_categories.models import SkillCategory
from apps.candidate.skills.models import Skill
from apps.company.companies.models import Company
from apps.recruitment.applications.models import Application
from apps.recruitment.job_categories.models import JobCategory
from apps.recruitment.jobs.models import Job


class FakeManager:
    def __init__(self, items):
        self.items = items

    def all(self):
        return self.items


class MatchingHelpersTest(TestCase):
    def setUp(self):
        self.skill_category = SkillCategory.objects.create(
            name="Engineering",
            slug="engineering",
        )

    def _skill(self, name, slug):
        return Skill.objects.create(
            name=name,
            slug=slug,
            category=self.skill_category,
            is_active=True,
        )

    def test_resolve_cv_skill_ids_uses_exact_slug_and_known_aliases(self):
        from apps.recruitment.jobs.selectors.jobs import _resolve_cv_skill_ids

        javascript = self._skill("JavaScript", "javascript")
        react = self._skill("React.js", "react-js")
        postgres = self._skill("PostgreSQL", "postgresql")

        result = _resolve_cv_skill_ids(
            {
                "skills": [
                    {"name": "JS"},
                    {"name": "React"},
                    {"name": "postgres"},
                ]
            }
        )

        self.assertEqual(result, {javascript.id, react.id, postgres.id})

    def test_resolve_cv_skill_ids_does_not_accept_ambiguous_fuzzy_match(self):
        from apps.recruitment.jobs.selectors.jobs import _resolve_cv_skill_ids

        self._skill("JavaScript", "javascript")
        self._skill("TypeScript", "typescript")

        self.assertEqual(_resolve_cv_skill_ids({"skills": [{"name": "script"}]}), set())

    def test_experience_range_is_used_before_level_fallback(self):
        from apps.recruitment.jobs.selectors.jobs import _experience_level_score

        self.assertEqual(_experience_level_score(3, "senior", 2, 4), 1.0)
        self.assertEqual(_experience_level_score(1, "senior", 3, 5), 0.4)
        self.assertEqual(_experience_level_score(8, "intern", 2, 4), 0.6)

    def test_negotiable_salary_is_neutral(self):
        from apps.recruitment.jobs.selectors.jobs import _salary_match_score

        self.assertEqual(_salary_match_score(20, 30, None, None, True), 0.5)
        self.assertEqual(_salary_match_score(20, 30, 5, 10, False), 0.0)

    def test_location_score_uses_multi_location_provinces(self):
        from apps.recruitment.jobs.selectors.jobs import _location_score

        job = SimpleNamespace(
            is_remote=False,
            address_id=None,
            locations=FakeManager(
                [
                    SimpleNamespace(
                        address=SimpleNamespace(province_id=10),
                    )
                ]
            ),
        )

        self.assertEqual(_location_score(10, job), 1.0)


class MatchingCategoryLeakTest(TestCase):
    def setUp(self):
        self.owner = CustomUser.objects.create_user(
            email="owner@example.test",
            password="password123",
            full_name="Owner",
            role="company",
        )
        self.candidate = CustomUser.objects.create_user(
            email="candidate@example.test",
            password="password123",
            full_name="Candidate",
        )
        self.company = Company.objects.create(
            user=self.owner,
            company_name="Test Company",
            description="A test company",
            verification_status=Company.VerificationStatus.VERIFIED,
        )
        self.recruiter = Recruiter.objects.create(user=self.candidate)
        self.cv = RecruiterCV.objects.create(
            recruiter=self.recruiter,
            cv_name="Fallback CV",
            cv_data={},
        )
        self.current_category = JobCategory.objects.create(
            name="Current Category",
            slug="current-category",
        )
        self.other_category = JobCategory.objects.create(
            name="Other Category",
            slug="other-category",
        )
        self.current_job = self._job(
            "Current Job",
            "current-job",
            self.current_category,
        )
        self.other_job = self._job(
            "Other Job",
            "other-job",
            self.other_category,
        )
        Application.objects.create(
            recruiter=self.recruiter,
            job=self.current_job,
            status="pending",
        )
        Application.objects.create(
            recruiter=self.recruiter,
            job=self.other_job,
            status="pending",
        )

    def _job(self, title, slug, category):
        return Job.objects.create(
            company=self.company,
            title=title,
            slug=slug,
            category=category,
            job_type="full-time",
            level="junior",
            description="Job description",
            requirements="Requirements",
            status="published",
            created_by=self.owner,
        )

    def test_current_application_job_category_is_excluded_from_history(self):
        from apps.recruitment.jobs.selectors.jobs import _extract_candidate_data

        data = _extract_candidate_data(
            self.cv,
            self.recruiter,
            exclude_job_id=self.current_job.id,
        )

        self.assertNotIn(self.current_category.id, data["category_ids"])
        self.assertIn(self.other_category.id, data["category_ids"])
