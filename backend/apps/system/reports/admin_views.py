from django.template.loader import render_to_string
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q
from django.utils import timezone

from apps.core.excel import make_excel_response
from apps.core.users.permissions import IsAdmin
from apps.core.users.models import CustomUser
from apps.core.users.services.users import update_user_status
from .models import Report
from .serializers import (
    AdminReportSerializer,
    AdminReportStatusUpdateSerializer,
    ReportResolutionSerializer,
)
from apps.core.pagination import StandardResultsSetPagination
from apps.email.services import EmailService
from apps.communication.notifications.services.notifications import send_notification
from apps.recruitment.jobs.models import Job
from django.apps import apps
import logging

logger = logging.getLogger(__name__)


class AdminReportViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet dành riêng cho Admin để quản lý báo cáo vi phạm
    """

    permission_classes = [IsAdmin]
    serializer_class = AdminReportSerializer
    pagination_class = StandardResultsSetPagination

    def get_queryset(self):
        queryset = (
            Report.objects.select_related("reporter", "report_type", "resolved_by")
            .all()
            .order_by("-created_at")
        )

        status_param = self.request.query_params.get("status")
        if status_param and status_param != "all":
            queryset = queryset.filter(status=status_param)

        search = self.request.query_params.get("search")
        if search:
            queryset = queryset.filter(
                Q(description__icontains=search)
                | Q(reporter__email__icontains=search)
                | Q(entity_type__icontains=search)
                | Q(report_type__type_name__icontains=search)
            )

        return queryset

    @action(detail=False, methods=["get"])
    def stats(self, request):
        """
        Lấy thống kê tổng quan báo cáo
        """
        total_reports = Report.objects.count()
        pending_reports = Report.objects.filter(status=Report.Status.PENDING).count()
        resolved_reports = Report.objects.filter(status=Report.Status.RESOLVED).count()
        rejected_reports = Report.objects.filter(status=Report.Status.REJECTED).count()

        return Response(
            {
                "total_reports": total_reports,
                "pending_reports": pending_reports,
                "resolved_reports": resolved_reports,
                "rejected_reports": rejected_reports,
            }
        )

    @action(detail=True, methods=["patch"])
    def update_status(self, request, pk=None):
        """
        [DEPRECATED] Dùng `resolve` thay thế.
        Cập nhật trạng thái báo cáo (Chỉ dành cho Admin)
        """
        try:
            report = self.get_queryset().get(pk=pk)
        except Report.DoesNotExist:
            return Response(
                {"detail": "Không tìm thấy báo cáo."}, status=status.HTTP_404_NOT_FOUND
            )

        serializer = AdminReportStatusUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        new_status = serializer.validated_data["status"]
        resolution_notes = serializer.validated_data.get("resolution_notes", "")

        report.status = new_status
        report.resolution_notes = resolution_notes
        report.resolved_by = request.user
        report.resolved_at = timezone.now()
        report.save()

        result_serializer = AdminReportSerializer(report)
        return Response(result_serializer.data)

    @action(detail=True, methods=["post"])
    def resolve(self, request, pk=None):
        """
        Xử lý báo cáo với các hành động cụ thể (ban, hide_content, warn, reject)
        """
        try:
            report = self.get_queryset().get(pk=pk)
        except Report.DoesNotExist:
            return Response(
                {"detail": "Không tìm thấy báo cáo."}, status=status.HTTP_404_NOT_FOUND
            )

        if report.status in [Report.Status.RESOLVED, Report.Status.REJECTED]:
            return Response(
                {"detail": "Báo cáo đã được xử lý."}, status=status.HTTP_400_BAD_REQUEST
            )

        serializer = ReportResolutionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        action_type = serializer.validated_data["action"]
        reporter_note = serializer.validated_data.get("reporter_note", "")
        violator_note = serializer.validated_data.get("violator_note", "")

        # Combine into resolution_notes for internal logging
        combined_notes = (
            f"[Gửi Reporter]: {reporter_note}\n[Gửi Violator]: {violator_note}"
            if action_type != "reject"
            else f"[Bác bỏ]: {reporter_note}"
        )

        # Lấy Entity bị báo cáo
        entity_user = None
        entity_company = None
        entity_job = None
        entity_email = None
        entity_user_id = None
        entity_type = (report.entity_type or "").lower()
        try:
            if entity_type in ["user", "candidate", "recruiter"]:
                entity_user = apps.get_model("core_users", "CustomUser").objects.get(
                    id=report.entity_id
                )
                entity_email = entity_user.email
                entity_user_id = entity_user.id
            elif entity_type == "company":
                entity_company = apps.get_model(
                    "company_companies", "Company"
                ).objects.get(id=report.entity_id)
                if entity_company.user:
                    entity_user = entity_company.user
                    entity_email = entity_user.email
                    entity_user_id = entity_user.id
            elif entity_type == "job":
                entity_job = apps.get_model("recruitment_jobs", "Job").objects.get(
                    id=report.entity_id
                )
                if entity_job.company and entity_job.company.user:
                    entity_user = entity_job.company.user
                    entity_email = entity_user.email
                    entity_user_id = entity_user.id
        except Exception:
            logger.warning(
                f"Could not find entity {report.entity_type} {report.entity_id} for report {report.id}"
            )

        report_status = Report.Status.RESOLVED

        # Thực thi hành động
        try:
            if action_type == "ban":
                if entity_user:
                    update_user_status(entity_user, CustomUser.Status.BANNED)
                if entity_job and entity_job.status != Job.Status.CLOSED:
                    entity_job.status = Job.Status.CLOSED
                    entity_job.save(update_fields=["status"])
            elif action_type == "hide_content":
                if entity_job:
                    if entity_job.status != Job.Status.CLOSED:
                        entity_job.status = Job.Status.CLOSED
                        entity_job.save(update_fields=["status"])
                elif entity_company:
                    entity_company.jobs.filter(status=Job.Status.PUBLISHED).update(
                        status=Job.Status.CLOSED
                    )
                    if entity_user:
                        update_user_status(entity_user, CustomUser.Status.INACTIVE)
                elif entity_user:
                    update_user_status(entity_user, CustomUser.Status.INACTIVE)
            elif action_type == "reject":
                report_status = Report.Status.REJECTED
        except Exception as e:
            logger.error(
                f"Error applying action {action_type} to entity {report.entity_type} {report.entity_id}: {e}"
            )

        # Thông báo cho người báo cáo (Reporter)
        if report.reporter and report.reporter.email:
            action_text = (
                "đã từ chối do không phát hiện vi phạm"
                if action_type == "reject"
                else "đã tiến hành xử lý nghiêm"
            )

            reporter_body = render_to_string(
                "emails/report/reporter.html",
                {
                    "full_name": report.reporter.full_name or report.reporter.email,
                    "report_type_name": report.report_type.type_name
                    if report.report_type
                    else "Vi phạm",
                    "report_id": report.id,
                    "action_text": action_text,
                    "admin_note": reporter_note,
                },
            )

            # Gửi Email cho Reporter
            EmailService.send_email(
                recipient=report.reporter.email,
                subject=f"[JOBIO] Kết quả xử lý báo cáo vi phạm #{report.id}",
                body=reporter_body,
            )

            # Gửi In-App Notification cho Reporter
            send_notification(
                user_id=report.reporter.id,
                notification_type_name="report",
                title=f"Kết quả báo cáo #{report.id}",
                content=f"Báo cáo của bạn đã được {action_text}. Xem ghi chú: {reporter_note}",
                link="/candidate/notifications",
            )

        # Thông báo cho đối tượng vi phạm (Reported Entity)
        if entity_email and action_type != "reject":
            violator_subject = "[JOBIO] CẢNH BÁO VI PHẠM TÀI KHOẢN/NỘI DUNG"
            violator_action = "Cảnh báo nhắc nhở"
            violator_color = "#f59e0b"
            violator_text_color = "#b45309"
            extra_text = (
                "Vui lòng khắc phục ngay lập tức để tránh các hình thức xử lý nặng hơn."
            )

            if action_type == "ban":
                violator_subject = "[JOBIO] QUYẾT ĐỊNH KHÓA TÀI KHOẢN VĨNH VIỄN"
                violator_action = "KHÓA VĨNH VIỄN"
                violator_color = "#dc2626"
                violator_text_color = "#991b1b"
                extra_text = "Quyết định này là không thể thay đổi. Cảm ơn bạn đã từng sử dụng dịch vụ của chúng tôi."
            elif action_type == "hide_content":
                violator_subject = "[JOBIO] THÔNG BÁO ẨN NỘI DUNG VI PHẠM"
                violator_action = "Ẩn tài khoản/nội dung"
                violator_color = "#ef4444"
                violator_text_color = "#b91c1c"
                extra_text = (
                    "Vui lòng liên hệ bộ phận hỗ trợ nếu bạn có bất kỳ thắc mắc nào."
                )

            violator_body = render_to_string(
                "emails/report/report_result_violator.html",
                {
                    "report_type_name": report.report_type.type_name
                    if report.report_type
                    else "Vi phạm",
                    "violator_action": violator_action,
                    "violator_color": violator_color,
                    "violator_text_color": violator_text_color,
                    "admin_note": violator_note,
                    "extra_text": extra_text,
                },
            )

            # Gửi Email cho Violator
            EmailService.send_email(
                recipient=entity_email, subject=violator_subject, body=violator_body
            )

            # Gửi In-App Notification cho Violator (NẾU không phải ban)
            if action_type != "ban" and entity_user_id:
                notif_title = (
                    "Cảnh báo vi phạm nội dung"
                    if action_type == "warn"
                    else "Nội dung vi phạm đã bị ẩn"
                )
                send_notification(
                    user_id=entity_user_id,
                    notification_type_name="warning",
                    title=notif_title,
                    content=violator_note,
                )

        report.status = report_status
        report.resolution_notes = combined_notes
        report.resolved_by = request.user
        report.resolved_at = timezone.now()
        report.save()

        result_serializer = AdminReportSerializer(report)
        return Response(result_serializer.data)

    @action(detail=False, methods=["get"], url_path="export")
    def export_csv(self, request):
        """
        Xuất danh sách báo cáo ra file Excel.
        """
        queryset = self.get_queryset()

        headers = [
            "ID báo cáo",
            "Loại vi phạm",
            "Người báo cáo",
            "Đối tượng",
            "ID đối tượng",
            "Trạng thái",
            "Ngày báo cáo",
            "Người xử lý",
            "Ghi chú",
        ]
        rows = (
            [
                f"REP-{report.id}",
                report.report_type.type_name if report.report_type else "N/A",
                report.reporter.email if report.reporter else "N/A",
                report.entity_type,
                report.entity_id,
                report.get_status_display(),
                report.created_at.strftime("%Y-%m-%d %H:%M:%S")
                if report.created_at
                else "",
                report.resolved_by.email if report.resolved_by else "N/A",
                report.resolution_notes or "",
            ]
            for report in queryset
        )

        return make_excel_response(
            filename="reports.xlsx",
            headers=headers,
            rows=rows,
            sheet_name="Bao cao vi pham",
        )
