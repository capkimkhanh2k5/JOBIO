import pytest
import secrets
from datetime import timedelta
from rest_framework import status
from django.utils import timezone
from apps.core.users.models import CustomUser


# ============================================================================
# URL PATHS (sau refactoring sang ViewSet pattern)
# ============================================================================
AUTH_CHECK_EMAIL = '/api/users/auth/check-email/'
AUTH_FORGOT_PASSWORD = '/api/users/auth/forgot-password/'
AUTH_RESET_PASSWORD = '/api/users/auth/reset-password/'
AUTH_VERIFY_EMAIL = '/api/users/auth/verify-email/'
AUTH_RESEND_VERIFICATION = '/api/users/auth/resend-verification/'
AUTH_CHANGE_PASSWORD = '/api/users/auth/change-password/'


@pytest.mark.django_db
class TestNewAuthAPIs:
    
    def test_check_email_exists(self, api_client, user):
        response = api_client.post(AUTH_CHECK_EMAIL, {'email': user.email})
        assert response.status_code == status.HTTP_200_OK
        assert response.data['exists'] is True
    
    def test_check_email_not_exists(self, api_client):
        response = api_client.post(AUTH_CHECK_EMAIL, {'email': 'nonexist@example.com'})
        assert response.status_code == status.HTTP_200_OK
        assert response.data['exists'] is False
    
    def test_forgot_password_success(self, api_client, user):
        response = api_client.post(AUTH_FORGOT_PASSWORD, {'email': user.email})
        assert response.status_code == status.HTTP_200_OK
        user.refresh_from_db()
        assert user.password_reset_token is not None
    
    def test_reset_password_success(self, api_client, user):
        token = secrets.token_urlsafe(32)
        user.password_reset_token = token
        user.password_reset_expires = timezone.now() + timedelta(minutes=5)
        user.save()
        
        data = {
            'token': token,
            'new_password': 'newpass123',
            'new_password_confirm': 'newpass123'
        }
        response = api_client.post(AUTH_RESET_PASSWORD, data)
        assert response.status_code == status.HTTP_200_OK
        user.refresh_from_db()
        assert user.check_password('newpass123')
    
    def test_verify_email_success(self, api_client, user):
        token = "verify123"
        user.email_verification_token = token
        user.email_verified = False
        user.save()
        
        response = api_client.post(AUTH_VERIFY_EMAIL, {'email_verification_token': token})
        assert response.status_code == status.HTTP_200_OK
        user.refresh_from_db()
        assert user.email_verified is True
    
    def test_resend_verification_success(self, api_client, user):
        user.email_verified = False
        user.save()
        response = api_client.post(AUTH_RESEND_VERIFICATION, {'email': user.email})
        assert response.status_code == status.HTTP_200_OK
        user.refresh_from_db()
        assert user.email_verification_token is not None
    
    def test_change_password_success(self, api_client, user):
        user.set_password('oldpass')
        user.save()
        api_client.force_authenticate(user=user)
        
        data = {
            'old_password': 'oldpass',
            'new_password': 'newpass123',
            'new_password_confirm': 'newpass123'
        }
        response = api_client.post(AUTH_CHANGE_PASSWORD, data)
        assert response.status_code == status.HTTP_200_OK
        user.refresh_from_db()
        assert user.check_password('newpass123')
