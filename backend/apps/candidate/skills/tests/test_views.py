from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from apps.core.users.models import CustomUser
from apps.candidate.skills.models import Skill
from apps.candidate.skill_categories.models import SkillCategory


class SkillViewSetTests(TestCase):
    """Tests cho Skills API"""
    
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
        
        # Create skill category
        self.category = SkillCategory.objects.create(
            name='Programming',
            slug='programming',
            is_active=True
        )
        self.category2 = SkillCategory.objects.create(
            name='Design',
            slug='design',
            is_active=True
        )
        
        # Create skills
        self.skill1 = Skill.objects.create(
            name='Python',
            slug='python',
            category=self.category,
            is_verified=True,
            usage_count=100
        )
        self.skill2 = Skill.objects.create(
            name='JavaScript',
            slug='javascript',
            category=self.category,
            is_verified=True,
            usage_count=150
        )
        self.skill3 = Skill.objects.create(
            name='Figma',
            slug='figma',
            category=self.category2,
            is_verified=False,
            usage_count=50
        )
    
    def test_list_skills(self):
        """Test GET /api/skills/ - Danh sách kỹ năng (public)"""
        response = self.client.get('/api/skills/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 3)
    
    def test_retrieve_skill(self):
        """Test GET /api/skills/:id/ - Chi tiết kỹ năng (public)"""
        response = self.client.get(f'/api/skills/{self.skill1.id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['name'], 'Python')
        self.assertIn('category', response.data)
    
    def test_create_skill_admin(self):
        """Test POST /api/skills/ - Admin có thể tạo"""
        self.client.force_authenticate(user=self.admin)
        data = {
            'name': 'React',
            'slug': 'react',
            'category': self.category.id,
            'description': 'Frontend framework',
            'is_verified': True
        }
        response = self.client.post('/api/skills/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(Skill.objects.filter(name='React').exists())
    
    def test_create_skill_unauthorized(self):
        """Test POST /api/skills/ - User thường không thể tạo"""
        self.client.force_authenticate(user=self.user)
        data = {
            'name': 'Vue',
            'slug': 'vue',
            'category': self.category.id
        }
        response = self.client.post('/api/skills/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
    
    def test_update_skill_admin(self):
        """Test PUT /api/skills/:id/ - Admin có thể cập nhật"""
        self.client.force_authenticate(user=self.admin)
        data = {
            'name': 'Python 3',
            'slug': 'python-3',
            'category': self.category.id,
            'is_verified': True
        }
        response = self.client.put(f'/api/skills/{self.skill1.id}/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.skill1.refresh_from_db()
        self.assertEqual(self.skill1.name, 'Python 3')
    
    def test_delete_skill_admin(self):
        """Test DELETE /api/skills/:id/ - Admin có thể xóa"""
        self.client.force_authenticate(user=self.admin)
        response = self.client.delete(f'/api/skills/{self.skill3.id}/')
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Skill.objects.filter(id=self.skill3.id).exists())
    
    def test_search_skills(self):
        """Test GET /api/skills/search/?q=python - Tìm kiếm kỹ năng"""
        response = self.client.get('/api/skills/search/?q=python')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['name'], 'Python')
    
    def test_search_skills_short_query(self):
        """Test GET /api/skills/search/?q=p - Query quá ngắn trả empty"""
        response = self.client.get('/api/skills/search/?q=p')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data, [])
    
    def test_popular_skills(self):
        """Test GET /api/skills/popular/ - Top kỹ năng phổ biến"""
        response = self.client.get('/api/skills/popular/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 3)
        # Should be sorted by usage_count DESC
        self.assertEqual(response.data[0]['name'], 'JavaScript')  # 150
        self.assertEqual(response.data[1]['name'], 'Python')      # 100
        self.assertEqual(response.data[2]['name'], 'Figma')       # 50
    
    def test_categories(self):
        """Test GET /api/skills/categories/ - Danh mục kỹ năng"""
        response = self.client.get('/api/skills/categories/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)  # Programming, Design
    
    def test_filter_by_category(self):
        """Test GET /api/skills/?category_id=X - Filter theo category"""
        response = self.client.get(f'/api/skills/?category_id={self.category.id}')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)  # Python, JavaScript
    
    def test_filter_by_verified(self):
        """Test GET /api/skills/?is_verified=true - Filter theo verified"""
        response = self.client.get('/api/skills/?is_verified=true')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)  # Python, JavaScript
    
    def test_retrieve_skill_not_found(self):
        """Test GET /api/skills/99999/ - Skill không tồn tại"""
        response = self.client.get('/api/skills/99999/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
    
    def test_update_skill_unauthorized(self):
        """Test PUT /api/skills/:id/ - User thường không thể cập nhật"""
        self.client.force_authenticate(user=self.user)
        data = {
            'name': 'Hacked',
            'slug': 'hacked',
            'category': self.category.id
        }
        response = self.client.put(f'/api/skills/{self.skill1.id}/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
    
    def test_delete_skill_unauthorized(self):
        """Test DELETE /api/skills/:id/ - User thường không thể xóa"""
        self.client.force_authenticate(user=self.user)
        response = self.client.delete(f'/api/skills/{self.skill1.id}/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
    
    def test_create_skill_unauthenticated(self):
        """Test POST /api/skills/ - Unauthenticated không thể tạo"""
        data = {
            'name': 'New Skill',
            'slug': 'new-skill',
            'category': self.category.id
        }
        response = self.client.post('/api/skills/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    def test_search_no_results(self):
        """Test GET /api/skills/search/?q=xyz - Không có kết quả"""
        response = self.client.get('/api/skills/search/?q=xyz123')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data, [])

