"""
User Authentication Views Tests - Django TestCase Version
"""

from unittest.mock import patch

from django.core.cache import cache
from rest_framework.test import APITestCase
from rest_framework import status
from django.conf import settings
from rest_framework_simplejwt.tokens import RefreshToken
import pyotp

from apps.candidate.recruiters.models import Recruiter
from apps.core.users.models import CustomUser
from apps.core.users.services.auth import (
    LOGIN_ACCOUNT_LOCKOUT_ERROR,
    LOGIN_ACCOUNT_LOCKOUT_MAX_ATTEMPTS,
    PASSWORD_RESET_REQUEST_LIMIT_ERROR,
    PASSWORD_RESET_REQUEST_MAX_ATTEMPTS,
)


# ============================================================================
# TEST: LOGIN API
# ============================================================================


class TestLoginAPI(APITestCase):
    """Test cases for API POST /api/users/auth/login/"""

    @classmethod
    def setUpTestData(cls):
        cls.active_user = CustomUser.objects.create_user(
            email="test@example.com",
            password="password123",
            full_name="Test User",
            role="candidate",
            status="active",
        )
        cls.recruiter = Recruiter.objects.create(user=cls.active_user)

    def setUp(self):
        cache.clear()

    def tearDown(self):
        cache.clear()

    def test_login_success(self):
        """Test successful login"""
        response = self.client.post(
            "/api/users/auth/login/",
            {"email": "test@example.com", "password": "password123"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("access_token", response.data)
        self.assertIn("refresh_token", response.data)
        self.assertIn("user", response.data)
        self.assertEqual(response.data["user"]["email"], "test@example.com")
        self.assertEqual(response.data["user"]["candidate_id"], self.recruiter.id)
        self.assertEqual(response.data["user"]["recruiter_id"], self.recruiter.id)

        refresh = RefreshToken(response.data["refresh_token"])
        lifetime_seconds = refresh["exp"] - refresh["iat"]
        self.assertEqual(
            lifetime_seconds,
            int(settings.SIMPLE_JWT["REFRESH_TOKEN_LIFETIME"].total_seconds()),
        )

    def test_login_remember_me_extends_refresh_token_lifetime(self):
        """Test remember_me issues a longer refresh token"""
        response = self.client.post(
            "/api/users/auth/login/",
            {
                "email": "test@example.com",
                "password": "password123",
                "remember_me": True,
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        refresh = RefreshToken(response.data["refresh_token"])
        lifetime_seconds = refresh["exp"] - refresh["iat"]

        self.assertEqual(
            lifetime_seconds,
            int(settings.REMEMBER_ME_REFRESH_TOKEN_LIFETIME.total_seconds()),
        )

    def test_login_wrong_email(self):
        """Test login with non-existent email"""
        response = self.client.post(
            "/api/users/auth/login/",
            {"email": "notexist@example.com", "password": "password123"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertIn("detail", response.data)

    def test_login_wrong_password(self):
        """Test login with wrong password"""
        response = self.client.post(
            "/api/users/auth/login/",
            {"email": "test@example.com", "password": "wrongpassword"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertIn("detail", response.data)

    @patch("apps.core.users.services.auth.EmailService.send_email", return_value=True)
    def test_login_account_locks_after_too_many_bad_passwords(self, mock_send_email):
        """Repeated wrong passwords lock the target account, not only the caller IP."""
        for _ in range(LOGIN_ACCOUNT_LOCKOUT_MAX_ATTEMPTS - 1):
            response = self.client.post(
                "/api/users/auth/login/",
                {"email": "test@example.com", "password": "wrongpassword"},
                format="json",
            )
            self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
            self.assertEqual(response.data["detail"], "Email hoặc mật khẩu không đúng")

        locked_response = self.client.post(
            "/api/users/auth/login/",
            {"email": "test@example.com", "password": "wrongpassword"},
            format="json",
        )
        self.assertEqual(locked_response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertEqual(locked_response.data["detail"], LOGIN_ACCOUNT_LOCKOUT_ERROR)
        mock_send_email.assert_called_once()

        correct_password_response = self.client.post(
            "/api/users/auth/login/",
            {"email": "test@example.com", "password": "password123"},
            format="json",
        )
        self.assertEqual(
            correct_password_response.status_code, status.HTTP_401_UNAUTHORIZED
        )
        self.assertEqual(
            correct_password_response.data["detail"], LOGIN_ACCOUNT_LOCKOUT_ERROR
        )

    def test_login_invalid_email_format(self):
        """Test login with invalid email format"""
        response = self.client.post(
            "/api/users/auth/login/",
            {"email": "invalid-email", "password": "password123"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_login_missing_password(self):
        """Test login without password"""
        response = self.client.post(
            "/api/users/auth/login/", {"email": "test@example.com"}, format="json"
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_login_empty_body(self):
        """Test login with empty body"""
        response = self.client.post("/api/users/auth/login/", {}, format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_login_with_2fa_requires_challenge_before_tokens(self):
        """2FA-enabled accounts must not receive JWTs until the code is verified."""
        secret = pyotp.random_base32()
        self.active_user.two_factor_secret = secret
        self.active_user.two_factor_enabled = True
        self.active_user.save(update_fields=["two_factor_secret", "two_factor_enabled"])

        response = self.client.post(
            "/api/users/auth/login/",
            {"email": "test@example.com", "password": "password123"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["requires_2fa"])
        self.assertIn("challenge_id", response.data)
        self.assertNotIn("access_token", response.data)
        self.assertNotIn("refresh_token", response.data)

        verify_response = self.client.post(
            "/api/users/auth/verify-2fa/",
            {
                "challenge_id": response.data["challenge_id"],
                "code": pyotp.TOTP(secret).now(),
            },
            format="json",
        )

        self.assertEqual(verify_response.status_code, status.HTTP_200_OK)
        self.assertIn("access_token", verify_response.data)
        self.assertIn("refresh_token", verify_response.data)

    def test_login_2fa_challenge_locks_after_too_many_bad_codes(self):
        """A login 2FA challenge must not allow unlimited OTP guesses."""
        secret = pyotp.random_base32()
        self.active_user.two_factor_secret = secret
        self.active_user.two_factor_enabled = True
        self.active_user.save(update_fields=["two_factor_secret", "two_factor_enabled"])

        login_response = self.client.post(
            "/api/users/auth/login/",
            {"email": "test@example.com", "password": "password123"},
            format="json",
        )
        challenge_id = login_response.data["challenge_id"]

        for _ in range(5):
            response = self.client.post(
                "/api/users/auth/verify-2fa/",
                {"challenge_id": challenge_id, "code": "000000"},
                format="json",
            )
            self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
            self.assertEqual(response.data["detail"], "2FA code is incorrect!")

        locked_response = self.client.post(
            "/api/users/auth/verify-2fa/",
            {"challenge_id": challenge_id, "code": "000000"},
            format="json",
        )
        self.assertEqual(locked_response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(
            locked_response.data["detail"],
            "Quá nhiều lần thử. Vui lòng yêu cầu mã mới.",
        )

        correct_after_lock = self.client.post(
            "/api/users/auth/verify-2fa/",
            {"challenge_id": challenge_id, "code": pyotp.TOTP(secret).now()},
            format="json",
        )
        self.assertEqual(correct_after_lock.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(
            correct_after_lock.data["detail"], "Phiên xác thực 2FA đã hết hạn."
        )


class TestTwoFactorSettingsAPI(APITestCase):
    """Test cases for authenticated 2FA management endpoints."""

    def setUp(self):
        self.user = CustomUser.objects.create_user(
            email="twofactor@example.com",
            password="password123",
            full_name="Two Factor",
            role="candidate",
            status="active",
        )
        self.client.force_authenticate(user=self.user)

    def test_enable_2fa_requires_current_password(self):
        response = self.client.post("/api/users/auth/2fa/enable/", {}, format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.user.refresh_from_db()
        self.assertFalse(self.user.two_factor_enabled)

    def test_enable_2fa_rejects_wrong_current_password(self):
        response = self.client.post(
            "/api/users/auth/2fa/enable/",
            {"current_password": "wrong-password"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data["detail"], "Mật khẩu hiện tại không đúng.")
        self.user.refresh_from_db()
        self.assertFalse(self.user.two_factor_enabled)

    def test_enable_2fa_success_with_current_password(self):
        response = self.client.post(
            "/api/users/auth/2fa/enable/",
            {"current_password": "password123"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["is_enabled"])
        self.assertIn("secret", response.data)
        self.assertIn("provisioning_uri", response.data)
        self.user.refresh_from_db()
        self.assertTrue(self.user.two_factor_enabled)

    def test_disable_2fa_requires_current_password(self):
        secret = pyotp.random_base32()
        self.user.two_factor_secret = secret
        self.user.two_factor_enabled = True
        self.user.save(update_fields=["two_factor_secret", "two_factor_enabled"])

        response = self.client.post(
            "/api/users/auth/2fa/disable/",
            {"code": pyotp.TOTP(secret).now()},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.user.refresh_from_db()
        self.assertTrue(self.user.two_factor_enabled)

    def test_disable_2fa_rejects_wrong_current_password(self):
        secret = pyotp.random_base32()
        self.user.two_factor_secret = secret
        self.user.two_factor_enabled = True
        self.user.save(update_fields=["two_factor_secret", "two_factor_enabled"])

        response = self.client.post(
            "/api/users/auth/2fa/disable/",
            {"code": pyotp.TOTP(secret).now(), "current_password": "wrong-password"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data["detail"], "Mật khẩu hiện tại không đúng.")
        self.user.refresh_from_db()
        self.assertTrue(self.user.two_factor_enabled)

    def test_disable_2fa_success_with_current_password_and_totp(self):
        secret = pyotp.random_base32()
        self.user.two_factor_secret = secret
        self.user.two_factor_enabled = True
        self.user.save(update_fields=["two_factor_secret", "two_factor_enabled"])

        response = self.client.post(
            "/api/users/auth/2fa/disable/",
            {
                "code": pyotp.TOTP(secret).now(),
                "current_password": "password123",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.data["is_enabled"])
        self.user.refresh_from_db()
        self.assertFalse(self.user.two_factor_enabled)
        self.assertIsNone(self.user.two_factor_secret)


# ============================================================================
# TEST: REGISTER API
# ============================================================================


class TestRegisterAPI(APITestCase):
    """Test cases for API POST /api/users/auth/register/"""

    def test_register_success(self):
        """Test successful registration"""
        response = self.client.post(
            "/api/users/auth/register/",
            {
                "email": "newuser@example.com",
                "password": "password123",
                "password_confirm": "password123",
                "full_name": "New User",
                "role": "candidate",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn("access_token", response.data)
        self.assertIn("refresh_token", response.data)
        self.assertEqual(response.data["user"]["email"], "newuser@example.com")
        self.assertEqual(CustomUser.objects.count(), 1)

    def test_register_with_company_role(self):
        """Test registration with company role"""
        response = self.client.post(
            "/api/users/auth/register/",
            {
                "email": "company@example.com",
                "password": "password123",
                "password_confirm": "password123",
                "full_name": "Company ABC",
                "role": "company",
                "company_name": "Company ABC",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["user"]["role"], "company")

    def test_register_duplicate_email(self):
        """Test registration with existing email"""
        CustomUser.objects.create_user(
            email="existing@example.com",
            password="password123",
            full_name="Existing User",
            role="candidate",
        )

        response = self.client.post(
            "/api/users/auth/register/",
            {
                "email": "existing@example.com",
                "password": "password123",
                "password_confirm": "password123",
                "full_name": "Another User",
                "role": "candidate",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("detail", response.data)

    def test_register_password_mismatch(self):
        """Test registration with mismatched passwords"""
        response = self.client.post(
            "/api/users/auth/register/",
            {
                "email": "test@example.com",
                "password": "password123",
                "password_confirm": "differentpassword",
                "full_name": "Test User",
                "role": "candidate",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("password_confirm", response.data)

    def test_register_password_too_short(self):
        """Test registration with short password (<8 chars)"""
        response = self.client.post(
            "/api/users/auth/register/",
            {
                "email": "test@example.com",
                "password": "1234567",
                "password_confirm": "1234567",
                "full_name": "Test User",
                "role": "candidate",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_register_invalid_role(self):
        """Test registration with invalid role"""
        response = self.client.post(
            "/api/users/auth/register/",
            {
                "email": "test@example.com",
                "password": "password123",
                "password_confirm": "password123",
                "full_name": "Test User",
                "role": "admin",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_register_missing_full_name(self):
        """Test registration without full_name"""
        response = self.client.post(
            "/api/users/auth/register/",
            {
                "email": "test@example.com",
                "password": "password123",
                "password_confirm": "password123",
                "role": "candidate",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class TestPublicUserCreateAPI(APITestCase):
    def test_anonymous_cannot_create_admin_user_via_users_endpoint(self):
        response = self.client.post(
            "/api/users/",
            {
                "email": "evil-admin@example.com",
                "password": "password123",
                "full_name": "Evil Admin",
                "role": "admin",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertFalse(
            CustomUser.objects.filter(email="evil-admin@example.com").exists()
        )

    def test_admin_can_create_admin_user_via_users_endpoint(self):
        admin = CustomUser.objects.create_superuser(
            email="admin@example.com", password="password123", full_name="Admin"
        )
        self.client.force_authenticate(user=admin)

        response = self.client.post(
            "/api/users/",
            {
                "email": "managed-admin@example.com",
                "password": "password123",
                "full_name": "Managed Admin",
                "role": "admin",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        created = CustomUser.objects.get(email="managed-admin@example.com")
        self.assertEqual(created.role, CustomUser.Role.ADMIN)


# ============================================================================
# TEST: LOGOUT API
# ============================================================================


class TestLogoutAPI(APITestCase):
    """Test cases for API POST /api/users/auth/logout/"""

    def setUp(self):
        self.user = CustomUser.objects.create_user(
            email="logout@example.com",
            password="password123",
            full_name="Logout User",
            role="candidate",
            status="active",
        )
        self.refresh = RefreshToken.for_user(self.user)
        self.client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {self.refresh.access_token}"
        )

    def test_logout_success(self):
        """Test successful logout"""
        response = self.client.post(
            "/api/users/auth/logout/",
            {"refresh_token": str(self.refresh)},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("detail", response.data)

    def test_logout_invalid_token(self):
        """Test logout with invalid refresh token"""
        response = self.client.post(
            "/api/users/auth/logout/",
            {"refresh_token": "invalid_token_here"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_logout_without_authentication(self):
        """Test logout without being logged in"""
        self.client.credentials()  # Clear credentials
        response = self.client.post(
            "/api/users/auth/logout/", {"refresh_token": "some_token"}, format="json"
        )

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_logout_missing_refresh_token(self):
        """Test logout without refresh_token"""
        response = self.client.post("/api/users/auth/logout/", {}, format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class TestForgotPasswordAPI(APITestCase):
    """Test cases for API POST /api/users/auth/forgot-password/"""

    def setUp(self):
        cache.clear()
        self.user = CustomUser.objects.create_user(
            email="forgot@example.com",
            password="password123",
            full_name="Forgot Password",
            role="candidate",
            status="active",
        )

    def tearDown(self):
        cache.clear()

    @patch("apps.core.users.services.auth.EmailService.send_email", return_value=True)
    def test_forgot_password_is_limited_per_email(self, mock_send_email):
        for _ in range(PASSWORD_RESET_REQUEST_MAX_ATTEMPTS):
            response = self.client.post(
                "/api/users/auth/forgot-password/",
                {"email": self.user.email},
                format="json",
            )
            self.assertEqual(response.status_code, status.HTTP_200_OK)

        limited_response = self.client.post(
            "/api/users/auth/forgot-password/",
            {"email": self.user.email},
            format="json",
        )
        self.assertEqual(limited_response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(
            limited_response.data["detail"], PASSWORD_RESET_REQUEST_LIMIT_ERROR
        )
        self.assertEqual(
            mock_send_email.call_count, PASSWORD_RESET_REQUEST_MAX_ATTEMPTS
        )


# ============================================================================
# TEST: USER ME API
# ============================================================================


class TestUserMeAPI(APITestCase):
    """Test cases for API GET /api/users/me/"""

    def setUp(self):
        self.user = CustomUser.objects.create_user(
            email="me@example.com",
            password="password123",
            full_name="Me User",
            role="candidate",
            status="active",
        )
        self.recruiter = Recruiter.objects.create(user=self.user)
        refresh = RefreshToken.for_user(self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {refresh.access_token}")

    def test_get_me_success(self):
        """Test getting current user info"""
        response = self.client.get("/api/users/me/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["email"], "me@example.com")
        self.assertEqual(response.data["role"], "candidate")
        self.assertEqual(response.data["candidate_id"], self.recruiter.id)
        self.assertEqual(response.data["recruiter_id"], self.recruiter.id)

    def test_get_auth_me_returns_candidate_profile_id(self):
        """Test getting current auth user info"""
        response = self.client.get("/api/users/auth/me/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["candidate_id"], self.recruiter.id)
        self.assertEqual(response.data["recruiter_id"], self.recruiter.id)

    def test_get_me_without_authentication(self):
        """Test getting user info without login"""
        self.client.credentials()  # Clear credentials
        response = self.client.get("/api/users/me/")

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
