from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from apps.core.users.models import CustomUser
from apps.company.industries.models import Industry


class IndustryViewSetTests(TestCase):
    """Tests cho Industries API"""
    
    def setUp(self):
        self.client = APIClient()
        self.user = CustomUser.objects.create_user(
            email='test@example.com',
            password='testpass123',
            full_name='Test User'
        )
        self.admin = CustomUser.objects.create_superuser(
            email='admin@example.com',
            password='adminpass123',
            full_name='Admin User'
        )
        
        # Create parent industry
        self.parent = Industry.objects.create(
            name='Technology',
            slug='technology',
            is_active=True
        )
        
        # Create child industry
        self.child = Industry.objects.create(
            name='Software',
            slug='software',
            parent=self.parent,
            is_active=True
        )
    
    def test_list_industries_public(self):
        """Test GET /api/industries/ - Public access"""
        response = self.client.get('/api/industries/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(response.data), 1)
    
    def test_retrieve_industry(self):
        """Test GET /api/industries/:id/ - Get industry detail"""
        response = self.client.get(f'/api/industries/{self.parent.id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['name'], 'Technology')
    
    def test_get_industry_tree(self):
        """Test GET /api/industries/tree/ - Hierarchical tree"""
        response = self.client.get('/api/industries/tree/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Should only return root nodes
        for item in response.data:
            if item['id'] == self.parent.id:
                self.assertIn('children', item)
    
    def test_filter_by_parent(self):
        """Test GET /api/industries/?parent_id= - Filter by parent"""
        response = self.client.get(f'/api/industries/?parent_id={self.parent.id}')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        for item in response.data:
            self.assertEqual(item['parent'], self.parent.id)
    
    def test_filter_root_industries(self):
        """Test GET /api/industries/?parent_id=null - Root only"""
        response = self.client.get('/api/industries/?parent_id=null')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        for item in response.data:
            self.assertIsNone(item['parent'])
    
    def test_create_industry_admin(self):
        """Test POST /api/industries/ - Admin can create"""
        self.client.force_authenticate(user=self.admin)
        data = {
            'name': 'Healthcare',
            'slug': 'healthcare',
            'description': 'Healthcare industry'
        }
        response = self.client.post('/api/industries/', data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
    
    def test_create_industry_user_forbidden(self):
        """Test POST /api/industries/ - Regular user cannot create"""
        self.client.force_authenticate(user=self.user)
        data = {
            'name': 'New Industry',
            'slug': 'new-industry'
        }
        response = self.client.post('/api/industries/', data)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
    
    def test_update_industry_admin(self):
        """Test PUT /api/industries/:id/ - Admin can update"""
        self.client.force_authenticate(user=self.admin)
        data = {
            'name': 'Updated Technology',
            'slug': 'technology',
            'is_active': True
        }
        response = self.client.put(f'/api/industries/{self.parent.id}/', data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
    
    def test_delete_industry_admin(self):
        """Test DELETE /api/industries/:id/ - Admin can delete"""
        self.client.force_authenticate(user=self.admin)
        response = self.client.delete(f'/api/industries/{self.child.id}/')
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
    
    # ========== Tests bổ sung ==========
    
    def test_retrieve_industry_not_found(self):
        """Test GET /api/industries/:id/ - Not found → 404"""
        response = self.client.get('/api/industries/99999/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
    
    def test_update_industry_user_forbidden(self):
        """Test PUT /api/industries/:id/ - Regular user cannot update → 403"""
        self.client.force_authenticate(user=self.user)
        data = {'name': 'Hacked', 'slug': 'hacked'}
        response = self.client.put(f'/api/industries/{self.parent.id}/', data)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
    
    def test_update_industry_not_found(self):
        """Test PUT /api/industries/:id/ - Not found → 404"""
        self.client.force_authenticate(user=self.admin)
        data = {'name': 'Test', 'slug': 'test'}
        response = self.client.put('/api/industries/99999/', data)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
    
    def test_delete_industry_user_forbidden(self):
        """Test DELETE /api/industries/:id/ - Regular user cannot delete → 403"""
        self.client.force_authenticate(user=self.user)
        response = self.client.delete(f'/api/industries/{self.parent.id}/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

