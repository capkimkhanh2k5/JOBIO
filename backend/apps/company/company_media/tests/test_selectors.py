from django.test import TestCase
from apps.core.users.models import CustomUser
from apps.company.companies.models import Company
from apps.company.media_types.models import MediaType
from apps.company.company_media.models import CompanyMedia
from apps.company.company_media.selectors.company_media import list_company_media, get_company_media


class CompanyMediaSelectorTest(TestCase):
    def setUp(self):
        self.user = CustomUser.objects.create_user(email="test@example.com", password="password")
        self.company = Company.objects.create(user=self.user, company_name="Test Company")
        self.media_type = MediaType.objects.create(type_name="Office Photo")
        
        self.media1 = CompanyMedia.objects.create(
            company=self.company, 
            media_type=self.media_type, 
            media_url="u1", 
            display_order=2
        )
        self.media2 = CompanyMedia.objects.create(
            company=self.company, 
            media_type=self.media_type, 
            media_url="u2", 
            display_order=1
        )

    def test_list_company_media(self):
        # Should be ordered by display_order (default ordering in model is display_order)
        # However, checking if selector enforces correct filtering
        medias = list_company_media(self.company.id)
        self.assertEqual(len(medias), 2)
        # Assuming model ordering is respected
        self.assertEqual(medias[0], self.media2) 
        self.assertEqual(medias[1], self.media1)

    def test_get_company_media(self):
        media = get_company_media(self.media1.id)
        self.assertEqual(media, self.media1)
        
        non_existent = get_company_media(999)
        self.assertIsNone(non_existent)
