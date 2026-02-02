"""
Custom Throttle Classes cho Rate Limiting.

Cung cấp bảo vệ chống brute force và DDoS cho các endpoints nhạy cảm.
"""
from rest_framework.throttling import AnonRateThrottle, UserRateThrottle


class LoginRateThrottle(AnonRateThrottle):
    """
    Rate limit cho login endpoint.
    Giới hạn: 5 requests/phút cho anonymous users.
    """
    scope = 'login'


class RegisterRateThrottle(AnonRateThrottle):
    """
    Rate limit cho register endpoint.
    Giới hạn: 10 requests/giờ cho anonymous users.
    """
    scope = 'register'


class PasswordResetRateThrottle(AnonRateThrottle):
    """
    Rate limit cho forgot password endpoint.
    Giới hạn: 3 requests/giờ cho anonymous users.
    """
    scope = 'password_reset'


class EmailVerificationRateThrottle(AnonRateThrottle):
    """
    Rate limit cho resend verification email.
    Giới hạn: 3 requests/giờ.
    """
    scope = 'email_verification'


class SocialAuthRateThrottle(AnonRateThrottle):
    """
    Rate limit cho social login.
    Giới hạn: 10 requests/phút.
    """
    scope = 'social_auth'


class BurstRateThrottle(UserRateThrottle):
    """
    Rate limit cho burst requests từ authenticated users.
    Giới hạn: 60 requests/phút.
    """
    scope = 'burst'


class SustainedRateThrottle(UserRateThrottle):
    """
    Rate limit sustained cho authenticated users.
    Giới hạn: 1000 requests/ngày.
    """
    scope = 'sustained'


class PaymentRateThrottle(UserRateThrottle):
    """
    Rate limit cho payment endpoints.
    Giới hạn: 10 requests/phút.
    """
    scope = 'payment'


class AIMatchingRateThrottle(UserRateThrottle):
    """
    Rate limit cho AI matching (tốn resources).
    Giới hạn: 20 requests/giờ.
    """
    scope = 'ai_matching'


class FileUploadRateThrottle(UserRateThrottle):
    """
    Rate limit cho file upload.
    Giới hạn: 30 requests/giờ.
    """
    scope = 'file_upload'
