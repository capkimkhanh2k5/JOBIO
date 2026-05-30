from django.test import TestCase
from apps.core.users.models import CustomUser
from apps.candidate.recruiters.models import Recruiter
from apps.geography.addresses.models import Address
from apps.geography.communes.models import Commune
from apps.geography.provinces.models import Province
from apps.candidate.recruiters.services.recruiters import (
    create_recruiter_service,
    update_recruiter_service,
    delete_recruiter_service,
    RecruiterInput,
)
from datetime import date


class RecruiterServiceTest(TestCase):
    def setUp(self):
        self.user = CustomUser.objects.create_user(
            email="test@example.com",
            password="password123",
            full_name="Test User",
            role="candidate",
        )
        self.user2 = CustomUser.objects.create_user(
            email="test2@example.com",
            password="password123",
            full_name="Test User 2",
            role="candidate",
        )

    def test_create_recruiter_profile_success(self):
        data = RecruiterInput(
            bio="Hello World",
            date_of_birth=date(1990, 1, 1),
            years_of_experience=5,
            gender=Recruiter.Gender.MALE,
        )
        recruiter = create_recruiter_service(self.user, data)

        self.assertEqual(Recruiter.objects.count(), 1)
        self.assertEqual(recruiter.user, self.user)
        self.assertEqual(recruiter.bio, "Hello World")
        self.assertEqual(recruiter.years_of_experience, 5)
        self.assertEqual(recruiter.gender, Recruiter.Gender.MALE)

    def test_create_recruiter_profile_duplicate_fail(self):
        Recruiter.objects.create(user=self.user)

        data = RecruiterInput(bio="New Bio")
        with self.assertRaisesMessage(
            ValueError, "User already has a recruiter profile."
        ):
            create_recruiter_service(self.user, data)

    def test_update_recruiter_profile(self):
        recruiter = Recruiter.objects.create(
            user=self.user, bio="Old Bio", years_of_experience=1
        )

        data = RecruiterInput(bio="New Bio", years_of_experience=10)
        update_recruiter_service(recruiter, data)

        recruiter.refresh_from_db()
        self.assertEqual(recruiter.bio, "New Bio")
        self.assertEqual(recruiter.years_of_experience, 10)

    def test_update_recruiter_profile_partial(self):
        """Test updating only subset of fields"""
        recruiter = Recruiter.objects.create(
            user=self.user,
            bio="Old Bio",
            years_of_experience=1,
            gender=Recruiter.Gender.MALE,
        )

        # Only update bio, keep everything else
        data = RecruiterInput(bio="Updated Bio")
        update_recruiter_service(recruiter, data)

        recruiter.refresh_from_db()
        self.assertEqual(recruiter.bio, "Updated Bio")
        self.assertEqual(recruiter.years_of_experience, 1)
        self.assertEqual(recruiter.gender, Recruiter.Gender.MALE)

    def test_update_recruiter_address_resolves_cv_location_variants(self):
        province = Province.objects.create(
            province_name="Hồ Chí Minh",
            province_type="municipality",
            region="south",
            is_active=True,
        )
        recruiter = Recruiter.objects.create(user=self.user)

        data = RecruiterInput(address={"province": "Ho Chi Minh City, Vietnam"})
        update_recruiter_service(recruiter, data)

        recruiter.refresh_from_db()
        self.assertIsNotNone(recruiter.address)
        self.assertEqual(recruiter.address.province_id, province.id)

    def test_update_recruiter_address_accepts_combobox_numeric_string(self):
        province = Province.objects.create(
            province_name="Đà Nẵng",
            province_type="municipality",
            region="central",
            is_active=True,
        )
        recruiter = Recruiter.objects.create(user=self.user)

        data = RecruiterInput(address={"province": str(province.id)})
        update_recruiter_service(recruiter, data)

        recruiter.refresh_from_db()
        self.assertIsNotNone(recruiter.address)
        self.assertEqual(recruiter.address.province_id, province.id)

    def test_update_recruiter_address_resolves_commune_from_unaccented_cv_address(self):
        province = Province.objects.create(
            province_name="Đà Nẵng",
            province_type="municipality",
            region="central",
            is_active=True,
        )
        commune = Commune.objects.create(
            province=province,
            commune_name="Phường Hòa Khánh Bắc - Quận Liên Chiểu (Đà Nẵng)",
            commune_type=Commune.CommuneType.WARD,
            is_active=True,
        )
        Commune.objects.create(
            province=province,
            commune_name="Phường Hòa Khánh Nam - Quận Liên Chiểu (Đà Nẵng)",
            commune_type=Commune.CommuneType.WARD,
            is_active=True,
        )
        recruiter = Recruiter.objects.create(user=self.user)

        data = RecruiterInput(
            address={
                "province": "Danang",
                "commune": "Lien Chieu",
                "address_line": "Hoa Khanh Bac, Lien Chieu, Danang",
            }
        )
        update_recruiter_service(recruiter, data)

        recruiter.refresh_from_db()
        self.assertIsNotNone(recruiter.address)
        self.assertEqual(recruiter.address.province_id, province.id)
        self.assertEqual(recruiter.address.commune_id, commune.id)

    def test_update_recruiter_address_does_not_guess_ambiguous_district_as_commune(
        self,
    ):
        province = Province.objects.create(
            province_name="Đà Nẵng",
            province_type="municipality",
            region="central",
            is_active=True,
        )
        Commune.objects.create(
            province=province,
            commune_name="Phường Hòa Khánh Bắc - Quận Liên Chiểu (Đà Nẵng)",
            commune_type=Commune.CommuneType.WARD,
            is_active=True,
        )
        Commune.objects.create(
            province=province,
            commune_name="Phường Hòa Khánh Nam - Quận Liên Chiểu (Đà Nẵng)",
            commune_type=Commune.CommuneType.WARD,
            is_active=True,
        )
        recruiter = Recruiter.objects.create(user=self.user)

        data = RecruiterInput(address={"province": "Danang", "commune": "Lien Chieu"})
        update_recruiter_service(recruiter, data)

        recruiter.refresh_from_db()
        self.assertIsNotNone(recruiter.address)
        self.assertEqual(recruiter.address.province_id, province.id)
        self.assertIsNone(recruiter.address.commune_id)

    def test_update_recruiter_address_resolves_saigon_alias_to_db_province(self):
        province = Province.objects.create(
            province_name="Tp.Hồ Chí Minh",
            province_type="municipality",
            region="south",
            is_active=True,
        )
        recruiter = Recruiter.objects.create(user=self.user)

        data = RecruiterInput(address={"province": "SaiGon"})
        update_recruiter_service(recruiter, data)

        recruiter.refresh_from_db()
        self.assertIsNotNone(recruiter.address)
        self.assertEqual(recruiter.address.province_id, province.id)

    def test_update_recruiter_address_ignores_unmatched_cv_location(self):
        province = Province.objects.create(
            province_name="Hà Nội",
            province_type="municipality",
            region="north",
            is_active=True,
        )
        address = Address.objects.create(address_line="Existing", province=province)
        recruiter = Recruiter.objects.create(user=self.user, address=address)

        data = RecruiterInput(address={"province": "Remote worldwide"})
        update_recruiter_service(recruiter, data)

        recruiter.refresh_from_db()
        address.refresh_from_db()
        self.assertEqual(recruiter.address_id, address.id)
        self.assertEqual(address.address_line, "Existing")
        self.assertEqual(address.province_id, province.id)

    def test_update_recruiter_address_does_not_create_when_cv_location_unmatched(self):
        recruiter = Recruiter.objects.create(user=self.user)

        data = RecruiterInput(address={"province": "Remote worldwide"})
        update_recruiter_service(recruiter, data)

        recruiter.refresh_from_db()
        self.assertIsNone(recruiter.address)

    def test_delete_recruiter_service(self):
        recruiter = Recruiter.objects.create(user=self.user)
        self.assertEqual(Recruiter.objects.count(), 1)

        delete_recruiter_service(recruiter)

        self.assertEqual(Recruiter.objects.count(), 0)
