import csv

from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated

from apps.recruitment.jobs.selectors.jobs import get_job_by_id
from apps.recruitment.interviews.selectors.interviews import (
    list_interviews_by_application,
)
from apps.recruitment.interviews.serializers import InterviewListSerializer
from apps.recruitment.application_status_history.selectors.application_status_history import (
    list_history_by_application,
)
from apps.recruitment.application_status_history.serializers import (
    StatusHistorySerializer,
)
from apps.recruitment.application_status_history.services.application_status_history import (
    log_status_history,
)
from apps.candidate.recruiters.selectors.recruiters import get_recruiter_by_user

from django.http import HttpResponse
from django.utils.text import get_valid_filename

from apps.company.companies.models import Company, CompanyMember
from apps.company.companies.permissions import MANAGE_JOB_ROLES, can_manage_company_jobs
from apps.core.throttles import ApplicationSubmitRateThrottle
from apps.core.users.permissions import is_admin_user
from .models import Application

from .services.applications import (
    applicant_withdraw,
    send_offer,
    change_application_status,
    rate_application,
    withdraw_application,
    update_application,
    create_application,
    ApplicationUpdateInput,
    ApplicationCreateInput,
)

from .serializers import (
    ApplicationWithdrawSerializer,
    ApplicationStatusSerializer,
    ApplicationUpdateSerializer,
    ApplicationCreateSerializer,
    ApplicationOfferSerializer,
    ApplicationListSerializer,
    ApplicationDetailSerializer,
    ApplicationRejectSerializer,
    ApplicationNotesSerializer,
    ApplicationRatingSerializer,
)

from .selectors.applications import (
    list_applications_by_job,
    list_applications_by_status,
    list_applications_by_rating,
    list_applications_for_export,
    get_application_stats,
    get_application_by_id,
    search_applications,
)


APPLICATION_ORDERING_MAP = {
    "applied_at": "applied_at",
    "-applied_at": "-applied_at",
    "updated_at": "updated_at",
    "-updated_at": "-updated_at",
    "rating": "rating",
    "-rating": "-rating",
    "status": "status",
    "-status": "-status",
}

NESTED_APPLICATION_LIST_LIMIT = 100
APPLICATION_EXPORT_MAX_ROWS = 5000


def _csv_safe(value):
    text = "" if value is None else str(value)
    if text.startswith(("=", "+", "-", "@", "\t", "\r")):
        return f"'{text}"
    return text


def _parse_optional_int(params, name: str):
    value = params.get(name)
    if value in (None, ""):
        return None, None
    try:
        return int(value), None
    except (TypeError, ValueError):
        return None, Response(
            {name: ["A valid integer is required."]},
            status=status.HTTP_400_BAD_REQUEST,
        )


class JobApplicationViewSet(viewsets.GenericViewSet):
    """
    ViewSet cho danh sách applications của một job.
    Nested URL: /api/jobs/:job_id/applications/
    """

    permission_classes = [IsAuthenticated]
    serializer_class = ApplicationListSerializer

    def get_queryset(self):
        job_id = self.kwargs.get("job_id")
        filters, error = self._build_filters()
        if error:
            return Application.objects.none()
        return list_applications_by_job(job_id, filters)

    def _build_filters(self):
        """
        Build filters từ query params
        """
        filters = {}
        params = self.request.query_params

        if params.get("status"):
            filters["status"] = params["status"]

        rating, error = _parse_optional_int(params, "rating")
        if error:
            return None, error
        if rating is not None:
            filters["rating"] = rating

        return filters, None

    def _application_list_response(
        self, request, queryset, *, force_paginated: bool = False
    ):
        should_paginate = force_paginated or any(
            key in request.query_params for key in ("page", "page_size")
        )
        if should_paginate:
            page = self.paginate_queryset(queryset)
            if page is not None:
                serializer = ApplicationListSerializer(
                    page, many=True, context={"request": request}
                )
                return self.get_paginated_response(serializer.data)

        serializer = ApplicationListSerializer(
            queryset[:NESTED_APPLICATION_LIST_LIMIT],
            many=True,
            context={"request": request},
        )
        return Response(serializer.data)

    def _get_job_or_404(self, job_id):
        """
        Helper: Lấy job hoặc trả về 404
        """
        job = get_job_by_id(job_id)
        if not job:
            return None, Response(
                {"detail": "Job not found"}, status=status.HTTP_404_NOT_FOUND
            )
        return job, None

    def _check_job_owner(self, request, job):
        """
        Helper: Kiểm tra nếu user sở hữu job
        """
        if not can_manage_company_jobs(job.company, request.user):
            return Response(
                {"detail": "Permission denied"}, status=status.HTTP_403_FORBIDDEN
            )
        return None

    def list(self, request, job_id=None):
        """
        GET /api/jobs/:job_id/applications/
        Danh sách ứng viên cho job
        """
        job, error = self._get_job_or_404(job_id)
        if error:
            return error

        permission_error = self._check_job_owner(request, job)
        if permission_error:
            return permission_error

        filters, error = self._build_filters()
        if error:
            return error

        queryset = list_applications_by_job(job_id, filters)
        return self._application_list_response(request, queryset, force_paginated=True)

    def _filter_by_status(self, request, job_id, filter_status):
        """
        Helper: Filter applications by status
        """

        job, error = self._get_job_or_404(job_id)
        if error:
            return error

        permission_error = self._check_job_owner(request, job)
        if permission_error:
            return permission_error

        queryset = list_applications_by_status(job_id, filter_status)
        return self._application_list_response(request, queryset)

    def pending(self, request, job_id=None):
        """
        GET /api/jobs/:job_id/applications/pending/
        Danh sách đơn chờ xử lý
        """
        return self._filter_by_status(request, job_id, "pending")

    def shortlisted(self, request, job_id=None):
        """
        GET /api/jobs/:job_id/applications/shortlisted/
        Danh sách đơn đã chọn
        """
        return self._filter_by_status(request, job_id, "shortlisted")

    def rejected(self, request, job_id=None):
        """
        GET /api/jobs/:job_id/applications/rejected/
        Danh sách đơn bị từ chối
        """
        return self._filter_by_status(request, job_id, "rejected")

    def by_rating(self, request, job_id=None):
        """
        GET /api/jobs/:job_id/applications/by-rating/
        Lọc theo điểm đánh giá
        """

        job, error = self._get_job_or_404(job_id)
        if error:
            return error

        permission_error = self._check_job_owner(request, job)
        if permission_error:
            return permission_error

        rating, error = _parse_optional_int(request.query_params, "rating")
        if error:
            return error

        min_rating, error = _parse_optional_int(request.query_params, "min_rating")
        if error:
            return error

        max_rating, error = _parse_optional_int(request.query_params, "max_rating")
        if error:
            return error

        queryset = list_applications_by_rating(
            job_id,
            rating=rating,
            min_rating=min_rating,
            max_rating=max_rating,
        )
        return self._application_list_response(request, queryset)

    def search(self, request, job_id=None):
        """
        GET /api/jobs/:job_id/applications/search/
        Tìm kiếm trong đơn ứng tuyển
        """

        job, error = self._get_job_or_404(job_id)
        if error:
            return error

        permission_error = self._check_job_owner(request, job)
        if permission_error:
            return permission_error

        query = request.query_params.get("q", "")
        if not query:
            return Response([])

        queryset = search_applications(job_id, query)
        return self._application_list_response(request, queryset)


class ApplicationViewSet(viewsets.GenericViewSet):
    """
    ViewSet cho quản lý applications.
    URL: /api/applications/
    """

    permission_classes = [IsAuthenticated]
    serializer_class = ApplicationDetailSerializer

    def get_throttles(self):
        throttles = super().get_throttles()
        if self.action == "create":
            throttles.append(ApplicationSubmitRateThrottle())
        return throttles

    def _ensure_verified_company(self, request, company):
        if getattr(request.user, "role", None) != "company":
            return None

        if company.verification_status != "verified":
            return Response(
                {
                    "detail": "Công ty chưa được xác thực. Bạn chưa thể đăng hoặc xử lý nội dung tuyển dụng."
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        return None

    def list(self, request):
        """
        GET /api/applications/
        Danh sách đơn ứng tuyển của user
        """
        user = request.user

        # Nếu là ứng viên: Lấy các ứng tuyển của chính họ
        if hasattr(user, "role") and user.role == "candidate":
            recruiter = get_recruiter_by_user(user)
            if not recruiter:
                return Response([])
            queryset = Application.objects.filter(recruiter=recruiter)
        # Nếu là nhà tuyển dụng: Lấy các ứng tuyển vào các job của họ
        elif hasattr(user, "role") and user.role == "company":
            member_company_ids = CompanyMember.objects.filter(
                user=user,
                status=CompanyMember.Status.ACTIVE,
                role__in=MANAGE_JOB_ROLES,
            ).values_list("company_id", flat=True)
            owned_company_ids = Company.objects.filter(user=user).values_list(
                "id", flat=True
            )
            queryset = Application.objects.filter(
                job__company_id__in=list(member_company_ids) + list(owned_company_ids)
            )
        else:
            queryset = Application.objects.none()

        queryset = queryset.select_related(
            "recruiter",
            "recruiter__user",
            "recruiter__address__province",
            "job",
            "job__company",
            "job__category__parent",
            "job__address__province",
            "cv",
            "reviewed_by",
        ).prefetch_related(
            "job__required_skills__skill",
            "job__locations__address__province",
            "recruiter__skills__skill",
        )

        # Áp dụng filters từ query params nếu cần
        status_filter = request.query_params.get("status")
        if status_filter:
            queryset = queryset.filter(status=status_filter)

        ordering = APPLICATION_ORDERING_MAP.get(
            request.query_params.get("ordering", "-applied_at"), "-applied_at"
        )
        queryset = queryset.order_by(ordering)

        # Pagination
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = ApplicationListSerializer(
                page, many=True, context={"request": request}
            )
            return self.get_paginated_response(serializer.data)

        serializer = ApplicationListSerializer(
            queryset, many=True, context={"request": request}
        )
        return Response(serializer.data)

    def _is_applicant(self, request, application):
        """
        Kiểm tra nếu user là người nộp đơn
        """
        return application.recruiter.user == request.user

    def _is_job_owner(self, request, application):
        """
        Kiểm tra nếu user là người sở hữu job
        """
        return can_manage_company_jobs(application.job.company, request.user)

    def _get_application_or_404(self, pk):
        """
        Lấy application hoặc trả về 404
        """

        application = get_application_by_id(pk)
        if not application:
            return None, Response(
                {"detail": "Application not found"}, status=status.HTTP_404_NOT_FOUND
            )
        return application, None

    def create(self, request):
        """
        POST /api/applications/
        Nộp đơn ứng tuyển
        """
        if getattr(request.user, "role", None) != "candidate":
            return Response(
                {"detail": "Only candidates can apply for jobs"},
                status=status.HTTP_403_FORBIDDEN,
            )

        recruiter = get_recruiter_by_user(request.user)
        if not recruiter:
            return Response(
                {"detail": "Recruiter profile not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = ApplicationCreateSerializer(
            data=request.data, context={"recruiter": recruiter}
        )
        serializer.is_valid(raise_exception=True)

        try:
            input_data = ApplicationCreateInput(**serializer.validated_data)
            application = create_application(recruiter, input_data)
            return Response(
                ApplicationDetailSerializer(
                    application, context={"request": request}
                ).data,
                status=status.HTTP_201_CREATED,
            )
        except ValueError as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def retrieve(self, request, pk=None):
        """
        GET /api/applications/:id/
        Chi tiết đơn ứng tuyển
        """
        application, error = self._get_application_or_404(pk)
        if error:
            return error

        # Both applicant and job owner can view
        if not self._is_applicant(request, application) and not self._is_job_owner(
            request, application
        ):
            return Response(
                {"detail": "Permission denied"}, status=status.HTTP_403_FORBIDDEN
            )

        return Response(
            ApplicationDetailSerializer(application, context={"request": request}).data
        )

    def update(self, request, pk=None):
        """
        PUT /api/applications/:id/
        Cập nhật đơn (chỉ applicant)
        """

        application, error = self._get_application_or_404(pk)
        if error:
            return error

        if not self._is_applicant(request, application):
            return Response(
                {"detail": "Permission denied"}, status=status.HTTP_403_FORBIDDEN
            )

        serializer = ApplicationUpdateSerializer(
            data=request.data, context={"recruiter": application.recruiter}
        )
        serializer.is_valid(raise_exception=True)

        try:
            input_data = ApplicationUpdateInput(**serializer.validated_data)
            updated = update_application(application, input_data)
            return Response(
                ApplicationDetailSerializer(updated, context={"request": request}).data
            )
        except ValueError as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def destroy(self, request, pk=None):
        """
        DELETE /api/applications/:id/
        Rút đơn (chỉ applicant)
        """

        application, error = self._get_application_or_404(pk)
        if error:
            return error

        if not self._is_applicant(request, application):
            return Response(
                {"detail": "Permission denied"}, status=status.HTTP_403_FORBIDDEN
            )

        try:
            withdraw_application(application)
            return Response(status=status.HTTP_204_NO_CONTENT)
        except ValueError as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def change_status(self, request, pk=None):
        """
        PATCH /api/applications/:id/status/
        Đổi trạng thái (chỉ job owner)
        """

        application, error = self._get_application_or_404(pk)
        if error:
            return error

        if not self._is_job_owner(request, application):
            return Response(
                {"detail": "Permission denied"}, status=status.HTTP_403_FORBIDDEN
            )

        permission_error = self._ensure_verified_company(
            request, application.job.company
        )
        if permission_error:
            return permission_error

        serializer = ApplicationStatusSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            updated = change_application_status(
                application,
                serializer.validated_data["status"],
                request.user,
                serializer.validated_data.get("notes"),
            )
            return Response(
                ApplicationDetailSerializer(updated, context={"request": request}).data
            )
        except ValueError as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def rate(self, request, pk=None):
        """
        PATCH /api/applications/:id/rating/
        Đánh giá ứng viên (chỉ job owner)
        """

        application, error = self._get_application_or_404(pk)
        if error:
            return error

        if not self._is_job_owner(request, application):
            return Response(
                {"detail": "Permission denied"}, status=status.HTTP_403_FORBIDDEN
            )

        permission_error = self._ensure_verified_company(
            request, application.job.company
        )
        if permission_error:
            return permission_error

        serializer = ApplicationRatingSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            updated = rate_application(
                application,
                serializer.validated_data["rating"],
                serializer.validated_data.get("notes"),
            )
            return Response(
                ApplicationDetailSerializer(updated, context={"request": request}).data
            )
        except ValueError as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def add_notes(self, request, pk=None):
        """
        POST /api/applications/:id/notes/
        Thêm ghi chú (chỉ job owner)
        """

        application, error = self._get_application_or_404(pk)
        if error:
            return error

        if not self._is_job_owner(request, application):
            return Response(
                {"detail": "Permission denied"}, status=status.HTTP_403_FORBIDDEN
            )

        permission_error = self._ensure_verified_company(
            request, application.job.company
        )
        if permission_error:
            return permission_error

        serializer = ApplicationNotesSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # Update notes
        application.notes = serializer.validated_data["notes"]
        application.save()

        # Log to history
        log_status_history(
            application,
            application.status,
            application.status,  # same status
            request.user,
            f"Ghi chú: {serializer.validated_data['notes']}",
        )

        return Response(
            ApplicationDetailSerializer(application, context={"request": request}).data
        )

    def history(self, request, pk=None):
        """
        GET /api/applications/:id/history/
        Lịch sử thay đổi trạng thái (cả applicant và job owner)
        """

        application, error = self._get_application_or_404(pk)
        if error:
            return error

        # Both can view history
        if not self._is_applicant(request, application) and not self._is_job_owner(
            request, application
        ):
            return Response(
                {"detail": "Permission denied"}, status=status.HTTP_403_FORBIDDEN
            )

        history = list_history_by_application(int(pk))
        serializer = StatusHistorySerializer(history, many=True)
        return Response(serializer.data)

    def shortlist(self, request, pk=None):
        """
        POST /api/applications/:id/shortlist/
        Thêm vào danh sách rút gọn (chỉ job owner)
        """

        application, error = self._get_application_or_404(pk)
        if error:
            return error

        if not self._is_job_owner(request, application):
            return Response(
                {"detail": "Permission denied"}, status=status.HTTP_403_FORBIDDEN
            )

        permission_error = self._ensure_verified_company(
            request, application.job.company
        )
        if permission_error:
            return permission_error

        try:
            updated = change_application_status(
                application, "shortlisted", request.user, request.data.get("notes")
            )

            return Response(
                ApplicationDetailSerializer(updated, context={"request": request}).data
            )
        except ValueError as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def reject(self, request, pk=None):
        """
        POST /api/applications/:id/reject/
        Từ chối ứng viên (chỉ job owner)
        """

        application, error = self._get_application_or_404(pk)
        if error:
            return error

        if not self._is_job_owner(request, application):
            return Response(
                {"detail": "Permission denied"}, status=status.HTTP_403_FORBIDDEN
            )

        permission_error = self._ensure_verified_company(
            request, application.job.company
        )
        if permission_error:
            return permission_error

        serializer = ApplicationRejectSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        reason = serializer.validated_data.get("reason", "Không phù hợp")

        try:
            updated = change_application_status(
                application, "rejected", request.user, reason
            )

            return Response(
                ApplicationDetailSerializer(updated, context={"request": request}).data
            )
        except ValueError as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def offer(self, request, pk=None):
        """
        POST /api/applications/:id/offer/
        Gửi offer (chỉ job owner)
        """

        application, error = self._get_application_or_404(pk)
        if error:
            return error

        if not self._is_job_owner(request, application):
            return Response(
                {"detail": "Permission denied"}, status=status.HTTP_403_FORBIDDEN
            )

        permission_error = self._ensure_verified_company(
            request, application.job.company
        )
        if permission_error:
            return permission_error

        serializer = ApplicationOfferSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            updated = send_offer(
                application,
                serializer.validated_data["offer_details"],
                request.user,
                serializer.validated_data.get("salary"),
                serializer.validated_data.get("start_date"),
            )

            return Response(
                ApplicationDetailSerializer(updated, context={"request": request}).data
            )
        except ValueError as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def applicant_withdraw(self, request, pk=None):
        """
        POST /api/applications/:id/withdraw/
        Ứng viên rút đơn (chỉ applicant)
        """

        application, error = self._get_application_or_404(pk)
        if error:
            return error

        if not self._is_applicant(request, application):
            return Response(
                {"detail": "Permission denied"}, status=status.HTTP_403_FORBIDDEN
            )

        serializer = ApplicationWithdrawSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            updated = applicant_withdraw(
                application, serializer.validated_data.get("reason")
            )
            return Response(
                ApplicationDetailSerializer(updated, context={"request": request}).data
            )
        except ValueError as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def stats(self, request):
        """
        GET /api/applications/stats/
        Thống kê đơn ứng tuyển
        """

        stats = get_application_stats(request.user)
        return Response(stats)

    def bulk_action_view(self, request):
        """
        POST /api/applications/bulk-action/
        Thao tác hàng loạt
        """
        from .serializers import ApplicationBulkActionSerializer
        from .services.applications import bulk_action

        serializer = ApplicationBulkActionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            result = bulk_action(
                serializer.validated_data["application_ids"],
                serializer.validated_data["action"],
                request.user,
                serializer.validated_data.get("notes"),
            )
            return Response(result)
        except ValueError as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def export(self, request):
        """
        GET /api/applications/export/
        Export danh sách applications (CSV)
        """

        job_id, error = _parse_optional_int(request.query_params, "job_id")
        if error:
            return error

        status_filter = request.query_params.get("status")

        applications = list_applications_for_export(
            request.user, job_id=job_id, status=status_filter
        )
        if applications.count() > APPLICATION_EXPORT_MAX_ROWS:
            return Response(
                {
                    "detail": (
                        "Export quá lớn. Vui lòng lọc theo job_id hoặc status "
                        f"để còn tối đa {APPLICATION_EXPORT_MAX_ROWS} bản ghi."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Create CSV response
        response = HttpResponse(content_type="text/csv")
        response["Content-Disposition"] = 'attachment; filename="applications.csv"'

        writer = csv.writer(response)
        writer.writerow(
            [
                "ID",
                "Job Title",
                "Applicant Name",
                "Email",
                "Status",
                "Rating",
                "Applied At",
                "Notes",
            ]
        )

        for app in applications.iterator(chunk_size=500):
            writer.writerow(
                [
                    _csv_safe(app.id),
                    _csv_safe(app.job.title),
                    _csv_safe(app.recruiter.user.full_name),
                    _csv_safe(app.recruiter.user.email),
                    _csv_safe(app.status),
                    _csv_safe(app.rating or ""),
                    _csv_safe(app.applied_at.strftime("%Y-%m-%d %H:%M")),
                    _csv_safe(app.notes or ""),
                ]
            )

        return response

    def list_interviews(self, request, pk=None):
        """
        GET /api/applications/:id/interviews/
        Lịch sử phỏng vấn của đơn
        """

        application, error = self._get_application_or_404(pk)
        if error:
            return error

        # Job team, applicant, or admin can view
        if (
            not is_admin_user(request.user)
            and not self._is_job_owner(request, application)
            and not self._is_applicant(request, application)
        ):
            return Response(
                {"detail": "Permission denied"}, status=status.HTTP_403_FORBIDDEN
            )

        interviews = list_interviews_by_application(int(pk))
        return Response(InterviewListSerializer(interviews, many=True).data)

    @action(detail=True, methods=["get"], url_path="cv-file")
    def cv_file(self, request, pk=None):
        """
        GET /api/applications/:id/cv-file/
        Protected PDF proxy for uploaded/generated CV files.
        """
        application, error = self._get_application_or_404(pk)
        if error:
            return error

        if (
            not is_admin_user(request.user)
            and not self._is_job_owner(request, application)
            and not self._is_applicant(request, application)
        ):
            return Response(
                {"detail": "Permission denied"}, status=status.HTTP_403_FORBIDDEN
            )

        if not application.cv:
            return Response(
                {"detail": "This application does not have a CV."},
                status=status.HTTP_404_NOT_FOUND,
            )

        from apps.candidate.recruiter_cvs.services.recruiter_cvs import (
            generate_cv_download,
        )
        from apps.candidate.recruiter_cvs.tasks import _download_pdf

        try:
            cv_url = application.cv.cv_url
            if not cv_url or application.cv.template_id:
                result = generate_cv_download(application.cv)
                cv_url = result.get("download_url")
            if not cv_url:
                return Response(
                    {"detail": "CV file is not available."},
                    status=status.HTTP_404_NOT_FOUND,
                )

            pdf_bytes = _download_pdf(cv_url)
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_502_BAD_GATEWAY)
        except Exception as exc:
            return Response(
                {"detail": f"Error loading CV file: {str(exc)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        filename = get_valid_filename(f"{application.cv.cv_name or 'CV'}.pdf")
        disposition = (
            "attachment"
            if str(request.query_params.get("download", "")).lower() in {"1", "true"}
            else "inline"
        )
        response = HttpResponse(pdf_bytes, content_type="application/pdf")
        response["Content-Disposition"] = f'{disposition}; filename="{filename}"'
        response["Cache-Control"] = "private, max-age=60"
        return response

    @action(detail=True, methods=["get"])
    def cv_preview(self, request, pk=None):
        """
        GET /api/applications/:id/cv_preview/
        Preview CV content (HTML) for job owner or applicant
        """
        application, error = self._get_application_or_404(pk)
        if error:
            return error

        if (
            not is_admin_user(request.user)
            and not self._is_job_owner(request, application)
            and not self._is_applicant(request, application)
        ):
            return Response(
                {"detail": "Permission denied"}, status=status.HTTP_403_FORBIDDEN
            )

        if not application.cv:
            return Response(
                {"detail": "This application does not have a dynamic CV."},
                status=status.HTTP_404_NOT_FOUND,
            )

        from apps.candidate.recruiter_cvs.services.recruiter_cvs import (
            generate_cv_preview,
        )

        try:
            result = generate_cv_preview(application.cv)
            return Response(result)
        except Exception as e:
            return Response(
                {"detail": f"Error generating preview: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
