from unittest.mock import patch

from django.db.models.signals import post_delete
from django.test import TestCase, override_settings

from apps.blog.models import Post
from apps.candidate.recruiter_cvs.models import RecruiterCV
from apps.candidate.recruiters.models import Recruiter
from apps.core.users.models import CustomUser
from apps.system.file_uploads.models import FileUpload


class TestCloudinarySignals(TestCase):
    def test_signal_receivers_are_registered_on_app_ready(self):
        receiver_names = {
            getattr(receiver_ref(), "__name__", "")
            for _, receiver_ref, _ in post_delete.receivers
            if receiver_ref()
        }

        self.assertIn("delete_avatar_on_delete", receiver_names)
        self.assertIn("delete_blog_thumbnail_on_delete", receiver_names)

    @patch("apps.system.file_uploads.tasks.delete_cloudinary_file_task.delay")
    def test_user_avatar_deletion_on_delete(self, mock_delete_delay):
        user = CustomUser.objects.create_user(
            email="test_avatar_del@test.com",
            password="pwd",
            avatar_url=(
                "https://res.cloudinary.com/demo/image/upload/v1234/"
                "Jobio/Avatars/1/avatar.jpg"
            ),
        )
        url = user.avatar_url

        with self.captureOnCommitCallbacks(execute=True):
            user.delete()

        mock_delete_delay.assert_called_once_with(url, "image")

    @patch("apps.system.file_uploads.tasks.delete_cloudinary_file_task.delay")
    def test_user_avatar_deletion_on_update(self, mock_delete_delay):
        user = CustomUser.objects.create_user(
            email="test_avatar_upd@test.com",
            password="pwd",
            avatar_url=(
                "https://res.cloudinary.com/demo/image/upload/v1234/"
                "Jobio/Avatars/1/avatar_old.jpg"
            ),
        )
        old_url = user.avatar_url
        user.avatar_url = (
            "https://res.cloudinary.com/demo/image/upload/v1234/"
            "Jobio/Avatars/1/avatar_new.jpg"
        )

        with self.captureOnCommitCallbacks(execute=True):
            user.save()

        mock_delete_delay.assert_called_once_with(old_url, "image")

    @patch("apps.system.file_uploads.tasks.delete_cloudinary_file_task.delay")
    def test_cv_deletion_on_delete(self, mock_delete_delay):
        user = CustomUser.objects.create_user(
            email="test_cv_del@test.com", password="pwd", role="candidate"
        )
        profile = Recruiter.objects.create(user=user)
        cv = RecruiterCV.objects.create(
            recruiter=profile,
            cv_name="Test CV",
            cv_url=(
                "https://res.cloudinary.com/demo/raw/upload/v1234/Jobio/CVs/cv_123.pdf"
            ),
        )
        url = cv.cv_url

        with self.captureOnCommitCallbacks(execute=True):
            cv.delete()

        mock_delete_delay.assert_called_once_with(url, "raw")

    @patch("apps.system.file_uploads.tasks.delete_cloudinary_file_task.delay")
    def test_blog_thumbnail_uses_thumbnail_field(self, mock_delete_delay):
        user = CustomUser.objects.create_user(
            email="blog_author@test.com", password="pwd"
        )
        post = Post.objects.create(
            author=user,
            title="Cloudinary cleanup",
            content="content",
            thumbnail=(
                "https://res.cloudinary.com/demo/image/upload/v1234/"
                "Jobio/Blog/Thumbnails/1/old.jpg"
            ),
        )
        old_url = post.thumbnail
        post.thumbnail = (
            "https://res.cloudinary.com/demo/image/upload/v1234/"
            "Jobio/Blog/Thumbnails/1/new.jpg"
        )

        with self.captureOnCommitCallbacks(execute=True):
            post.save()

        mock_delete_delay.assert_called_once_with(old_url, "image")

    @patch("apps.system.file_uploads.tasks.delete_cloudinary_file_task.delay")
    def test_file_upload_with_missing_type_defaults_to_raw(self, mock_delete_delay):
        user = CustomUser.objects.create_user(
            email="file_upload@test.com", password="pwd"
        )
        upload = FileUpload.objects.create(
            user=user,
            file_name="file",
            original_name="file",
            file_path=(
                "https://res.cloudinary.com/demo/raw/upload/v1234/"
                "Jobio/Uploads/private/file"
            ),
            file_type=None,
        )
        url = upload.file_path

        with self.captureOnCommitCallbacks(execute=True):
            upload.delete()

        mock_delete_delay.assert_called_once_with(url, "raw")

    @override_settings(CLOUDINARY_STORAGE={"CLOUD_NAME": "demo"})
    @patch("cloudinary.uploader.destroy")
    def test_cloudinary_utils_image_extraction(self, mock_destroy):
        from apps.system.file_uploads.cloudinary_utils import delete_cloudinary_file

        mock_destroy.return_value = {"result": "ok"}
        url = (
            "https://res.cloudinary.com/demo/image/upload/v1234/"
            "Jobio/Avatars/1/avatar.jpg"
        )

        self.assertTrue(delete_cloudinary_file(url, "image"))
        mock_destroy.assert_called_once_with(
            "Jobio/Avatars/1/avatar", resource_type="image", invalidate=True
        )

    @override_settings(CLOUDINARY_STORAGE={"CLOUD_NAME": "demo"})
    @patch("cloudinary.uploader.destroy")
    def test_cloudinary_utils_handles_transformed_image_url(self, mock_destroy):
        from apps.system.file_uploads.cloudinary_utils import delete_cloudinary_file

        mock_destroy.return_value = {"result": "ok"}
        url = (
            "https://res.cloudinary.com/demo/image/upload/"
            "c_fill,w_100/v1234/Jobio/Avatars/1/avatar.jpg"
        )

        self.assertTrue(delete_cloudinary_file(url, "image"))
        mock_destroy.assert_called_once_with(
            "Jobio/Avatars/1/avatar", resource_type="image", invalidate=True
        )

    @override_settings(CLOUDINARY_STORAGE={"CLOUD_NAME": "demo"})
    @patch("cloudinary.uploader.destroy")
    def test_cloudinary_utils_raw_extraction(self, mock_destroy):
        from apps.system.file_uploads.cloudinary_utils import delete_cloudinary_file

        mock_destroy.return_value = {"result": "ok"}
        url = "https://res.cloudinary.com/demo/raw/upload/v1234/Jobio/CVs/cv_123.pdf"

        self.assertTrue(delete_cloudinary_file(url, "raw"))
        mock_destroy.assert_called_once_with(
            "Jobio/CVs/cv_123.pdf", resource_type="raw", invalidate=True
        )

    @override_settings(CLOUDINARY_STORAGE={"CLOUD_NAME": "demo"})
    @patch("cloudinary.uploader.destroy")
    def test_cloudinary_utils_raw_extraction_retries_without_extension(
        self, mock_destroy
    ):
        from apps.system.file_uploads.cloudinary_utils import delete_cloudinary_file

        mock_destroy.side_effect = [{"result": "not found"}, {"result": "ok"}]
        url = "https://res.cloudinary.com/demo/raw/upload/v1234/Jobio/CVs/cv_123.pdf"

        self.assertTrue(delete_cloudinary_file(url, "raw"))
        self.assertEqual(mock_destroy.call_count, 2)
        mock_destroy.assert_any_call(
            "Jobio/CVs/cv_123.pdf", resource_type="raw", invalidate=True
        )
        mock_destroy.assert_any_call(
            "Jobio/CVs/cv_123", resource_type="raw", invalidate=True
        )

    @override_settings(CLOUDINARY_STORAGE={"CLOUD_NAME": "demo"})
    @patch("cloudinary.uploader.destroy")
    def test_cloudinary_utils_rejects_wrong_cloud(self, mock_destroy):
        from apps.system.file_uploads.cloudinary_utils import delete_cloudinary_file

        url = (
            "https://res.cloudinary.com/other-cloud/image/upload/v1234/"
            "Jobio/Avatars/1/avatar.jpg"
        )

        self.assertFalse(delete_cloudinary_file(url, "image"))
        mock_destroy.assert_not_called()
