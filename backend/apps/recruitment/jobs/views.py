from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny

from .models import Job
from .permissions import IsJobOwnerOrReadOnly
from .serializers import (
    JobListSerializer,
    JobDetailSerializer,
    JobCreateSerializer,
    JobUpdateSerializer,
    JobStatusSerializer
)
from .selectors.jobs import (
    list_jobs,
    get_job_by_id,
    get_job_by_slug,
    get_job_stats,
    list_featured_jobs,
    list_urgent_jobs,
    get_similar_jobs,
    get_job_recommendations
)
from .services.jobs import (
    create_job,
    update_job,
    delete_job,
    change_job_status,
    publish_job,
    close_job,
    duplicate_job,
    record_job_view,
    set_job_featured,
    JobInput
)
from apps.candidate.recruiters.selectors.recruiters import get_recruiter_by_user
from apps.recruitment.saved_jobs.services.saved_jobs import save_job
from apps.recruitment.saved_jobs.serializers import SavedJobSerializer
from apps.recruitment.saved_jobs.services.saved_jobs import unsave_job
from apps.recruitment.saved_jobs.selectors.saved_jobs import is_job_saved
from apps.recruitment.job_views.selectors.job_views import get_viewer_demographics as get_demographics
from apps.recruitment.job_views.selectors.job_views import get_view_chart_data
from apps.recruitment.job_views.selectors.job_views import get_view_stats as get_job_view_stats


class JobViewSet(viewsets.GenericViewSet):
    """
    ViewSet quản lý tin tuyển dụng.
    
    Endpoints:
    - GET    /api/jobs/               → list (public)
    - POST   /api/jobs/               → create (authenticated + company owner)
    - GET    /api/jobs/:id/           → retrieve (public)
    - GET    /api/jobs/slug/:slug/    → retrieve by slug (public)
    - PUT    /api/jobs/:id/           → update (authenticated + owner)
    """
    permission_classes = [IsJobOwnerOrReadOnly]
    
    def get_queryset(self):
        filters = self._build_filters()
        return list_jobs(filters)
    
    def _build_filters(self):
        """
        Build filters từ query params
        """
        filters = {}
        params = self.request.query_params
        
        if params.get('company_id'):
            filters['company_id'] = int(params['company_id'])
        
        if params.get('category_id'):
            filters['category_id'] = int(params['category_id'])
        
        if params.get('job_type'):
            filters['job_type'] = params['job_type']
        
        if params.get('level'):
            filters['level'] = params['level']
        
        if params.get('status'):
            filters['status'] = params['status']
        
        if params.get('is_remote'):
            filters['is_remote'] = params['is_remote'].lower() == 'true'
        
        if params.get('salary_min'):
            filters['salary_min'] = params['salary_min']
        
        if params.get('salary_max'):
            filters['salary_max'] = params['salary_max']
        
        if params.get('search'):
            filters['search'] = params['search']
        
        return filters
    
    def list(self, request):
        """
            GET /api/jobs/
            Danh sách tin tuyển dụng (public, có filter)
        """
        queryset = self.get_queryset()
        serializer = JobListSerializer(queryset, many=True)
        return Response(serializer.data)
    
    def create(self, request):
        """
            POST /api/jobs/
            Tạo tin tuyển dụng mới
        """
        serializer = JobCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        try:
            input_data = JobInput(**serializer.validated_data)
            job = create_job(request.user, input_data)
            return Response(
                JobDetailSerializer(job).data,
                status=status.HTTP_201_CREATED
            )
        except ValueError as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)
    
    def retrieve(self, request, pk=None):
        """
            GET /api/jobs/:id/
            Chi tiết tin tuyển dụng
        """
        job = get_job_by_id(pk)
        if not job:
            return Response(
                {"detail": "Job not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        
        return Response(JobDetailSerializer(job).data)
    
    @action(detail=False, methods=['get'], url_path='slug/(?P<slug>[^/.]+)')
    def retrieve_by_slug(self, request, slug=None):
        """
            GET /api/jobs/slug/:slug/
            Chi tiết tin tuyển dụng theo slug
        """
        job = get_job_by_slug(slug)
        if not job:
            return Response(
                {"detail": "Job not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        
        return Response(JobDetailSerializer(job).data)
    
    def update(self, request, pk=None):
        """
            PUT /api/jobs/:id/
            Cập nhật tin tuyển dụng
        """
        job = get_job_by_id(pk)
        if not job:
            return Response(
                {"detail": "Job not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Check object permission
        self.check_object_permissions(request, job)
        
        serializer = JobUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        try:
            input_data = JobInput(**serializer.validated_data)
            updated = update_job(job, input_data)
            return Response(JobDetailSerializer(updated).data)
        except ValueError as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)
    
    def destroy(self, request, pk=None):
        """
            DELETE /api/jobs/:id/
            Xóa tin tuyển dụng
        """
        job = get_job_by_id(pk)
        if not job:
            return Response(
                {"detail": "Job not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        
        self.check_object_permissions(request, job)
        delete_job(job)
        return Response(status=status.HTTP_204_NO_CONTENT)
    
    @action(detail=True, methods=['patch'], url_path='status')
    def change_status(self, request, pk=None):
        """
            PATCH /api/jobs/:id/status/
            Thay đổi trạng thái tin tuyển dụng
        """
        job = get_job_by_id(pk)
        if not job:
            return Response(
                {"detail": "Job not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        
        self.check_object_permissions(request, job)
        
        serializer = JobStatusSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        try:
            updated = change_job_status(job, serializer.validated_data['status'])
            return Response(JobDetailSerializer(updated).data)
        except ValueError as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'], url_path='publish')
    def publish(self, request, pk=None):
        """
            POST /api/jobs/:id/publish/
            Xuất bản tin tuyển dụng
        """
        job = get_job_by_id(pk)
        if not job:
            return Response(
                {"detail": "Job not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        
        self.check_object_permissions(request, job)
        
        try:
            updated = publish_job(job)
            return Response(JobDetailSerializer(updated).data)
        except ValueError as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'], url_path='close')
    def close(self, request, pk=None):
        """
            POST /api/jobs/:id/close/
            Đóng tin tuyển dụng
        """
        job = get_job_by_id(pk)
        if not job:
            return Response(
                {"detail": "Job not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        
        self.check_object_permissions(request, job)
        
        try:
            updated = close_job(job)
            return Response(JobDetailSerializer(updated).data)
        except ValueError as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'], url_path='duplicate')
    def duplicate(self, request, pk=None):
        """
            POST /api/jobs/:id/duplicate/
            Nhân bản tin tuyển dụng
        """
        job = get_job_by_id(pk)
        if not job:
            return Response(
                {"detail": "Job not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        
        self.check_object_permissions(request, job)
        
        try:
            new_job = duplicate_job(request.user, job)
            return Response(
                JobDetailSerializer(new_job).data,
                status=status.HTTP_201_CREATED
            )
        except ValueError as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['get'], url_path='stats')
    def stats(self, request, pk=None):
        """
            GET /api/jobs/:id/stats/
            Thống kê tin tuyển dụng
        """
        job = get_job_by_id(pk)
        if not job:
            return Response(
                {"detail": "Job not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        
        self.check_object_permissions(request, job)
        
        stats_data = get_job_stats(pk)
        return Response(stats_data)
    
    @action(detail=False, methods=['get'], url_path='featured')
    def featured(self, request):
        """
            GET /api/jobs/featured/
            Việc làm nổi bật
        """
        queryset = list_featured_jobs()
        serializer = JobListSerializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'], url_path='urgent')
    def urgent(self, request):
        """
            GET /api/jobs/urgent/
            Việc làm gấp (deadline trong 7 ngày)
        """
        queryset = list_urgent_jobs()
        serializer = JobListSerializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'], url_path='similar')
    def similar(self, request, pk=None):
        """
            GET /api/jobs/:id/similar/
            Việc làm tương tự
        """
        job = get_job_by_id(pk)
        if not job:
            return Response(
                {"detail": "Job not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        
        queryset = get_similar_jobs(pk)
        serializer = JobListSerializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'], url_path='recommendations')
    def recommendations(self, request):
        """
            GET /api/jobs/recommendations/
            Gợi ý việc làm cho ứng viên
        """
        if not request.user.is_authenticated:
            return Response(
                {"detail": "Authentication required"},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        recruiter = get_recruiter_by_user(request.user)
        if not recruiter:
            return Response(
                {"detail": "Recruiter profile not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        
        queryset = get_job_recommendations(recruiter.id)
        serializer = JobListSerializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'], url_path='view')
    def record_view(self, request, pk=None):
        """
            POST /api/jobs/:id/view/
            Ghi nhận lượt xem
        """
        job = get_job_by_id(pk)
        if not job:
            return Response(
                {"detail": "Job not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        
        updated = record_job_view(job)
        return Response({"view_count": updated.view_count})
    
    @action(detail=True, methods=['post', 'delete'], url_path='feature')
    def feature(self, request, pk=None):
        """
            POST /api/jobs/:id/feature/ - Đánh dấu nổi bật
            DELETE /api/jobs/:id/feature/ - Bỏ đánh dấu nổi bật
        """
        job = get_job_by_id(pk)
        if not job:
            return Response(
                {"detail": "Job not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        
        self.check_object_permissions(request, job)
        
        if request.method == 'POST':
            featured_until = request.data.get('featured_until')
            updated = set_job_featured(job, True, featured_until)
        else:  # DELETE
            updated = set_job_featured(job, False)
        
        return Response(JobDetailSerializer(updated).data)
    
    @action(detail=True, methods=['post'], url_path='save')
    def save_job(self, request, pk=None):
        """
            POST /api/jobs/:id/save/
            Lưu việc làm
        """

        if not request.user.is_authenticated:
            return Response(
                {"detail": "Authentication required"},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        job = get_job_by_id(pk)
        if not job:
            return Response(
                {"detail": "Job not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        
        recruiter = get_recruiter_by_user(request.user)
        if not recruiter:
            return Response(
                {"detail": "Recruiter profile not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        
        try:
            folder_name = request.data.get('folder_name')
            saved = save_job(recruiter, job, folder_name)
            return Response(
                SavedJobSerializer(saved).data,
                status=status.HTTP_201_CREATED
            )
        except ValueError as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['delete'], url_path='unsave')
    def unsave_job(self, request, pk=None):
        """
            DELETE /api/jobs/:id/unsave/
            Bỏ lưu việc làm
        """
        
        if not request.user.is_authenticated:
            return Response(
                {"detail": "Authentication required"},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        job = get_job_by_id(pk)
        if not job:
            return Response(
                {"detail": "Job not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        
        recruiter = get_recruiter_by_user(request.user)
        if not recruiter:
            return Response(
                {"detail": "Recruiter profile not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        
        try:
            unsave_job(recruiter, job)
            return Response(status=status.HTTP_204_NO_CONTENT)
        except ValueError as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['get'], url_path='is-saved')
    def is_saved(self, request, pk=None):
        """
            GET /api/jobs/:id/is-saved/
            Kiểm tra job đã lưu chưa
        """
        
        if not request.user.is_authenticated:
            return Response({"is_saved": False})
        
        job = get_job_by_id(pk)
        if not job:
            return Response(
                {"detail": "Job not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        
        recruiter = get_recruiter_by_user(request.user)
        if not recruiter:
            return Response({"is_saved": False})
        
        saved = is_job_saved(recruiter.id, int(pk))
        return Response({"is_saved": saved})
    
    @action(detail=True, methods=['get'], url_path='views')
    def view_stats(self, request, pk=None):
        """
            GET /api/jobs/:id/views/
            Thống kê lượt xem
        """
        
        job = get_job_by_id(pk)
        if not job:
            return Response(
                {"detail": "Job not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        
        self.check_object_permissions(request, job)
        
        stats = get_job_view_stats(int(pk))
        return Response(stats)
    
    @action(detail=True, methods=['get'], url_path='views/chart')
    def view_chart(self, request, pk=None):
        """
            GET /api/jobs/:id/views/chart/
            Biểu đồ lượt xem theo thời gian
        """
        
        job = get_job_by_id(pk)
        if not job:
            return Response(
                {"detail": "Job not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        
        self.check_object_permissions(request, job)
        
        period = request.query_params.get('period', '7d')
        if period not in ['7d', '30d', '90d']:
            period = '7d'
        
        chart_data = get_view_chart_data(int(pk), period)
        return Response(chart_data)
    
    @action(detail=True, methods=['get'], url_path='viewer-demographics')
    def viewer_demographics(self, request, pk=None):
        """
            GET /api/jobs/:id/viewer-demographics/
            Thống kê người xem
        """

        job = get_job_by_id(pk)
        if not job:
            return Response(
                {"detail": "Job not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        
        self.check_object_permissions(request, job)
        
        demographics = get_demographics(int(pk))
        return Response(demographics)
