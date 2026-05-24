from django.utils import timezone
from django.core.exceptions import PermissionDenied
from apps.blog.models import Post
from apps.core.users.permissions import is_admin_user


class BlogService:
    @staticmethod
    def create_post(author, data):
        """
        Create a new blog post.

        Args:
            author: The user creating the post (must be verified company or admin)
            data: Validated dict of post fields

        Raises:
            PermissionDenied: If user is not a verified company or admin
        """

        if is_admin_user(author):
            return Post.objects.create(author=author, **data)

        company_profile = getattr(author, "company_profile", None)
        if not company_profile or company_profile.verification_status != "verified":
            raise PermissionDenied("Chỉ công ty đã xác thực mới được đăng bài blog.")

        return Post.objects.create(author=author, company=company_profile, **data)

    @staticmethod
    def publish_post(post: Post) -> Post:
        post.status = Post.Status.PUBLISHED
        post.published_at = timezone.now()
        post.save()
        return post

    @staticmethod
    def increment_view_count(post: Post) -> int:
        post.view_count += 1
        post.save(update_fields=["view_count"])
        return post.view_count
