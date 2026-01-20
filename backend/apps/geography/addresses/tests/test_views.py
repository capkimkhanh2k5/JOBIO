from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from apps.core.users.models import CustomUser
from apps.geography.provinces.models import Province
from apps.geography.communes.models import Commune
from apps.geography.addresses.models import Address


class AddressViewSetTests(TestCase):
    """Tests cho Addresses API - Comprehensive Coverage"""
    
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
        
        # Create province
        self.province = Province.objects.create(
            province_code='HN',
            province_name='Hà Nội',
            province_type='municipality',
            region='north',
            is_active=True
        )
        
        # Create commune
        self.commune = Commune.objects.create(
            province=self.province,
            commune_name='Ba Đình',
            commune_type='ward',
            is_active=True
        )
        
        # Create addresses
        self.address1 = Address.objects.create(
            address_line='123 Đường ABC',
            commune=self.commune,
            province=self.province,
            latitude=21.0285,
            longitude=105.8542,
            is_verified=False
        )
        self.address2 = Address.objects.create(
            address_line='456 Đường XYZ',
            commune=self.commune,
            province=self.province,
            is_verified=True
        )
    
    # ==================== LIST TESTS ====================
    
    def test_list_addresses(self):
        """Test GET /api/addresses/ - Danh sách địa chỉ (public)"""
        response = self.client.get('/api/addresses/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)
    
    def test_list_addresses_ordered_by_created(self):
        """Test GET /api/addresses/ - Sắp xếp theo created_at DESC"""
        response = self.client.get('/api/addresses/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # address2 created later, should be first
        self.assertEqual(response.data[0]['id'], self.address2.id)
    
    # ==================== RETRIEVE TESTS ====================
    
    def test_retrieve_address(self):
        """Test GET /api/addresses/:id/ - Chi tiết địa chỉ (public)"""
        response = self.client.get(f'/api/addresses/{self.address1.id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['address_line'], '123 Đường ABC')
        self.assertIn('province_name', response.data)
        self.assertIn('commune_name', response.data)
        self.assertIn('latitude', response.data)
        self.assertIn('longitude', response.data)
    
    def test_retrieve_address_not_found(self):
        """Test GET /api/addresses/99999/ - Address không tồn tại"""
        response = self.client.get('/api/addresses/99999/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
    
    # ==================== CREATE TESTS ====================
    
    def test_create_address_authenticated(self):
        """Test POST /api/addresses/ - Authenticated user có thể tạo"""
        self.client.force_authenticate(user=self.user)
        data = {
            'address_line': '789 Đường New',
            'commune': self.commune.id,
            'province': self.province.id,
            'latitude': 21.0300,
            'longitude': 105.8500
        }
        response = self.client.post('/api/addresses/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(Address.objects.filter(address_line='789 Đường New').exists())
    
    def test_create_address_without_commune(self):
        """Test POST /api/addresses/ - Tạo address không có commune (optional)"""
        self.client.force_authenticate(user=self.user)
        data = {
            'address_line': 'Địa chỉ không có xã',
            'province': self.province.id
        }
        response = self.client.post('/api/addresses/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
    
    def test_create_address_unauthenticated(self):
        """Test POST /api/addresses/ - Unauthenticated không thể tạo"""
        data = {
            'address_line': 'New Address',
            'province': self.province.id
        }
        response = self.client.post('/api/addresses/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    def test_create_address_invalid_province(self):
        """Test POST /api/addresses/ - Province không tồn tại"""
        self.client.force_authenticate(user=self.user)
        data = {
            'address_line': 'Invalid Province Address',
            'province': 99999
        }
        response = self.client.post('/api/addresses/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    
    def test_create_address_missing_required_field(self):
        """Test POST /api/addresses/ - Thiếu address_line"""
        self.client.force_authenticate(user=self.user)
        data = {
            'province': self.province.id
        }
        response = self.client.post('/api/addresses/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    
    # ==================== UPDATE TESTS ====================
    
    def test_update_address_authenticated(self):
        """Test PUT /api/addresses/:id/ - Authenticated user có thể cập nhật"""
        self.client.force_authenticate(user=self.user)
        data = {
            'address_line': 'Updated Address',
            'province': self.province.id,
            'latitude': 21.0400,
            'longitude': 105.8600
        }
        response = self.client.put(f'/api/addresses/{self.address1.id}/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.address1.refresh_from_db()
        self.assertEqual(self.address1.address_line, 'Updated Address')
    
    def test_update_address_unauthenticated(self):
        """Test PUT /api/addresses/:id/ - Unauthenticated không thể cập nhật"""
        data = {
            'address_line': 'Hacked',
            'province': self.province.id
        }
        response = self.client.put(f'/api/addresses/{self.address1.id}/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    def test_update_address_not_found(self):
        """Test PUT /api/addresses/99999/ - Address không tồn tại"""
        self.client.force_authenticate(user=self.user)
        data = {
            'address_line': 'Updated',
            'province': self.province.id
        }
        response = self.client.put('/api/addresses/99999/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
    
    # ==================== DELETE TESTS ====================
    
    def test_delete_address_admin(self):
        """Test DELETE /api/addresses/:id/ - Admin có thể xóa"""
        self.client.force_authenticate(user=self.admin)
        response = self.client.delete(f'/api/addresses/{self.address1.id}/')
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Address.objects.filter(id=self.address1.id).exists())
    
    def test_delete_address_user_forbidden(self):
        """Test DELETE /api/addresses/:id/ - User thường không thể xóa"""
        self.client.force_authenticate(user=self.user)
        response = self.client.delete(f'/api/addresses/{self.address1.id}/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
    
    def test_delete_address_unauthenticated(self):
        """Test DELETE /api/addresses/:id/ - Unauthenticated không thể xóa"""
        response = self.client.delete(f'/api/addresses/{self.address1.id}/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    def test_delete_address_not_found(self):
        """Test DELETE /api/addresses/99999/ - Address không tồn tại"""
        self.client.force_authenticate(user=self.admin)
        response = self.client.delete('/api/addresses/99999/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
    
    # ==================== VERIFY TESTS ====================
    
    def test_verify_address_admin(self):
        """Test PATCH /api/addresses/:id/verify/ - Admin có thể verify"""
        self.client.force_authenticate(user=self.admin)
        self.assertFalse(self.address1.is_verified)
        
        response = self.client.patch(f'/api/addresses/{self.address1.id}/verify/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['verified'])
        
        self.address1.refresh_from_db()
        self.assertTrue(self.address1.is_verified)
    
    def test_verify_address_user_forbidden(self):
        """Test PATCH /api/addresses/:id/verify/ - User thường không thể verify"""
        self.client.force_authenticate(user=self.user)
        response = self.client.patch(f'/api/addresses/{self.address1.id}/verify/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
    
    def test_verify_address_unauthenticated(self):
        """Test PATCH /api/addresses/:id/verify/ - Unauthenticated không thể verify"""
        response = self.client.patch(f'/api/addresses/{self.address1.id}/verify/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    def test_verify_address_not_found(self):
        """Test PATCH /api/addresses/99999/verify/ - Address không tồn tại"""
        self.client.force_authenticate(user=self.admin)
        response = self.client.patch('/api/addresses/99999/verify/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
    
    def test_verify_already_verified_address(self):
        """Test PATCH /api/addresses/:id/verify/ - Verify address đã verified"""
        self.client.force_authenticate(user=self.admin)
        self.assertTrue(self.address2.is_verified)
        
        response = self.client.patch(f'/api/addresses/{self.address2.id}/verify/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['verified'])
