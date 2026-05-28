from rest_framework import status
from rest_framework.test import APITestCase

from apps.candidate.recruiter_skills.models import RecruiterSkill
from apps.candidate.recruiters.models import Recruiter
from apps.candidate.skill_categories.models import SkillCategory
from apps.candidate.skills.models import Skill
from apps.core.users.models import CustomUser


class RecruiterSkillViewTests(APITestCase):
    def setUp(self):
        self.user = CustomUser.objects.create_user(
            email="candidate@example.com", password="password123", role="candidate"
        )
        self.other_user = CustomUser.objects.create_user(
            email="other@example.com", password="password123", role="candidate"
        )
        self.recruiter = Recruiter.objects.create(user=self.user)
        self.other_recruiter = Recruiter.objects.create(user=self.other_user)
        self.category = SkillCategory.objects.create(
            name="Programming", slug="programming"
        )
        self.python = Skill.objects.create(
            name="Python", slug="python", category=self.category, is_verified=True
        )
        self.url = f"/api/candidates/{self.recruiter.id}/skills/"
        self.client.force_authenticate(user=self.user)

    def test_create_skill_by_name_creates_pending_master_skill(self):
        response = self.client.post(
            self.url,
            {
                "skill_name": " GraphQL ",
                "proficiency_level": "advanced",
                "years_of_experience": 2,
            },
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        skill = Skill.objects.get(name="GraphQL")
        self.assertEqual(skill.category.slug, "khac")
        self.assertFalse(skill.is_verified)
        self.assertEqual(response.data["skill_id"], skill.id)
        self.assertEqual(response.data["skill_name"], "GraphQL")

    def test_create_skill_by_name_reuses_existing_case_insensitive_skill(self):
        response = self.client.post(self.url, {"skill_name": "python"})

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["skill_id"], self.python.id)
        self.assertEqual(Skill.objects.filter(name__iexact="python").count(), 1)

    def test_create_skill_rejects_blank_name(self):
        response = self.client.post(self.url, {"skill_name": "   "})

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(Skill.objects.filter(name="").exists())

    def test_create_skill_rejects_duplicate_for_recruiter(self):
        RecruiterSkill.objects.create(recruiter=self.recruiter, skill=self.python)

        response = self.client.post(self.url, {"skill_id": self.python.id})

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_list_skills_unauthenticated(self):
        self.client.logout()

        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_list_skills_not_owner(self):
        self.client.force_authenticate(user=self.other_user)

        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_owner_cannot_create_skill_for_other_recruiter(self):
        response = self.client.post(
            f"/api/candidates/{self.other_recruiter.id}/skills/",
            {"skill_name": "Rust"},
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
