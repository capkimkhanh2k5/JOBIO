from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated

from .serializers import (
    EducationSerializer,
    EducationCreateSerializer,
    EducationUpdateSerializer,
    EducationReorderSerializer,
)


class RecruiterEducationViewSet(viewsets.GenericViewSet):
    """
    ViewSet quản lý học vấn của ứng viên (Recruiter Education).

    Nested URLs: /api/recruiters/:recruiter_id/education/
    """

    permission_classes = [IsAuthenticated]

    def get_permissions(self):
        if self.action in {"list", "retrieve"}:
            return [AllowAny()]
        return super().get_permissions()

    def get_queryset(self):
        from .selectors.recruiter_education import list_education_by_recruiter

        recruiter_id = self.kwargs.get("recruiter_id")
        return list_education_by_recruiter(recruiter_id)

    def _get_recruiter_or_404(self, recruiter_id):
        """
        Helper: Get recruiter or return 404 response
        """
        from apps.candidate.recruiters.selectors.recruiters import get_recruiter_by_id

        recruiter = get_recruiter_by_id(recruiter_id)
        if not recruiter:
            return None, Response(
                {"detail": "Recruiter not found"}, status=status.HTTP_404_NOT_FOUND
            )
        return recruiter, None

    def _check_owner_permission(self, request, recruiter):
        """
        Helper: Check if request user is the owner
        """
        if recruiter.user != request.user:
            return Response(
                {"detail": "Permission denied"}, status=status.HTTP_403_FORBIDDEN
            )
        return None

    def _check_public_or_owner_permission(self, request, recruiter):
        if not request.user.is_authenticated:
            return Response(
                {"detail": "Authentication required"},
                status=status.HTTP_401_UNAUTHORIZED,
            )
        if recruiter.user == request.user:
            return None
        return Response(
            {"detail": "Permission denied"}, status=status.HTTP_403_FORBIDDEN
        )

    def list(self, request, recruiter_id=None):
        """
        GET /api/recruiters/:recruiter_id/education/
        Danh sách học vấn của ứng viên
        """
        from .selectors.recruiter_education import list_education_by_recruiter

        recruiter, error = self._get_recruiter_or_404(recruiter_id)
        if error:
            return error
        permission_error = self._check_public_or_owner_permission(request, recruiter)
        if permission_error:
            return permission_error

        queryset = list_education_by_recruiter(recruiter_id)
        serializer = EducationSerializer(queryset, many=True)
        return Response(serializer.data)

    def create(self, request, recruiter_id=None):
        """
        POST /api/recruiters/:recruiter_id/education/
        Thêm học vấn mới
        """
        from .services.recruiter_education import (
            create_education_service,
            EducationInput,
        )

        recruiter, error = self._get_recruiter_or_404(recruiter_id)
        if error:
            return error

        # Only owner can create
        permission_error = self._check_owner_permission(request, recruiter)
        if permission_error:
            return permission_error

        serializer = EducationCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            input_data = EducationInput(**serializer.validated_data)
            education = create_education_service(recruiter, input_data)
            return Response(
                EducationSerializer(education).data, status=status.HTTP_201_CREATED
            )
        except ValueError as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def retrieve(self, request, recruiter_id=None, pk=None):
        """
        GET /api/recruiters/:recruiter_id/education/:pk/
        Chi tiết một học vấn
        """
        from .selectors.recruiter_education import get_education_by_id

        recruiter, error = self._get_recruiter_or_404(recruiter_id)
        if error:
            return error
        permission_error = self._check_public_or_owner_permission(request, recruiter)
        if permission_error:
            return permission_error

        education = get_education_by_id(pk)
        if not education:
            return Response(
                {"detail": "Education not found"}, status=status.HTTP_404_NOT_FOUND
            )

        if education.recruiter_id != int(recruiter_id):
            return Response(
                {"detail": "Education not found"}, status=status.HTTP_404_NOT_FOUND
            )

        return Response(EducationSerializer(education).data)

    def update(self, request, recruiter_id=None, pk=None):
        """
        PUT /api/recruiters/:recruiter_id/education/:pk/
        Cập nhật học vấn
        """
        return self._update(request, recruiter_id, pk, partial=False)

    def partial_update(self, request, recruiter_id=None, pk=None):
        """
        PATCH /api/recruiters/:recruiter_id/education/:pk/
        Cập nhật một phần học vấn
        """
        return self._update(request, recruiter_id, pk, partial=True)

    def _update(self, request, recruiter_id, pk, partial=False):
        from .selectors.recruiter_education import get_education_by_id
        from .services.recruiter_education import (
            update_education_service,
            EducationInput,
        )

        recruiter, error = self._get_recruiter_or_404(recruiter_id)
        if error:
            return error

        education = get_education_by_id(pk)
        if not education:
            return Response(
                {"detail": "Education not found"}, status=status.HTTP_404_NOT_FOUND
            )

        if education.recruiter_id != int(recruiter_id):
            return Response(
                {"detail": "Education not found"}, status=status.HTTP_404_NOT_FOUND
            )

        # Only owner can update
        permission_error = self._check_owner_permission(request, recruiter)
        if permission_error:
            return permission_error

        serializer = EducationUpdateSerializer(data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)

        try:
            input_data = EducationInput(**serializer.validated_data)
            updated = update_education_service(education, input_data)
            return Response(EducationSerializer(updated).data)
        except ValueError as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def destroy(self, request, recruiter_id=None, pk=None):
        """
        DELETE /api/recruiters/:recruiter_id/education/:pk/
        Xóa học vấn
        """
        from .selectors.recruiter_education import get_education_by_id
        from .services.recruiter_education import delete_education_service

        recruiter, error = self._get_recruiter_or_404(recruiter_id)
        if error:
            return error

        education = get_education_by_id(pk)
        if not education:
            return Response(
                {"detail": "Education not found"}, status=status.HTTP_404_NOT_FOUND
            )

        if education.recruiter_id != int(recruiter_id):
            return Response(
                {"detail": "Education not found"}, status=status.HTTP_404_NOT_FOUND
            )

        # Only owner can delete
        permission_error = self._check_owner_permission(request, recruiter)
        if permission_error:
            return permission_error

        delete_education_service(education)
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=False, methods=["patch"], url_path="reorder")
    def reorder(self, request, recruiter_id=None):
        """
        PATCH /api/recruiters/:recruiter_id/education/reorder/
        Sắp xếp lại thứ tự hiển thị
        """
        from .services.recruiter_education import reorder_education_service
        from .selectors.recruiter_education import list_education_by_recruiter

        recruiter, error = self._get_recruiter_or_404(recruiter_id)
        if error:
            return error

        # Only owner can reorder
        permission_error = self._check_owner_permission(request, recruiter)
        if permission_error:
            return permission_error

        serializer = EducationReorderSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            reorder_education_service(recruiter, serializer.validated_data["order"])
            # Return updated list
            queryset = list_education_by_recruiter(recruiter_id)
            return Response(EducationSerializer(queryset, many=True).data)
        except ValueError as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)
