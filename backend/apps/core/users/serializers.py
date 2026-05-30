from rest_framework import serializers
from .models import CustomUser
from apps.billing.services.subscriptions import SubscriptionService


class CustomUserSerializer(serializers.ModelSerializer):
    avatar_url = serializers.SerializerMethodField()
    candidate_id = serializers.SerializerMethodField()
    recruiter_id = serializers.SerializerMethodField()
    company_id = serializers.SerializerMethodField()
    subscription_plan = serializers.SerializerMethodField()
    application_count = serializers.SerializerMethodField()
    cv_count = serializers.SerializerMethodField()
    job_count = serializers.SerializerMethodField()
    trust_score = serializers.SerializerMethodField()
    has_usable_password = serializers.SerializerMethodField()

    class Meta:
        model = CustomUser
        fields = [
            "id",
            "email",
            "full_name",
            "role",
            "status",
            "email_verified",
            "password",
            "last_login",
            "phone",
            "avatar_url",
            "candidate_id",
            "recruiter_id",
            "company_id",
            "social_provider",
            "has_usable_password",
            "subscription_plan",
            "application_count",
            "cv_count",
            "job_count",
            "trust_score",
            "created_at",
        ]
        extra_kwargs = {
            "password": {"write_only": True},
            "last_login": {"read_only": True},
            "created_at": {"read_only": True},
        }

    def get_recruiter_id(self, obj):
        try:
            return obj.recruiter_profile.id
        except Exception:
            return None

    def get_avatar_url(self, obj):
        if obj.role == "company":
            try:
                return obj.company_profile.logo_url or obj.avatar_url
            except Exception:
                pass
        return obj.avatar_url

    def get_candidate_id(self, obj):
        return self.get_recruiter_id(obj)

    def get_company_id(self, obj):
        try:
            return obj.company_profile.id
        except Exception:
            return None

    def get_subscription_plan(self, obj):
        if obj.role != "company" or not hasattr(obj, "company_profile"):
            return None

        sub = SubscriptionService.get_active_subscription(obj.company_profile.id)
        if sub:
            return sub.plan.name
        return "Free"

    def get_application_count(self, obj):
        if obj.role != "candidate" or not hasattr(obj, "recruiter_profile"):
            return 0
        return obj.recruiter_profile.applications.count()

    def get_cv_count(self, obj):
        if obj.role != "candidate" or not hasattr(obj, "recruiter_profile"):
            return 0
        return obj.recruiter_profile.cvs.count()

    def get_job_count(self, obj):
        if obj.role != "company" or not hasattr(obj, "company_profile"):
            return 0
        return obj.company_profile.jobs.count()

    def get_trust_score(self, obj):
        score = 0
        if obj.email_verified:
            score += 40
        if obj.phone:
            score += 20
        if obj.role == "candidate" and hasattr(obj, "recruiter_profile"):
            score += min(obj.recruiter_profile.profile_completeness_score, 40)
        elif obj.role == "company" and hasattr(obj, "company_profile"):
            score += 40  # Giả định công ty đã tạo profile là +40
        return min(score, 100)

    def get_has_usable_password(self, obj):
        return obj.has_usable_password()


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)
    remember_me = serializers.BooleanField(required=False, default=False)


class LogoutSerializer(serializers.Serializer):
    refresh_token = serializers.CharField()


class LoginResponseSerializer(serializers.Serializer):
    access_token = serializers.CharField()
    refresh_token = serializers.CharField()
    user = CustomUserSerializer()


class SendRegistrationOtpSerializer(serializers.Serializer):
    email = serializers.EmailField()


class VerifyRegistrationOtpSerializer(serializers.Serializer):
    email = serializers.EmailField()
    otp = serializers.CharField(max_length=6)


class RegisterSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(
        write_only=True,
        min_length=8,
        error_messages={"min_length": "Mật khẩu phải có ít nhất 8 ký tự"},
    )

    password_confirm = serializers.CharField(write_only=True)

    full_name = serializers.CharField(max_length=255)
    role = serializers.ChoiceField(
        choices=["candidate", "company"], default="candidate"
    )
    otp = serializers.CharField(
        write_only=True,
        max_length=6,
        min_length=6,
        required=False,
        error_messages={
            "max_length": "Mã OTP phải có đúng 6 ký tự",
            "min_length": "Mã OTP phải có đúng 6 ký tự",
        },
    )

    company_name = serializers.CharField(
        max_length=255,
        required=False,
        allow_blank=True,
        error_messages={"max_length": "Tên công ty không được vượt quá 255 ký tự"},
    )
    tax_code = serializers.CharField(
        max_length=50,
        required=False,
        allow_blank=True,
        error_messages={"max_length": "Mã số thuế không được vượt quá 50 ký tự"},
    )

    def validate(self, data):
        """Kiểm tra password và password_confirm khớp nhau, và validate thông tin công ty"""
        if data.get("password") != data.get("password_confirm"):
            raise serializers.ValidationError(
                {"password_confirm": "Mật khẩu xác nhận không khớp"}
            )

        role = data.get("role", "candidate")

        if role == "company":
            # company_name is required when role is company
            company_name = data.get("company_name")
            if not company_name or not str(company_name).strip():
                raise serializers.ValidationError(
                    {"company_name": "Tên công ty là bắt buộc đối với nhà tuyển dụng"}
                )

        return data


class RegisterResponseSerializer(serializers.Serializer):
    access_token = serializers.CharField()
    refresh_token = serializers.CharField()
    user = CustomUserSerializer()


class ForgotPasswordSerializer(serializers.Serializer):
    email = serializers.EmailField()


class ResetPasswordSerializer(serializers.Serializer):
    email = serializers.EmailField()
    otp = serializers.RegexField(
        regex=r"^\d{6}$", error_messages={"invalid": "Mã OTP phải gồm đúng 6 chữ số"}
    )
    new_password = serializers.CharField(
        write_only=True,
        min_length=8,
        error_messages={"min_length": "Mật khẩu phải có ít nhất 8 ký tự"},
    )

    new_password_confirm = serializers.CharField(
        write_only=True
    )  # Xác thực lại mật khẩu

    def validate(self, data):
        """Kiểm tra new_password và new_password_confirm khớp nhau"""
        if data["new_password"] != data["new_password_confirm"]:
            raise serializers.ValidationError(
                {"new_password_confirm": "Mật khẩu xác nhận không khớp"}
            )
        return data


class ConfirmSetPasswordSerializer(serializers.Serializer):
    otp = serializers.RegexField(
        regex=r"^\d{6}$", error_messages={"invalid": "Ma OTP phai gom dung 6 chu so"}
    )
    new_password = serializers.CharField(
        write_only=True,
        min_length=8,
        error_messages={"min_length": "Mat khau phai co it nhat 8 ky tu"},
    )
    new_password_confirm = serializers.CharField(write_only=True)

    def validate(self, data):
        if data["new_password"] != data["new_password_confirm"]:
            raise serializers.ValidationError(
                {"new_password_confirm": "Mat khau xac nhan khong khop"}
            )
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
        if data["new_password"] != data["new_password_confirm"]:
            raise serializers.ValidationError(
                {"new_password_confirm": "Mật khẩu xác nhận không khớp"}
            )
        return data


class CheckEmailSerializer(serializers.Serializer):
    email = serializers.EmailField()


class SocialAuthSerializer(serializers.Serializer):
    access_token = serializers.CharField()
    provider = serializers.ChoiceField(choices=["google"], required=False)
    email = serializers.EmailField(required=False)
    full_name = serializers.CharField(required=False)
    role = serializers.ChoiceField(
        choices=["candidate", "company", "admin"], default="candidate", required=False
    )


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

    credential_id = serializers.CharField(help_text="Base64url-encoded credential ID")
    client_data_json = serializers.CharField(
        help_text="Base64url-encoded clientDataJSON"
    )
    attestation_object = serializers.CharField(
        help_text="Base64url-encoded attestationObject"
    )
    device_name = serializers.CharField(
        max_length=255,
        default="Passkey",
        required=False,
        help_text="Tên thiết bị (ví dụ: MacBook Touch ID)",
    )
    transports = serializers.ListField(
        child=serializers.CharField(),
        required=False,
        default=list,
        help_text="Danh sách transport types (usb, ble, nfc, internal, hybrid)",
    )


class PasskeyAuthOptionsSerializer(serializers.Serializer):
    """Input: yêu cầu tạo authentication options"""

    email = serializers.EmailField(
        required=False,
        allow_blank=True,
        help_text="Email của user (optional, nếu không cung cấp sẽ dùng discoverable credentials)",
    )


class PasskeyAuthVerifySerializer(serializers.Serializer):
    """Input: dữ liệu từ navigator.credentials.get() response"""

    session_id = serializers.CharField(help_text="Session ID từ bước generate options")
    credential_id = serializers.CharField(help_text="Base64url-encoded credential ID")
    client_data_json = serializers.CharField(
        help_text="Base64url-encoded clientDataJSON"
    )
    authenticator_data = serializers.CharField(
        help_text="Base64url-encoded authenticatorData"
    )
    signature = serializers.CharField(help_text="Base64url-encoded signature")
    user_handle = serializers.CharField(
        required=False,
        allow_blank=True,
        default="",
        help_text="Base64url-encoded user handle (cho discoverable credentials)",
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

    passkey_id = serializers.IntegerField(help_text="ID của passkey cần xóa")


class PasskeyUpdateNameSerializer(serializers.Serializer):
    """Input: cập nhật tên passkey"""

    device_name = serializers.CharField(max_length=255, help_text="Tên mới cho passkey")
