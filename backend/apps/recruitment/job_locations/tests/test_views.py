from rest_framework.test import APITestCase
from rest_framework import status
from apps.core.users.models import CustomUser
from apps.company.companies.models import Company
from apps.recruitment.jobs.models import Job
from apps.recruitment.job_locations.models import JobLocation
from apps.geography.addresses.models import Address
from apps.geography.provinces.models import Province
from apps.geography.communes.models import Commune


class JobLocationViewTests(APITestCase):
    """Test cases for Job Locations APIs - /api/jobs/:job_id/locations/"""
    
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
        
        # Create province and commune for address
        self.province = Province.objects.create(
            province_code="HN01",
            province_name="Hà Nội",
            province_type="municipality",
            region="north"
        )
        self.commune = Commune.objects.create(
            commune_name="Cầu Giấy",
            commune_type="ward",
            province=self.province
        )
        
        # Create addresses
        self.address = Address.objects.create(
            address_line="123 Đường ABC",
            province=self.province,
            commune=self.commune
        )
        self.address2 = Address.objects.create(
            address_line="456 Đường XYZ",
            province=self.province,
            commune=self.commune
        )
    
    # ========== API #1: GET /api/jobs/:job_id/locations/ ==========
    
    def test_list_job_locations_success(self):
        """GET /api/jobs/:job_id/locations/ - public access → 200"""
        # Add location to job first
        JobLocation.objects.create(
            job=self.job,
            address=self.address,
            is_primary=True
        )
        
        url = f'/api/jobs/{self.job.id}/locations/'
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['address_id'], self.address.id)
    
    def test_list_job_locations_empty(self):
        """GET /api/jobs/:job_id/locations/ - empty list → 200 + []"""
        url = f'/api/jobs/{self.job.id}/locations/'
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data, [])
    
    def test_list_job_locations_job_not_found(self):
        """GET /api/jobs/:job_id/locations/ - job không tồn tại → 404"""
        url = '/api/jobs/99999/locations/'
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
    
    # ========== API #2: POST /api/jobs/:job_id/locations/ ==========
    
    def test_create_job_location_success(self):
        """POST /api/jobs/:job_id/locations/ - thêm location → 201"""
        self.client.force_authenticate(user=self.owner)
        
        url = f'/api/jobs/{self.job.id}/locations/'
        data = {
            'address_id': self.address.id,
            'is_primary': True
        }
        response = self.client.post(url, data)
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['address_id'], self.address.id)
        self.assertTrue(response.data['is_primary'])
    
    def test_create_job_location_unauthenticated(self):
        """POST /api/jobs/:job_id/locations/ - không login → 401"""
        url = f'/api/jobs/{self.job.id}/locations/'
        data = {'address_id': self.address.id}
        response = self.client.post(url, data)
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    def test_create_job_location_not_owner(self):
        """POST /api/jobs/:job_id/locations/ - non-owner → 403"""
        self.client.force_authenticate(user=self.other_user)
        
        url = f'/api/jobs/{self.job.id}/locations/'
        data = {'address_id': self.address.id}
        response = self.client.post(url, data)
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
    
    def test_create_job_location_job_not_found(self):
        """POST /api/jobs/:job_id/locations/ - job không tồn tại → 404"""
        self.client.force_authenticate(user=self.owner)
        
        url = '/api/jobs/99999/locations/'
        data = {'address_id': self.address.id}
        response = self.client.post(url, data)
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
    
    def test_create_job_location_address_not_found(self):
        """POST /api/jobs/:job_id/locations/ - address_id không hợp lệ → 400"""
        self.client.force_authenticate(user=self.owner)
        
        url = f'/api/jobs/{self.job.id}/locations/'
        data = {'address_id': 99999}
        response = self.client.post(url, data)
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    
    def test_create_job_location_set_primary(self):
        """POST /api/jobs/:job_id/locations/ - set is_primary → 201"""
        self.client.force_authenticate(user=self.owner)
        
        url = f'/api/jobs/{self.job.id}/locations/'
        data = {
            'address_id': self.address.id,
            'is_primary': True
        }
        response = self.client.post(url, data)
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(response.data['is_primary'])
    
    # ========== API #3: PUT /api/jobs/:job_id/locations/:id/ ==========
    
    def test_update_job_location_success(self):
        """PUT /api/jobs/:job_id/locations/:id/ - cập nhật location → 200"""
        job_location = JobLocation.objects.create(
            job=self.job,
            address=self.address,
            is_primary=False
        )
        
        self.client.force_authenticate(user=self.owner)
        url = f'/api/jobs/{self.job.id}/locations/{job_location.id}/'
        data = {
            'address_id': self.address2.id,
            'is_primary': True
        }
        response = self.client.put(url, data)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['is_primary'])
    
    def test_update_job_location_unauthenticated(self):
        """PUT /api/jobs/:job_id/locations/:id/ - không login → 401"""
        job_location = JobLocation.objects.create(
            job=self.job, address=self.address
        )
        
        url = f'/api/jobs/{self.job.id}/locations/{job_location.id}/'
        data = {'address_id': self.address.id, 'is_primary': True}
        response = self.client.put(url, data)
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    def test_update_job_location_not_owner(self):
        """PUT /api/jobs/:job_id/locations/:id/ - non-owner → 403"""
        job_location = JobLocation.objects.create(
            job=self.job, address=self.address
        )
        
        self.client.force_authenticate(user=self.other_user)
        url = f'/api/jobs/{self.job.id}/locations/{job_location.id}/'
        data = {'address_id': self.address.id, 'is_primary': True}
        response = self.client.put(url, data)
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
    
    def test_update_job_location_not_found(self):
        """PUT /api/jobs/:job_id/locations/:id/ - location không tồn tại → 404"""
        self.client.force_authenticate(user=self.owner)
        
        url = f'/api/jobs/{self.job.id}/locations/99999/'
        data = {'address_id': self.address.id, 'is_primary': True}
        response = self.client.put(url, data)
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
    
    def test_update_job_location_wrong_job(self):
        """PUT /api/jobs/:job_id/locations/:id/ - location thuộc job khác → 404"""
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
        
        # Add location to other job
        job_location = JobLocation.objects.create(
            job=other_job, address=self.address
        )
        
        self.client.force_authenticate(user=self.owner)
        # Try to update via wrong job
        url = f'/api/jobs/{self.job.id}/locations/{job_location.id}/'
        data = {'address_id': self.address.id, 'is_primary': True}
        response = self.client.put(url, data)
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
    
    def test_update_job_location_change_primary(self):
        """PUT /api/jobs/:job_id/locations/:id/ - thay đổi is_primary → 200"""
        job_location = JobLocation.objects.create(
            job=self.job,
            address=self.address,
            is_primary=False
        )
        
        self.client.force_authenticate(user=self.owner)
        url = f'/api/jobs/{self.job.id}/locations/{job_location.id}/'
        data = {
            'address_id': self.address.id,
            'is_primary': True
        }
        response = self.client.put(url, data)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['is_primary'])
        
        # Verify in database
        job_location.refresh_from_db()
        self.assertTrue(job_location.is_primary)
    
    # ========== API #4: DELETE /api/jobs/:job_id/locations/:id/ ==========
    
    def test_delete_job_location_success(self):
        """DELETE /api/jobs/:job_id/locations/:id/ - xóa location → 204"""
        job_location = JobLocation.objects.create(
            job=self.job, address=self.address
        )
        
        self.client.force_authenticate(user=self.owner)
        url = f'/api/jobs/{self.job.id}/locations/{job_location.id}/'
        response = self.client.delete(url)
        
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(JobLocation.objects.filter(id=job_location.id).exists())
    
    def test_delete_job_location_unauthenticated(self):
        """DELETE /api/jobs/:job_id/locations/:id/ - không login → 401"""
        job_location = JobLocation.objects.create(
            job=self.job, address=self.address
        )
        
        url = f'/api/jobs/{self.job.id}/locations/{job_location.id}/'
        response = self.client.delete(url)
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    def test_delete_job_location_not_owner(self):
        """DELETE /api/jobs/:job_id/locations/:id/ - non-owner → 403"""
        job_location = JobLocation.objects.create(
            job=self.job, address=self.address
        )
        
        self.client.force_authenticate(user=self.other_user)
        url = f'/api/jobs/{self.job.id}/locations/{job_location.id}/'
        response = self.client.delete(url)
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
    
    def test_delete_job_location_not_found(self):
        """DELETE /api/jobs/:job_id/locations/:id/ - location không tồn tại → 404"""
        self.client.force_authenticate(user=self.owner)
        
        url = f'/api/jobs/{self.job.id}/locations/99999/'
        response = self.client.delete(url)
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
    
    def test_delete_job_location_wrong_job(self):
        """DELETE /api/jobs/:job_id/locations/:id/ - location thuộc job khác → 404"""
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
        
        # Add location to other job
        job_location = JobLocation.objects.create(
            job=other_job, address=self.address
        )
        
        self.client.force_authenticate(user=self.owner)
        # Try to delete via wrong job
        url = f'/api/jobs/{self.job.id}/locations/{job_location.id}/'
        response = self.client.delete(url)
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
    
    # ========== Edge Cases ==========
    
    def test_multiple_locations_per_job(self):
        """Job có thể có nhiều địa điểm"""
        self.client.force_authenticate(user=self.owner)
        
        # Add first location
        url = f'/api/jobs/{self.job.id}/locations/'
        response1 = self.client.post(url, {
            'address_id': self.address.id,
            'is_primary': True
        })
        self.assertEqual(response1.status_code, status.HTTP_201_CREATED)
        
        # Add second location
        response2 = self.client.post(url, {
            'address_id': self.address2.id,
            'is_primary': False
        })
        self.assertEqual(response2.status_code, status.HTTP_201_CREATED)
        
        # Verify both locations exist
        response = self.client.get(url)
        self.assertEqual(len(response.data), 2)
