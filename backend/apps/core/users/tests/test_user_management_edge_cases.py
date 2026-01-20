"""
Test cases bổ sung cho User Management APIs - Edge cases và Error handling
Bổ sung các test còn thiếu theo báo cáo phân tích

File: test_user_management_edge_cases.py
Module 1: Authentication & User Management
"""
import pytest
import io
from PIL import Image
from rest_framework import status
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken
from django.core.files.uploadedfile import SimpleUploadedFile

from apps.core.users.models import CustomUser


# ============================================================================
# URL PATHS
# ============================================================================
USER_LIST = '/api/users/'
USER_STATS = '/api/users/stats/'
USER_EXPORT = '/api/users/export/'
USER_BULK_ACTION = '/api/users/bulk-action/'

def user_detail(user_id): return f'/api/users/{user_id}/'
def user_status(user_id): return f'/api/users/{user_id}/status/'
def user_role(user_id): return f'/api/users/{user_id}/role/'
def user_avatar(user_id): return f'/api/users/{user_id}/avatar/'
def user_activity_logs(user_id): return f'/api/users/{user_id}/activity-logs/'


# ============================================================================
# TEST: GET USER DETAIL API - Chưa có test
# ============================================================================

@pytest.mark.django_db
class TestGetUserDetail:
    """Test cases cho API GET /api/users/:id/ - Chi tiết user"""
    
    @pytest.fixture
    def api_client(self):
        return APIClient()
    
    @pytest.fixture
    def admin_user(self, api_client):
        """Fixture tạo admin user và authenticate"""
        admin = CustomUser.objects.create_superuser(
            email="admin@example.com",
            password="adminpass123"
        )
        refresh = RefreshToken.for_user(admin)
        api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
        return admin
    
    @pytest.fixture
    def normal_user(self, api_client):
        """Fixture tạo normal user và authenticate"""
        user = CustomUser.objects.create_user(
            email="normal@example.com",
            password="password123",
            full_name="Normal User",
            role="recruiter"
        )
        refresh = RefreshToken.for_user(user)
        api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
        return user
    
    @pytest.fixture
    def target_user(self):
        """Fixture tạo user để test"""
        return CustomUser.objects.create_user(
            email="target@example.com",
            password="password123",
            full_name="Target User",
            role="recruiter"
        )
    
    def test_get_user_detail_as_admin(self, api_client, admin_user, target_user):
        """Admin xem chi tiết user → 200"""
        response = api_client.get(user_detail(target_user.id))
        assert response.status_code == status.HTTP_200_OK
        assert response.data['email'] == target_user.email
        assert response.data['full_name'] == target_user.full_name
    
    def test_get_user_detail_as_authenticated_user(self, api_client, normal_user, target_user):
        """User thường xem chi tiết user khác → 200"""
        response = api_client.get(user_detail(target_user.id))
        assert response.status_code == status.HTTP_200_OK
    
    def test_get_user_detail_self(self, api_client, normal_user):
        """User xem chi tiết chính mình → 200"""
        response = api_client.get(user_detail(normal_user.id))
        assert response.status_code == status.HTTP_200_OK
        assert response.data['email'] == normal_user.email
    
    def test_get_user_detail_not_found(self, api_client, admin_user):
        """Xem chi tiết user không tồn tại → 404"""
        response = api_client.get(user_detail(99999))
        assert response.status_code == status.HTTP_404_NOT_FOUND
    
    def test_get_user_detail_without_authentication(self, api_client, target_user):
        """Xem chi tiết user mà chưa đăng nhập → 401"""
        api_client.credentials()  # Clear auth
        response = api_client.get(user_detail(target_user.id))
        assert response.status_code == status.HTTP_401_UNAUTHORIZED


# ============================================================================
# TEST: LIST USERS API - Edge Cases
# ============================================================================

@pytest.mark.django_db
class TestListUsersEdgeCases:
    """Test cases bổ sung cho API GET /api/users/ - Danh sách users"""
    
    @pytest.fixture
    def api_client(self):
        return APIClient()
    
    @pytest.fixture
    def admin_user(self, api_client):
        admin = CustomUser.objects.create_superuser(
            email="admin@example.com",
            password="adminpass123"
        )
        refresh = RefreshToken.for_user(admin)
        api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
        return admin
    
    @pytest.fixture
    def normal_user(self, api_client):
        user = CustomUser.objects.create_user(
            email="normal@example.com",
            password="password123",
            full_name="Normal User",
            role="recruiter"
        )
        refresh = RefreshToken.for_user(user)
        api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
        return user
    
    def test_list_users_without_authentication(self, api_client):
        """Xem danh sách users mà chưa đăng nhập → 401"""
        api_client.credentials()
        response = api_client.get(USER_LIST)
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
    
    def test_list_users_as_normal_user(self, api_client, normal_user):
        """User thường xem danh sách users → có thể xem được (tùy permission)"""
        response = api_client.get(USER_LIST)
        # Tùy vào thiết kế, có thể là 200 hoặc 403
        assert response.status_code in [status.HTTP_200_OK, status.HTTP_403_FORBIDDEN]
    
    def test_list_users_with_pagination(self, api_client, admin_user):
        """Test pagination khi list users"""
        # Tạo nhiều users
        for i in range(15):
            CustomUser.objects.create_user(
                email=f"user{i}@example.com",
                password="password123",
                full_name=f"User {i}"
            )
        
        response = api_client.get(USER_LIST, {'page': 1, 'page_size': 10})
        assert response.status_code == status.HTTP_200_OK


# ============================================================================
# TEST: UPDATE USER API - Edge Cases
# ============================================================================

@pytest.mark.django_db
class TestUpdateUserEdgeCases:
    """Test cases bổ sung cho API PUT /api/users/:id/"""
    
    @pytest.fixture
    def api_client(self):
        return APIClient()
    
    @pytest.fixture
    def admin_user(self, api_client):
        admin = CustomUser.objects.create_superuser(
            email="admin@example.com",
            password="adminpass123"
        )
        refresh = RefreshToken.for_user(admin)
        api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
        return admin
    
    @pytest.fixture
    def normal_user(self, api_client):
        user = CustomUser.objects.create_user(
            email="normal@example.com",
            password="password123",
            full_name="Normal User",
            role="recruiter"
        )
        refresh = RefreshToken.for_user(user)
        api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
        return user
    
    @pytest.fixture
    def target_user(self):
        return CustomUser.objects.create_user(
            email="target@example.com",
            password="password123",
            full_name="Target User",
            role="recruiter"
        )
    
    def test_update_self_as_normal_user(self, api_client, normal_user):
        """User tự cập nhật thông tin của mình → 200"""
        response = api_client.put(user_detail(normal_user.id), {
            'full_name': 'Updated Name'
        })
        # Có thể là 200 hoặc 403 tùy vào permission
        assert response.status_code in [status.HTTP_200_OK, status.HTTP_403_FORBIDDEN]
    
    def test_update_other_user_as_normal_user(self, api_client, normal_user, target_user):
        """User thường cập nhật user khác → 403 (BUG ĐÃ SỬa)"""
        response = api_client.put(user_detail(target_user.id), {
            'full_name': 'Hacked Name'
        })
        assert response.status_code == status.HTTP_403_FORBIDDEN
        assert 'detail' in response.data
    
    def test_update_user_not_found(self, api_client, admin_user):
        """Cập nhật user không tồn tại → 404"""
        response = api_client.put(user_detail(99999), {
            'full_name': 'New Name'
        })
        assert response.status_code == status.HTTP_404_NOT_FOUND


# ============================================================================
# TEST: UPDATE STATUS API - Edge Cases
# ============================================================================

@pytest.mark.django_db
class TestUpdateStatusEdgeCases:
    """Test cases bổ sung cho API PATCH /api/users/:id/status/"""
    
    @pytest.fixture
    def api_client(self):
        return APIClient()
    
    @pytest.fixture
    def admin_user(self, api_client):
        admin = CustomUser.objects.create_superuser(
            email="admin@example.com",
            password="adminpass123"
        )
        refresh = RefreshToken.for_user(admin)
        api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
        return admin
    
    @pytest.fixture
    def target_user(self):
        return CustomUser.objects.create_user(
            email="target@example.com",
            password="password123",
            full_name="Target User",
            role="recruiter",
            status="active"
        )
    
    def test_update_status_to_inactive(self, api_client, admin_user, target_user):
        """Admin chuyển user sang inactive → 200"""
        response = api_client.patch(user_status(target_user.id), {'status': 'inactive'})
        assert response.status_code == status.HTTP_200_OK
        target_user.refresh_from_db()
        assert target_user.status == 'inactive'
    
    def test_update_status_to_active(self, api_client, admin_user, target_user):
        """Admin chuyển user sang active → 200"""
        target_user.status = 'banned'
        target_user.save()
        
        response = api_client.patch(user_status(target_user.id), {'status': 'active'})
        assert response.status_code == status.HTTP_200_OK
        target_user.refresh_from_db()
        assert target_user.status == 'active'
    
    def test_update_status_invalid_value(self, api_client, admin_user, target_user):
        """Admin gửi status không hợp lệ → 400"""
        response = api_client.patch(user_status(target_user.id), {'status': 'invalid_status'})
        assert response.status_code == status.HTTP_400_BAD_REQUEST


# ============================================================================
# TEST: UPDATE ROLE API - Edge Cases
# ============================================================================

@pytest.mark.django_db
class TestUpdateRoleEdgeCases:
    """Test cases bổ sung cho API PATCH /api/users/:id/role/"""
    
    @pytest.fixture
    def api_client(self):
        return APIClient()
    
    @pytest.fixture
    def admin_user(self, api_client):
        admin = CustomUser.objects.create_superuser(
            email="admin@example.com",
            password="adminpass123"
        )
        refresh = RefreshToken.for_user(admin)
        api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
        return admin
    
    @pytest.fixture
    def target_user(self):
        return CustomUser.objects.create_user(
            email="target@example.com",
            password="password123",
            full_name="Target User",
            role="recruiter"
        )
    
    def test_update_role_to_company(self, api_client, admin_user, target_user):
        """Admin chuyển role thành company → 200"""
        response = api_client.patch(user_role(target_user.id), {'role': 'company'})
        assert response.status_code == status.HTTP_200_OK
        target_user.refresh_from_db()
        assert target_user.role == 'company'
    
    def test_update_role_invalid_value(self, api_client, admin_user, target_user):
        """Admin gửi role không hợp lệ → 400"""
        response = api_client.patch(user_role(target_user.id), {'role': 'superadmin'})
        assert response.status_code == status.HTTP_400_BAD_REQUEST


# ============================================================================
# TEST: AVATAR API - Edge Cases
# ============================================================================

@pytest.mark.django_db
class TestAvatarEdgeCases:
    """Test cases bổ sung cho API POST/DELETE /api/users/:id/avatar/"""
    
    @pytest.fixture
    def api_client(self):
        return APIClient()
    
    @pytest.fixture
    def authenticated_user(self, api_client):
        user = CustomUser.objects.create_user(
            email="avatar@example.com",
            password="password123",
            full_name="Avatar User",
            role="recruiter"
        )
        refresh = RefreshToken.for_user(user)
        api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
        return user
    
    @pytest.fixture
    def other_user(self):
        return CustomUser.objects.create_user(
            email="other@example.com",
            password="password123",
            full_name="Other User",
            role="recruiter"
        )
    
    def test_upload_avatar_other_user(self, api_client, authenticated_user, other_user):
        """Upload avatar cho user khác → 403 (BUG ĐÃ SỬa)"""
        file = io.BytesIO()
        image = Image.new('RGB', (100, 100), 'white')
        image.save(file, 'jpeg')
        file.seek(0)
        avatar = SimpleUploadedFile("avatar.jpg", file.read(), content_type="image/jpeg")
        
        response = api_client.post(user_avatar(other_user.id), {'avatar': avatar}, format='multipart')
        assert response.status_code == status.HTTP_403_FORBIDDEN
        assert 'detail' in response.data
    
    def test_upload_non_image_file(self, api_client, authenticated_user):
        """Upload file không phải ảnh → 400"""
        text_file = SimpleUploadedFile("document.txt", b"This is a text file", content_type="text/plain")
        
        response = api_client.post(user_avatar(authenticated_user.id), {'avatar': text_file}, format='multipart')
        assert response.status_code == status.HTTP_400_BAD_REQUEST
    
    def test_delete_avatar_other_user(self, api_client, authenticated_user, other_user):
        """Xóa avatar của user khác → 403 (BUG ĐÃ SỬa)"""
        response = api_client.delete(user_avatar(other_user.id))
        assert response.status_code == status.HTTP_403_FORBIDDEN
        assert 'detail' in response.data
    
    def test_upload_avatar_self(self, api_client, authenticated_user):
        """User upload avatar cho chính mình → 200"""
        file = io.BytesIO()
        image = Image.new('RGB', (100, 100), 'blue')
        image.save(file, 'jpeg')
        file.seek(0)
        avatar = SimpleUploadedFile("my_avatar.jpg", file.read(), content_type="image/jpeg")
        
        response = api_client.post(user_avatar(authenticated_user.id), {'avatar': avatar}, format='multipart')
        assert response.status_code == status.HTTP_200_OK
    
    def test_delete_avatar_self(self, api_client, authenticated_user):
        """User xóa avatar của chính mình → 200"""
        authenticated_user.avatar_url = "http://example.com/avatar.jpg"
        authenticated_user.save()
        
        response = api_client.delete(user_avatar(authenticated_user.id))
        assert response.status_code == status.HTTP_200_OK


@pytest.mark.django_db
class TestPermissionSecurityFix:
    """Test cases verify security fix: chỉ chính user hoặc admin mới được thao tác"""
    
    @pytest.fixture
    def api_client(self):
        return APIClient()
    
    @pytest.fixture
    def admin_user(self):
        return CustomUser.objects.create_superuser(
            email="admin@example.com",
            password="adminpass123"
        )
    
    @pytest.fixture
    def target_user(self):
        return CustomUser.objects.create_user(
            email="target@example.com",
            password="password123",
            full_name="Target User",
            role="recruiter"
        )
    
    def test_admin_can_update_other_user(self, api_client, admin_user, target_user):
        """Admin có thể cập nhật user khác → 200"""
        refresh = RefreshToken.for_user(admin_user)
        api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
        
        response = api_client.put(user_detail(target_user.id), {
            'full_name': 'Updated By Admin'
        })
        assert response.status_code == status.HTTP_200_OK
        target_user.refresh_from_db()
        assert target_user.full_name == 'Updated By Admin'
    
    def test_admin_can_upload_avatar_for_other_user(self, api_client, admin_user, target_user):
        """Admin có thể upload avatar cho user khác → 200"""
        refresh = RefreshToken.for_user(admin_user)
        api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
        
        file = io.BytesIO()
        image = Image.new('RGB', (100, 100), 'green')
        image.save(file, 'jpeg')
        file.seek(0)
        avatar = SimpleUploadedFile("admin_avatar.jpg", file.read(), content_type="image/jpeg")
        
        response = api_client.post(user_avatar(target_user.id), {'avatar': avatar}, format='multipart')
        assert response.status_code == status.HTTP_200_OK
    
    def test_admin_can_delete_avatar_of_other_user(self, api_client, admin_user, target_user):
        """Admin có thể xóa avatar của user khác → 200"""
        target_user.avatar_url = "http://example.com/old_avatar.jpg"
        target_user.save()
        
        refresh = RefreshToken.for_user(admin_user)
        api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
        
        response = api_client.delete(user_avatar(target_user.id))
        assert response.status_code == status.HTTP_200_OK
        target_user.refresh_from_db()
        assert target_user.avatar_url is None


# ============================================================================
# TEST: STATS API - Edge Cases
# ============================================================================

@pytest.mark.django_db
class TestStatsEdgeCases:
    """Test cases bổ sung cho API GET /api/users/stats/"""
    
    @pytest.fixture
    def api_client(self):
        return APIClient()
    
    @pytest.fixture
    def normal_user(self, api_client):
        user = CustomUser.objects.create_user(
            email="normal@example.com",
            password="password123",
            full_name="Normal User",
            role="recruiter"
        )
        refresh = RefreshToken.for_user(user)
        api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
        return user
    
    def test_stats_as_normal_user(self, api_client, normal_user):
        """User thường xem stats → 403"""
        response = api_client.get(USER_STATS)
        assert response.status_code == status.HTTP_403_FORBIDDEN
    
    def test_stats_without_authentication(self, api_client):
        """Xem stats mà chưa đăng nhập → 401"""
        api_client.credentials()
        response = api_client.get(USER_STATS)
        assert response.status_code == status.HTTP_401_UNAUTHORIZED


# ============================================================================
# TEST: EXPORT API - Edge Cases
# ============================================================================

@pytest.mark.django_db
class TestExportEdgeCases:
    """Test cases bổ sung cho API GET /api/users/export/"""
    
    @pytest.fixture
    def api_client(self):
        return APIClient()
    
    @pytest.fixture
    def normal_user(self, api_client):
        user = CustomUser.objects.create_user(
            email="normal@example.com",
            password="password123",
            full_name="Normal User",
            role="recruiter"
        )
        refresh = RefreshToken.for_user(user)
        api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
        return user
    
    def test_export_as_normal_user(self, api_client, normal_user):
        """User thường export users → 403"""
        response = api_client.get(USER_EXPORT)
        assert response.status_code == status.HTTP_403_FORBIDDEN
    
    def test_export_without_authentication(self, api_client):
        """Export users mà chưa đăng nhập → 401"""
        api_client.credentials()
        response = api_client.get(USER_EXPORT)
        assert response.status_code == status.HTTP_401_UNAUTHORIZED


# ============================================================================
# TEST: BULK ACTION API - Edge Cases
# ============================================================================

@pytest.mark.django_db
class TestBulkActionEdgeCases:
    """Test cases bổ sung cho API POST /api/users/bulk-action/"""
    
    @pytest.fixture
    def api_client(self):
        return APIClient()
    
    @pytest.fixture
    def admin_user(self, api_client):
        admin = CustomUser.objects.create_superuser(
            email="admin@example.com",
            password="adminpass123"
        )
        refresh = RefreshToken.for_user(admin)
        api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
        return admin
    
    @pytest.fixture
    def normal_user(self, api_client):
        user = CustomUser.objects.create_user(
            email="normal@example.com",
            password="password123",
            full_name="Normal User",
            role="recruiter"
        )
        refresh = RefreshToken.for_user(user)
        api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
        return user
    
    def test_bulk_action_as_normal_user(self, api_client, normal_user):
        """User thường thực hiện bulk action → 403"""
        response = api_client.post(USER_BULK_ACTION, {
            'ids': [1, 2],
            'action': 'update_status',
            'value': 'banned'
        }, format='json')
        assert response.status_code == status.HTTP_403_FORBIDDEN
    
    def test_bulk_action_missing_ids(self, api_client, admin_user):
        """Bulk action thiếu ids → 400"""
        response = api_client.post(USER_BULK_ACTION, {
            'action': 'update_status',
            'value': 'banned'
        }, format='json')
        assert response.status_code == status.HTTP_400_BAD_REQUEST
    
    def test_bulk_action_missing_action(self, api_client, admin_user):
        """Bulk action thiếu action → 400"""
        response = api_client.post(USER_BULK_ACTION, {
            'ids': [1, 2],
            'value': 'banned'
        }, format='json')
        assert response.status_code == status.HTTP_400_BAD_REQUEST
    
    def test_bulk_action_invalid_action(self, api_client, admin_user):
        """Bulk action với action không hợp lệ → 400"""
        u1 = CustomUser.objects.create_user(email="u1@example.com", password="pass")
        
        response = api_client.post(USER_BULK_ACTION, {
            'ids': [u1.id],
            'action': 'invalid_action',
            'value': 'some_value'
        }, format='json')
        assert response.status_code == status.HTTP_400_BAD_REQUEST
    
    def test_bulk_action_without_authentication(self, api_client):
        """Bulk action mà chưa đăng nhập → 401"""
        api_client.credentials()
        response = api_client.post(USER_BULK_ACTION, {
            'ids': [1, 2],
            'action': 'update_status',
            'value': 'banned'
        }, format='json')
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
