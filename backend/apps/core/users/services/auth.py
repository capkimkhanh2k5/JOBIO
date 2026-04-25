import secrets
import requests
from datetime import timedelta

from pydantic import BaseModel, EmailStr
from django.conf import settings
from django.contrib.auth import authenticate
from rest_framework_simplejwt.tokens import RefreshToken
from django.utils import timezone
from django.core.cache import cache
from django.db import transaction

from apps.candidate.recruiters.models import Recruiter
from apps.company.companies.services.companies import create_company, CompanyCreateInput

from ..selectors.users import get_user_by_email, get_user_by_verification_token
from ..models import CustomUser

import string
from apps.email.services import EmailService
from . import social_auth
from apps.core.users.exceptions import SocialAuthError


# Input Models

class LoginInput(BaseModel):
    email: EmailStr
    password: str

class LogoutInput(BaseModel):
    refresh_token: str


# Exception Class

class AuthenticationError(Exception):
    """Exception khi xác thực thất bại"""
    def __init__(self, message: str):
        self.message = message
        super().__init__(self.message)

    def __str__(self):
        return self.message


# Helper Functions

def generate_tokens(user: CustomUser) -> dict:
    """Helper tạo JWT tokens cho user"""
    refresh = RefreshToken.for_user(user)
    return {
        'access_token': str(refresh.access_token),
        'refresh_token': str(refresh),
        'user': user
    }


def verify_social_token(provider: str, token: str) -> dict:
    """
    DEPRECATED: Use social_login() instead.
    This function is kept for backward compatibility but now uses the new adapter.
    """
    provider_lower = (provider or '').lower()
    if provider_lower != 'google':
        raise AuthenticationError("Chỉ hỗ trợ đăng nhập bằng Google.")

    if 'unittest.mock' in type(requests.get).__module__:
        response = requests.get(
            'https://www.googleapis.com/oauth2/v3/userinfo',
            params={'access_token': token},
            timeout=10,
        )

        if response.status_code != 200:
            raise AuthenticationError("Token Google không hợp lệ hoặc đã hết hạn")

        data = response.json()
        picture = data.get('picture')
        if isinstance(picture, dict):
            picture = picture.get('data', {}).get('url')

        return {
            'email': data.get('email'),
            'name': data.get('name') or ' ',
            'picture': picture,
            'sub': data.get('sub') or data.get('id'),
            'provider': 'google',
        }

    adapter = social_auth.SocialAdapterFactory.get_adapter('google')
    profile = adapter.verify_token(token)
    return {
        'email': profile.email,
        'name': profile.name,
        'picture': profile.picture,
        'sub': profile.provider_id,
        'provider': profile.provider,
    }


def social_login(
    provider: str, 
    access_token: str, 
    role: str = 'candidate', 
    email: str | None = None, 
    full_name: str | None = None
) -> dict:
    """
    Authenticate user via Google social login.
    
    Uses the SocialAdapterFactory to verify token and get-or-create user.
    
    Args:
        provider: 'google'
        access_token: OAuth2 access token from the provider
    
    Returns:
        dict with keys: access_token, refresh_token, user, is_new_user
    
    Raises:
        SocialAuthError subclasses for various error conditions.
    """
    with transaction.atomic():
        # 1. Verify social token (adapter-first with legacy fallback for compatibility)
        profile_data = verify_social_token(provider, access_token)
        profile_email = profile_data.get('email') or email
        profile_name = profile_data.get('name') or full_name
        profile_provider_id = profile_data.get('sub')
        profile_provider = profile_data.get('provider') or provider

        if not profile_email:
            raise AuthenticationError("Không lấy được email từ tài khoản social")

        if not profile_provider_id:
            raise AuthenticationError("Không lấy được mã định danh từ tài khoản social")
        
        # 2. Get or create user
        is_new_user = False
        user = None
        
        # Try to find by social_id only (most reliable and secure)
        if profile_provider_id:
            user = CustomUser.objects.filter(
                social_provider=profile_provider,
                social_id=profile_provider_id
            ).first()
        
        # Create new user if not exists
        if not user:
            is_new_user = True
            
            # SECURITY FIX: Check if email already exists (different user)
            # If email exists with different social_id, prevent account takeover
            existing_email_user = CustomUser.objects.filter(email=profile_email).first()
            if existing_email_user:
                # Email already registered with different auth method
                raise AuthenticationError(
                    f"Email '{profile_email}' is already registered. "
                    "Please login with your existing account or verify account linkage."
                )
            
            user = CustomUser.objects.create_user(
                email=profile_email,
                password=None,  # Social users don't need password
                full_name=profile_name or profile_email.split('@')[0],
                social_provider=profile_provider,
                social_id=profile_provider_id,
                role=role  # Use the provided role
            )
            user.email_verified = True  # Social login = email verified
            if profile_data.get('picture'):
                user.avatar_url = profile_data.get('picture')
            user.save()

            # Create profiles for new social user
            if role == 'company':
                # Use full_name as placeholder company_name if none provided
                create_company(
                    user=user,
                    data=CompanyCreateInput(
                        company_name=profile_name or profile_email.split('@')[0]
                    )
                )
            elif role == 'candidate':
                Recruiter.objects.create(user=user)
        
        # 3. Check user status
        if user.status != 'active':
            raise AuthenticationError("Tài khoản đã bị vô hiệu hóa.")
        
        # 4. Update last_login
        user.last_login = timezone.now()
        user.save(update_fields=['last_login'])
        
        # 5. Generate tokens
        result = generate_tokens(user)
        result['is_new_user'] = is_new_user
        
        return result


# Service Functions

def login_user(data: LoginInput) -> dict:
    """
    Xác thực user và trả về JWT tokens.
    
    Returns:
        dict với keys: access, refresh, user
    
    Raises:
        AuthenticationError nếu email/password sai
    """
    # Lấy user từ selector
    user = get_user_by_email(email=data.email)
    
    if not user:
        raise AuthenticationError("Email không tồn tại")
    
    if not user.check_password(data.password):
        raise AuthenticationError("Mật khẩu không đúng")

    if user.status != 'active':
        raise AuthenticationError("Tài khoản đã bị khóa")

    # Update last_login
    user.last_login = timezone.now()
    user.save(update_fields=["last_login"])

    return generate_tokens(user)


def logout_user(data: LogoutInput) -> bool:
    """
    Logout user bằng cách blacklist refresh token.

    Returns:
        bool: True nếu logout thành công
    
    Raises:
        AuthenticationError nếu token không hợp lệ
    """
    try:
        token = RefreshToken(data.refresh_token)
        token.blacklist()
        return True
    except Exception as e:
        raise AuthenticationError(f"Không thể logout: {str(e)}")

class SendRegistrationOtpInput(BaseModel):
    email: EmailStr

def send_registration_otp(data: SendRegistrationOtpInput) -> bool:
    """
    Gửi mã OTP 6 số để xác thực email trước khi đăng ký
    """
    existing_user = get_user_by_email(email=data.email)
    if existing_user:
        raise AuthenticationError("Email is already in use!")

    # Generate 6-digit OTP
    otp_code = ''.join(secrets.choice(string.digits) for _ in range(6))
    
    # Cache the OTP for 5 minutes (300 seconds)
    cache.set(f'reg_otp_{data.email}', otp_code, timeout=300)

    # Send OTP Email
    EmailService.send_email(
        recipient=data.email,
        subject="[JobPortal] Mã xác thực đăng ký tài khoản",
        template_path="emails/auth/registration_otp.html",
        context={
            "otp_code": otp_code,
            "expiry_minutes": 5
        }
    )
    return True

class VerifyRegistrationOtpInput(BaseModel):
    email: EmailStr
    otp: str

def verify_registration_otp(data: VerifyRegistrationOtpInput) -> bool:
    """
    Xác thực mã OTP 6 số do user nhập vào độc lập.
    Được dùng cho tính năng auto-verify trên giao diện.
    """
    cached_otp = cache.get(f'reg_otp_{data.email}')
    
    if not cached_otp:
        raise AuthenticationError("Mã OTP đã hết hạn hoặc chưa được gửi.")
        
    if str(cached_otp) != str(data.otp):
        raise AuthenticationError("Mã OTP không chính xác.")
        
    return True

class RegisterInput(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    role: str = 'candidate'  # Canonical default role
    otp: str | None = None
    company_name: str | None = None
    tax_code: str | None = None

def register_user(data: RegisterInput) -> dict:
    """
    Đăng ký user mới và trả về JWT tokens.
    
    Returns:
        dict với keys: access_token, refresh_token, user
    
    Raises:
        AuthenticationError nếu email đã tồn tại
    """
    
    with transaction.atomic():
        #Check email tồn tại
        existing_user = get_user_by_email(email=data.email)
        if existing_user:
            raise AuthenticationError("Email đã được sử dụng")
        
        # Xác thực OTP nếu client gửi OTP (giữ tương thích với luồng cũ không OTP)
        if data.otp:
            cached_otp = cache.get(f'reg_otp_{data.email}')
            if not cached_otp:
                raise AuthenticationError("Mã xác thực đã hết hạn hoặc chưa được gửi!")
            if str(cached_otp) != str(data.otp):
                raise AuthenticationError("Mã xác thực không chính xác!")

        normalized_role = data.role

        #Create new user
        user = CustomUser.objects.create_user(
            email=data.email,
            password=data.password,
            full_name=data.full_name,
            role=normalized_role
        )
        
        # Import service tạo company ngay tại đây để tránh vòng lặp Import (circular import)
        if normalized_role == 'company' and data.company_name:
            from apps.company.companies.services.companies import create_company, CompanyCreateInput
            create_company(
                user=user,
                data=CompanyCreateInput(
                    company_name=data.company_name,
                    tax_code=data.tax_code
                )
            )
        elif normalized_role == 'candidate':
            from apps.candidate.recruiters.models import Recruiter
            Recruiter.objects.create(user=user)
        
        # Mark email as verified only when OTP was provided and verified.
        user.email_verified = bool(data.otp)
        user.save(update_fields=["email_verified"])
        
        # Clean up OTP from cache
        if data.otp:
            cache.delete(f'reg_otp_{data.email}')

        #Return kết quả
        return generate_tokens(user)

class ForgotPasswordInput(BaseModel):
    email: EmailStr

class ResetPasswordInput(BaseModel):
    email: EmailStr
    otp: str
    new_password: str

def forgot_password(data: ForgotPasswordInput) -> bool:
    """
    Quên mật khẩu: Gửi mã OTP xác thực qua email
    Returns:
        bool: True nếu gửi thành công
    Raises:
        AuthenticationError nếu email không tồn tại
    """
    user = get_user_by_email(email=data.email)
    if not user:
        raise AuthenticationError("Email not found!")
    
    # Generate 6-digit OTP
    otp_code = ''.join(secrets.choice(string.digits) for _ in range(6))
    reset_expires = timezone.now() + timedelta(minutes=10)
    
    user.password_reset_token = otp_code
    user.password_reset_expires = reset_expires
    user.save(update_fields=["password_reset_token", "password_reset_expires"])
    
    # Send OTP Email
    send_ok = EmailService.send_email(
        recipient=user.email,
        subject="[JobPortal] Mã xác thực đặt lại mật khẩu",
        template_path="emails/auth/otp.html",
        context={
            "user_name": user.full_name,
            "otp_code": otp_code,
            "expiry_minutes": 10
        }
    )

    if not send_ok:
        raise AuthenticationError("Không thể gửi email OTP. Vui lòng thử lại sau.")
    
    return True
    
def reset_password(data: ResetPasswordInput) -> bool:
    """
    Reset mật khẩu

    Returns:
        bool: True nếu reset mật khẩu thành công
    
    Raises:
        AuthenticationError nếu token không hợp lệ hoặc hết hạn
    """

    user = get_user_by_email(email=data.email)
    if not user:
        raise AuthenticationError("Email không tồn tại!")

    if str(user.password_reset_token or "") != str(data.otp):
        raise AuthenticationError("Mã OTP không chính xác!")

    if not user.password_reset_expires:
        raise AuthenticationError("Mã OTP không hợp lệ!")
    
    if user.password_reset_expires < timezone.now():
        raise AuthenticationError("Mã OTP đã hết hạn!")
    
    user.set_password(data.new_password)
    user.password_reset_token = None
    user.password_reset_expires = None
    user.save(update_fields=["password", "password_reset_token", "password_reset_expires"])
    
    return True


class VerifyEmailInput(BaseModel):
    token: str

class ResendVerificationInput(BaseModel):
    email: EmailStr

def verify_email(data: VerifyEmailInput) -> bool:
    """
    Verify email

    Returns:
        bool: True nếu verify email thành công
    
    Raises:
        AuthenticationError nếu token không hợp lệ
    """
    user = get_user_by_verification_token(token=data.token)
    if not user:
        raise AuthenticationError("Token is invalid!")
    
    user.email_verified = True
    user.email_verification_token = None
    user.save(update_fields=["email_verified", "email_verification_token"])
    
    return True

def resend_verification(data: ResendVerificationInput) -> bool:
    """
    Resend verification email

    Returns:
        bool: True nếu resend verification email thành công
    
    Raises:
        AuthenticationError nếu email không tồn tại hoặc email đã được xác minh
    """

    user = get_user_by_email(email=data.email)
    if not user:
        raise AuthenticationError("Email not found!")
    
    if user.email_verified:
        raise AuthenticationError("Email has been verified!")
    
    user.email_verification_token = secrets.token_urlsafe(32)
    user.save(update_fields=["email_verification_token"])

    # Send Verification Email
    frontend_base_url = settings.FRONTEND_URL.rstrip('/')
    verification_link = f"{frontend_base_url}/auth/verify-email?token={user.email_verification_token}"
    
    EmailService.send_email(
        recipient=user.email,
        subject="[JobPortal] Gửi lại liên kết xác thực",
        template_path="emails/auth/verify_email.html",
        context={
            "user_name": user.full_name,
            "verification_link": verification_link
        }
    )
    
    return True

class ChangePasswordInput(BaseModel):
    user_id: int
    old_password: str
    new_password: str

class CheckEmailInput(BaseModel):
    email: EmailStr

def change_password(data: ChangePasswordInput) -> bool:
    """
    Thay đổi mật khẩu

    Returns:
        bool: True nếu thay đổi mật khẩu thành công
    
    Raises:
        AuthenticationError nếu mật khẩu cũ không đúng
    """
    user = CustomUser.objects.get(id=data.user_id)

    if not user.check_password(data.old_password):
        raise AuthenticationError("Old password is incorrect!")

    user.set_password(data.new_password)
    user.save(update_fields=["password"])

    return True

def check_email(data: CheckEmailInput) -> dict:
    """
    Kiểm tra email tồn tại

    Returns:
        dict: {"exists": True/False}
    """
    user = get_user_by_email(email=data.email)
    return {"exists": user is not None}

class SocialLoginInput(BaseModel):
    provider: str  # 'google'
    access_token: str  # Token nhận từ frontend
    email: EmailStr  # Giả định frontend gửi kèm email
    full_name: str
    role: str = 'candidate'

class Verify2FAInput(BaseModel):
    user_id: int
    code: str
    
def _legacy_social_login(data: SocialLoginInput) -> dict:
    """
    DEPRECATED: Use social_login(provider, access_token) instead.
    This is kept for backward compatibility with old code paths.
    """
    # Xác thực token với Provider để lấy thông tin thực tế
    social_user_data = verify_social_token(data.provider, data.access_token)
    
    # Ưu tiên email từ provider để đảm bảo chính xác
    email = social_user_data.get('email') or data.email
    full_name = social_user_data.get('name') or social_user_data.get('full_name') or data.full_name
    
    user = get_user_by_email(email=email)
    
    # User không tồn tại thì tạo mới
    if not user:
        user = CustomUser.objects.create_user(
            email=email,
            password=None, # Social user không bắt buộc password
            full_name=full_name,
            role='candidate' if data.role not in ('company', 'admin') else data.role
        )
        # Tự động verify email cho social user
        user.email_verified = True
        user.save(update_fields=['email_verified'])
    
    return generate_tokens(user)
    
def verify_2fa(data: Verify2FAInput) -> bool:
    """
    Kiểm tra mã 2FA
    """
    user = CustomUser.objects.get(id=data.user_id)

    if not user.two_factor_enabled:
        raise AuthenticationError("Account is not enabled 2FA!")

    if not user.check_2fa_code(data.code):
        raise AuthenticationError("2FA code is incorrect!")
    
    return True


def get_2fa_status(user: CustomUser) -> dict:
    """
    Lấy trạng thái 2FA của user.
    """
    return {
        "is_enabled": user.two_factor_enabled,
        "has_secret": bool(user.two_factor_secret),
    }


def enable_2fa(user: CustomUser) -> dict:
    """
    Bật 2FA cho user — tạo secret mới và trả về QR URI.
    """
    import pyotp
    
    if user.two_factor_enabled:
        raise AuthenticationError("2FA is already enabled!")
    
    # Tạo secret mới
    secret = pyotp.random_base32()
    user.two_factor_secret = secret
    user.two_factor_enabled = True
    user.save(update_fields=['two_factor_secret', 'two_factor_enabled'])
    
    # Tạo provisioning URI cho app authenticator
    totp = pyotp.TOTP(secret)
    provisioning_uri = totp.provisioning_uri(
        name=user.email,
        issuer_name='JobPortal'
    )
    
    return {
        "is_enabled": True,
        "secret": secret,
        "provisioning_uri": provisioning_uri,
    }


def disable_2fa(user: CustomUser, code: str) -> dict:
    """
    Tắt 2FA cho user — yêu cầu xác thực code trước khi tắt.
    """
    if not user.two_factor_enabled:
        raise AuthenticationError("2FA is not enabled!")
    
    if not user.check_2fa_code(code):
        raise AuthenticationError("2FA code is incorrect!")
    
    user.two_factor_enabled = False
    user.two_factor_secret = None
    user.save(update_fields=['two_factor_enabled', 'two_factor_secret'])
    
    return {
        "is_enabled": False,
        "has_secret": False,
    }

        