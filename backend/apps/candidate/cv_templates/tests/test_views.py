from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from apps.core.users.models import CustomUser
from apps.candidate.cv_templates.models import CVTemplate
from apps.candidate.cv_template_categories.models import CVTemplateCategory


class CVTemplateViewSetTests(TestCase):
    """Tests cho CV Templates API"""
    
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
        
        # Create category
        self.category = CVTemplateCategory.objects.create(
            name='Modern',
            slug='modern',
            is_active=True
        )
        
        # Create templates
        self.template = CVTemplate.objects.create(
            name='Modern Classic',
            category=self.category,
            template_data={'sections': []},
            is_premium=False,
            is_active=True
        )
        self.premium_template = CVTemplate.objects.create(
            name='Executive Pro',
            category=self.category,
            template_data={'sections': []},
            is_premium=True,
            price=9.99,
            is_active=True
        )
    
    def test_list_templates_public(self):
        """Test GET /api/cv-templates/ - Public access"""
        response = self.client.get('/api/cv-templates/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(response.data), 1)
    
    def test_retrieve_template(self):
        """Test GET /api/cv-templates/:id/ - Get template detail"""
        response = self.client.get(f'/api/cv-templates/{self.template.id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['name'], 'Modern Classic')
    
    def test_list_categories(self):
        """Test GET /api/cv-templates/categories/ - List categories"""
        response = self.client.get('/api/cv-templates/categories/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(response.data), 1)
    
    def test_list_premium_templates(self):
        """Test GET /api/cv-templates/premium/ - Premium templates"""
        response = self.client.get('/api/cv-templates/premium/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(all(t['is_premium'] for t in response.data))
    
    def test_list_popular_templates(self):
        """Test GET /api/cv-templates/popular/ - Popular templates"""
        response = self.client.get('/api/cv-templates/popular/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
    
    def test_create_template_admin(self):
        """Test POST /api/cv-templates/ - Admin can create"""
        self.client.force_authenticate(user=self.admin)
        data = {
            'name': 'New Template',
            'category': self.category.id,
            'template_data': {'sections': ['personal', 'education']},
            'is_premium': False
        }
        response = self.client.post('/api/cv-templates/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
    
    def test_create_template_user_forbidden(self):
        """Test POST /api/cv-templates/ - Regular user cannot create"""
        self.client.force_authenticate(user=self.user)
        data = {
            'name': 'New Template',
            'category': self.category.id,
        }
        response = self.client.post('/api/cv-templates/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
    
    def test_update_template_admin(self):
        """Test PUT /api/cv-templates/:id/ - Admin can update"""
        self.client.force_authenticate(user=self.admin)
        data = {
            'name': 'Updated Template',
            'category': self.category.id,
            'is_premium': True
        }
        response = self.client.put(f'/api/cv-templates/{self.template.id}/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
    
    def test_delete_template_admin(self):
        """Test DELETE /api/cv-templates/:id/ - Admin can delete"""
        self.client.force_authenticate(user=self.admin)
        response = self.client.delete(f'/api/cv-templates/{self.template.id}/')
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
    
    # ========== Tests bổ sung ==========
    
    def test_retrieve_template_not_found(self):
        """Test GET /api/cv-templates/:id/ - Not found → 404"""
        response = self.client.get('/api/cv-templates/99999/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
    
    def test_update_template_user_forbidden(self):
        """Test PUT /api/cv-templates/:id/ - Regular user cannot update → 403"""
        self.client.force_authenticate(user=self.user)
        data = {'name': 'Hacked', 'category': self.category.id}
        response = self.client.put(f'/api/cv-templates/{self.template.id}/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
    
    def test_delete_template_user_forbidden(self):
        """Test DELETE /api/cv-templates/:id/ - Regular user cannot delete → 403"""
        self.client.force_authenticate(user=self.user)
        response = self.client.delete(f'/api/cv-templates/{self.template.id}/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
    
    def test_update_template_not_found(self):
        """Test PUT /api/cv-templates/:id/ - Not found → 404"""
        self.client.force_authenticate(user=self.admin)
        data = {'name': 'Test', 'category': self.category.id}
        response = self.client.put('/api/cv-templates/99999/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

