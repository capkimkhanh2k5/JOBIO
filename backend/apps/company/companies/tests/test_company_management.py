import pytest
from rest_framework.test import APIClient
from rest_framework import status
from django.urls import reverse

from apps.core.users.models import CustomUser


@pytest.fixture
def api_client():
    return APIClient()


@pytest.mark.django_db
class TestCompanyManagement:
    """Test suite cho Company Management APIs"""
    
    def test_create_company_success(self, api_client):
        """Kiểm tra tạo công ty thành công qua API"""
        user = CustomUser.objects.create_user(
            email="company@example.com",
            password="password123",
            role='company'
        )
        api_client.force_authenticate(user=user)
        
        url = reverse('company-list')
        data = {
            "company_name": "Công ty ABC",
            "website": "https://abc.com",
            "description": "Mô tả công ty ABC"
        }
        response = api_client.post(url, data, format='json')
        
        print("Response status:", response.status_code)
        print("Response data:", response.data)
        
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['company_name'] == "Công ty ABC"
        assert 'cong-ty-abc' in response.data['slug']
        assert response.data['user'] == user.id
    
    def test_create_company_duplicate_user(self, api_client):
        """Lỗi khi user đã có company (sử dụng API thay vì trực tiếp tạo)"""
        user = CustomUser.objects.create_user(
            email="company2@example.com",
            password="password123",
            role='company'
        )
        api_client.force_authenticate(user=user)
        
        url = reverse('company-list')
        
        # Tạo company đầu tiên qua API
        response1 = api_client.post(url, {"company_name": "Công ty 1"}, format='json')
        assert response1.status_code == status.HTTP_201_CREATED
        
        # Tạo công ty thứ 2 sẽ lỗi
        response2 = api_client.post(url, {"company_name": "Công ty 2"}, format='json')
        assert response2.status_code == status.HTTP_400_BAD_REQUEST
        assert "đã có hồ sơ công ty" in response2.data['detail']
    
    def test_list_companies_public(self, api_client):
        """Danh sách công ty công khai (không cần auth)"""
        # Tạo company trước
        user = CustomUser.objects.create_user(
            email="company3@example.com",
            password="password123",
            role='company'
        )
        api_client.force_authenticate(user=user)
        api_client.post(reverse('company-list'), {"company_name": "Test Company"}, format='json')
        api_client.logout()
        
        # Truy cập list không cần auth
        url = reverse('company-list')
        response = api_client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
    
    def test_retrieve_company_by_slug(self, api_client):
        """Lấy chi tiết công ty theo slug"""
        user = CustomUser.objects.create_user(
            email="company4@example.com",
            password="password123",
            role='company'
        )
        api_client.force_authenticate(user=user)
        create_response = api_client.post(reverse('company-list'), {"company_name": "Slug Company"}, format='json')
        assert create_response.status_code == status.HTTP_201_CREATED
        
        slug = create_response.data['slug']
        api_client.logout()
        
        url = reverse('company-retrieve-by-slug', kwargs={'slug': slug})
        response = api_client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data['slug'] == slug
    
    def test_update_company_owner_only(self, api_client):
        """Chỉ chủ sở hữu mới được cập nhật"""
        owner = CustomUser.objects.create_user(email="owner@example.com", password="password")
        other = CustomUser.objects.create_user(email="other@example.com", password="password")
        
        # Tạo company bằng owner
        api_client.force_authenticate(user=owner)
        create_response = api_client.post(reverse('company-list'), {"company_name": "Owner Company"}, format='json')
        company_id = create_response.data['id']
        
        # Thử update bằng other user
        api_client.force_authenticate(user=other)
        url = reverse('company-detail', kwargs={'pk': company_id})
        response = api_client.put(url, {"company_name": "Hacked"}, format='json')
        
        assert response.status_code == status.HTTP_403_FORBIDDEN
    
    def test_delete_company_owner_only(self, api_client):
        """Chỉ chủ sở hữu mới được xóa"""
        owner = CustomUser.objects.create_user(email="deleteowner@example.com", password="password")
        
        api_client.force_authenticate(user=owner)
        create_response = api_client.post(reverse('company-list'), {"company_name": "Delete Company"}, format='json')
        company_id = create_response.data['id']
        
        url = reverse('company-detail', kwargs={'pk': company_id})
        response = api_client.delete(url)
        
        assert response.status_code == status.HTTP_204_NO_CONTENT
