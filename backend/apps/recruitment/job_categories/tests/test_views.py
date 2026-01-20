from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from apps.core.users.models import CustomUser
from apps.recruitment.job_categories.models import JobCategory


class JobCategoryViewSetTests(TestCase):
    """Tests cho Job Categories API"""
    
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
        
        # Create parent category
        self.parent = JobCategory.objects.create(
            name='Engineering',
            slug='engineering',
            is_active=True
        )
        
        # Create child category
        self.child = JobCategory.objects.create(
            name='Software Engineering',
            slug='software-engineering',
            parent=self.parent,
            is_active=True
        )
    
    def test_list_categories_public(self):
        """Test GET /api/job-categories/ - Public access"""
        response = self.client.get('/api/job-categories/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(response.data), 1)
    
    def test_retrieve_category(self):
        """Test GET /api/job-categories/:id/ - Get category detail"""
        response = self.client.get(f'/api/job-categories/{self.parent.id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['name'], 'Engineering')
    
    def test_get_category_tree(self):
        """Test GET /api/job-categories/tree/ - Hierarchical tree"""
        response = self.client.get('/api/job-categories/tree/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        for item in response.data:
            if item['id'] == self.parent.id:
                self.assertIn('children', item)
    
    def test_filter_by_parent(self):
        """Test GET /api/job-categories/?parent_id= - Filter by parent"""
        response = self.client.get(f'/api/job-categories/?parent_id={self.parent.id}')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        for item in response.data:
            self.assertEqual(item['parent'], self.parent.id)
    
    def test_create_category_admin(self):
        """Test POST /api/job-categories/ - Admin can create"""
        self.client.force_authenticate(user=self.admin)
        data = {
            'name': 'Design',
            'slug': 'design',
            'description': 'Design jobs'
        }
        response = self.client.post('/api/job-categories/', data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
    
    def test_create_category_user_forbidden(self):
        """Test POST /api/job-categories/ - Regular user cannot create"""
        self.client.force_authenticate(user=self.user)
        data = {
            'name': 'New Category',
            'slug': 'new-category'
        }
        response = self.client.post('/api/job-categories/', data)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
    
    def test_update_category_admin(self):
        """Test PUT /api/job-categories/:id/ - Admin can update"""
        self.client.force_authenticate(user=self.admin)
        data = {
            'name': 'Updated Engineering',
            'slug': 'engineering',
            'is_active': True
        }
        response = self.client.put(f'/api/job-categories/{self.parent.id}/', data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
    
    def test_delete_category_admin(self):
        """Test DELETE /api/job-categories/:id/ - Admin can delete"""
        self.client.force_authenticate(user=self.admin)
        response = self.client.delete(f'/api/job-categories/{self.child.id}/')
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
    
    # ========== Tests bổ sung ==========
    
    def test_retrieve_category_not_found(self):
        """Test GET /api/job-categories/:id/ - Not found → 404"""
        response = self.client.get('/api/job-categories/99999/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
    
    def test_update_category_user_forbidden(self):
        """Test PUT /api/job-categories/:id/ - Regular user cannot update → 403"""
        self.client.force_authenticate(user=self.user)
        data = {'name': 'Hacked', 'slug': 'hacked'}
        response = self.client.put(f'/api/job-categories/{self.parent.id}/', data)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
    
    def test_update_category_not_found(self):
        """Test PUT /api/job-categories/:id/ - Not found → 404"""
        self.client.force_authenticate(user=self.admin)
        data = {'name': 'Test', 'slug': 'test'}
        response = self.client.put('/api/job-categories/99999/', data)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
    
    def test_delete_category_user_forbidden(self):
        """Test DELETE /api/job-categories/:id/ - Regular user cannot delete → 403"""
        self.client.force_authenticate(user=self.user)
        response = self.client.delete(f'/api/job-categories/{self.parent.id}/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

