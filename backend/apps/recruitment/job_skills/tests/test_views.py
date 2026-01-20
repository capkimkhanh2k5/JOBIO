from rest_framework.test import APITestCase
from rest_framework import status
from apps.core.users.models import CustomUser
from apps.company.companies.models import Company
from apps.recruitment.jobs.models import Job
from apps.recruitment.job_skills.models import JobSkill
from apps.candidate.skills.models import Skill
from apps.candidate.skill_categories.models import SkillCategory


class JobSkillViewTests(APITestCase):
    """Test cases for Job Skills APIs - /api/jobs/:job_id/skills/"""
    
    def setUp(self):
        # Create test users
        self.owner = CustomUser.objects.create_user(
            email="owner@example.com",
            password="password123",
            full_name="Job Owner"
        )
        self.other_user = CustomUser.objects.create_user(
            email="other@example.com",
            password="password123",
            full_name="Other User"
        )
        
        # Create company
        self.company = Company.objects.create(
            user=self.owner,
            company_name="Test Company",
            description="A test company"
        )
        
        # Create job
        self.job = Job.objects.create(
            company=self.company,
            title="Python Developer",
            slug="python-developer-test",
            job_type="full-time",
            level="senior",
            description="Job description",
            requirements="Job requirements",
            status="published",
            created_by=self.owner
        )
        
        # Create skill category and skill
        self.category = SkillCategory.objects.create(
            name="Programming",
            slug="programming"
        )
        self.skill = Skill.objects.create(
            name="Python",
            slug="python",
            category=self.category
        )
        self.skill2 = Skill.objects.create(
            name="Django",
            slug="django",
            category=self.category
        )
    
    # ========== API #1: GET /api/jobs/:job_id/skills/ ==========
    
    def test_list_job_skills_success(self):
        """GET /api/jobs/:job_id/skills/ - public access → 200"""
        # Add skill to job first
        JobSkill.objects.create(
            job=self.job,
            skill=self.skill,
            is_required=True,
            proficiency_level='intermediate'
        )
        
        url = f'/api/jobs/{self.job.id}/skills/'
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['skill_id'], self.skill.id)
    
    def test_list_job_skills_empty(self):
        """GET /api/jobs/:job_id/skills/ - empty list → 200 + []"""
        url = f'/api/jobs/{self.job.id}/skills/'
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data, [])
    
    def test_list_job_skills_job_not_found(self):
        """GET /api/jobs/:job_id/skills/ - job không tồn tại → 404"""
        url = '/api/jobs/99999/skills/'
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
    
    # ========== API #2: POST /api/jobs/:job_id/skills/ ==========
    
    def test_create_job_skill_success(self):
        """POST /api/jobs/:job_id/skills/ - thêm skill → 201"""
        self.client.force_authenticate(user=self.owner)
        
        url = f'/api/jobs/{self.job.id}/skills/'
        data = {
            'skill_id': self.skill.id,
            'is_required': True,
            'proficiency_level': 'intermediate',
            'years_required': 2
        }
        response = self.client.post(url, data)
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['skill_id'], self.skill.id)
        self.assertEqual(response.data['is_required'], True)
        self.assertEqual(response.data['proficiency_level'], 'intermediate')
    
    def test_create_job_skill_unauthenticated(self):
        """POST /api/jobs/:job_id/skills/ - không login → 401"""
        url = f'/api/jobs/{self.job.id}/skills/'
        data = {'skill_id': self.skill.id}
        response = self.client.post(url, data)
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    def test_create_job_skill_not_owner(self):
        """POST /api/jobs/:job_id/skills/ - non-owner → 403"""
        self.client.force_authenticate(user=self.other_user)
        
        url = f'/api/jobs/{self.job.id}/skills/'
        data = {'skill_id': self.skill.id}
        response = self.client.post(url, data)
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
    
    def test_create_job_skill_job_not_found(self):
        """POST /api/jobs/:job_id/skills/ - job không tồn tại → 404"""
        self.client.force_authenticate(user=self.owner)
        
        url = '/api/jobs/99999/skills/'
        data = {'skill_id': self.skill.id}
        response = self.client.post(url, data)
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
    
    def test_create_job_skill_skill_not_found(self):
        """POST /api/jobs/:job_id/skills/ - skill_id không hợp lệ → 400"""
        self.client.force_authenticate(user=self.owner)
        
        url = f'/api/jobs/{self.job.id}/skills/'
        data = {'skill_id': 99999}
        response = self.client.post(url, data)
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    
    def test_create_job_skill_duplicate(self):
        """POST /api/jobs/:job_id/skills/ - skill đã tồn tại → 400"""
        # Add skill first
        JobSkill.objects.create(job=self.job, skill=self.skill)
        
        self.client.force_authenticate(user=self.owner)
        url = f'/api/jobs/{self.job.id}/skills/'
        data = {'skill_id': self.skill.id}
        response = self.client.post(url, data)
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    
    def test_create_job_skill_invalid_proficiency(self):
        """POST /api/jobs/:job_id/skills/ - proficiency không hợp lệ → 400"""
        self.client.force_authenticate(user=self.owner)
        
        url = f'/api/jobs/{self.job.id}/skills/'
        data = {
            'skill_id': self.skill.id,
            'proficiency_level': 'invalid-level'
        }
        response = self.client.post(url, data)
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    
    # ========== API #3: PUT /api/jobs/:job_id/skills/:id/ ==========
    
    def test_update_job_skill_success(self):
        """PUT /api/jobs/:job_id/skills/:id/ - cập nhật skill → 200"""
        job_skill = JobSkill.objects.create(
            job=self.job,
            skill=self.skill,
            is_required=True,
            proficiency_level='basic'
        )
        
        self.client.force_authenticate(user=self.owner)
        url = f'/api/jobs/{self.job.id}/skills/{job_skill.id}/'
        data = {
            'skill_id': self.skill.id,
            'is_required': False,
            'proficiency_level': 'expert',
            'years_required': 5
        }
        response = self.client.put(url, data)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['is_required'], False)
        self.assertEqual(response.data['proficiency_level'], 'expert')
        self.assertEqual(response.data['years_required'], 5)
    
    def test_update_job_skill_unauthenticated(self):
        """PUT /api/jobs/:job_id/skills/:id/ - không login → 401"""
        job_skill = JobSkill.objects.create(job=self.job, skill=self.skill)
        
        url = f'/api/jobs/{self.job.id}/skills/{job_skill.id}/'
        data = {'skill_id': self.skill.id, 'is_required': False}
        response = self.client.put(url, data)
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    def test_update_job_skill_not_owner(self):
        """PUT /api/jobs/:job_id/skills/:id/ - non-owner → 403"""
        job_skill = JobSkill.objects.create(job=self.job, skill=self.skill)
        
        self.client.force_authenticate(user=self.other_user)
        url = f'/api/jobs/{self.job.id}/skills/{job_skill.id}/'
        data = {'skill_id': self.skill.id, 'is_required': False}
        response = self.client.put(url, data)
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
    
    def test_update_job_skill_not_found(self):
        """PUT /api/jobs/:job_id/skills/:id/ - job_skill không tồn tại → 404"""
        self.client.force_authenticate(user=self.owner)
        
        url = f'/api/jobs/{self.job.id}/skills/99999/'
        data = {'skill_id': self.skill.id, 'is_required': False}
        response = self.client.put(url, data)
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
    
    def test_update_job_skill_wrong_job(self):
        """PUT /api/jobs/:job_id/skills/:id/ - skill thuộc job khác → 404"""
        # Create another job
        other_job = Job.objects.create(
            company=self.company,
            title="Other Job",
            slug="other-job-test",
            job_type="full-time",
            level="junior",
            description="Desc",
            requirements="Req",
            status="published",
            created_by=self.owner
        )
        
        # Add skill to other job
        job_skill = JobSkill.objects.create(job=other_job, skill=self.skill)
        
        self.client.force_authenticate(user=self.owner)
        # Try to update via wrong job
        url = f'/api/jobs/{self.job.id}/skills/{job_skill.id}/'
        data = {'skill_id': self.skill.id, 'is_required': False}
        response = self.client.put(url, data)
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
    
    # ========== API #4: DELETE /api/jobs/:job_id/skills/:id/ ==========
    
    def test_delete_job_skill_success(self):
        """DELETE /api/jobs/:job_id/skills/:id/ - xóa skill → 204"""
        job_skill = JobSkill.objects.create(job=self.job, skill=self.skill)
        
        self.client.force_authenticate(user=self.owner)
        url = f'/api/jobs/{self.job.id}/skills/{job_skill.id}/'
        response = self.client.delete(url)
        
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(JobSkill.objects.filter(id=job_skill.id).exists())
    
    def test_delete_job_skill_unauthenticated(self):
        """DELETE /api/jobs/:job_id/skills/:id/ - không login → 401"""
        job_skill = JobSkill.objects.create(job=self.job, skill=self.skill)
        
        url = f'/api/jobs/{self.job.id}/skills/{job_skill.id}/'
        response = self.client.delete(url)
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    def test_delete_job_skill_not_owner(self):
        """DELETE /api/jobs/:job_id/skills/:id/ - non-owner → 403"""
        job_skill = JobSkill.objects.create(job=self.job, skill=self.skill)
        
        self.client.force_authenticate(user=self.other_user)
        url = f'/api/jobs/{self.job.id}/skills/{job_skill.id}/'
        response = self.client.delete(url)
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
    
    def test_delete_job_skill_not_found(self):
        """DELETE /api/jobs/:job_id/skills/:id/ - job_skill không tồn tại → 404"""
        self.client.force_authenticate(user=self.owner)
        
        url = f'/api/jobs/{self.job.id}/skills/99999/'
        response = self.client.delete(url)
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
    
    def test_delete_job_skill_wrong_job(self):
        """DELETE /api/jobs/:job_id/skills/:id/ - skill thuộc job khác → 404"""
        # Create another job
        other_job = Job.objects.create(
            company=self.company,
            title="Other Job 2",
            slug="other-job-2-test",
            job_type="full-time",
            level="junior",
            description="Desc",
            requirements="Req",
            status="published",
            created_by=self.owner
        )
        
        # Add skill to other job
        job_skill = JobSkill.objects.create(job=other_job, skill=self.skill)
        
        self.client.force_authenticate(user=self.owner)
        # Try to delete via wrong job
        url = f'/api/jobs/{self.job.id}/skills/{job_skill.id}/'
        response = self.client.delete(url)
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
