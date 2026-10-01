import shutil
import tempfile
from pathlib import Path
from unittest.mock import patch

from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase, override_settings
from PIL import Image
import io

from apps.core.users.models import CustomUser
from apps.moderation.services import ModerationBlocked
from apps.system.file_uploads.services.file_uploads import save_upload

MEDIA_ROOT = tempfile.mkdtemp()


@override_settings(
    MEDIA_ROOT=MEDIA_ROOT,
    CLOUDINARY_STORAGE={
        "CLOUD_NAME": "demo",
        "API_KEY": "key",
        "API_SECRET": "secret",
    },
)
class SaveUploadServiceTests(TestCase):
    @classmethod
    def tearDownClass(cls):
        shutil.rmtree(MEDIA_ROOT, ignore_errors=True)
        super().tearDownClass()

    def setUp(self):
        self.user = CustomUser.objects.create_user(
            email="upload-service@test.com", password="pwd"
        )

    def _image_file(self, name="avatar.jpg"):
        buffer = io.BytesIO()
        Image.new("RGB", (20, 20), "blue").save(buffer, "jpeg")
        return SimpleUploadedFile(name, buffer.getvalue(), content_type="image/jpeg")

    @patch("cloudinary.uploader.upload")
    def test_cloudinary_image_public_id_does_not_include_extension(self, mock_upload):
        mock_upload.return_value = {
            "secure_url": "https://res.cloudinary.com/demo/image/upload/v1/id.jpg"
        }
        file_obj = self._image_file()

        upload = save_upload(self.user, file_obj, is_public=True)

        _, kwargs = mock_upload.call_args
        self.assertEqual(kwargs["resource_type"], "image")
        self.assertFalse(kwargs["public_id"].endswith(".jpg"))
        self.assertEqual(upload.file_type, "jpg")

    @patch("cloudinary.uploader.upload")
    def test_cloudinary_raw_public_id_keeps_extension(self, mock_upload):
        mock_upload.return_value = {
            "secure_url": "https://res.cloudinary.com/demo/raw/upload/v1/file.pdf"
        }
        file_obj = SimpleUploadedFile(
            "resume.pdf", b"%PDF-1.4\n", content_type="application/pdf"
        )

        save_upload(self.user, file_obj, is_public=False)

        _, kwargs = mock_upload.call_args
        self.assertEqual(kwargs["resource_type"], "raw")
        self.assertTrue(kwargs["public_id"].endswith(".pdf"))

    @patch("cloudinary.uploader.upload")
    def test_fallback_storage_rewinds_file_after_cloudinary_failure(self, mock_upload):
        def fail_after_read(file_obj, **kwargs):
            file_obj.read()
            raise RuntimeError("cloudinary down")

        mock_upload.side_effect = fail_after_read
        file_obj = SimpleUploadedFile(
            "note.txt", b"file_content", content_type="text/plain"
        )

        upload = save_upload(self.user, file_obj, is_public=False)

        self.assertEqual(upload.file_size, len(b"file_content"))
        saved_files = list(Path(MEDIA_ROOT).rglob("*.txt"))
        self.assertEqual(len(saved_files), 1)
        self.assertEqual(saved_files[0].read_bytes(), b"file_content")

    @patch("apps.system.file_uploads.cloudinary_utils.delete_cloudinary_file")
    @patch("apps.system.file_uploads.models.FileUpload.objects.create")
    @patch("cloudinary.uploader.upload")
    def test_cloudinary_file_is_cleaned_up_when_db_create_fails(
        self, mock_upload, mock_create, mock_delete
    ):
        cloudinary_url = "https://res.cloudinary.com/demo/raw/upload/v1/file.pdf"
        mock_upload.return_value = {"secure_url": cloudinary_url}
        mock_create.side_effect = RuntimeError("db down")
        file_obj = SimpleUploadedFile(
            "resume.pdf", b"%PDF-1.4\n", content_type="application/pdf"
        )

        with self.assertRaisesMessage(RuntimeError, "db down"):
            save_upload(self.user, file_obj, is_public=False)

        mock_delete.assert_called_once_with(cloudinary_url, "raw")

    def test_fake_public_image_mime_is_rejected_before_upload(self):
        file_obj = SimpleUploadedFile(
            "avatar.jpg", b"not really an image", content_type="image/jpeg"
        )

        with self.assertRaises(ModerationBlocked):
            save_upload(self.user, file_obj, is_public=True)

    def test_fake_pdf_magic_is_rejected_before_upload(self):
        file_obj = SimpleUploadedFile(
            "resume.pdf", b"not really a pdf", content_type="application/pdf"
        )

        with self.assertRaises(ModerationBlocked) as ctx:
            save_upload(self.user, file_obj, is_public=False)

        reason_codes = {reason["code"] for reason in ctx.exception.result.reasons}
        self.assertIn("invalid_pdf_magic", reason_codes)

    def test_svg_public_upload_is_rejected(self):
        file_obj = SimpleUploadedFile(
            "logo.svg",
            b"<svg><script>alert('x')</script></svg>",
            content_type="image/svg+xml",
        )

        with self.assertRaises(ModerationBlocked):
            save_upload(self.user, file_obj, is_public=True)

    def test_unsafe_image_filename_is_rejected(self):
        file_obj = self._image_file("nsfw-avatar.jpg")

        with self.assertRaises(ModerationBlocked):
            save_upload(self.user, file_obj, is_public=True)
