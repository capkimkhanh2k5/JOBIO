from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Avg, Sum, Q

from apps.core.excel import make_excel_response
from apps.core.users.permissions import IsAdmin
from apps.recruitment.jobs.models import Job
from apps.recruitment.jobs.serializers import AdminJobSerializer
from apps.core.pagination import StandardResultsSetPagination


class AdminJobViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet dành riêng cho Admin để quản lý thị trường việc làm
    """

    permission_classes = [IsAdmin]
    serializer_class = AdminJobSerializer
    pagination_class = StandardResultsSetPagination

    def get_queryset(self):
        queryset = (
            Job.objects.select_related(
                "company", "company__user", "category", "created_by"
            )
            .all()
            .order_by("-created_at")
        )

        status_param = self.request.query_params.get("status")
        if status_param and status_param != "all":
            # Kiểm tra xem status_param có phải là một trong các status hợp lệ của Job model
            valid_statuses = [s[0] for s in Job.Status.choices]
            if status_param in valid_statuses:
                queryset = queryset.filter(status=status_param)

        search = self.request.query_params.get("search")
        if search:
            search_filter = (
                Q(title__icontains=search)
                | Q(company__company_name__icontains=search)
                | Q(company__user__email__icontains=search)
                | Q(slug__icontains=search)
            )
            if search.isdigit():
                search_filter |= Q(id=int(search))
            queryset = queryset.filter(search_filter)

        return queryset

    @action(detail=False, methods=["get"])
    def stats(self, request):
        """
        Lấy thống kê tổng quan việc làm
        """
        total_jobs = Job.objects.count()
        active_jobs = Job.objects.filter(status=Job.Status.PUBLISHED).count()

        view_stats = Job.objects.aggregate(
            total=Sum("view_count"),
            average=Avg("view_count"),
        )
        total_views = view_stats["total"] or 0
        avg_views_per_job = view_stats["average"] or 0

        # Tổng đơn ứng tuyển
        total_applications = (
            Job.objects.aggregate(total=Sum("application_count"))["total"] or 0
        )

        return Response(
            {
                "total_jobs": total_jobs,
                "active_jobs": active_jobs,
                "total_views": total_views,
                "avg_views_per_job": avg_views_per_job,
                "total_applications": total_applications,
            }
        )

    @action(detail=False, methods=["get"], url_path="export")
    def export_csv(self, request):
        """
        Xuất danh sách việc làm ra file Excel.
        """
        queryset = self.get_queryset()

        headers = [
            "ID",
            "Tiêu đề",
            "Công ty",
            "Email công ty",
            "Loại công việc",
            "Cấp bậc",
            "Lượt xem",
            "Lượt ứng tuyển",
            "Trạng thái",
            "Ngày tạo",
        ]
        rows = (
            [
                f"JOB-{job.id}",
                job.title,
                job.company.company_name if job.company else "N/A",
                job.company.user.email if job.company and job.company.user else "N/A",
                job.get_job_type_display(),
                job.get_level_display(),
                job.view_count,
                job.application_count,
                job.get_status_display(),
                job.created_at.strftime("%Y-%m-%d %H:%M:%S")
                if job.created_at
                else "",
            ]
            for job in queryset
        )

        return make_excel_response(
            filename="jobs.xlsx",
            headers=headers,
            rows=rows,
            sheet_name="Thi truong viec lam",
        )
