from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase
from unittest.mock import patch

from apps.core.users.models import CustomUser
from apps.company.companies.models import Company
from apps.company.media_types.models import MediaType
from apps.company.company_media.models import CompanyMedia
from apps.company.company_media.services.company_media import (
    upload_company_media_service,
    update_company_media_service,
    delete_company_media_service,
    reorder_company_media_service,
    bulk_upload_company_media_service,
    CompanyMediaCreateInput,
    CompanyMediaUpdateInput,
    CompanyMediaReorderInput,
    MediaReorderItemInput,
    CompanyMediaBulkUploadInput,
)


class CompanyMediaServiceTest(TestCase):
    def setUp(self):
        self.user = CustomUser.objects.create_user(
            email="test@example.com", password="password"
        )
        self.company = Company.objects.create(
            user=self.user, company_name="Test Company"
        )
        self.media_type = MediaType.objects.create(type_name="Office Photo")

    @patch("apps.company.company_media.services.company_media.save_company_file")
    def test_upload_company_media_service(self, mock_save_file):
        mock_save_file.return_value = "http://cloudinary.com/image.jpg"

        file = SimpleUploadedFile(
            "test.jpg", b"file_content", content_type="image/jpeg"
        )
        input_data = CompanyMediaCreateInput(
            media_file=file,
            media_type_id=self.media_type.id,
            title="Test Media",
            caption="Test Caption",
        )

        media = upload_company_media_service(self.company.id, self.user, input_data)

        self.assertEqual(media.company, self.company)
        self.assertEqual(media.media_url, "http://cloudinary.com/image.jpg")
        self.assertEqual(media.title, "Test Media")

    @patch("apps.company.company_media.services.company_media.delete_company_file")
    @patch("apps.company.company_media.models.CompanyMedia.objects.create")
    @patch("apps.company.company_media.services.company_media.save_company_file")
    def test_upload_company_media_cleans_up_when_db_create_fails(
        self, mock_save_file, mock_create, mock_delete_file
    ):
        media_url = "https://res.cloudinary.com/demo/image/upload/v1/media.jpg"
        mock_save_file.return_value = media_url
        mock_create.side_effect = RuntimeError("db down")
        file = SimpleUploadedFile(
            "test.jpg", b"file_content", content_type="image/jpeg"
        )
        input_data = CompanyMediaCreateInput(
            media_file=file,
            media_type_id=self.media_type.id,
            title="Test Media",
        )

        with self.assertRaisesMessage(RuntimeError, "db down"):
            upload_company_media_service(self.company.id, self.user, input_data)

        mock_delete_file.assert_called_once_with(media_url, resource_type="image")

    def test_update_company_media_service(self):
        media = CompanyMedia.objects.create(
            company=self.company,
            media_type=self.media_type,
            media_url="http://old.url",
            title="Old Title",
        )

        input_data = CompanyMediaUpdateInput(title="New Title")
        updated_media = update_company_media_service(media.id, self.user, input_data)

        self.assertEqual(updated_media.title, "New Title")
        self.assertEqual(updated_media.media_url, "http://old.url")

    def test_delete_company_media_service(self):
        media = CompanyMedia.objects.create(
            company=self.company,
            media_type=self.media_type,
            media_url="http://url.to.delete",
        )

        delete_company_media_service(media.id, self.user)

        self.assertFalse(CompanyMedia.objects.filter(id=media.id).exists())

    def test_reorder_company_media_service(self):
        m1 = CompanyMedia.objects.create(
            company=self.company,
            media_type=self.media_type,
            media_url="u1",
            display_order=1,
        )
        m2 = CompanyMedia.objects.create(
            company=self.company,
            media_type=self.media_type,
            media_url="u2",
            display_order=2,
        )

        input_data = CompanyMediaReorderInput(
            reorders=[
                MediaReorderItemInput(id=m1.id, display_order=10),
                MediaReorderItemInput(id=m2.id, display_order=20),
            ]
        )

        reorder_company_media_service(self.company.id, self.user, input_data)

        m1.refresh_from_db()
        m2.refresh_from_db()
        self.assertEqual(m1.display_order, 10)
        self.assertEqual(m2.display_order, 20)

    @patch("apps.company.company_media.services.company_media.save_company_file")
    def test_bulk_upload_company_media_service(self, mock_save_file):
        mock_save_file.return_value = "http://cloud.com/img.jpg"
        files = [
            SimpleUploadedFile("f1.jpg", b"c1", content_type="image/jpeg"),
            SimpleUploadedFile("f2.jpg", b"c2", content_type="image/jpeg"),
        ]

        input_data = CompanyMediaBulkUploadInput(
            media_files=files, media_type_id=self.media_type.id
        )

        media_list = bulk_upload_company_media_service(
            self.company.id, self.user, input_data
        )

        self.assertEqual(len(media_list), 2)
        self.assertEqual(CompanyMedia.objects.count(), 2)
