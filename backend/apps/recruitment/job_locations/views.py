from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny

from apps.recruitment.jobs.selectors.jobs import get_job_by_id
from .models import JobLocation
from .serializers import JobLocationSerializer, JobLocationCreateSerializer
from .selectors.job_locations import list_locations_by_job, get_job_location_by_id
from .services.job_locations import (
    add_job_location,
    update_job_location,
    remove_job_location,
    JobLocationInput
)


class JobLocationViewSet(viewsets.GenericViewSet):
    """
        ViewSet cho quản lý job locations (địa điểm làm việc).
        Nested URL: /api/jobs/:job_id/locations/
    """
    
    def get_permissions(self):
        if self.action == 'list':
            return [AllowAny()]
        return [IsAuthenticated()]
    
    def get_queryset(self):
        job_id = self.kwargs.get('job_id')
        return list_locations_by_job(job_id)
    
    def _get_job_or_404(self, job_id):
        """
            Helper: Get job or return 404
        """
        job = get_job_by_id(job_id)
        if not job:
            return None, Response(
                {"detail": "Job not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        return job, None
    
    def _check_job_owner(self, request, job):
        """
            Helper: Check if user is job owner
        """
        if job.company.user != request.user:
            return Response(
                {"detail": "Permission denied"},
                status=status.HTTP_403_FORBIDDEN
            )
        return None
    
    def list(self, request, job_id=None):
        """
            GET /api/jobs/:job_id/locations/
            Danh sách địa điểm làm việc
        """
        job, error = self._get_job_or_404(job_id)
        if error:
            return error
        
        queryset = self.get_queryset()
        serializer = JobLocationSerializer(queryset, many=True)
        return Response(serializer.data)
    
    def create(self, request, job_id=None):
        """
            POST /api/jobs/:job_id/locations/
            Thêm địa điểm làm việc
        """
        job, error = self._get_job_or_404(job_id)
        if error:
            return error
        
        permission_error = self._check_job_owner(request, job)
        if permission_error:
            return permission_error
        
        serializer = JobLocationCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        try:
            input_data = JobLocationInput(**serializer.validated_data)
            job_location = add_job_location(job, input_data)
            return Response(
                JobLocationSerializer(job_location).data,
                status=status.HTTP_201_CREATED
            )
        except ValueError as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)
    
    def update(self, request, job_id=None, pk=None):
        """
            PUT /api/jobs/:job_id/locations/:id/
            Cập nhật địa điểm
        """
        job, error = self._get_job_or_404(job_id)
        if error:
            return error
        
        permission_error = self._check_job_owner(request, job)
        if permission_error:
            return permission_error
        
        job_location = get_job_location_by_id(pk)
        if not job_location or job_location.job_id != int(job_id):
            return Response(
                {"detail": "Job location not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        
        serializer = JobLocationCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        try:
            input_data = JobLocationInput(**serializer.validated_data)
            updated = update_job_location(job_location, input_data)
            return Response(JobLocationSerializer(updated).data)
        except ValueError as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)
    
    def destroy(self, request, job_id=None, pk=None):
        """
            DELETE /api/jobs/:job_id/locations/:id/
            Xóa địa điểm
        """
        job, error = self._get_job_or_404(job_id)
        if error:
            return error
        
        permission_error = self._check_job_owner(request, job)
        if permission_error:
            return permission_error
        
        job_location = get_job_location_by_id(pk)
        if not job_location or job_location.job_id != int(job_id):
            return Response(
                {"detail": "Job location not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        
        remove_job_location(job_location)
        return Response(status=status.HTTP_204_NO_CONTENT)
