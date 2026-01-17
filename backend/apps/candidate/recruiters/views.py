from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated, AllowAny

from .models import Recruiter
from .serializers import (
    RecruiterSerializer, RecruiterCreateSerializer, RecruiterUpdateSerializer, JobSearchStatusSerializer
)
from .services.recruiters import (
    create_recruiter_service, update_recruiter_service,
    delete_recruiter_service, update_job_search_status_service,
    RecruiterInput
)
from .selectors.recruiters import get_recruiter_by_id

# TODO: Add new actions to RecruiterViewSet
# 1. @action(detail=True, methods=['get'], url_path='profile-completeness')
#    - get_completeness(self, request, pk=None)
#    - Use: calculate_profile_completeness_service, ProfileCompletenessSerializer
#
# 2. @action(detail=True, methods=['post'], url_path='avatar')
#    - upload_avatar(self, request, pk=None)
#    - Use: upload_recruiter_avatar_service, RecruiterAvatarSerializer
#
# 3. @action(detail=True, methods=['get'], url_path='public-profile')
#    - public_profile(self, request, pk=None)
#    - Use: RecruiterPublicProfileSerializer, check privacy, increment view count
#
# 4. @action(detail=True, methods=['patch'], url_path='privacy')
#    - update_privacy(self, request, pk=None)
#    - Use: update_recruiter_privacy_service, RecruiterPrivacySerializer
#
# 5. @action(detail=True, methods=['get'], url_path='stats')
#    - get_stats(self, request, pk=None)
#    - Use: get_recruiter_stats, RecruiterStatsSerializer

class RecruiterViewSet(viewsets.GenericViewSet):
    """
    ViewSet quản lý hồ sơ ứng viên (Recruiters).
    """
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return Recruiter.objects.all()

    def create(self, request):
        """
        POST /api/recruiters/ - Tạo hồ sơ ứng viên
        """
        serializer = RecruiterCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        try:
            input_data = RecruiterInput(**serializer.validated_data)
            recruiter = create_recruiter_service(user=request.user, data=input_data)
            return Response(RecruiterSerializer(recruiter).data, status=status.HTTP_201_CREATED)
        except ValueError as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def retrieve(self, request, pk=None):
        """
        GET /api/recruiters/:id/ - Xem chi tiết hồ sơ
        """
        recruiter = get_recruiter_by_id(pk)
        if not recruiter:
            return Response({"detail": "Not found recruiter"}, status=status.HTTP_404_NOT_FOUND)
        return Response(RecruiterSerializer(recruiter).data)

    def update(self, request, pk=None):
        """
        PUT /api/recruiters/:id/ - Cập nhật hồ sơ
        """
        recruiter = get_recruiter_by_id(pk)
        if not recruiter:
            return Response({"detail": "Not found recruiter"}, status=status.HTTP_404_NOT_FOUND)
            
        if recruiter.user != request.user:
             return Response({"detail": "Permission denied"}, status=status.HTTP_403_FORBIDDEN)
             
        serializer = RecruiterUpdateSerializer(data=request.data)
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
            return Response({"detail": "Not found recruiter"}, status=status.HTTP_404_NOT_FOUND)

        if recruiter.user != request.user:
             return Response({"detail": "Permission denied"}, status=status.HTTP_403_FORBIDDEN)
             
        delete_recruiter_service(recruiter)
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=['patch'], url_path='job-search-status')
    def update_status(self, request, pk=None):
        """
        PATCH /api/recruiters/:id/job-search-status - Cập nhật trạng thái tìm việc
        """
        recruiter = get_recruiter_by_id(pk)
        if not recruiter:
            return Response({"detail": "Not found recruiter"}, status=status.HTTP_404_NOT_FOUND)
            
        if recruiter.user != request.user:
             return Response({"detail": "Permission denied"}, status=status.HTTP_403_FORBIDDEN)
             
        serializer = JobSearchStatusSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        try:
            updated = update_job_search_status_service(recruiter, serializer.validated_data['job_search_status'])
            return Response(RecruiterSerializer(updated).data)
        except ValueError as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)
