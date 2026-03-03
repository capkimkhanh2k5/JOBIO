from rest_framework import serializers
from .models import CustomUser

class CustomUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ['id', 'email', 'full_name', 'role', 'status', 'email_verified', 'password', 'last_login', 'phone', 'avatar_url']
        extra_kwargs = {
            'password': {'write_only': True},
            'last_login': {'read_only': True}
        }

class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

class LogoutSerializer(serializers.Serializer):
    refresh_token = serializers.CharField()

class LoginResponseSerializer(serializers.Serializer):
    access_token = serializers.CharField()
    refresh_token = serializers.CharField()
    user = CustomUserSerializer()

class RegisterSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(
        write_only=True,
        min_length=8,
        error_messages={'min_length': 'Mật khẩu phải có ít nhất 8 ký tự'}
    )

    password_confirm = serializers.CharField(write_only=True)
    
    full_name = serializers.CharField(max_length=255)
    role = serializers.ChoiceField(
        choices=['recruiter', 'company'],
        default='recruiter'
    )

    def validate(self, data):
        """Kiểm tra password và password_confirm khớp nhau"""
        if data['password'] != data['password_confirm']:
            raise serializers.ValidationError({
                'password_confirm': 'Mật khẩu xác nhận không khớp'
            })
        return data


class RegisterResponseSerializer(serializers.Serializer):
    access_token = serializers.CharField()
    refresh_token = serializers.CharField()
    user = CustomUserSerializer()

class ForgotPasswordSerializer(serializers.Serializer):
    email = serializers.EmailField()

class ResetPasswordSerializer(serializers.Serializer):
    token = serializers.CharField()
    new_password = serializers.CharField(
        write_only=True,
        min_length=8,
        error_messages={'min_length': 'Mật khẩu phải có ít nhất 8 ký tự'}
    )
    
    new_password_confirm = serializers.CharField(write_only=True) # Xác thực lại mật khẩu
    
    def validate(self, data):
        """Kiểm tra new_password và new_password_confirm khớp nhau"""
        if data['new_password'] != data['new_password_confirm']:
            raise serializers.ValidationError({
                'new_password_confirm': 'Mật khẩu xác nhận không khớp'
            })
        return data

class VerifyEmailSerializer(serializers.Serializer):
    email_verification_token = serializers.CharField()

class ResendVerificationSerializer(serializers.Serializer):
    email = serializers.EmailField()

class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True, min_length=8)
    new_password_confirm = serializers.CharField(write_only=True)

    def validate(self, data):
        if data['new_password'] != data['new_password_confirm']:
            raise serializers.ValidationError({
                'new_password_confirm': 'Mật khẩu xác nhận không khớp'
            })
        return data

class CheckEmailSerializer(serializers.Serializer):
    email = serializers.EmailField()

class SocialAuthSerializer(serializers.Serializer):
    provider = serializers.ChoiceField(choices=['google', 'facebook', 'linkedin'])
    access_token = serializers.CharField()
    email = serializers.EmailField()
    full_name = serializers.CharField()
    role = serializers.CharField(default='recruiter')

class Verify2FASerializer(serializers.Serializer):
    code = serializers.CharField(max_length=6, min_length=6)

class TwoFactorStatusSerializer(serializers.Serializer):
    is_enabled = serializers.BooleanField()
    has_secret = serializers.BooleanField(required=False)

class TwoFactorEnableSerializer(serializers.Serializer):
    is_enabled = serializers.BooleanField()
    secret = serializers.CharField(required=False)
    provisioning_uri = serializers.CharField(required=False)

class TwoFactorDisableSerializer(serializers.Serializer):
    code = serializers.CharField(max_length=6, min_length=6)

class UserUpdateSerializer(serializers.Serializer):
    full_name = serializers.CharField(max_length=255, required=False)
    phone = serializers.CharField(max_length=20, required=False)
    avatar_url = serializers.URLField(max_length=500, required=False)

class UserStatusSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=CustomUser.Status.values)

class UserRoleSerializer(serializers.Serializer):
    role = serializers.ChoiceField(choices=CustomUser.Role.values)

class UserAvatarSerializer(serializers.Serializer):
    avatar = serializers.ImageField()


# ============================================================
# Passkey (WebAuthn) Serializers
# ============================================================

class PasskeyRegisterOptionsSerializer(serializers.Serializer):
    """Input: yêu cầu tạo registration options (không cần input, chỉ cần auth)"""
    pass


class PasskeyRegisterVerifySerializer(serializers.Serializer):
    """Input: dữ liệu từ navigator.credentials.create() response"""
    credential_id = serializers.CharField(
        help_text='Base64url-encoded credential ID'
    )
    client_data_json = serializers.CharField(
        help_text='Base64url-encoded clientDataJSON'
    )
    attestation_object = serializers.CharField(
        help_text='Base64url-encoded attestationObject'
    )
    device_name = serializers.CharField(
        max_length=255,
        default='Passkey',
        required=False,
        help_text='Tên thiết bị (ví dụ: MacBook Touch ID)'
    )
    transports = serializers.ListField(
        child=serializers.CharField(),
        required=False,
        default=list,
        help_text='Danh sách transport types (usb, ble, nfc, internal, hybrid)'
    )


class PasskeyAuthOptionsSerializer(serializers.Serializer):
    """Input: yêu cầu tạo authentication options"""
    email = serializers.EmailField(
        required=False,
        allow_blank=True,
        help_text='Email của user (optional, nếu không cung cấp sẽ dùng discoverable credentials)'
    )


class PasskeyAuthVerifySerializer(serializers.Serializer):
    """Input: dữ liệu từ navigator.credentials.get() response"""
    session_id = serializers.CharField(
        help_text='Session ID từ bước generate options'
    )
    credential_id = serializers.CharField(
        help_text='Base64url-encoded credential ID'
    )
    client_data_json = serializers.CharField(
        help_text='Base64url-encoded clientDataJSON'
    )
    authenticator_data = serializers.CharField(
        help_text='Base64url-encoded authenticatorData'
    )
    signature = serializers.CharField(
        help_text='Base64url-encoded signature'
    )
    user_handle = serializers.CharField(
        required=False,
        allow_blank=True,
        default='',
        help_text='Base64url-encoded user handle (cho discoverable credentials)'
    )


class PasskeyListSerializer(serializers.Serializer):
    """Output: thông tin passkey"""
    id = serializers.IntegerField()
    device_name = serializers.CharField()
    credential_id = serializers.CharField()
    transports = serializers.ListField(child=serializers.CharField())
    is_active = serializers.BooleanField()
    created_at = serializers.CharField()
    last_used_at = serializers.CharField(allow_null=True)


class PasskeyDeleteSerializer(serializers.Serializer):
    """Input: xóa passkey"""
    passkey_id = serializers.IntegerField(
        help_text='ID của passkey cần xóa'
    )


class PasskeyUpdateNameSerializer(serializers.Serializer):
    """Input: cập nhật tên passkey"""
    device_name = serializers.CharField(
        max_length=255,
        help_text='Tên mới cho passkey'
    )