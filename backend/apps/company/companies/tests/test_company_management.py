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
    
    # =========================================================================
    # Tests cho Company Stats API
    # =========================================================================
    @pytest.mark.skip(reason="Company stats API needs Job/Review/Follower models not available in test settings")
    def test_company_stats(self, api_client):
        """GET /api/companies/:id/stats - Lấy thống kê công ty"""
        user = CustomUser.objects.create_user(email="stats@example.com", password="password")
        api_client.force_authenticate(user=user)
        
        # Tạo company
        create_response = api_client.post(reverse('company-list'), {"company_name": "Stats Company"}, format='json')
        company_id = create_response.data['id']
        
        # Lấy stats
        url = f"/api/companies/{company_id}/stats/"
        response = api_client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        assert 'job_count' in response.data
        assert 'follower_count' in response.data
        assert 'review_count' in response.data
    
    # =========================================================================
    # Tests cho Request Verification API
    # =========================================================================
    def test_request_verification_success(self, api_client):
        """POST /api/companies/:id/verify - Yêu cầu xác thực thành công"""
        user = CustomUser.objects.create_user(email="verify@example.com", password="password")
        api_client.force_authenticate(user=user)
        
        # Tạo company
        create_response = api_client.post(reverse('company-list'), {"company_name": "Verify Company"}, format='json')
        company_id = create_response.data['id']
        
        # Yêu cầu xác thực
        url = f"/api/companies/{company_id}/verify/"
        response = api_client.post(url)
        
        assert response.status_code == status.HTTP_200_OK
        assert "successfully" in response.data['detail']
    
    def test_request_verification_not_owner(self, api_client):
        """POST /api/companies/:id/verify - Không phải chủ sở hữu"""
        owner = CustomUser.objects.create_user(email="verifyowner@example.com", password="password")
        other = CustomUser.objects.create_user(email="verifyother@example.com", password="password")
        
        api_client.force_authenticate(user=owner)
        create_response = api_client.post(reverse('company-list'), {"company_name": "Other Verify Company"}, format='json')
        company_id = create_response.data['id']
        
        # Other user cố yêu cầu xác thực
        api_client.force_authenticate(user=other)
        url = f"/api/companies/{company_id}/verify/"
        response = api_client.post(url)
        
        assert response.status_code == status.HTTP_403_FORBIDDEN
    
    # =========================================================================
    # Tests cho Admin Verification API
    # =========================================================================
    def test_admin_verification_success(self, api_client):
        """PATCH /api/companies/:id/verification - Admin duyệt thành công"""
        owner = CustomUser.objects.create_user(email="adminverifyowner@example.com", password="password")
        admin = CustomUser.objects.create_user(email="admin@example.com", password="password", is_staff=True)
        
        # Tạo company
        api_client.force_authenticate(user=owner)
        create_response = api_client.post(reverse('company-list'), {"company_name": "Admin Verify Company"}, format='json')
        company_id = create_response.data['id']
        
        # Admin duyệt
        api_client.force_authenticate(user=admin)
        url = f"/api/companies/{company_id}/verification/"
        response = api_client.patch(url, {"status": "verified"}, format='json')
        
        assert response.status_code == status.HTTP_200_OK
    
    def test_admin_verification_not_admin(self, api_client):
        """PATCH /api/companies/:id/verification - User thường không được duyệt"""
        owner = CustomUser.objects.create_user(email="notadminowner@example.com", password="password")
        
        api_client.force_authenticate(user=owner)
        create_response = api_client.post(reverse('company-list'), {"company_name": "Not Admin Company"}, format='json')
        company_id = create_response.data['id']
        
        url = f"/api/companies/{company_id}/verification/"
        response = api_client.patch(url, {"status": "verified"}, format='json')
        
        assert response.status_code == status.HTTP_403_FORBIDDEN
    
    # =========================================================================
    # Tests cho Search Companies API
    # =========================================================================
    def test_search_companies(self, api_client):
        """GET /api/companies/search - Tìm kiếm công ty"""
        user = CustomUser.objects.create_user(email="searchtest@example.com", password="password")
        api_client.force_authenticate(user=user)
        api_client.post(reverse('company-list'), {"company_name": "Tech ABC Company"}, format='json')
        api_client.logout()
        
        # Tìm kiếm
        url = "/api/companies/search/?q=Tech"
        response = api_client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        assert isinstance(response.data, list)
    
    # =========================================================================
    # Tests cho Featured Companies API
    # =========================================================================
    def test_featured_companies(self, api_client):
        """GET /api/companies/featured - Công ty nổi bật"""
        url = "/api/companies/featured/"
        response = api_client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        assert isinstance(response.data, list)
    
    # =========================================================================
    # Tests cho Company Suggestions API
    # =========================================================================
    def test_company_suggestions_anonymous(self, api_client):
        """GET /api/companies/suggestions - Gợi ý cho anonymous user"""
        url = "/api/companies/suggestions/"
        response = api_client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        assert isinstance(response.data, list)
    
    def test_company_suggestions_authenticated(self, api_client):
        """GET /api/companies/suggestions - Gợi ý cho authenticated user"""
        user = CustomUser.objects.create_user(email="suggestions@example.com", password="password")
        api_client.force_authenticate(user=user)
        
        url = "/api/companies/suggestions/"
        response = api_client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        assert isinstance(response.data, list)
    
    # =========================================================================
    # Tests cho Claim Company API
    # =========================================================================
    def test_claim_company_already_claimed(self, api_client):
        """POST /api/companies/:id/claim - Công ty đã có chủ sở hữu"""
        owner = CustomUser.objects.create_user(email="claimowner@example.com", password="password")
        other = CustomUser.objects.create_user(email="claimother@example.com", password="password")
        
        # Tạo company có owner
        api_client.force_authenticate(user=owner)
        create_response = api_client.post(reverse('company-list'), {"company_name": "Claimed Company"}, format='json')
        company_id = create_response.data['id']
        
        # Other user cố claim
        api_client.force_authenticate(user=other)
        url = f"/api/companies/{company_id}/claim/"
        response = api_client.post(url)
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "already claimed" in response.data['detail']
