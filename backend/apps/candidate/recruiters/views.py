from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated
from apps.core.pagination import StandardResultsSetPagination

from .models import Recruiter
from .serializers import (
    RecruiterSerializer,
    RecruiterCreateSerializer,
    RecruiterUpdateSerializer,
    JobSearchStatusSerializer,
    RecruiterAvatarSerializer,
    RecruiterPublicProfileSerializer,
    RecruiterPrivacySerializer,
    RecruiterStatsSerializer,
    RecruiterApplicationSerializer,
    SavedJobSerializer,
)
from .services.recruiters import (
    create_recruiter_service,
    update_recruiter_service,
    delete_recruiter_service,
    update_job_search_status_service,
    calculate_profile_completeness_service,
    upload_recruiter_avatar_service,
    update_recruiter_privacy_service,
    RecruiterInput,
)
from .selectors.recruiters import (
    get_recruiter_by_id,
    get_recruiter_stats,
    search_recruiters,
    get_recruiter_applications,
    get_saved_jobs,
)


class RecruiterViewSet(viewsets.GenericViewSet):
    """
    ViewSet quản lý hồ sơ ứng viên (Recruiters).
    """

    permission_classes = [IsAuthenticated]
    pagination_class = StandardResultsSetPagination

    def get_permissions(self):
        if self.action == "public_profile":
            return [AllowAny()]
        return super().get_permissions()

    def get_queryset(self):
        return Recruiter.objects.all()

    def list(self, request):
        """
        GET /api/recruiters/ - Liệt kê và tìm kiếm ứng viên
        """
        recruiters = search_recruiters(request.query_params)
        page = self.paginate_queryset(recruiters)
        if page is not None:
            serializer = RecruiterSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = RecruiterSerializer(recruiters, many=True)
        return Response(serializer.data)

    def create(self, request):
        """
        POST /api/recruiters/ - Tạo hồ sơ ứng viên
        """
        serializer = RecruiterCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            input_data = RecruiterInput(**serializer.validated_data)
            recruiter = create_recruiter_service(user=request.user, data=input_data)
            return Response(
                RecruiterSerializer(recruiter).data, status=status.HTTP_201_CREATED
            )
        except ValueError as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def retrieve(self, request, pk=None):
        """
        GET /api/recruiters/:id/ - Xem chi tiết hồ sơ
        """
        recruiter = get_recruiter_by_id(pk)
        if not recruiter:
            return Response(
                {"detail": "Not found recruiter"}, status=status.HTTP_404_NOT_FOUND
            )

        from .serializers import RecruiterDetailSerializer

        return Response(RecruiterDetailSerializer(recruiter).data)

    def update(self, request, pk=None):
        """
        PUT /api/recruiters/:id/ - Cập nhật hồ sơ
        """
        return self._update(request, pk, partial=False)

    def partial_update(self, request, pk=None):
        """
        PATCH /api/recruiters/:id/ - Cập nhật một phần hồ sơ
        """
        return self._update(request, pk, partial=True)

    def _update(self, request, pk=None, partial=False):
        recruiter = get_recruiter_by_id(pk)
        if not recruiter:
            return Response(
                {"detail": "Not found recruiter"}, status=status.HTTP_404_NOT_FOUND
            )

        if recruiter.user != request.user:
            return Response(
                {"detail": "Permission denied"}, status=status.HTTP_403_FORBIDDEN
            )

        serializer = RecruiterUpdateSerializer(data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)

        try:
            input_data = RecruiterInput(**serializer.validated_data)
            updated = update_recruiter_service(recruiter, input_data)
            return Response(RecruiterSerializer(updated).data)
        except ValueError as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def destroy(self, request, pk=None):
        """
        DELETE /api/recruiters/:id/ - Xóa hồ sơ
        """
        recruiter = get_recruiter_by_id(pk)
        if not recruiter:
            return Response(
                {"detail": "Not found recruiter"}, status=status.HTTP_404_NOT_FOUND
            )

        if recruiter.user != request.user:
            return Response(
                {"detail": "Permission denied"}, status=status.HTTP_403_FORBIDDEN
            )

        delete_recruiter_service(recruiter)
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=False, methods=["get"], url_path="me")
    def me(self, request):
        """
        GET /api/recruiters/me/ - Lấy hồ sơ ứng viên của user hiện tại
        """
        try:
            recruiter = Recruiter.objects.get(user=request.user)
        except Recruiter.DoesNotExist:
            # Nếu user có role candidate nhưng chưa có profile (do lỗi logic cũ hoặc db mới), tạo luôn
            if hasattr(request.user, "role") and request.user.role == "candidate":
                recruiter = Recruiter.objects.create(user=request.user)
            else:
                return Response(
                    {"detail": "You don't have a recruiter profile"},
                    status=status.HTTP_404_NOT_FOUND,
                )

        from .serializers import RecruiterDetailSerializer

        return Response(RecruiterDetailSerializer(recruiter).data)

    @action(detail=True, methods=["patch"], url_path="job-search-status")
    def update_status(self, request, pk=None):
        """
        PATCH /api/recruiters/:id/job-search-status - Cập nhật trạng thái tìm việc
        """
        recruiter = get_recruiter_by_id(pk)
        if not recruiter:
            return Response(
                {"detail": "Not found recruiter"}, status=status.HTTP_404_NOT_FOUND
            )

        if recruiter.user != request.user:
            return Response(
                {"detail": "Permission denied"}, status=status.HTTP_403_FORBIDDEN
            )

        serializer = JobSearchStatusSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            updated = update_job_search_status_service(
                recruiter, serializer.validated_data["job_search_status"]
            )
            return Response(RecruiterSerializer(updated).data)
        except ValueError as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=["get"], url_path="profile-completeness")
    def get_completeness(self, request, pk=None):
        """
        GET /api/recruiters/:id/profile-completeness - Lấy mức độ hoàn thiện hồ sơ
        """
        recruiter = get_recruiter_by_id(pk)
        if not recruiter:
            return Response(
                {"detail": "Not found recruiter"}, status=status.HTTP_404_NOT_FOUND
            )

        if recruiter.user != request.user:
            return Response(
                {"detail": "Permission denied"}, status=status.HTTP_403_FORBIDDEN
            )

        completeness = calculate_profile_completeness_service(recruiter)
        return Response(completeness)

    @action(detail=True, methods=["post"], url_path="avatar")
    def upload_avatar(self, request, pk=None):
        """
        POST /api/recruiters/:id/avatar - Upload avatar
        """
        recruiter = get_recruiter_by_id(pk)
        if not recruiter:
            return Response(
                {"detail": "Not found recruiter"}, status=status.HTTP_404_NOT_FOUND
            )

        if recruiter.user != request.user:
            return Response(
                {"detail": "Permission denied"}, status=status.HTTP_403_FORBIDDEN
            )

        serializer = RecruiterAvatarSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            updated = upload_recruiter_avatar_service(
                recruiter, serializer.validated_data
            )
            return Response(RecruiterSerializer(updated).data)
        except ValueError as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=["get"], url_path="public_profile")
    def public_profile(self, request, pk=None):
        """
        GET /api/recruiters/:id/public_profile - Lấy hồ sơ công khai
        """
        recruiter = get_recruiter_by_id(pk)
        if not recruiter:
            return Response(
                {"detail": "Not found recruiter"}, status=status.HTTP_404_NOT_FOUND
            )

        if not recruiter.is_profile_public:
            return Response(
                {"detail": "Profile is not public"}, status=status.HTTP_403_FORBIDDEN
            )

        return Response(RecruiterPublicProfileSerializer(recruiter).data)

    @action(detail=True, methods=["patch"], url_path="privacy")
    def update_privacy(self, request, pk=None):
        """
        PATCH /api/recruiters/:id/privacy - Cập nhật trạng thái riêng tư
        """
        recruiter = get_recruiter_by_id(pk)
        if not recruiter:
            return Response(
                {"detail": "Not found recruiter"}, status=status.HTTP_404_NOT_FOUND
            )

        if recruiter.user != request.user:
            return Response(
                {"detail": "Permission denied"}, status=status.HTTP_403_FORBIDDEN
            )

        serializer = RecruiterPrivacySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            updated = update_recruiter_privacy_service(
                recruiter, serializer.validated_data["is_profile_public"]
            )
            return Response(RecruiterSerializer(updated).data)
        except ValueError as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=["get"], url_path="stats")
    def get_stats(self, request, pk=None):
        """
        GET /api/recruiters/:id/stats - Lấy thống kê hồ sơ
        """
        recruiter = get_recruiter_by_id(pk)
        if not recruiter:
            return Response(
                {"detail": "Not found recruiter"}, status=status.HTTP_404_NOT_FOUND
            )

        if recruiter.user != request.user:
            return Response(
                {"detail": "Permission denied"}, status=status.HTTP_403_FORBIDDEN
            )

        stats = get_recruiter_stats(recruiter)
        return Response(RecruiterStatsSerializer(stats).data)

    @action(detail=False, methods=["get"], url_path="search")
    def search(self, request):
        """
        GET /api/recruiters/search - Tìm kiếm hồ sơ ứng viên
        """
        user = request.user
        # Check if user has company role
        if not hasattr(user, "role") or user.role != "company":
            return Response(
                {"detail": "Permission denied"}, status=status.HTTP_403_FORBIDDEN
            )

        recruiters = search_recruiters(request.query_params)
        return Response(RecruiterSerializer(recruiters, many=True).data)

    @action(detail=True, methods=["get"], url_path="applications")
    def applications(self, request, pk=None):
        """
        GET /api/recruiters/:id/applications - Lấy các CV đã ứng tuyển
        """
        recruiter = get_recruiter_by_id(pk)
        if not recruiter:
            return Response(
                {"detail": "Not found recruiter"}, status=status.HTTP_404_NOT_FOUND
            )

        if recruiter.user != request.user:
            return Response(
                {"detail": "Permission denied"}, status=status.HTTP_403_FORBIDDEN
            )

        applications = get_recruiter_applications(recruiter)
        return Response(RecruiterApplicationSerializer(applications, many=True).data)

    @action(detail=True, methods=["post"], url_path="verify-phone")
    def verify_phone(self, request, pk=None):
        """
        POST /api/recruiters/:id/verify-phone - Xác thực số điện thoại
        """
        recruiter = get_recruiter_by_id(pk)
        if not recruiter:
            return Response(
                {"detail": "Not found recruiter"}, status=status.HTTP_404_NOT_FOUND
            )

        if recruiter.user != request.user:
            return Response(
                {"detail": "Permission denied"}, status=status.HTTP_403_FORBIDDEN
            )

        # Logic giả định xác thực số điện thoại (thường qua OTP)
        # Ở đây chỉ cập nhật trạng thái đã xác thực
        phone = request.data.get("phone")
        if not phone:
            return Response(
                {"detail": "Phone is required"}, status=status.HTTP_400_BAD_REQUEST
            )

        return Response({"detail": "Phone verified successfully"})

    @action(detail=True, methods=["get"], url_path="saved-jobs")
    def saved_jobs(self, request, pk=None):
        """
        GET /api/recruiters/:id/saved-jobs - Lấy các công việc đã lưu
        """
        recruiter = get_recruiter_by_id(pk)
        if not recruiter:
            return Response(
                {"detail": "Not found recruiter"}, status=status.HTTP_404_NOT_FOUND
            )

        if recruiter.user != request.user:
            return Response(
                {"detail": "Permission denied"}, status=status.HTTP_403_FORBIDDEN
            )

        jobs = get_saved_jobs(recruiter)
        return Response(SavedJobSerializer(jobs, many=True).data)
