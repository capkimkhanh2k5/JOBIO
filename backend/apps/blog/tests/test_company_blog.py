from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from apps.core.users.models import CustomUser
from apps.company.companies.models import Company
from apps.blog.models import Post


class CompanyBlogTest(TestCase):
    def setUp(self):
        self.client = APIClient()

        # 1. Company Owner
        self.owner = CustomUser.objects.create(
            email="owner@test.com", full_name="Owner", role="company"
        )
        self.company = Company.objects.create(
            user=self.owner,
            company_name="Owner Co",
            slug="owner-co",
            verification_status=Company.VerificationStatus.VERIFIED,
        )

        # 2. Regular User (Freelancer)
        self.freelancer = CustomUser.objects.create(
            email="free@test.com", full_name="Free"
        )

        # 3. Admin
        self.admin = CustomUser.objects.create_superuser(
            email="admin@test.com", password="pwd"
        )

    def test_create_post_company_owner(self):
        """Owner's post should be linked to Company and Draft by default"""
        self.client.force_authenticate(user=self.owner)
        data = {
            "title": "Company Culture",
            "content": "We are great.",
            "summary": "Summary",
        }
        response = self.client.post("/api/blog/posts/", data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        post = Post.objects.get(id=response.data["id"])
        self.assertEqual(post.author, self.owner)
        self.assertEqual(post.company, self.company)
        self.assertEqual(post.status, Post.Status.DRAFT)

    def test_create_post_freelancer_forbidden(self):
        """Freelancer (non-company user) cannot create blog posts"""
        self.client.force_authenticate(user=self.freelancer)
        data = {
            "title": "My Freelance Journey",
            "content": "It is hard.",
            "summary": "Summary",
        }
        response = self.client.post("/api/blog/posts/", data)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_create_post_admin(self):
        """Admin can publish immediately"""
        self.client.force_authenticate(user=self.admin)
        data = {
            "title": "Official News",
            "content": "Update available.",
            "status": Post.Status.PUBLISHED,
        }
        response = self.client.post("/api/blog/posts/", data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        post = Post.objects.get(id=response.data["id"])
        self.assertEqual(post.status, Post.Status.PUBLISHED)

    def test_create_post_pending_company_forbidden(self):
        """Pending company cannot create blog posts"""
        pending_owner = CustomUser.objects.create_user(
            email="pending@test.com",
            password="pwd",
            full_name="Pending Owner",
            role="company",
        )
        Company.objects.create(
            user=pending_owner,
            company_name="Pending Co",
            slug="pending-co-blog-test",
        )

        self.client.force_authenticate(user=pending_owner)
        response = self.client.post(
            "/api/blog/posts/",
            {
                "title": "Blocked Post",
                "content": "Should not be allowed",
                "summary": "Blocked",
            },
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_post_response_contains_company_name(self):
        """Verified company post should return company_name in API response"""
        self.client.force_authenticate(user=self.owner)
        data = {
            "title": "Company Blog Post",
            "content": "Content about our company.",
            "summary": "Summary",
        }
        response = self.client.post("/api/blog/posts/", data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["company_name"], "Owner Co")

    def test_post_list_shows_company_name(self):
        """Published company post should show company_name in list view"""
        self.client.force_authenticate(user=self.owner)
        post = Post.objects.create(
            title="Listed Post",
            content="Content",
            author=self.owner,
            company=self.company,
            status=Post.Status.PUBLISHED,
        )

        # Unauthenticated list should also see company_name
        self.client.force_authenticate(user=None)
        response = self.client.get("/api/blog/posts/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        results = response.data.get("results", response.data)
        found = [p for p in results if p["id"] == post.id]
        self.assertTrue(len(found) > 0)
        self.assertEqual(found[0]["company_name"], "Owner Co")
