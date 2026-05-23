from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.decorators import action
from decimal import Decimal, InvalidOperation

from .permissions import IsJobOwnerOrReadOnly
from .serializers import (
    JobListSerializer,
    JobDetailSerializer,
    JobCreateSerializer,
    JobUpdateSerializer,
    JobStatusSerializer,
)
from .selectors.jobs import (
    list_jobs,
    get_job_by_id,
    get_job_by_slug,
    get_job_stats,
    list_featured_jobs,
    list_urgent_jobs,
    get_similar_jobs,
    get_job_recommendations,
    get_job_suggestions_for_cv,
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
    JobInput,
)
from apps.candidate.recruiters.selectors.recruiters import get_recruiter_by_user
from apps.recruitment.saved_jobs.services.saved_jobs import save_job
from apps.recruitment.saved_jobs.serializers import SavedJobSerializer
from apps.recruitment.saved_jobs.services.saved_jobs import unsave_job
from apps.recruitment.saved_jobs.selectors.saved_jobs import is_job_saved
from apps.recruitment.job_views.selectors.job_views import (
    get_viewer_demographics as get_demographics,
)
from apps.recruitment.job_views.selectors.job_views import get_view_chart_data
from apps.recruitment.job_views.selectors.job_views import (
    get_view_stats as get_job_view_stats,
)


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

    def _ensure_verified_company(self, request, job=None):
        if getattr(request.user, "role", None) != "company":
            return None

        company_profile = getattr(request.user, "company_profile", None)
        if not company_profile:
            return Response(
                {"detail": "Tài khoản công ty chưa có hồ sơ công ty."},
                status=status.HTTP_403_FORBIDDEN,
            )

        target_company = job.company if job is not None else company_profile
        if target_company.verification_status != "verified":
            return Response(
                {
                    "detail": "Công ty chưa được xác thực. Bạn chưa thể đăng nội dung tuyển dụng."
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        return None

    def get_queryset(self):
        filters = self._build_filters()
        return list_jobs(filters)

    def _build_filters(self):
        """
        Build filters từ query params
        """
        filters = {}
        params = self.request.query_params

        def parse_int(value):
            try:
                return int(value)
            except (TypeError, ValueError):
                return None

        def parse_decimal(value):
            try:
                return Decimal(str(value))
            except (TypeError, InvalidOperation):
                return None

        def parse_csv(name):
            values = []
            for raw_value in params.getlist(name):
                values.extend(
                    item.strip() for item in str(raw_value).split(",") if item.strip()
                )
            return values

        if params.get("company_id"):
            company_id = parse_int(params["company_id"])
            if company_id is not None:
                filters["company_id"] = company_id

        if params.get("category_id"):
            category_id = parse_int(params["category_id"])
            if category_id is not None:
                filters["category_id"] = category_id

        if params.get("province_id"):
            province_id = parse_int(params["province_id"])
            if province_id is not None:
                filters["province_id"] = province_id

        job_types = parse_csv("job_type")
        if job_types:
            filters["job_type"] = job_types

        levels = parse_csv("level")
        if levels:
            filters["level"] = levels

        if params.get("status"):
            filters["status"] = params["status"]

        if params.get("is_remote"):
            filters["is_remote"] = params["is_remote"].lower() == "true"

        if params.get("salary_min"):
            salary_min = parse_decimal(params["salary_min"])
            if salary_min is not None:
                filters["salary_min"] = salary_min

        if params.get("salary_max"):
            salary_max = parse_decimal(params["salary_max"])
            if salary_max is not None:
                filters["salary_max"] = salary_max

        if params.get("experience_min"):
            experience_min = parse_int(params["experience_min"])
            if experience_min is not None:
                filters["experience_min"] = experience_min

        if params.get("experience_max"):
            experience_max = parse_int(params["experience_max"])
            if experience_max is not None:
                filters["experience_max"] = experience_max

        skills = parse_csv("skills")
        if skills:
            filters["skills"] = skills

        if params.get("search"):
            filters["search"] = params["search"]

        if params.get("ordering"):
            filters["ordering"] = params["ordering"]

        if (
            getattr(self.request.user, "is_authenticated", False)
            and getattr(self.request.user, "role", None) == "company"
            and params.get("company_id")
        ):
            try:
                company_id = int(params["company_id"])
                company_profile = getattr(self.request.user, "company_profile", None)
                if company_profile and company_profile.id == company_id:
                    filters["include_all_statuses"] = True
            except (TypeError, ValueError):
                pass

        return filters

    def list(self, request):
        """
        GET /api/jobs/
        Danh sách tin tuyển dụng (public, có filter)
        """
        queryset = self.get_queryset()
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = JobListSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = JobListSerializer(queryset, many=True)
        return Response(serializer.data)

    def create(self, request):
        """
        POST /api/jobs/
        Tạo tin tuyển dụng mới
        """
        serializer = JobCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        permission_error = self._ensure_verified_company(request)
        if permission_error:
            return permission_error

        try:
            input_data = JobInput(**serializer.validated_data)
            job = create_job(request.user, input_data)
            return Response(
                JobDetailSerializer(job).data, status=status.HTTP_201_CREATED
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
                {"detail": "Job not found"}, status=status.HTTP_404_NOT_FOUND
            )

        return Response(JobDetailSerializer(job).data)

    @action(detail=False, methods=["get"], url_path="slug/(?P<slug>[^/.]+)")
    def retrieve_by_slug(self, request, slug=None):
        """
        GET /api/jobs/slug/:slug/
        Chi tiết tin tuyển dụng theo slug
        """
        job = get_job_by_slug(slug)
        if not job:
            return Response(
                {"detail": "Job not found"}, status=status.HTTP_404_NOT_FOUND
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
                {"detail": "Job not found"}, status=status.HTTP_404_NOT_FOUND
            )

        # Check object permission
        self.check_object_permissions(request, job)

        permission_error = self._ensure_verified_company(request, job)
        if permission_error:
            return permission_error

        serializer = JobUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            input_data = JobInput(**serializer.validated_data)
            updated = update_job(job, input_data)
            return Response(JobDetailSerializer(updated).data)
        except ValueError as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def partial_update(self, request, pk=None):
        """
        PATCH /api/jobs/:id/
        Cập nhật một phần tin tuyển dụng
        """
        return self.update(request, pk)

    def destroy(self, request, pk=None):
        """
        DELETE /api/jobs/:id/
        Xóa tin tuyển dụng
        """
        job = get_job_by_id(pk)
        if not job:
            return Response(
                {"detail": "Job not found"}, status=status.HTTP_404_NOT_FOUND
            )

        self.check_object_permissions(request, job)

        permission_error = self._ensure_verified_company(request, job)
        if permission_error:
            return permission_error

        delete_job(job)
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=["patch"], url_path="status")
    def change_status(self, request, pk=None):
        """
        PATCH /api/jobs/:id/status/
        Thay đổi trạng thái tin tuyển dụng
        """
        job = get_job_by_id(pk)
        if not job:
            return Response(
                {"detail": "Job not found"}, status=status.HTTP_404_NOT_FOUND
            )

        self.check_object_permissions(request, job)

        permission_error = self._ensure_verified_company(request, job)
        if permission_error:
            return permission_error

        serializer = JobStatusSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            updated = change_job_status(job, serializer.validated_data["status"])
            return Response(JobDetailSerializer(updated).data)
        except ValueError as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=["post"], url_path="publish")
    def publish(self, request, pk=None):
        """
        POST /api/jobs/:id/publish/
        Xuất bản tin tuyển dụng
        """
        job = get_job_by_id(pk)
        if not job:
            return Response(
                {"detail": "Job not found"}, status=status.HTTP_404_NOT_FOUND
            )

        self.check_object_permissions(request, job)

        permission_error = self._ensure_verified_company(request, job)
        if permission_error:
            return permission_error

        try:
            updated = publish_job(job)
            return Response(JobDetailSerializer(updated).data)
        except ValueError as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=["post"], url_path="close")
    def close(self, request, pk=None):
        """
        POST /api/jobs/:id/close/
        Đóng tin tuyển dụng
        """
        job = get_job_by_id(pk)
        if not job:
            return Response(
                {"detail": "Job not found"}, status=status.HTTP_404_NOT_FOUND
            )

        self.check_object_permissions(request, job)

        permission_error = self._ensure_verified_company(request, job)
        if permission_error:
            return permission_error

        try:
            updated = close_job(job)
            return Response(JobDetailSerializer(updated).data)
        except ValueError as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=["post"], url_path="duplicate")
    def duplicate(self, request, pk=None):
        """
        POST /api/jobs/:id/duplicate/
        Nhân bản tin tuyển dụng
        """
        job = get_job_by_id(pk)
        if not job:
            return Response(
                {"detail": "Job not found"}, status=status.HTTP_404_NOT_FOUND
            )

        self.check_object_permissions(request, job)

        permission_error = self._ensure_verified_company(request, job)
        if permission_error:
            return permission_error

        try:
            new_job = duplicate_job(request.user, job)
            return Response(
                JobDetailSerializer(new_job).data, status=status.HTTP_201_CREATED
            )
        except ValueError as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=["get"], url_path="stats")
    def stats(self, request, pk=None):
        """
        GET /api/jobs/:id/stats/
        Thống kê tin tuyển dụng
        """
        job = get_job_by_id(pk)
        if not job:
            return Response(
                {"detail": "Job not found"}, status=status.HTTP_404_NOT_FOUND
            )

        self.check_object_permissions(request, job)

        stats_data = get_job_stats(pk)
        return Response(stats_data)

    @action(detail=False, methods=["get"], url_path="featured")
    def featured(self, request):
        """
        GET /api/jobs/featured/
        Việc làm nổi bật
        """
        raw_limit = request.query_params.get("limit") or request.query_params.get(
            "page_size"
        )
        try:
            limit = int(raw_limit) if raw_limit else 8
        except (TypeError, ValueError):
            limit = 8
        limit = max(1, min(limit, 50))

        queryset = list_featured_jobs(limit=limit)
        serializer = JobListSerializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=["get"], url_path="urgent")
    def urgent(self, request):
        """
        GET /api/jobs/urgent/
        Việc làm gấp (deadline trong 7 ngày)
        """
        queryset = list_urgent_jobs()
        serializer = JobListSerializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=["get"], url_path="similar")
    def similar(self, request, pk=None):
        """
        GET /api/jobs/:id/similar/
        Việc làm tương tự
        """
        job = get_job_by_id(pk)
        if not job:
            return Response(
                {"detail": "Job not found"}, status=status.HTTP_404_NOT_FOUND
            )

        queryset = get_similar_jobs(pk)
        serializer = JobListSerializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=["get"], url_path="recommendations")
    def recommendations(self, request):
        """
        GET /api/jobs/recommendations/
        GET /api/jobs/recommendations/?cv_id=<id>
        Gợi ý việc làm cho ứng viên (theo profile hoặc theo CV cụ thể)
        """
        if not request.user.is_authenticated:
            return Response(
                {"detail": "Authentication required"},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        recruiter = get_recruiter_by_user(request.user)
        if not recruiter:
            return Response(
                {"detail": "Recruiter profile not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        cv_id = request.query_params.get("cv_id")

        if cv_id:
            # CV-based suggestions with match_score
            try:
                cv_id_int = int(cv_id)
            except (ValueError, TypeError):
                return Response(
                    {"detail": "cv_id must be an integer"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            suggestions = get_job_suggestions_for_cv(cv_id_int, recruiter)

            result = []
            for item in suggestions:
                job = item["job"]
                serialized = JobListSerializer(job).data
                serialized["match_score"] = item["match_score"]
                serialized["match_reasons"] = item["match_reasons"]
                result.append(serialized)

            return Response(result)

        # Default: skill-based recommendations (legacy)
        queryset = get_job_recommendations(recruiter.id)
        serializer = JobListSerializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=["post"], url_path="view")
    def record_view(self, request, pk=None):
        """
        POST /api/jobs/:id/view/
        Ghi nhận lượt xem
        """
        job = get_job_by_id(pk)
        if not job:
            return Response(
                {"detail": "Job not found"}, status=status.HTTP_404_NOT_FOUND
            )

        updated = record_job_view(job)
        return Response({"view_count": updated.view_count})

    @action(detail=True, methods=["post", "delete"], url_path="feature")
    def feature(self, request, pk=None):
        """
        POST /api/jobs/:id/feature/ - Đánh dấu nổi bật
        DELETE /api/jobs/:id/feature/ - Bỏ đánh dấu nổi bật
        """
        job = get_job_by_id(pk)
        if not job:
            return Response(
                {"detail": "Job not found"}, status=status.HTTP_404_NOT_FOUND
            )

        self.check_object_permissions(request, job)

        permission_error = self._ensure_verified_company(request, job)
        if permission_error:
            return permission_error

        if request.method == "POST":
            featured_until = request.data.get("featured_until")
            updated = set_job_featured(job, True, featured_until)
        else:  # DELETE
            updated = set_job_featured(job, False)

        return Response(JobDetailSerializer(updated).data)

    @action(detail=True, methods=["post"], url_path="save")
    def save_job(self, request, pk=None):
        """
        POST /api/jobs/:id/save/
        Lưu việc làm
        """

        if not request.user.is_authenticated:
            return Response(
                {"detail": "Authentication required"},
                status=status.HTTP_401_UNAUTHORIZED,
            )
        if getattr(request.user, "role", None) != "candidate":
            return Response(
                {"detail": "Only candidates can save jobs"},
                status=status.HTTP_403_FORBIDDEN,
            )

        job = get_job_by_id(pk)
        if not job:
            return Response(
                {"detail": "Job not found"}, status=status.HTTP_404_NOT_FOUND
            )

        recruiter = get_recruiter_by_user(request.user)
        if not recruiter:
            return Response(
                {"detail": "Recruiter profile not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        try:
            folder_name = request.data.get("folder_name")
            saved = save_job(recruiter, job, folder_name)
            return Response(
                SavedJobSerializer(saved).data, status=status.HTTP_201_CREATED
            )
        except ValueError as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=["delete"], url_path="unsave")
    def unsave_job(self, request, pk=None):
        """
        DELETE /api/jobs/:id/unsave/
        Bỏ lưu việc làm
        """

        if not request.user.is_authenticated:
            return Response(
                {"detail": "Authentication required"},
                status=status.HTTP_401_UNAUTHORIZED,
            )
        if getattr(request.user, "role", None) != "candidate":
            return Response(
                {"detail": "Only candidates can unsave jobs"},
                status=status.HTTP_403_FORBIDDEN,
            )

        job = get_job_by_id(pk)
        if not job:
            return Response(
                {"detail": "Job not found"}, status=status.HTTP_404_NOT_FOUND
            )

        recruiter = get_recruiter_by_user(request.user)
        if not recruiter:
            return Response(
                {"detail": "Recruiter profile not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        try:
            unsave_job(recruiter, job)
            return Response(status=status.HTTP_204_NO_CONTENT)
        except ValueError as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=["get"], url_path="is-saved")
    def is_saved(self, request, pk=None):
        """
        GET /api/jobs/:id/is-saved/
        Kiểm tra job đã lưu chưa
        """

        if not request.user.is_authenticated:
            return Response({"is_saved": False})
        if getattr(request.user, "role", None) != "candidate":
            return Response({"is_saved": False})

        job = get_job_by_id(pk)
        if not job:
            return Response(
                {"detail": "Job not found"}, status=status.HTTP_404_NOT_FOUND
            )

        recruiter = get_recruiter_by_user(request.user)
        if not recruiter:
            return Response({"is_saved": False})

        saved = is_job_saved(recruiter.id, int(pk))
        return Response({"is_saved": saved})

    @action(detail=True, methods=["get"], url_path="views")
    def view_stats(self, request, pk=None):
        """
        GET /api/jobs/:id/views/
        Thống kê lượt xem
        """

        job = get_job_by_id(pk)
        if not job:
            return Response(
                {"detail": "Job not found"}, status=status.HTTP_404_NOT_FOUND
            )

        self.check_object_permissions(request, job)

        stats = get_job_view_stats(int(pk))
        return Response(stats)

    @action(detail=True, methods=["get"], url_path="views/chart")
    def view_chart(self, request, pk=None):
        """
        GET /api/jobs/:id/views/chart/
        Biểu đồ lượt xem theo thời gian
        """

        job = get_job_by_id(pk)
        if not job:
            return Response(
                {"detail": "Job not found"}, status=status.HTTP_404_NOT_FOUND
            )

        self.check_object_permissions(request, job)

        period = request.query_params.get("period", "7d")
        if period not in ["7d", "30d", "90d"]:
            period = "7d"

        chart_data = get_view_chart_data(int(pk), period)
        return Response(chart_data)

    @action(detail=True, methods=["get"], url_path="viewer-demographics")
    def viewer_demographics(self, request, pk=None):
        """
        GET /api/jobs/:id/viewer-demographics/
        Thống kê người xem
        """

        job = get_job_by_id(pk)
        if not job:
            return Response(
                {"detail": "Job not found"}, status=status.HTTP_404_NOT_FOUND
            )

        self.check_object_permissions(request, job)

        demographics = get_demographics(int(pk))
        return Response(demographics)
