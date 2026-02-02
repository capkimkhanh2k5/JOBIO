from rest_framework import viewsets, mixins, status
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework_simplejwt.views import TokenRefreshView

from .permissions import IsAdmin
from apps.core.throttles import (
    LoginRateThrottle, RegisterRateThrottle, PasswordResetRateThrottle,
    EmailVerificationRateThrottle, SocialAuthRateThrottle
)

from .models import CustomUser
from .services.auth import (
    login_user, logout_user, register_user, forgot_password, reset_password, 
    verify_email, resend_verification, change_password, check_email,
    social_login, verify_2fa,
    LoginInput, LogoutInput, RegisterInput, ForgotPasswordInput, 
    ResetPasswordInput, VerifyEmailInput, ResendVerificationInput, 
    ChangePasswordInput, CheckEmailInput, SocialLoginInput, Verify2FAInput,
    AuthenticationError
)
from .services.users import create_user, UserCreateInput, bulk_user_action, upload_user_avatar, update_user_role, update_user_status, delete_user, update_user, UserUpdateInput
from .selectors.users import list_users, get_user_stats, export_users_csv
from .serializers import (
    CustomUserSerializer, LoginSerializer, LogoutSerializer, 
    LoginResponseSerializer, RegisterSerializer, RegisterResponseSerializer, 
    ForgotPasswordSerializer, ResetPasswordSerializer, VerifyEmailSerializer, 
    ResendVerificationSerializer, ChangePasswordSerializer, CheckEmailSerializer,
    SocialAuthSerializer, Verify2FASerializer,
    UserUpdateSerializer, UserStatusSerializer, UserRoleSerializer, UserAvatarSerializer
)
from django.http import HttpResponse

from apps.system.activity_logs.models import ActivityLog
from apps.system.activity_logs.serializers import ActivityLogSerializer


class CustomUserViewSet(viewsets.GenericViewSet, mixins.RetrieveModelMixin, mixins.ListModelMixin):
    """
        ViewSet cho quản lý User và Authentication
    """
    serializer_class = CustomUserSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return list_users(filters=self.request.query_params)

    def get_permissions(self):
        # Public endpoints (không cần auth)
        public_actions = [
            'create', 'auth_login', 'auth_register', 'auth_forgot_password',
            'auth_reset_password', 'auth_verify_email', 'auth_resend_verification',
            'auth_check_email', 'auth_social_login'
        ]
        if self.action in public_actions:
            return [AllowAny()]
        
        # Admin only endpoints
        admin_actions = ['destroy', 'update_status_action', 'update_role_action']
        if self.action in admin_actions:
            return [IsAuthenticated(), IsAdmin()]
            
        return super().get_permissions()

    def create(self, request, *args, **kwargs):
        """POST /api/users/ - Tạo user mới"""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            user_input = UserCreateInput(
                email=serializer.validated_data['email'],
                password=serializer.validated_data['password'],
                role=serializer.validated_data.get('role', CustomUser.Role.RECRUITER)
            )
            user = create_user(data=user_input)
        except Exception as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)

        output_serializer = self.get_serializer(user)
        return Response(output_serializer.data, status=status.HTTP_201_CREATED)

    def update(self, request, *args, **kwargs):
        """PUT /api/users/:id/ - Cập nhật user"""
        user = self.get_object()
        
        # Quyền: Chỉ user hoặc admin mới được cập nhật
        if request.user.id != user.id and request.user.role != CustomUser.Role.ADMIN:
            return Response(
                {"detail": "Bạn không có quyền cập nhật thông tin user này."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        serializer = UserUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        updated_user = update_user(
            user=user, 
            data=UserUpdateInput(**serializer.validated_data)
        )
        
        return Response(CustomUserSerializer(updated_user).data)

    def destroy(self, request, *args, **kwargs):
        """DELETE /api/users/:id/ - Xóa user"""
        user = self.get_object()
        delete_user(user)
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=['patch'], url_path='status')
    def update_status_action(self, request, pk=None):
        """PATCH /api/users/:id/status - Cập nhật status"""
        user = self.get_object()
        serializer = UserStatusSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        try:
            updated_user = update_user_status(user, serializer.validated_data['status'])
            return Response(CustomUserSerializer(updated_user).data)
        except ValueError as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['patch'], url_path='role')
    def update_role_action(self, request, pk=None):
        """
            PATCH /api/users/:id/role - Cập nhật role
        """
        user = self.get_object()
        serializer = UserRoleSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        try:
            updated_user = update_user_role(user, serializer.validated_data['role'])
            return Response(CustomUserSerializer(updated_user).data)
        except ValueError as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post', 'delete'], url_path='avatar', parser_classes=[MultiPartParser, FormParser])
    def manage_avatar(self, request, pk=None):
        """
            POST/DELETE /api/users/:id/avatar - Quản lý avatar
        """
        user = self.get_object()
        
        # Permission check: chỉ chính user hoặc admin mới được quản lý avatar
        if request.user.id != user.id and request.user.role != CustomUser.Role.ADMIN:
            return Response(
                {"detail": "Bạn không có quyền quản lý avatar của user này."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        if request.method == 'POST':
            serializer = UserAvatarSerializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            
            try:
                updated_user = upload_user_avatar(user, serializer.validated_data['avatar'])
                return Response(CustomUserSerializer(updated_user).data)
            except Exception as e:
                return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)
                
        elif request.method == 'DELETE':
            user.avatar_url = None
            user.save(update_fields=['avatar_url'])
            return Response(CustomUserSerializer(user).data)

    @action(detail=False, methods=['get'], url_path='me')
    def me(self, request):
        """GET /api/users/me/ - Lấy thông tin user hiện tại"""
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)

    @action(detail=True, methods=['get'], url_path='activity-logs')
    def activity_logs(self, request, pk=None):
        """GET /api/users/:id/activity-logs - Lịch sử hoạt động"""
        user = self.get_object()
        
        logs = ActivityLog.objects.filter(user=user)
        page = self.paginate_queryset(logs)
        if page is not None:
            serializer = ActivityLogSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)
            
        serializer = ActivityLogSerializer(logs, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], url_path='stats')
    def stats(self, request):
        """GET /api/users/stats/ - Thống kê users (admin only)"""
        if not request.user.role == CustomUser.Role.ADMIN:
             return Response({"detail": "Permission denied"}, status=status.HTTP_403_FORBIDDEN)
             
        data = get_user_stats()
        return Response(data)

    @action(detail=False, methods=['get'], url_path='export')
    def export(self, request):
        """GET /api/users/export/ - Export users CSV (admin only)"""
        if not request.user.role == CustomUser.Role.ADMIN:
             return Response({"detail": "Permission denied"}, status=status.HTTP_403_FORBIDDEN)
             
        try:
            csv_content = export_users_csv()
            response = HttpResponse(csv_content, content_type='text/csv')
            response['Content-Disposition'] = 'attachment; filename="users_export.csv"'
            return response
        except Exception as e:
             return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['post'], url_path='bulk-action')
    def bulk_action(self, request):
        """POST /api/users/bulk-action/ - Bulk actions (admin only)"""
        if not request.user.role == CustomUser.Role.ADMIN:
             return Response({"detail": "Permission denied"}, status=status.HTTP_403_FORBIDDEN)
             
        ids = request.data.get('ids', [])
        action_type = request.data.get('action')
        value = request.data.get('value')
        
        if not ids or not action_type:
            return Response({"detail": "Missing ids or action"}, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            result = bulk_user_action(ids, action_type, value)
            return Response(result)
        except ValueError as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['post'], url_path='auth/login', throttle_classes=[LoginRateThrottle])
    def auth_login(self, request):
        """POST /api/users/auth/login/ - Đăng nhập"""
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            result = login_user(data=LoginInput(
                email=serializer.validated_data['email'],
                password=serializer.validated_data['password']
            ))
        except AuthenticationError as e:
            return Response({"detail": str(e)}, status=status.HTTP_401_UNAUTHORIZED)

        output_serializer = LoginResponseSerializer(result)
        return Response(output_serializer.data, status=status.HTTP_200_OK)

    @action(detail=False, methods=['post'], url_path='auth/logout')
    def auth_logout(self, request):
        """POST /api/users/auth/logout/ - Đăng xuất"""
        serializer = LogoutSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            logout_user(data=LogoutInput(
                refresh_token=serializer.validated_data['refresh_token']
            ))
        except AuthenticationError as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)

        return Response({"detail": "Logout successfully"}, status=status.HTTP_200_OK)

    @action(detail=False, methods=['post'], url_path='auth/register', throttle_classes=[RegisterRateThrottle])
    def auth_register(self, request):
        """POST /api/users/auth/register/ - Đăng ký"""
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        try:
            result = register_user(data=RegisterInput(
                email=serializer.validated_data['email'],
                password=serializer.validated_data['password'],
                full_name=serializer.validated_data['full_name'],
                role=serializer.validated_data.get('role', 'recruiter')
            ))
        except AuthenticationError as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        
        output_serializer = RegisterResponseSerializer(result)
        return Response(output_serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['post'], url_path='auth/forgot-password', throttle_classes=[PasswordResetRateThrottle])
    def auth_forgot_password(self, request):
        """POST /api/users/auth/forgot-password/ - Quên mật khẩu"""
        serializer = ForgotPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        try:
            forgot_password(data=ForgotPasswordInput(
                email=serializer.validated_data['email']
            ))
        except AuthenticationError as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        
        return Response({"detail": "Email has been sent"}, status=status.HTTP_200_OK)

    @action(detail=False, methods=['post'], url_path='auth/reset-password')
    def auth_reset_password(self, request):
        """POST /api/users/auth/reset-password/ - Reset mật khẩu"""
        serializer = ResetPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        try:
            reset_password(data=ResetPasswordInput(
                reset_token=serializer.validated_data['token'],
                new_password=serializer.validated_data['new_password']
            ))
        except AuthenticationError as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        
        return Response({"detail": "Password has been changed"}, status=status.HTTP_200_OK)

    @action(detail=False, methods=['post'], url_path='auth/verify-email')
    def auth_verify_email(self, request):
        """POST /api/users/auth/verify-email/ - Xác thực email"""
        serializer = VerifyEmailSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        try:
            verify_email(data=VerifyEmailInput(
                token=serializer.validated_data['email_verification_token']
            ))
        except AuthenticationError as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        
        return Response({"detail": "Email has been verified"}, status=status.HTTP_200_OK)

    @action(detail=False, methods=['post'], url_path='auth/resend-verification', throttle_classes=[EmailVerificationRateThrottle])
    def auth_resend_verification(self, request):
        """POST /api/users/auth/resend-verification/ - Gửi lại email xác thực"""
        serializer = ResendVerificationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        try:
            resend_verification(data=ResendVerificationInput(
                email=serializer.validated_data['email']
            ))
        except AuthenticationError as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        
        return Response({"detail": "Email verification has been resend"}, status=status.HTTP_200_OK)

    @action(detail=False, methods=['post'], url_path='auth/change-password')
    def auth_change_password(self, request):
        """POST /api/users/auth/change-password/ - Đổi mật khẩu"""
        serializer = ChangePasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        try:
            change_password(data=ChangePasswordInput(
                user_id=request.user.id,
                old_password=serializer.validated_data['old_password'],
                new_password=serializer.validated_data['new_password']
            ))
        except AuthenticationError as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        
        return Response({"detail": "Password has been changed"}, status=status.HTTP_200_OK)

    @action(detail=False, methods=['post'], url_path='auth/check-email')
    def auth_check_email(self, request):
        """POST /api/users/auth/check-email/ - Kiểm tra email"""
        serializer = CheckEmailSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        try:
            result = check_email(data=CheckEmailInput(email=serializer.validated_data['email']))
        except AuthenticationError as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        
        return Response(result, status=status.HTTP_200_OK)

    @action(detail=False, methods=['get'], url_path='auth/me')
    def auth_me(self, request):
        """GET /api/users/auth/me/ - Lấy thông tin user hiện tại"""
        serializer = CustomUserSerializer(request.user)
        return Response(serializer.data)

    @action(detail=False, methods=['post'], url_path='auth/social/(?P<provider>[^/.]+)', throttle_classes=[SocialAuthRateThrottle])
    def auth_social_login(self, request, provider=None):
        """POST /api/users/auth/social/:provider/ - Đăng nhập social"""
        serializer = SocialAuthSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        try:
            result = social_login(data=SocialLoginInput(
                provider=provider,
                access_token=serializer.validated_data['access_token'],
                email=serializer.validated_data['email'],
                full_name=serializer.validated_data['full_name'],
                role=serializer.validated_data.get('role', 'recruiter')
            ))
        except AuthenticationError as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        
        output_serializer = LoginResponseSerializer(result)
        return Response(output_serializer.data, status=status.HTTP_200_OK)

    @action(detail=False, methods=['post'], url_path='auth/verify-2fa')
    def auth_verify_2fa(self, request):
        """POST /api/users/auth/verify-2fa/ - Xác thực 2FA"""
        serializer = Verify2FASerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        try:
            result = verify_2fa(data=Verify2FAInput(
                user_id=request.user.id,
                code=serializer.validated_data['code']
            ))
        except AuthenticationError as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        
        return Response(result, status=status.HTTP_200_OK)