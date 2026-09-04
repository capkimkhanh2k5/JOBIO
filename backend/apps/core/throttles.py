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

    scope = "login"


class TokenRefreshRateThrottle(AnonRateThrottle):
    """
    Rate limit cho JWT refresh endpoint.
    Giới hạn: 30 requests/phút theo IP cho endpoint public.
    """

    scope = "token_refresh"


class RegisterRateThrottle(AnonRateThrottle):
    """
    Rate limit cho register endpoint.
    Giới hạn: 10 requests/giờ cho anonymous users.
    """

    scope = "register"


class PasswordResetRateThrottle(AnonRateThrottle):
    """
    Rate limit cho forgot password endpoint.
    Giới hạn: 3 requests/giờ cho anonymous users.
    """

    scope = "password_reset"


class EmailVerificationRateThrottle(AnonRateThrottle):
    """
    Rate limit cho resend verification email.
    Giới hạn: 3 requests/giờ.
    """

    scope = "email_verification"


class SocialAuthRateThrottle(AnonRateThrottle):
    """
    Rate limit cho social login.
    Giới hạn: 10 requests/phút.
    """

    scope = "social_auth"


class TwoFactorVerifyRateThrottle(UserRateThrottle):
    """
    Rate limit cho xác thực 2FA.
    Giới hạn: 5 requests/phút theo user hoặc IP nếu chưa đăng nhập.
    """

    scope = "two_factor_verify"


class ReportCreateRateThrottle(UserRateThrottle):
    """
    Rate limit cho gửi báo cáo vi phạm.
    Giới hạn: 5 báo cáo/giờ theo user.
    """

    scope = "report_create"


class BurstRateThrottle(UserRateThrottle):
    """
    Rate limit cho burst requests từ authenticated users.
    Giới hạn: 60 requests/phút.
    """

    scope = "burst"


class SustainedRateThrottle(UserRateThrottle):
    """
    Rate limit sustained cho authenticated users.
    Giới hạn: 1000 requests/ngày.
    """

    scope = "sustained"


class PaymentRateThrottle(UserRateThrottle):
    """
    Rate limit cho payment endpoints.
    Giới hạn: 10 requests/phút.
    """

    scope = "payment"


class JobSearchRateThrottle(AnonRateThrottle):
    """
    Rate limit cho public job listing/search endpoint.
    Giới hạn: 60 requests/phút theo IP.
    """

    scope = "job_search"


class ApplicationSubmitRateThrottle(UserRateThrottle):
    """
    Rate limit cho candidate submit application endpoint.
    Giới hạn: 20 requests/giờ theo user.
    """

    scope = "application_submit"


class NotificationStreamRateThrottle(UserRateThrottle):
    """
    Rate limit cho notification stream endpoint.
    Giới hạn: 30 connection attempts/phút theo user.
    """

    scope = "notification_stream"


class AIMatchingRateThrottle(UserRateThrottle):
    """
    Rate limit cho AI matching (tốn resources).
    Giới hạn: 20 requests/giờ.
    """

    scope = "ai_matching"


class FileUploadRateThrottle(UserRateThrottle):
    """
    Rate limit cho file upload.
    Giới hạn: 30 requests/giờ.
    """

    scope = "file_upload"
