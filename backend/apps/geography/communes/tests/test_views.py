from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from apps.core.users.models import CustomUser
from apps.geography.provinces.models import Province
from apps.geography.communes.models import Commune


class CommuneViewSetTests(TestCase):
    """Tests cho Communes API"""
    
    def setUp(self):
        self.client = APIClient()
        
        # Create users
        self.user = CustomUser.objects.create_user(
            email='user@example.com',
            password='testpass123',
            full_name='Normal User'
        )
        self.admin = CustomUser.objects.create_user(
            email='admin@example.com',
            password='testpass123',
            full_name='Admin User',
            is_staff=True
        )
        
        # Create provinces
        self.province1 = Province.objects.create(
            province_code='HN',
            province_name='Hà Nội',
            province_type='municipality',
            region='north',
            is_active=True
        )
        self.province2 = Province.objects.create(
            province_code='HCM',
            province_name='Hồ Chí Minh',
            province_type='municipality',
            region='south',
            is_active=True
        )
        
        # Create communes
        self.commune1 = Commune.objects.create(
            province=self.province1,
            commune_name='Ba Đình',
            commune_type='ward',
            is_active=True
        )
        self.commune2 = Commune.objects.create(
            province=self.province1,
            commune_name='Hoàn Kiếm',
            commune_type='ward',
            is_active=True
        )
        self.commune3 = Commune.objects.create(
            province=self.province2,
            commune_name='Quận 1',
            commune_type='ward',
            is_active=True
        )
        self.commune_inactive = Commune.objects.create(
            province=self.province1,
            commune_name='Old Ward',
            commune_type='ward',
            is_active=False
        )
    
    def test_list_communes(self):
        """Test GET /api/communes/ - Danh sách communes (chỉ active)"""
        response = self.client.get('/api/communes/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 3)  # Only active
    
    def test_retrieve_commune(self):
        """Test GET /api/communes/:id/ - Chi tiết commune"""
        response = self.client.get(f'/api/communes/{self.commune1.id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['commune_name'], 'Ba Đình')
        self.assertIn('province_name', response.data)
    
    def test_retrieve_commune_not_found(self):
        """Test GET /api/communes/99999/ - Commune không tồn tại"""
        response = self.client.get('/api/communes/99999/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
    
    def test_create_commune_admin(self):
        """Test POST /api/communes/ - Admin có thể tạo"""
        self.client.force_authenticate(user=self.admin)
        data = {
            'commune_name': 'Đống Đa',
            'commune_type': 'ward',
            'province': self.province1.id,
            'is_active': True
        }
        response = self.client.post('/api/communes/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(Commune.objects.filter(commune_name='Đống Đa').exists())
    
    def test_create_commune_unauthorized(self):
        """Test POST /api/communes/ - User thường không thể tạo"""
        self.client.force_authenticate(user=self.user)
        data = {
            'commune_name': 'Hacked',
            'commune_type': 'ward',
            'province': self.province1.id
        }
        response = self.client.post('/api/communes/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
    
    def test_create_commune_unauthenticated(self):
        """Test POST /api/communes/ - Unauthenticated không thể tạo"""
        data = {
            'commune_name': 'New Ward',
            'commune_type': 'ward',
            'province': self.province1.id
        }
        response = self.client.post('/api/communes/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    def test_update_commune_admin(self):
        """Test PUT /api/communes/:id/ - Admin có thể cập nhật"""
        self.client.force_authenticate(user=self.admin)
        data = {
            'commune_name': 'Ba Đình Updated',
            'commune_type': 'ward',
            'province': self.province1.id,
            'is_active': True
        }
        response = self.client.put(f'/api/communes/{self.commune1.id}/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.commune1.refresh_from_db()
        self.assertEqual(self.commune1.commune_name, 'Ba Đình Updated')
    
    def test_update_commune_unauthorized(self):
        """Test PUT /api/communes/:id/ - User thường không thể cập nhật"""
        self.client.force_authenticate(user=self.user)
        data = {
            'commune_name': 'Hacked',
            'commune_type': 'ward',
            'province': self.province1.id
        }
        response = self.client.put(f'/api/communes/{self.commune1.id}/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
    
    def test_by_province(self):
        """Test GET /api/provinces/:id/communes/ - Danh sách communes theo tỉnh"""
        response = self.client.get(f'/api/provinces/{self.province1.id}/communes/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)  # Ba Đình, Hoàn Kiếm (not inactive)
    
    def test_by_province_empty(self):
        """Test GET /api/provinces/:id/communes/ - Tỉnh không có communes"""
        # Create new province without communes
        empty_province = Province.objects.create(
            province_code='DN',
            province_name='Đà Nẵng',
            province_type='municipality',
            region='central',
            is_active=True
        )
        response = self.client.get(f'/api/provinces/{empty_province.id}/communes/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data, [])
    
    def test_by_province_not_found(self):
        """Test GET /api/provinces/99999/communes/ - Province không tồn tại"""
        response = self.client.get('/api/provinces/99999/communes/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data, [])  # Empty list, not 404
    
    def test_filter_by_province_id(self):
        """Test GET /api/communes/?province_id=X - Filter theo province"""
        response = self.client.get(f'/api/communes/?province_id={self.province2.id}')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)  # Quận 1 only
        self.assertEqual(response.data[0]['commune_name'], 'Quận 1')
    
    def test_update_commune_not_found(self):
        """Test PUT /api/communes/99999/ - Commune không tồn tại"""
        self.client.force_authenticate(user=self.admin)
        data = {
            'commune_name': 'Updated',
            'commune_type': 'ward',
            'province': self.province1.id,
            'is_active': True
        }
        response = self.client.put('/api/communes/99999/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
    
    def test_update_commune_unauthenticated(self):
        """Test PUT /api/communes/:id/ - Unauthenticated không thể cập nhật"""
        data = {
            'commune_name': 'Hacked',
            'commune_type': 'ward',
            'province': self.province1.id
        }
        response = self.client.put(f'/api/communes/{self.commune1.id}/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    def test_list_communes_ordered(self):
        """Test GET /api/communes/ - Sắp xếp theo tên"""
        response = self.client.get('/api/communes/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        names = [c['commune_name'] for c in response.data]
        self.assertEqual(names, sorted(names))
    
    def test_create_commune_invalid_province(self):
        """Test POST /api/communes/ - Province không tồn tại"""
        self.client.force_authenticate(user=self.admin)
        data = {
            'commune_name': 'New Ward',
            'commune_type': 'ward',
            'province': 99999,
            'is_active': True
        }
        response = self.client.post('/api/communes/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

