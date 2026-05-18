from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated

from apps.candidate.recruiters.selectors.recruiters import get_recruiter_by_id
from .models import SavedJob
from .serializers import SavedJobSerializer, SavedJobUpdateSerializer, SavedJobCreateSerializer
from .selectors.saved_jobs import list_saved_jobs_by_recruiter, get_saved_job_by_id, get_saved_job_by_recruiter_and_job, is_job_saved
from .services.saved_jobs import save_job, unsave_job, update_saved_job, SavedJobUpdateInput
from apps.recruitment.jobs.models import Job


class RecruiterSavedJobViewSet(viewsets.GenericViewSet):
    """
        ViewSet cho danh sách saved jobs của recruiter.
        Nested URL: /api/recruiters/:recruiter_id/saved-jobs/
    """
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        recruiter_id = self.kwargs.get('recruiter_id')
        return list_saved_jobs_by_recruiter(recruiter_id)
    
    def _check_owner(self, request, recruiter_id):
        """
            Kiểm tra user có quyền sở hữu recruiter không
        """
        recruiter = get_recruiter_by_id(recruiter_id)
        if not recruiter:
            return None, Response(
                {"detail": "Recruiter not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        if recruiter.user != request.user:
            return None, Response(
                {"detail": "Permission denied"},
                status=status.HTTP_403_FORBIDDEN
            )
        return recruiter, None
    
    def list(self, request, recruiter_id=None):
        """
            GET /api/recruiters/:recruiter_id/saved-jobs/
            Danh sách việc làm đã lưu
        """
        recruiter, error = self._check_owner(request, recruiter_id)
        if error:
            return error
        
        jobs = list_saved_jobs_by_recruiter(recruiter_id)
        return Response(SavedJobSerializer(jobs, many=True).data)


class SavedJobViewSet(viewsets.GenericViewSet):
    """
        ViewSet cho quản lý saved jobs.
        URL: /api/saved-jobs/
        
        Endpoints:
        - GET    /api/saved-jobs/              — list (current user)
        - POST   /api/saved-jobs/              — save a job
        - PATCH  /api/saved-jobs/:id/          — update folder/notes
        - DELETE /api/saved-jobs/:id/          — unsave by saved_job id
        - DELETE /api/saved-jobs/by-job/:jobId/ — unsave by job id
        - GET    /api/saved-jobs/check/:jobId/ — check if job is saved
        - GET    /api/saved-jobs/folders/       — list unique folder names
    """
    permission_classes = [IsAuthenticated]
    
    def _get_recruiter(self, request):
        """Lấy recruiter profile của user hiện tại."""
        if not hasattr(request.user, 'recruiter_profile'):
            return None
        return request.user.recruiter_profile

    def list(self, request):
        """
            GET /api/saved-jobs/
            Danh sách việc làm đã lưu của user hiện tại
        """
        recruiter = self._get_recruiter(request)
        if not recruiter:
            return Response([], status=status.HTTP_200_OK)
        
        queryset = list_saved_jobs_by_recruiter(recruiter.id)
        
        # Filter by folder_name
        folder_name = request.query_params.get('folder_name')
        if folder_name:
            queryset = queryset.filter(folder_name=folder_name)
        
        # Pagination
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = SavedJobSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = SavedJobSerializer(queryset, many=True)
        return Response(serializer.data)

    def create(self, request):
        """
            POST /api/saved-jobs/
            Lưu một job mới. Body: { job_id: int, folder_name?: str, notes?: str }
        """
        recruiter = self._get_recruiter(request)
        if not recruiter:
            return Response(
                {"detail": "You don't have a recruiter profile"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        serializer = SavedJobCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        job_id = serializer.validated_data['job_id']
        try:
            job = Job.objects.get(id=job_id)
        except Job.DoesNotExist:
            return Response(
                {"detail": "Job not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        
        try:
            saved_job = save_job(
                recruiter=recruiter,
                job=job,
                folder_name=serializer.validated_data.get('folder_name'),
            )
        except ValueError as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        
        return Response(SavedJobSerializer(saved_job).data, status=status.HTTP_201_CREATED)

    def partial_update(self, request, pk=None):
        """
            PATCH /api/saved-jobs/:id/
            Cập nhật folder_name và notes
        """
        saved_job = get_saved_job_by_id(pk)
        if not saved_job:
            return Response(
                {"detail": "Saved job not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Check owner
        if saved_job.recruiter.user != request.user:
            return Response(
                {"detail": "Permission denied"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        serializer = SavedJobUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        input_data = SavedJobUpdateInput(**serializer.validated_data)
        updated = update_saved_job(saved_job, input_data)
        
        return Response(SavedJobSerializer(updated).data)

    def destroy(self, request, pk=None):
        """
            DELETE /api/saved-jobs/:id/
            Bỏ lưu job theo saved_job ID
        """
        saved_job = get_saved_job_by_id(pk)
        if not saved_job:
            return Response(
                {"detail": "Saved job not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        
        if saved_job.recruiter.user != request.user:
            return Response(
                {"detail": "Permission denied"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        saved_job.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=False, methods=['delete'], url_path='by-job/(?P<job_id>[0-9]+)')
    def unsave_by_job(self, request, job_id=None):
        """
            DELETE /api/saved-jobs/by-job/:jobId/
            Bỏ lưu job theo job ID
        """
        recruiter = self._get_recruiter(request)
        if not recruiter:
            return Response(
                {"detail": "You don't have a recruiter profile"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            job = Job.objects.get(id=job_id)
        except Job.DoesNotExist:
            return Response(
                {"detail": "Job not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        
        try:
            unsave_job(recruiter=recruiter, job=job)
        except ValueError as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=False, methods=['get'], url_path='check/(?P<job_id>[0-9]+)')
    def check_saved(self, request, job_id=None):
        """
            GET /api/saved-jobs/check/:jobId/
            Kiểm tra job đã được lưu chưa
        """
        recruiter = self._get_recruiter(request)
        if not recruiter:
            return Response({"is_saved": False})
        
        saved = is_job_saved(recruiter.id, int(job_id))
        result = {"is_saved": saved}
        
        if saved:
            saved_job = get_saved_job_by_recruiter_and_job(recruiter.id, int(job_id))
            if saved_job:
                result["saved_job_id"] = saved_job.id
        
        return Response(result)

    @action(detail=False, methods=['get'], url_path='folders')
    def folders(self, request):
        """
            GET /api/saved-jobs/folders/
            Lấy danh sách unique folder names
        """
        recruiter = self._get_recruiter(request)
        if not recruiter:
            return Response([])
        
        folder_names = (
            SavedJob.objects
            .filter(recruiter=recruiter, folder_name__isnull=False)
            .exclude(folder_name='')
            .values_list('folder_name', flat=True)
            .distinct()
            .order_by('folder_name')
        )
        
        return Response(list(folder_names))
