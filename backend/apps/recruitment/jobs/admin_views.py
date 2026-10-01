from rest_framework import filters, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Avg, Sum, Q
from django.utils import timezone

from apps.core.excel import make_excel_response
from apps.core.users.permissions import IsAdmin
from apps.moderation.services import ModerationResult, create_audit
from apps.recruitment.jobs.models import CanonicalTitle, Job, JobTitleAlias, SkillAlias
from apps.recruitment.jobs.serializers import (
    AdminJobSerializer,
    CanonicalTitleSerializer,
    JobTitleAliasSerializer,
    SkillAliasSerializer,
)
from apps.recruitment.jobs.services.recommendations import (
    get_vector_sync_progress,
    recommendation_health_snapshot,
    sync_missing_embeddings,
)
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

        moderation_status = self.request.query_params.get("moderation_status")
        if moderation_status:
            queryset = queryset.filter(moderation_status=moderation_status)

        domain_status = self.request.query_params.get("domain_status")
        if domain_status:
            queryset = queryset.filter(domain_status=domain_status)

        if self.request.query_params.get("needs_review") == "true":
            queryset = queryset.filter(
                Q(moderation_status=Job.ModerationStatus.NEEDS_REVIEW)
                | Q(domain_status=Job.DomainStatus.NEEDS_REVIEW)
                | Q(domain_status=Job.DomainStatus.NON_IT)
            )

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

    @action(detail=True, methods=["post"], url_path="moderation/approve")
    def moderation_approve(self, request, pk=None):
        job = self.get_object()
        job.domain_status = Job.DomainStatus.IT_APPROVED
        job.moderation_status = Job.ModerationStatus.APPROVED
        job.moderation_reasons = []
        job.last_moderated_at = timezone.now()
        job.save(
            update_fields=[
                "domain_status",
                "moderation_status",
                "moderation_reasons",
                "last_moderated_at",
                "updated_at",
            ]
        )
        self._audit_override(request, job, "approved")
        return Response(self.get_serializer(job).data)

    @action(detail=True, methods=["post"], url_path="moderation/reject")
    def moderation_reject(self, request, pk=None):
        job = self.get_object()
        reason = request.data.get("reason") or "Admin rejected moderation."
        job.domain_status = request.data.get("domain_status") or Job.DomainStatus.NON_IT
        job.moderation_status = Job.ModerationStatus.REJECTED
        job.moderation_reasons = [
            {
                "code": "admin_rejected",
                "field": None,
                "message": reason,
                "suggestion": (
                    "Chỉnh lại nội dung theo lý do admin nêu rồi gửi kiểm tra lại."
                ),
            }
        ]
        job.last_moderated_at = timezone.now()
        if job.status == Job.Status.PUBLISHED:
            job.status = Job.Status.CLOSED
        job.save(
            update_fields=[
                "status",
                "domain_status",
                "moderation_status",
                "moderation_reasons",
                "last_moderated_at",
                "updated_at",
            ]
        )
        self._audit_override(request, job, "rejected", job.moderation_reasons)
        return Response(self.get_serializer(job).data)

    @action(detail=True, methods=["post"], url_path="moderation/request_changes")
    def moderation_request_changes(self, request, pk=None):
        job = self.get_object()
        reason = request.data.get("reason") or "Admin requested changes."
        job.domain_status = Job.DomainStatus.NEEDS_REVIEW
        job.moderation_status = Job.ModerationStatus.NEEDS_REVIEW
        job.moderation_reasons = [
            {
                "code": "admin_request_changes",
                "field": None,
                "message": reason,
                "suggestion": (
                    "Cập nhật các phần admin yêu cầu trước khi xuất bản lại."
                ),
            }
        ]
        job.last_moderated_at = timezone.now()
        if job.status == Job.Status.PUBLISHED:
            job.status = Job.Status.CLOSED
        job.save(
            update_fields=[
                "status",
                "domain_status",
                "moderation_status",
                "moderation_reasons",
                "last_moderated_at",
                "updated_at",
            ]
        )
        self._audit_override(request, job, "needs_review", job.moderation_reasons)
        return Response(self.get_serializer(job).data)

    def _audit_override(self, request, job, decision, reasons=None):
        create_audit(
            entity_type="job",
            entity_id=job.id,
            purpose="admin_job_moderation",
            result=ModerationResult(
                allowed=decision == "approved",
                decision=decision,
                severity="none" if decision == "approved" else "medium",
                reasons=reasons or [],
                blocked_fields=[],
                provider="admin",
                confidence=1.0,
            ),
            user=request.user,
            metadata={"status": job.status},
        )

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
        moderation_counts = {
            "needs_review": Job.objects.filter(
                Q(moderation_status=Job.ModerationStatus.NEEDS_REVIEW)
                | Q(domain_status=Job.DomainStatus.NEEDS_REVIEW)
            ).count(),
            "non_it": Job.objects.filter(domain_status=Job.DomainStatus.NON_IT).count(),
            "rejected": Job.objects.filter(
                moderation_status=Job.ModerationStatus.REJECTED
            ).count(),
            "approved": Job.objects.filter(
                moderation_status=Job.ModerationStatus.APPROVED,
                domain_status=Job.DomainStatus.IT_APPROVED,
            ).count(),
        }

        return Response(
            {
                "total_jobs": total_jobs,
                "active_jobs": active_jobs,
                "total_views": total_views,
                "avg_views_per_job": avg_views_per_job,
                "total_applications": total_applications,
                "moderation": moderation_counts,
            }
        )

    @action(detail=False, methods=["get"], url_path="recommendations/health")
    def recommendation_health(self, request):
        """
        Operational snapshot for PGVector recommendation health.
        """
        try:
            days = int(request.query_params.get("days", 7))
        except (TypeError, ValueError):
            days = 7
        return Response(recommendation_health_snapshot(days=days))

    @action(
        detail=False,
        methods=["post"],
        url_path="recommendations/sync-missing-embeddings",
    )
    def sync_missing_embeddings(self, request):
        """
        Sinh Vector Embeddings CHỈ cho các tin tuyển dụng và hồ sơ ứng viên còn thiếu.
        """
        result = sync_missing_embeddings()
        return Response(result)

    @action(
        detail=False,
        methods=["get"],
        url_path="recommendations/sync-missing-embeddings/status",
    )
    def sync_missing_embeddings_status(self, request):
        """
        Lấy % tiến trình thời gian thực của tác vụ ngầm sinh Vector.
        """
        return Response(get_vector_sync_progress())

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
                job.created_at.strftime("%Y-%m-%d %H:%M:%S") if job.created_at else "",
            ]
            for job in queryset
        )

        return make_excel_response(
            filename="jobs.xlsx",
            headers=headers,
            rows=rows,
            sheet_name="Thi truong viec lam",
        )


class AdminCanonicalTitleViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAdmin]
    serializer_class = CanonicalTitleSerializer
    pagination_class = StandardResultsSetPagination
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["name", "description", "category"]
    ordering_fields = ["name", "category", "updated_at"]
    ordering = ["name"]
    queryset = CanonicalTitle.objects.all()


class AdminJobTitleAliasViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAdmin]
    serializer_class = JobTitleAliasSerializer
    pagination_class = StandardResultsSetPagination
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["alias_name", "normalized_alias", "canonical_title__name"]
    ordering_fields = ["alias_name", "normalized_alias", "updated_at"]
    ordering = ["alias_name"]

    def get_queryset(self):
        queryset = JobTitleAlias.objects.select_related("canonical_title")
        canonical_title = self.request.query_params.get("canonical_title")
        if canonical_title:
            queryset = queryset.filter(canonical_title_id=canonical_title)
        return queryset


class AdminSkillAliasViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAdmin]
    serializer_class = SkillAliasSerializer
    pagination_class = StandardResultsSetPagination
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["alias_name", "normalized_alias", "skill__name"]
    ordering_fields = ["alias_name", "normalized_alias", "updated_at"]
    ordering = ["alias_name"]

    def get_queryset(self):
        queryset = SkillAlias.objects.select_related("skill")
        skill = self.request.query_params.get("skill")
        if skill:
            queryset = queryset.filter(skill_id=skill)
        return queryset
