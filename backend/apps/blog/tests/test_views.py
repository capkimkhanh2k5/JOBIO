"""
Blog Views Tests - Django TestCase Version
"""

from unittest.mock import patch

from rest_framework import status
from rest_framework.test import APITestCase
from django.urls import reverse
from django.contrib.auth import get_user_model

from apps.blog.models import Category, Tag, Post

User = get_user_model()


class TestBlogViews(APITestCase):
    """Tests for Blog ViewSet"""

    @classmethod
    def setUpTestData(cls):
        cls.admin_user = User.objects.create_superuser(
            email="admin@blog-test.com",
            password="password123",
            first_name="Admin",
            last_name="User",
        )
        cls.public_user = User.objects.create_user(
            email="user@blog-test.com",
            password="password123",
            first_name="Public",
            last_name="User",
        )
        cls.category = Category.objects.create(name="Tech", slug="tech")
        cls.tag = Tag.objects.create(name="Python", slug="python")

        # Published post
        cls.published_post = Post.objects.create(
            title="Published Post",
            slug="published-post",
            author=cls.admin_user,
            category=cls.category,
            content="Content",
            status=Post.Status.PUBLISHED,
            published_at="2023-01-01T00:00:00Z",
        )
        cls.published_post.tags.add(cls.tag)

        # Draft post
        cls.draft_post = Post.objects.create(
            title="Draft Post",
            slug="draft-post",
            author=cls.admin_user,
            category=cls.category,
            content="Draft Content",
            status=Post.Status.DRAFT,
        )

    def test_public_list_posts(self):
        """Authenticated users see published posts (API requires auth)"""
        self.client.force_authenticate(user=self.public_user)
        url = reverse("posts-list")
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Public user sees only published posts
        self.assertEqual(
            len(
                response.data.get("results", response.data)
                if isinstance(response.data, dict)
                else response.data
            ),
            1,
        )
        self.assertEqual(
            (
                response.data.get("results", response.data)
                if isinstance(response.data, dict)
                else response.data
            )[0]["title"],
            self.published_post.title,
        )

    def test_admin_list_posts(self):
        """Admin users see all posts (published and draft)"""
        self.client.force_authenticate(user=self.admin_user)
        url = reverse("posts-list")
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(
            len(
                response.data.get("results", response.data)
                if isinstance(response.data, dict)
                else response.data
            ),
            2,
        )  # Admin sees all

    def test_create_post_admin(self):
        """Admin can create posts"""
        self.client.force_authenticate(user=self.admin_user)
        url = reverse("posts-list")
        data = {
            "title": "New Post",
            "content": "New Content",
            "category_id": self.category.id,
            "tag_ids": [self.tag.id],
            "status": "draft",
        }
        response = self.client.post(url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_regular_user_cannot_create_post(self):
        """Regular users (non-company) cannot create posts - expect 403"""
        self.client.force_authenticate(user=self.public_user)
        url = reverse("posts-list")
        data = {
            "title": "User Post",
            "content": "User content",
            "category_id": self.category.id,
        }
        response = self.client.post(url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_view_count_increment(self):
        """View count increments when action is called"""
        url = reverse("posts-view-count", kwargs={"slug": self.published_post.slug})
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.published_post.refresh_from_db()
        self.assertEqual(self.published_post.view_count, 1)

    def test_public_filters_posts_by_category_and_tag(self):
        """Public list supports category and tag filters"""
        category_response = self.client.get(
            f"/api/blog/posts/?category_id={self.category.id}"
        )
        tag_response = self.client.get(f"/api/blog/posts/?tag_id={self.tag.id}")

        self.assertEqual(category_response.status_code, status.HTTP_200_OK)
        self.assertEqual(tag_response.status_code, status.HTTP_200_OK)
        self.assertEqual(
            category_response.data["results"][0]["id"], self.published_post.id
        )
        self.assertEqual(tag_response.data["results"][0]["id"], self.published_post.id)

    @patch("apps.blog.views.EmailService.send_email")
    def test_admin_ban_archives_post_and_hides_it_publicly(self, mock_send_email):
        """Admin ban archives a post and removes it from public listing"""
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.post(
            f"/api/blog/posts/{self.published_post.slug}/ban/",
            {"reason": "Policy violation"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.published_post.refresh_from_db()
        self.assertEqual(self.published_post.status, Post.Status.ARCHIVED)
        mock_send_email.assert_called_once()

        self.client.force_authenticate(user=None)
        list_response = self.client.get("/api/blog/posts/")
        post_ids = [post["id"] for post in list_response.data["results"]]
        self.assertNotIn(self.published_post.id, post_ids)

    def test_admin_can_manage_categories_and_tags(self):
        """Admin can create, update, and delete blog categories and tags"""
        self.client.force_authenticate(user=self.admin_user)

        category_response = self.client.post(
            "/api/blog/categories/",
            {"name": "Career", "description": "Career advice"},
            format="json",
        )
        self.assertEqual(category_response.status_code, status.HTTP_201_CREATED)
        category_slug = category_response.data["slug"]

        update_category_response = self.client.patch(
            f"/api/blog/categories/{category_slug}/",
            {"description": "Updated career advice"},
            format="json",
        )
        self.assertEqual(update_category_response.status_code, status.HTTP_200_OK)
        self.assertEqual(
            update_category_response.data["description"], "Updated career advice"
        )

        tag_response = self.client.post(
            "/api/blog/tags/", {"name": "Interview"}, format="json"
        )
        self.assertEqual(tag_response.status_code, status.HTTP_201_CREATED)
        tag_slug = tag_response.data["slug"]

        delete_tag_response = self.client.delete(f"/api/blog/tags/{tag_slug}/")
        delete_category_response = self.client.delete(
            f"/api/blog/categories/{category_slug}/"
        )

        self.assertEqual(delete_tag_response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(
            delete_category_response.status_code, status.HTTP_204_NO_CONTENT
        )
