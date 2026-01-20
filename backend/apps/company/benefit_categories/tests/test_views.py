from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from apps.core.users.models import CustomUser
from apps.company.benefit_categories.models import BenefitCategory


class BenefitCategoryViewSetTests(TestCase):
    """Tests cho Benefit Categories API"""
    
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
        
        # Create benefit categories
        self.category1 = BenefitCategory.objects.create(
            name='Health Insurance',
            slug='health-insurance',
            icon_url='https://example.com/health.png',
            is_active=True,
            display_order=0
        )
        self.category2 = BenefitCategory.objects.create(
            name='Paid Time Off',
            slug='paid-time-off',
            is_active=True,
            display_order=1
        )
        self.category3 = BenefitCategory.objects.create(
            name='Remote Work',
            slug='remote-work',
            is_active=False,
            display_order=2
        )
    
    def test_list_categories_public(self):
        """Test GET /api/benefit-categories/ - Public có thể xem (chỉ active)"""
        response = self.client.get('/api/benefit-categories/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Only active categories for non-staff
        self.assertEqual(len(response.data), 2)
    
    def test_list_categories_admin(self):
        """Test GET /api/benefit-categories/ - Admin thấy tất cả"""
        self.client.force_authenticate(user=self.admin)
        response = self.client.get('/api/benefit-categories/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 3)
    
    def test_create_category_admin(self):
        """Test POST /api/benefit-categories/ - Admin có thể tạo"""
        self.client.force_authenticate(user=self.admin)
        data = {
            'name': 'Gym Membership',
            'slug': 'gym-membership',
            'icon_url': 'https://example.com/gym.png',
            'is_active': True,
            'display_order': 3
        }
        response = self.client.post('/api/benefit-categories/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(BenefitCategory.objects.filter(name='Gym Membership').exists())
    
    def test_create_category_unauthorized(self):
        """Test POST /api/benefit-categories/ - User thường không thể tạo"""
        self.client.force_authenticate(user=self.user)
        data = {
            'name': 'Bonus',
            'slug': 'bonus'
        }
        response = self.client.post('/api/benefit-categories/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
    
    def test_update_category_admin(self):
        """Test PUT /api/benefit-categories/:id/ - Admin có thể cập nhật"""
        self.client.force_authenticate(user=self.admin)
        data = {
            'name': 'Health & Dental Insurance',
            'slug': 'health-dental-insurance',
            'is_active': True,
            'display_order': 0
        }
        response = self.client.put(
            f'/api/benefit-categories/{self.category1.id}/', 
            data, 
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.category1.refresh_from_db()
        self.assertEqual(self.category1.name, 'Health & Dental Insurance')
    
    def test_delete_category_admin(self):
        """Test DELETE /api/benefit-categories/:id/ - Admin có thể xóa"""
        self.client.force_authenticate(user=self.admin)
        response = self.client.delete(f'/api/benefit-categories/{self.category3.id}/')
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(BenefitCategory.objects.filter(id=self.category3.id).exists())
    
    def test_reorder_categories(self):
        """Test PATCH /api/benefit-categories/reorder/ - Bulk reorder"""
        self.client.force_authenticate(user=self.admin)
        data = {
            'items': [
                {'id': self.category1.id, 'display_order': 2},
                {'id': self.category2.id, 'display_order': 0},
                {'id': self.category3.id, 'display_order': 1}
            ]
        }
        response = self.client.patch('/api/benefit-categories/reorder/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verify orders updated
        self.category1.refresh_from_db()
        self.category2.refresh_from_db()
        self.category3.refresh_from_db()
        
        self.assertEqual(self.category1.display_order, 2)
        self.assertEqual(self.category2.display_order, 0)
        self.assertEqual(self.category3.display_order, 1)
    
    def test_reorder_unauthorized(self):
        """Test PATCH /api/benefit-categories/reorder/ - User thường không thể reorder"""
        self.client.force_authenticate(user=self.user)
        data = {
            'items': [
                {'id': self.category1.id, 'display_order': 1}
            ]
        }
        response = self.client.patch('/api/benefit-categories/reorder/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
    
    def test_reorder_invalid_id(self):
        """Test PATCH /api/benefit-categories/reorder/ - ID không tồn tại"""
        self.client.force_authenticate(user=self.admin)
        data = {
            'items': [
                {'id': 9999, 'display_order': 0}
            ]
        }
        response = self.client.patch('/api/benefit-categories/reorder/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
    
    def test_update_category_unauthorized(self):
        """Test PUT /api/benefit-categories/:id/ - User thường không thể cập nhật"""
        self.client.force_authenticate(user=self.user)
        data = {
            'name': 'Hacked',
            'slug': 'hacked'
        }
        response = self.client.put(
            f'/api/benefit-categories/{self.category1.id}/', 
            data, 
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
    
    def test_delete_category_unauthorized(self):
        """Test DELETE /api/benefit-categories/:id/ - User thường không thể xóa"""
        self.client.force_authenticate(user=self.user)
        response = self.client.delete(f'/api/benefit-categories/{self.category1.id}/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
    
    def test_create_category_unauthenticated(self):
        """Test POST /api/benefit-categories/ - Unauthenticated không thể tạo"""
        data = {
            'name': 'New Category',
            'slug': 'new-category'
        }
        response = self.client.post('/api/benefit-categories/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    def test_retrieve_category_not_found(self):
        """Test GET /api/benefit-categories/99999/ - Category không tồn tại"""
        self.client.force_authenticate(user=self.admin)
        response = self.client.get('/api/benefit-categories/99999/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

