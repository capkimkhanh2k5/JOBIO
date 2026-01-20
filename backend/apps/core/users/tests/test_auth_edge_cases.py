"""
Test cases bổ sung cho Authentication APIs - Edge cases và Error handling
Bổ sung các test còn thiếu theo báo cáo phân tích

File: test_auth_edge_cases.py
Module 1: Authentication & User Management
"""
import pytest
import secrets
import pyotp
from datetime import timedelta
from unittest.mock import patch
from rest_framework import status
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken
from django.utils import timezone

from apps.core.users.models import CustomUser


# ============================================================================
# URL PATHS
# ============================================================================
AUTH_LOGIN = '/api/users/auth/login/'
AUTH_LOGOUT = '/api/users/auth/logout/'
AUTH_REGISTER = '/api/users/auth/register/'
AUTH_REFRESH_TOKEN = '/api/users/auth/refresh-token/'
AUTH_VERIFY_EMAIL = '/api/users/auth/verify-email/'
AUTH_RESEND_VERIFICATION = '/api/users/auth/resend-verification/'
AUTH_FORGOT_PASSWORD = '/api/users/auth/forgot-password/'
AUTH_RESET_PASSWORD = '/api/users/auth/reset-password/'
AUTH_CHANGE_PASSWORD = '/api/users/auth/change-password/'
AUTH_VERIFY_2FA = '/api/users/auth/verify-2fa/'

def auth_social_login(provider):
    return f'/api/users/auth/social/{provider}/'


# ============================================================================
# TEST: REFRESH TOKEN API - Edge Cases
# ============================================================================

@pytest.mark.django_db
class TestRefreshTokenEdgeCases:
    """Test cases bổ sung cho API POST /api/users/auth/refresh-token/"""
    
    @pytest.fixture
    def api_client(self):
        return APIClient()
    
    @pytest.fixture
    def user_with_tokens(self, api_client):
        """Fixture tạo user và JWT tokens"""
        user = CustomUser.objects.create_user(
            email="refresh@example.com",
            password="password123",
            full_name="Refresh User",
            role="recruiter",
            status="active"
        )
        refresh = RefreshToken.for_user(user)
        return {
            'user': user,
            'refresh_token': str(refresh),
            'access_token': str(refresh.access_token)
        }
    
    def test_refresh_token_with_invalid_token(self, api_client):
        """Test refresh với token không hợp lệ → 401"""
        response = api_client.post(AUTH_REFRESH_TOKEN, {'refresh': 'invalid_token_here'})
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
    
    def test_refresh_token_with_empty_token(self, api_client):
        """Test refresh với token rỗng → 400"""
        response = api_client.post(AUTH_REFRESH_TOKEN, {'refresh': ''})
        assert response.status_code == status.HTTP_400_BAD_REQUEST
    
    def test_refresh_token_without_token(self, api_client):
        """Test refresh không gửi token → 400"""
        response = api_client.post(AUTH_REFRESH_TOKEN, {})
        assert response.status_code == status.HTTP_400_BAD_REQUEST
    
    def test_refresh_token_with_blacklisted_token(self, api_client, user_with_tokens):
        """Test refresh với token đã bị blacklist → 401"""
        refresh_token = user_with_tokens['refresh_token']
        
        # Blacklist token
        api_client.force_authenticate(user=user_with_tokens['user'])
        api_client.post(AUTH_LOGOUT, {'refresh_token': refresh_token})
        
        # Try to refresh
        response = api_client.post(AUTH_REFRESH_TOKEN, {'refresh': refresh_token})
        assert response.status_code == status.HTTP_401_UNAUTHORIZED


# ============================================================================
# TEST: VERIFY EMAIL API - Edge Cases
# ============================================================================

@pytest.mark.django_db
class TestVerifyEmailEdgeCases:
    """Test cases bổ sung cho API POST /api/users/auth/verify-email/"""
    
    @pytest.fixture
    def api_client(self):
        return APIClient()
    
    @pytest.fixture
    def unverified_user(self):
        """Fixture tạo user chưa verify email"""
        user = CustomUser.objects.create_user(
            email="unverified@example.com",
            password="password123",
            full_name="Unverified User",
            role="recruiter"
        )
        user.email_verified = False
        user.email_verification_token = "valid_verify_token_123"
        user.save()
        return user
    
    def test_verify_email_with_invalid_token(self, api_client):
        """Test verify với token không hợp lệ → 400"""
        response = api_client.post(AUTH_VERIFY_EMAIL, {
            'email_verification_token': 'invalid_token_not_exist'
        })
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'detail' in response.data
    
    def test_verify_email_with_empty_token(self, api_client):
        """Test verify với token rỗng → 400"""
        response = api_client.post(AUTH_VERIFY_EMAIL, {
            'email_verification_token': ''
        })
        assert response.status_code == status.HTTP_400_BAD_REQUEST
    
    def test_verify_email_without_token(self, api_client):
        """Test verify không gửi token → 400"""
        response = api_client.post(AUTH_VERIFY_EMAIL, {})
        assert response.status_code == status.HTTP_400_BAD_REQUEST
    
    def test_verify_email_already_verified(self, api_client, unverified_user):
        """Test verify email đã được xác thực → token bị xóa sau lần verify đầu"""
        token = unverified_user.email_verification_token
        
        # Verify lần 1 - thành công
        response1 = api_client.post(AUTH_VERIFY_EMAIL, {'email_verification_token': token})
        assert response1.status_code == status.HTTP_200_OK
        
        # Verify lần 2 - token đã bị xóa
        response2 = api_client.post(AUTH_VERIFY_EMAIL, {'email_verification_token': token})
        assert response2.status_code == status.HTTP_400_BAD_REQUEST


# ============================================================================
# TEST: RESEND VERIFICATION API - Edge Cases
# ============================================================================

@pytest.mark.django_db
class TestResendVerificationEdgeCases:
    """Test cases bổ sung cho API POST /api/users/auth/resend-verification/"""
    
    @pytest.fixture
    def api_client(self):
        return APIClient()
    
    @pytest.fixture
    def verified_user(self):
        """Fixture tạo user đã verify email"""
        user = CustomUser.objects.create_user(
            email="verified@example.com",
            password="password123",
            full_name="Verified User",
            role="recruiter"
        )
        user.email_verified = True
        user.save()
        return user
    
    def test_resend_verification_email_not_exist(self, api_client):
        """Test resend với email không tồn tại → 400"""
        response = api_client.post(AUTH_RESEND_VERIFICATION, {
            'email': 'notexist@example.com'
        })
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'detail' in response.data
    
    def test_resend_verification_email_already_verified(self, api_client, verified_user):
        """Test resend với email đã được xác thực → 400"""
        response = api_client.post(AUTH_RESEND_VERIFICATION, {
            'email': verified_user.email
        })
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'detail' in response.data


# ============================================================================
# TEST: FORGOT PASSWORD API - Edge Cases
# ============================================================================

@pytest.mark.django_db
class TestForgotPasswordEdgeCases:
    """Test cases bổ sung cho API POST /api/users/auth/forgot-password/"""
    
    @pytest.fixture
    def api_client(self):
        return APIClient()
    
    def test_forgot_password_email_not_exist(self, api_client):
        """Test forgot password với email không tồn tại → 400"""
        response = api_client.post(AUTH_FORGOT_PASSWORD, {
            'email': 'notexist@example.com'
        })
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'detail' in response.data
    
    def test_forgot_password_invalid_email_format(self, api_client):
        """Test forgot password với email sai format → 400"""
        response = api_client.post(AUTH_FORGOT_PASSWORD, {
            'email': 'invalid-email-format'
        })
        assert response.status_code == status.HTTP_400_BAD_REQUEST


# ============================================================================
# TEST: RESET PASSWORD API - Edge Cases
# ============================================================================

@pytest.mark.django_db
class TestResetPasswordEdgeCases:
    """Test cases bổ sung cho API POST /api/users/auth/reset-password/"""
    
    @pytest.fixture
    def api_client(self):
        return APIClient()
    
    @pytest.fixture
    def user_with_reset_token(self):
        """Fixture tạo user có reset token"""
        user = CustomUser.objects.create_user(
            email="reset@example.com",
            password="oldpassword123",
            full_name="Reset User",
            role="recruiter"
        )
        token = secrets.token_urlsafe(32)
        user.password_reset_token = token
        user.password_reset_expires = timezone.now() + timedelta(minutes=5)
        user.save()
        return {'user': user, 'token': token}
    
    @pytest.fixture
    def user_with_expired_token(self):
        """Fixture tạo user có reset token hết hạn"""
        user = CustomUser.objects.create_user(
            email="expired@example.com",
            password="oldpassword123",
            full_name="Expired User",
            role="recruiter"
        )
        token = secrets.token_urlsafe(32)
        user.password_reset_token = token
        user.password_reset_expires = timezone.now() - timedelta(minutes=1)  # Đã hết hạn
        user.save()
        return {'user': user, 'token': token}
    
    def test_reset_password_invalid_token(self, api_client):
        """Test reset với token không hợp lệ → 400"""
        response = api_client.post(AUTH_RESET_PASSWORD, {
            'token': 'invalid_token_not_exist',
            'new_password': 'newpassword123',
            'new_password_confirm': 'newpassword123'
        })
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'detail' in response.data
    
    def test_reset_password_expired_token(self, api_client, user_with_expired_token):
        """Test reset với token đã hết hạn → 400"""
        response = api_client.post(AUTH_RESET_PASSWORD, {
            'token': user_with_expired_token['token'],
            'new_password': 'newpassword123',
            'new_password_confirm': 'newpassword123'
        })
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'detail' in response.data
    
    def test_reset_password_missing_token(self, api_client):
        """Test reset thiếu token → 400"""
        response = api_client.post(AUTH_RESET_PASSWORD, {
            'new_password': 'newpassword123',
            'new_password_confirm': 'newpassword123'
        })
        assert response.status_code == status.HTTP_400_BAD_REQUEST


# ============================================================================
# TEST: CHANGE PASSWORD API - Edge Cases
# ============================================================================

@pytest.mark.django_db
class TestChangePasswordEdgeCases:
    """Test cases bổ sung cho API POST /api/users/auth/change-password/"""
    
    @pytest.fixture
    def api_client(self):
        return APIClient()
    
    @pytest.fixture
    def authenticated_user(self, api_client):
        """Fixture tạo user đã đăng nhập"""
        user = CustomUser.objects.create_user(
            email="changepass@example.com",
            password="oldpassword123",
            full_name="Change Pass User",
            role="recruiter",
            status="active"
        )
        refresh = RefreshToken.for_user(user)
        api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
        return user
    
    def test_change_password_wrong_old_password(self, api_client, authenticated_user):
        """Test change password với old_password sai → 400"""
        response = api_client.post(AUTH_CHANGE_PASSWORD, {
            'old_password': 'wrongoldpassword',
            'new_password': 'newpassword123',
            'new_password_confirm': 'newpassword123'
        })
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'detail' in response.data
    
    def test_change_password_without_authentication(self, api_client):
        """Test change password mà chưa đăng nhập → 401"""
        # Clear credentials
        api_client.credentials()
        
        response = api_client.post(AUTH_CHANGE_PASSWORD, {
            'old_password': 'oldpassword123',
            'new_password': 'newpassword123',
            'new_password_confirm': 'newpassword123'
        })
        assert response.status_code == status.HTTP_401_UNAUTHORIZED


# ============================================================================
# TEST: SOCIAL LOGIN API - Edge Cases
# ============================================================================

@pytest.mark.django_db
class TestSocialLoginEdgeCases:
    """Test cases bổ sung cho Social Login APIs"""
    
    @pytest.fixture
    def api_client(self):
        return APIClient()
    
    @patch('apps.core.users.services.auth.requests.get')
    def test_social_login_google_invalid_token(self, mock_get, api_client):
        """Test Google login với token không hợp lệ → 400"""
        mock_get.return_value.status_code = 401  # Google trả về lỗi
        
        response = api_client.post(auth_social_login('google'), {
            'access_token': 'invalid_google_token',
            'provider': 'google',
            'email': 'test@example.com',
            'full_name': 'Test User'
        })
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'detail' in response.data
    
    @patch('apps.core.users.services.auth.requests.get')
    def test_social_login_facebook_invalid_token(self, mock_get, api_client):
        """Test Facebook login với token không hợp lệ → 400"""
        mock_get.return_value.status_code = 401  # Facebook trả về lỗi
        
        response = api_client.post(auth_social_login('facebook'), {
            'access_token': 'invalid_fb_token',
            'provider': 'facebook',
            'email': 'test@example.com',
            'full_name': 'Test User'
        })
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'detail' in response.data
    
    @patch('apps.core.users.services.auth.requests.get')
    def test_social_login_linkedin_invalid_token(self, mock_get, api_client):
        """Test LinkedIn login với token không hợp lệ → 400"""
        mock_get.return_value.status_code = 401  # LinkedIn trả về lỗi
        
        response = api_client.post(auth_social_login('linkedin'), {
            'access_token': 'invalid_linkedin_token',
            'provider': 'linkedin',
            'email': 'test@example.com',
            'full_name': 'Test User'
        })
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'detail' in response.data
    
    def test_social_login_unsupported_provider(self, api_client):
        """Test social login với provider không hỗ trợ → 400"""
        response = api_client.post(auth_social_login('twitter'), {
            'access_token': 'some_token',
            'provider': 'twitter',
            'email': 'test@example.com',
            'full_name': 'Test User'
        })
        # Có thể là 400 hoặc 404 tùy vào URL pattern
        assert response.status_code in [status.HTTP_400_BAD_REQUEST, status.HTTP_404_NOT_FOUND]
    
    @patch('apps.core.users.services.auth.requests.get')
    def test_social_login_existing_user(self, mock_get, api_client):
        """Test social login với user đã tồn tại → login thành công"""
        # Tạo user trước
        existing_user = CustomUser.objects.create_user(
            email="existing@example.com",
            password="password123",
            full_name="Existing User",
            role="recruiter"
        )
        
        mock_get.return_value.status_code = 200
        mock_get.return_value.json.return_value = {
            'email': 'existing@example.com',
            'name': 'Existing User'
        }
        
        response = api_client.post(auth_social_login('google'), {
            'access_token': 'valid_google_token',
            'provider': 'google',
            'email': 'existing@example.com',
            'full_name': 'Existing User'
        })
        assert response.status_code == status.HTTP_200_OK
        assert 'access_token' in response.data


# ============================================================================
# TEST: 2FA API - Edge Cases
# ============================================================================

@pytest.mark.django_db
class TestVerify2FAEdgeCases:
    """Test cases bổ sung cho API POST /api/users/auth/verify-2fa/"""
    
    @pytest.fixture
    def api_client(self):
        return APIClient()
    
    @pytest.fixture
    def user_without_2fa(self, api_client):
        """Fixture tạo user chưa kích hoạt 2FA"""
        user = CustomUser.objects.create_user(
            email="no2fa@example.com",
            password="password123",
            full_name="No 2FA User",
            role="recruiter",
            status="active"
        )
        user.two_factor_enabled = False
        user.save()
        refresh = RefreshToken.for_user(user)
        api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
        return user
    
    @pytest.fixture
    def user_with_2fa(self, api_client):
        """Fixture tạo user đã kích hoạt 2FA"""
        user = CustomUser.objects.create_user(
            email="with2fa@example.com",
            password="password123",
            full_name="With 2FA User",
            role="recruiter",
            status="active"
        )
        secret = pyotp.random_base32()
        user.two_factor_secret = secret
        user.two_factor_enabled = True
        user.save()
        refresh = RefreshToken.for_user(user)
        api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
        return {'user': user, 'secret': secret}
    
    def test_verify_2fa_not_enabled(self, api_client, user_without_2fa):
        """Test verify 2FA khi chưa kích hoạt 2FA → 400"""
        response = api_client.post(AUTH_VERIFY_2FA, {'code': '123456'})
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'detail' in response.data
    
    def test_verify_2fa_wrong_code(self, api_client, user_with_2fa):
        """Test verify 2FA với mã sai → 400"""
        response = api_client.post(AUTH_VERIFY_2FA, {'code': '000000'})
        assert response.status_code == status.HTTP_400_BAD_REQUEST
    
    def test_verify_2fa_without_authentication(self, api_client):
        """Test verify 2FA mà chưa đăng nhập → 401"""
        api_client.credentials()  # Clear auth
        response = api_client.post(AUTH_VERIFY_2FA, {'code': '123456'})
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
