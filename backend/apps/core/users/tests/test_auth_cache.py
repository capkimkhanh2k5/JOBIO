from unittest.mock import patch

from django.core.cache import cache
from django.test import TestCase

from apps.core.users.models import CustomUser
from apps.core.users.services.auth import (
    AuthenticationError,
    ConfirmSetPasswordInput,
    ForgotPasswordInput,
    LoginInput,
    LOGIN_ACCOUNT_LOCKOUT_MAX_ATTEMPTS,
    PASSWORD_RESET_REQUEST_LIMIT_ERROR,
    PASSWORD_RESET_REQUEST_MAX_ATTEMPTS,
    RequestSetPasswordInput,
    _increment_attempts,
    _login_failure_cache_key,
    _password_reset_request_key,
    _set_password_attempts_key,
    _set_password_cache_key,
    confirm_set_password,
    forgot_password,
    login_user,
    request_set_password,
)


class AuthCacheHardeningTest(TestCase):
    def setUp(self):
        cache.clear()

    def tearDown(self):
        cache.clear()

    def test_increment_attempts_uses_atomic_cache_counter(self):
        key = "otp_attempts:test@example.com"

        _increment_attempts(key, timeout=60, max_attempts=2)
        _increment_attempts(key, timeout=60, max_attempts=2)

        self.assertEqual(cache.get(key), 2)
        with self.assertRaises(AuthenticationError):
            _increment_attempts(key, timeout=60, max_attempts=2)
        self.assertEqual(cache.get(key), 3)

    @patch("apps.core.users.services.auth.EmailService.send_email", return_value=True)
    @patch("apps.core.users.services.auth.secrets.choice", return_value="1")
    def test_set_password_otp_is_hashed_and_attempts_are_cleared(
        self, _mock_choice, _mock_send
    ):
        user = CustomUser.objects.create_user(
            email="social@example.com",
            password=None,
            full_name="Social User",
            social_provider=CustomUser.SocialProvider.GOOGLE,
        )

        request_set_password(RequestSetPasswordInput(user_id=user.id))

        cached_otp = cache.get(_set_password_cache_key(user.id))
        self.assertIsNotNone(cached_otp)
        self.assertNotEqual(cached_otp, "111111")

        with self.assertRaises(AuthenticationError):
            confirm_set_password(
                ConfirmSetPasswordInput(
                    user_id=user.id,
                    otp="000000",
                    new_password="newpass123",
                )
            )
        self.assertEqual(cache.get(_set_password_attempts_key(user.id)), 1)

        confirm_set_password(
            ConfirmSetPasswordInput(
                user_id=user.id,
                otp="111111",
                new_password="newpass123",
            )
        )

        user.refresh_from_db()
        self.assertTrue(user.has_usable_password())
        self.assertIsNone(cache.get(_set_password_cache_key(user.id)))
        self.assertIsNone(cache.get(_set_password_attempts_key(user.id)))

    def test_successful_login_clears_failed_login_counter(self):
        user = CustomUser.objects.create_user(
            email="login-cache@example.com",
            password="password123",
            full_name="Login Cache User",
        )

        for _ in range(LOGIN_ACCOUNT_LOCKOUT_MAX_ATTEMPTS - 1):
            with self.assertRaises(AuthenticationError):
                login_user(
                    LoginInput(
                        email=user.email,
                        password="wrong-password",
                    )
                )

        self.assertEqual(
            cache.get(_login_failure_cache_key(user.email)),
            LOGIN_ACCOUNT_LOCKOUT_MAX_ATTEMPTS - 1,
        )

        result = login_user(LoginInput(email=user.email, password="password123"))

        self.assertEqual(result["user"], user)
        self.assertIsNone(cache.get(_login_failure_cache_key(user.email)))

    @patch("apps.core.users.services.auth.EmailService.send_email", return_value=True)
    @patch("apps.core.users.services.auth.secrets.choice", return_value="1")
    def test_forgot_password_is_limited_per_email(self, _mock_choice, mock_send):
        user = CustomUser.objects.create_user(
            email="reset-limit@example.com",
            password="password123",
            full_name="Reset Limit User",
        )

        for _ in range(PASSWORD_RESET_REQUEST_MAX_ATTEMPTS):
            self.assertTrue(forgot_password(ForgotPasswordInput(email=user.email)))

        self.assertEqual(mock_send.call_count, PASSWORD_RESET_REQUEST_MAX_ATTEMPTS)
        self.assertEqual(
            cache.get(_password_reset_request_key(user.email)),
            PASSWORD_RESET_REQUEST_MAX_ATTEMPTS,
        )

        with self.assertRaises(AuthenticationError) as ctx:
            forgot_password(ForgotPasswordInput(email=user.email))

        self.assertEqual(str(ctx.exception), PASSWORD_RESET_REQUEST_LIMIT_ERROR)
        self.assertEqual(mock_send.call_count, PASSWORD_RESET_REQUEST_MAX_ATTEMPTS)
