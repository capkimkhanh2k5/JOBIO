from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from apps.geography.provinces.models import Province


class ProvinceViewSetTests(TestCase):
    """Tests cho Provinces API"""
    
    def setUp(self):
        self.client = APIClient()
        
        # Create provinces for testing
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
        self.province3 = Province.objects.create(
            province_code='DN',
            province_name='Đà Nẵng',
            province_type='municipality',
            region='central',
            is_active=True
        )
        self.province_inactive = Province.objects.create(
            province_code='OLD',
            province_name='Old Province',
            province_type='province',
            region='north',
            is_active=False
        )
    
    def test_list_provinces(self):
        """Test GET /api/provinces/ - Danh sách tỉnh (chỉ active)"""
        response = self.client.get('/api/provinces/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Only active provinces
        self.assertEqual(len(response.data), 3)
    
    def test_retrieve_province(self):
        """Test GET /api/provinces/:id/ - Chi tiết tỉnh"""
        response = self.client.get(f'/api/provinces/{self.province1.id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['province_name'], 'Hà Nội')
        self.assertEqual(response.data['province_code'], 'HN')
    
    def test_by_region_north(self):
        """Test GET /api/provinces/by-region/north/ - Filter miền Bắc"""
        response = self.client.get('/api/provinces/by-region/north/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['province_name'], 'Hà Nội')
    
    def test_by_region_central(self):
        """Test GET /api/provinces/by-region/central/ - Filter miền Trung"""
        response = self.client.get('/api/provinces/by-region/central/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['province_name'], 'Đà Nẵng')
    
    def test_by_region_south(self):
        """Test GET /api/provinces/by-region/south/ - Filter miền Nam"""
        response = self.client.get('/api/provinces/by-region/south/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['province_name'], 'Hồ Chí Minh')
    
    def test_by_region_invalid(self):
        """Test GET /api/provinces/by-region/invalid/ - Region không hợp lệ"""
        response = self.client.get('/api/provinces/by-region/invalid/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data, [])
    
    def test_search_provinces(self):
        """Test GET /api/provinces/search/?q=hanoi - Tìm kiếm"""
        response = self.client.get('/api/provinces/search/?q=Hà')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['province_name'], 'Hà Nội')
    
    def test_search_short_query(self):
        """Test GET /api/provinces/search/?q=H - Query quá ngắn"""
        response = self.client.get('/api/provinces/search/?q=H')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data, [])
    
    def test_retrieve_province_not_found(self):
        """Test GET /api/provinces/99999/ - Province không tồn tại"""
        response = self.client.get('/api/provinces/99999/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
    
    def test_search_no_results(self):
        """Test GET /api/provinces/search/?q=xyz - Không có kết quả"""
        response = self.client.get('/api/provinces/search/?q=xyz123')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data, [])
    
    def test_list_provinces_ordered(self):
        """Test GET /api/provinces/ - Sắp xếp theo tên"""
        response = self.client.get('/api/provinces/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        names = [p['province_name'] for p in response.data]
        self.assertEqual(names, sorted(names))

