from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from apps.core.users.models import CustomUser
from apps.recruitment.interview_types.models import InterviewType


class InterviewTypeViewSetTests(TestCase):
    """Tests cho Interview Types API"""
    
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
        
        # Create test interview type
        self.interview_type = InterviewType.objects.create(
            name='Phone Interview',
            description='Initial phone screening'
        )
    
    def test_list_interview_types(self):
        """Test GET /api/interview-types/ - List all interview types"""
        self.client.force_authenticate(user=self.user)
        response = self.client.get('/api/interview-types/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(response.data), 1)
    
    def test_retrieve_interview_type(self):
        """Test GET /api/interview-types/:id/ - Get interview type detail"""
        self.client.force_authenticate(user=self.user)
        response = self.client.get(f'/api/interview-types/{self.interview_type.id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['name'], 'Phone Interview')
    
    def test_create_interview_type_admin(self):
        """Test POST /api/interview-types/ - Admin can create"""
        self.client.force_authenticate(user=self.admin)
        data = {
            'name': 'Technical Interview',
            'description': 'Technical skills assessment'
        }
        response = self.client.post('/api/interview-types/', data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['name'], 'Technical Interview')
    
    def test_create_interview_type_user_forbidden(self):
        """Test POST /api/interview-types/ - Regular user cannot create"""
        self.client.force_authenticate(user=self.user)
        data = {
            'name': 'New Type',
            'description': 'Test'
        }
        response = self.client.post('/api/interview-types/', data)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
    
    def test_update_interview_type_admin(self):
        """Test PUT /api/interview-types/:id/ - Admin can update"""
        self.client.force_authenticate(user=self.admin)
        data = {
            'name': 'Updated Phone Interview',
            'description': 'Updated description'
        }
        response = self.client.put(f'/api/interview-types/{self.interview_type.id}/', data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['name'], 'Updated Phone Interview')
    
    def test_delete_interview_type_admin(self):
        """Test DELETE /api/interview-types/:id/ - Admin can delete"""
        self.client.force_authenticate(user=self.admin)
        response = self.client.delete(f'/api/interview-types/{self.interview_type.id}/')
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(InterviewType.objects.filter(id=self.interview_type.id).exists())
    
    def test_delete_interview_type_user_forbidden(self):
        """Test DELETE /api/interview-types/:id/ - Regular user cannot delete"""
        self.client.force_authenticate(user=self.user)
        response = self.client.delete(f'/api/interview-types/{self.interview_type.id}/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
    
    # ========== Tests bổ sung ==========
    
    def test_list_interview_types_unauthenticated(self):
        """Test GET /api/interview-types/ - Unauthenticated → 401"""
        response = self.client.get('/api/interview-types/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    def test_retrieve_interview_type_unauthenticated(self):
        """Test GET /api/interview-types/:id/ - Unauthenticated → 401"""
        response = self.client.get(f'/api/interview-types/{self.interview_type.id}/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    def test_retrieve_interview_type_not_found(self):
        """Test GET /api/interview-types/:id/ - Not found → 404"""
        self.client.force_authenticate(user=self.user)
        response = self.client.get('/api/interview-types/99999/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
    
    def test_update_interview_type_user_forbidden(self):
        """Test PUT /api/interview-types/:id/ - Regular user cannot update → 403"""
        self.client.force_authenticate(user=self.user)
        data = {'name': 'Updated', 'description': 'Test'}
        response = self.client.put(f'/api/interview-types/{self.interview_type.id}/', data)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

