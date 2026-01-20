from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny

from apps.recruitment.jobs.selectors.jobs import get_job_by_id
from .models import JobSkill
from .serializers import JobSkillSerializer, JobSkillCreateSerializer
from .selectors.job_skills import list_skills_by_job, get_job_skill_by_id
from .services.job_skills import (
    add_job_skill,
    update_job_skill,
    remove_job_skill,
    JobSkillInput
)


class JobSkillViewSet(viewsets.GenericViewSet):
    """
        ViewSet cho quản lý job skills (kỹ năng yêu cầu cho job).
        Nested URL: /api/jobs/:job_id/skills/
    """
    
    def get_permissions(self):
        if self.action == 'list':
            return [AllowAny()]
        return [IsAuthenticated()]
    
    def get_queryset(self):
        job_id = self.kwargs.get('job_id')
        return list_skills_by_job(job_id)
    
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
            GET /api/jobs/:job_id/skills/
            Danh sách kỹ năng yêu cầu
        """
        job, error = self._get_job_or_404(job_id)
        if error:
            return error
        
        queryset = self.get_queryset()
        serializer = JobSkillSerializer(queryset, many=True)
        return Response(serializer.data)
    
    def create(self, request, job_id=None):
        """
            POST /api/jobs/:job_id/skills/
            Thêm kỹ năng yêu cầu
        """
        job, error = self._get_job_or_404(job_id)
        if error:
            return error
        
        permission_error = self._check_job_owner(request, job)
        if permission_error:
            return permission_error
        
        serializer = JobSkillCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        try:
            input_data = JobSkillInput(**serializer.validated_data)
            job_skill = add_job_skill(job, input_data)
            return Response(
                JobSkillSerializer(job_skill).data,
                status=status.HTTP_201_CREATED
            )
        except ValueError as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)
    
    def update(self, request, job_id=None, pk=None):
        """
            PUT /api/jobs/:job_id/skills/:id/
            Cập nhật kỹ năng
        """
        job, error = self._get_job_or_404(job_id)
        if error:
            return error
        
        permission_error = self._check_job_owner(request, job)
        if permission_error:
            return permission_error
        
        job_skill = get_job_skill_by_id(pk)
        if not job_skill or job_skill.job_id != int(job_id):
            return Response(
                {"detail": "Job skill not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        
        serializer = JobSkillCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        try:
            input_data = JobSkillInput(**serializer.validated_data)
            updated = update_job_skill(job_skill, input_data)
            return Response(JobSkillSerializer(updated).data)
        except ValueError as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)
    
    def destroy(self, request, job_id=None, pk=None):
        """
            DELETE /api/jobs/:job_id/skills/:id/
            Xóa kỹ năng
        """
        job, error = self._get_job_or_404(job_id)
        if error:
            return error
        
        permission_error = self._check_job_owner(request, job)
        if permission_error:
            return permission_error
        
        job_skill = get_job_skill_by_id(pk)
        if not job_skill or job_skill.job_id != int(job_id):
            return Response(
                {"detail": "Job skill not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        
        remove_job_skill(job_skill)
        return Response(status=status.HTTP_204_NO_CONTENT)
