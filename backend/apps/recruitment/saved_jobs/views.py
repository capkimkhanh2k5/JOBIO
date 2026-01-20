from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from apps.candidate.recruiters.selectors.recruiters import get_recruiter_by_user, get_recruiter_by_id
from .models import SavedJob
from .serializers import SavedJobSerializer, SavedJobUpdateSerializer
from .selectors.saved_jobs import list_saved_jobs_by_recruiter, get_saved_job_by_id
from .services.saved_jobs import update_saved_job, SavedJobUpdateInput


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
        ViewSet cho cập nhật saved job.
        URL: /api/saved-jobs/:id/
    """
    permission_classes = [IsAuthenticated]
    
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
