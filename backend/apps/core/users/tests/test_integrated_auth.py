import pytest
import secrets
import pyotp
from unittest.mock import patch
from datetime import timedelta
from rest_framework import status
from django.utils import timezone
from apps.core.users.models import CustomUser

AUTH_LOGIN = '/api/users/auth/login/'
AUTH_LOGOUT = '/api/users/auth/logout/'
AUTH_REGISTER = '/api/users/auth/register/'
AUTH_ME = '/api/users/auth/me/'
AUTH_CHECK_EMAIL = '/api/users/auth/check-email/'
AUTH_FORGOT_PASSWORD = '/api/users/auth/forgot-password/'
AUTH_RESET_PASSWORD = '/api/users/auth/reset-password/'
AUTH_VERIFY_EMAIL = '/api/users/auth/verify-email/'
AUTH_RESEND_VERIFICATION = '/api/users/auth/resend-verification/'
AUTH_CHANGE_PASSWORD = '/api/users/auth/change-password/'
AUTH_VERIFY_2FA = '/api/users/auth/verify-2fa/'
AUTH_TOKEN_REFRESH = '/api/users/auth/refresh-token/'

def auth_social_login(provider):
    return f'/api/users/auth/social/{provider}/'


@pytest.mark.django_db
class TestIntegratedAuthAPIs:
    
    
    def test_register_success(self, api_client):
        data = {
            'email': 'newuser@example.com',
            'password': 'password123',
            'password_confirm': 'password123',
            'full_name': 'New User',
            'role': 'recruiter'
        }
        response = api_client.post(AUTH_REGISTER, data)
        assert response.status_code == status.HTTP_201_CREATED
        assert 'access_token' in response.data
        assert 'refresh_token' in response.data
        assert response.data['user']['email'] == 'newuser@example.com'

    def test_login_success(self, api_client, user):
        user.set_password('password123')
        user.save()
        
        data = {
            'email': user.email,
            'password': 'password123'
        }
        response = api_client.post(AUTH_LOGIN, data)
        assert response.status_code == status.HTTP_200_OK
        assert 'access_token' in response.data

    def test_auth_me_success(self, api_client, user):
        api_client.force_authenticate(user=user)
        response = api_client.get(AUTH_ME)
        assert response.status_code == status.HTTP_200_OK
        assert response.data['email'] == user.email

    def test_logout_success(self, api_client, user):
        user.set_password('password123')
        user.save()
        
        # Login first to get refresh token
        login_resp = api_client.post(AUTH_LOGIN, {'email': user.email, 'password': 'password123'})
        refresh_token = login_resp.data['refresh_token']
        
        # Logout
        api_client.force_authenticate(user=user)
        response = api_client.post(AUTH_LOGOUT, {'refresh_token': refresh_token})
        assert response.status_code == status.HTTP_200_OK

    def test_refresh_token_success(self, api_client, user):
        user.set_password('password123')
        user.save()
        login_resp = api_client.post(AUTH_LOGIN, {'email': user.email, 'password': 'password123'})
        refresh_token = login_resp.data['refresh_token']
        
        response = api_client.post(AUTH_TOKEN_REFRESH, {'refresh': refresh_token})
        assert response.status_code == status.HTTP_200_OK
        assert 'access' in response.data

    # --- 2. Email & Password Flows ---

    def test_check_email_exists(self, api_client, user):
        response = api_client.post(AUTH_CHECK_EMAIL, {'email': user.email})
        assert response.status_code == status.HTTP_200_OK
        assert response.data['exists'] is True

    def test_check_email_not_exists(self, api_client):
        response = api_client.post(AUTH_CHECK_EMAIL, {'email': 'nobody@example.com'})
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
        user.set_password('oldpass123')
        user.save()
        api_client.force_authenticate(user=user)
        
        data = {
            'old_password': 'oldpass123',
            'new_password': 'newpass123',
            'new_password_confirm': 'newpass123'
        }
        response = api_client.post(AUTH_CHANGE_PASSWORD, data)
        assert response.status_code == status.HTTP_200_OK
        user.refresh_from_db()
        assert user.check_password('newpass123')

    # --- 3. Social Login (Mocked) ---

    @patch('apps.core.users.services.auth.requests.get')
    def test_social_login_google_success(self, mock_get, api_client):
        mock_get.return_value.status_code = 200
        mock_get.return_value.json.return_value = {
            'email': 'googleuser@example.com',
            'name': 'Google User',
            'picture': 'http://avatar.url'
        }
        
        data = {
            'access_token': 'fake_google_token',
            'provider': 'google',
            'email': 'googleuser@example.com',
            'full_name': 'Google User'
        }
        response = api_client.post(auth_social_login('google'), data)
        assert response.status_code == status.HTTP_200_OK
        assert response.data['user']['email'] == 'googleuser@example.com'
        assert CustomUser.objects.filter(email='googleuser@example.com').exists()

    @patch('apps.core.users.services.auth.requests.get')
    def test_social_login_facebook_success(self, mock_get, api_client):
        mock_get.return_value.status_code = 200
        mock_get.return_value.json.return_value = {
            'id': '123',
            'name': 'FB User',
            'email': 'fbuser@example.com'
        }
        
        data = {
            'access_token': 'fake_fb_token',
            'provider': 'facebook',
            'email': 'fbuser@example.com',
            'full_name': 'FB User'
        }
        response = api_client.post(auth_social_login('facebook'), data)
        assert response.status_code == status.HTTP_200_OK
        assert response.data['user']['email'] == 'fbuser@example.com'

    @patch('apps.core.users.services.auth.requests.get')
    def test_social_login_linkedin_success(self, mock_get, api_client):
        mock_get.return_value.status_code = 200
        mock_get.return_value.json.return_value = {
            'localizedFirstName': 'LinkedIn',
            'localizedLastName': 'User',
            'id': 'linkedin123',
        }
        
        data = {
            'access_token': 'fake_linkedin_token',
            'provider': 'linkedin',
            'email': 'linkedinuser@example.com',
            'full_name': 'LinkedIn User'
        }
        response = api_client.post(auth_social_login('linkedin'), data)
        assert response.status_code == status.HTTP_200_OK
        assert response.data['user']['email'] == 'linkedinuser@example.com'

    # --- 4. 2FA Verification ---

    def test_verify_2fa_success(self, api_client, user):
        secret = pyotp.random_base32()
        user.two_factor_secret = secret
        user.two_factor_enabled = True
        user.save()
        
        totp = pyotp.TOTP(secret)
        current_code = totp.now()
        
        api_client.force_authenticate(user=user)
        response = api_client.post(AUTH_VERIFY_2FA, {'code': current_code})
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data is True

    def test_verify_2fa_failure(self, api_client, user):
        secret = pyotp.random_base32()
        user.two_factor_secret = secret
        user.two_factor_enabled = True
        user.save()
        
        api_client.force_authenticate(user=user)
        response = api_client.post(AUTH_VERIFY_2FA, {'code': '000000'})
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
