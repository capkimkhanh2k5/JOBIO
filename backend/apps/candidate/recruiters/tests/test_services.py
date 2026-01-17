from django.test import TestCase
from apps.core.users.models import CustomUser
from apps.candidate.recruiters.models import Recruiter
from apps.candidate.recruiters.services.recruiters import (
    create_recruiter_service, 
    update_recruiter_service, 
    update_job_search_status_service,
    delete_recruiter_service,
    RecruiterInput
)
from datetime import date

class RecruiterServiceTest(TestCase):
    def setUp(self):
        self.user = CustomUser.objects.create_user(
            email="test@example.com",
            password="password123",
            full_name="Test User",
            role="recruiter"
        )
        self.user2 = CustomUser.objects.create_user(
            email="test2@example.com",
            password="password123",
            full_name="Test User 2",
            role="recruiter"
        )

    def test_create_recruiter_profile_success(self):
        data = RecruiterInput(
            bio="Hello World",
            date_of_birth=date(1990, 1, 1),
            years_of_experience=5,
            job_search_status=Recruiter.JobSearchStatus.PASSIVE,
            gender=Recruiter.Gender.MALE
        )
        recruiter = create_recruiter_service(self.user, data)
        
        self.assertEqual(Recruiter.objects.count(), 1)
        self.assertEqual(recruiter.user, self.user)
        self.assertEqual(recruiter.bio, "Hello World")
        self.assertEqual(recruiter.years_of_experience, 5)
        self.assertEqual(recruiter.job_search_status, Recruiter.JobSearchStatus.PASSIVE)
        self.assertEqual(recruiter.gender, Recruiter.Gender.MALE)

    def test_create_recruiter_profile_duplicate_fail(self):
        Recruiter.objects.create(user=self.user)
        
        data = RecruiterInput(bio="New Bio")
        with self.assertRaisesMessage(ValueError, "User already has a recruiter profile."):
            create_recruiter_service(self.user, data)

    def test_update_recruiter_profile(self):
        recruiter = Recruiter.objects.create(user=self.user, bio="Old Bio", years_of_experience=1)
        
        data = RecruiterInput(bio="New Bio", years_of_experience=10)
        updated = update_recruiter_service(recruiter, data)
        
        recruiter.refresh_from_db()
        self.assertEqual(recruiter.bio, "New Bio")
        self.assertEqual(recruiter.years_of_experience, 10)

    def test_update_recruiter_profile_partial(self):
        """Test updating only subset of fields"""
        recruiter = Recruiter.objects.create(
            user=self.user, 
            bio="Old Bio", 
            years_of_experience=1, 
            gender=Recruiter.Gender.MALE
        )
        
        # Only update bio, keep everything else
        data = RecruiterInput(bio="Updated Bio")
        updated = update_recruiter_service(recruiter, data)
        
        recruiter.refresh_from_db()
        self.assertEqual(recruiter.bio, "Updated Bio")
        self.assertEqual(recruiter.years_of_experience, 1)
        self.assertEqual(recruiter.gender, Recruiter.Gender.MALE)

    def test_update_job_search_status(self):
        recruiter = Recruiter.objects.create(user=self.user, job_search_status=Recruiter.JobSearchStatus.ACTIVE)
        
        updated = update_job_search_status_service(recruiter, Recruiter.JobSearchStatus.NOT_LOOKING)
        
        recruiter.refresh_from_db()
        self.assertEqual(recruiter.job_search_status, Recruiter.JobSearchStatus.NOT_LOOKING)
        
    def test_update_job_search_status_invalid(self):
        recruiter = Recruiter.objects.create(user=self.user)
        
        with self.assertRaises(ValueError):
            update_job_search_status_service(recruiter, "invalid_status")

    def test_delete_recruiter_service(self):
        recruiter = Recruiter.objects.create(user=self.user)
        self.assertEqual(Recruiter.objects.count(), 1)
        
        delete_recruiter_service(recruiter)
        
        self.assertEqual(Recruiter.objects.count(), 0)
