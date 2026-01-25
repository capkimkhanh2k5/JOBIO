
from django.test import TestCase
from django.utils import timezone
from apps.core.users.models import CustomUser
from apps.candidate.recruiters.models import Recruiter
from apps.candidate.recruiter_cvs.services.recruiter_cvs import auto_generate_cv
from apps.candidate.recruiter_skills.models import RecruiterSkill
from apps.candidate.skills.models import Skill
from apps.candidate.skill_categories.models import SkillCategory
from apps.candidate.recruiter_education.models import RecruiterEducation
from apps.candidate.recruiter_experience.models import RecruiterExperience
from apps.candidate.recruiter_projects.models import RecruiterProject

class AutoGenerateCVTest(TestCase):
    def setUp(self):
        # 1. Create User & Recruiter
        self.user = CustomUser.objects.create_user(
            email='test_gen@example.com',
            password='password123',
            full_name='Test Generator',
            role='recruiter'
        )
        self.recruiter = Recruiter.objects.create(user=self.user, current_position='Backend Dev')

        # 2. Add Skill
        self.category = SkillCategory.objects.create(name='Backend', slug='backend')
        self.skill = Skill.objects.create(name='Python', slug='python', category=self.category)
        RecruiterSkill.objects.create(
            recruiter=self.recruiter,
            skill=self.skill,
            proficiency_level='expert',
            years_of_experience=3
        )

        # 3. Add Education
        RecruiterEducation.objects.create(
            recruiter=self.recruiter,
            school_name='BK University',
            degree='Engineer',
            start_date=timezone.now().date(),
            is_current=True
        )

        # 4. Add Experience
        RecruiterExperience.objects.create(
            recruiter=self.recruiter,
            company_name='Google',
            job_title='Senior Engineer',
            start_date=timezone.now().date(),
            is_current=True
        )
        
        # 5. Add Project
        RecruiterProject.objects.create(
            recruiter=self.recruiter,
            project_name='AI System',
            description='Built AI',
            start_date=timezone.now().date()
        )

    def test_auto_generate_cv_success(self):
        """Test generating CV fetch all data correctly"""
        
        # Action
        cv = auto_generate_cv(self.recruiter)
        
        # Assertions
        self.assertIsNotNone(cv)
        self.assertTrue(cv.cv_name.startswith("Auto-generated CV"))
        
        data = cv.cv_data
        
        # Check Personal
        self.assertEqual(data['personal']['full_name'], 'Test Generator')
        self.assertEqual(data['personal']['current_position'], 'Backend Dev')
        
        # Check Skills
        self.assertEqual(len(data['skills']), 1)
        self.assertEqual(data['skills'][0]['name'], 'Python')
        self.assertEqual(data['skills'][0]['proficiency_level'], 'expert')
        
        # Check Education
        self.assertEqual(len(data['education']), 1)
        self.assertEqual(data['education'][0]['school_name'], 'BK University')
        
        # Check Experience
        self.assertEqual(len(data['experience']), 1)
        self.assertEqual(data['experience'][0]['company_name'], 'Google')
        
        # Check Project
        self.assertEqual(len(data['projects']), 1)
        self.assertEqual(data['projects'][0]['project_name'], 'AI System')
        
        print("\n✅ Test auto_generate_cv passed!")
