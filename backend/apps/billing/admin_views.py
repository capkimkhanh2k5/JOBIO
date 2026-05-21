from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Sum, Q
from django.utils import timezone

from apps.core.excel import make_excel_response
from apps.core.users.permissions import IsAdmin
from apps.billing.models import Transaction, CompanySubscription, SubscriptionPlan
from apps.billing.serializers import (
    AdminTransactionSerializer,
    SubscriptionPlanSerializer,
)
from apps.core.pagination import StandardResultsSetPagination


class AdminFinancialViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet dành riêng cho Admin để quản lý tài chính
    """

    permission_classes = [IsAdmin]
    serializer_class = AdminTransactionSerializer
    pagination_class = StandardResultsSetPagination

    def get_queryset(self):
        queryset = (
            Transaction.objects.select_related(
                "company", "company__user", "payment_method"
            )
            .all()
            .order_by("-created_at")
        )

        status_param = self.request.query_params.get("status")
        if status_param and status_param != "all":
            valid_statuses = [s[0] for s in Transaction.Status.choices]
            if status_param in valid_statuses:
                queryset = queryset.filter(status=status_param)

        search = self.request.query_params.get("search")
        if search:
            queryset = queryset.filter(
                Q(reference_code__icontains=search)
                | Q(description__icontains=search)
                | Q(company__company_name__icontains=search)
                | Q(company__user__email__icontains=search)
            )

        return queryset

    @action(detail=False, methods=["get"])
    def stats(self, request):
        """
        Lấy thống kê tổng quan tài chính
        """
        now = timezone.now()
        first_day_of_month = now.replace(
            day=1, hour=0, minute=0, second=0, microsecond=0
        )

        # Tổng doanh thu (Chỉ tính giao dịch COMPLETED)
        total_revenue = (
            Transaction.objects.filter(status=Transaction.Status.COMPLETED).aggregate(
                total=Sum("amount")
            )["total"]
            or 0
        )

        # Doanh thu tháng này
        monthly_revenue = (
            Transaction.objects.filter(
                status=Transaction.Status.COMPLETED, created_at__gte=first_day_of_month
            ).aggregate(total=Sum("amount"))["total"]
            or 0
        )

        # Số giao dịch tháng này
        monthly_transactions = Transaction.objects.filter(
            created_at__gte=first_day_of_month
        ).count()

        # Số gói Pro đang active (Tất cả các gói trả phí)
        active_subscriptions = CompanySubscription.objects.filter(
            status=CompanySubscription.Status.ACTIVE, plan__price__gt=0
        ).count()

        # Giá trị trung bình của giao dịch thành công
        successful_txns = Transaction.objects.filter(
            status=Transaction.Status.COMPLETED
        )
        avg_txn_value = 0
        if successful_txns.exists():
            avg_txn_value = float(total_revenue) / successful_txns.count()

        return Response(
            {
                "total_revenue": total_revenue,
                "monthly_revenue": monthly_revenue,
                "monthly_transactions": monthly_transactions,
                "active_subscriptions": active_subscriptions,
                "avg_transaction_value": avg_txn_value,
            }
        )

    @action(detail=False, methods=["get"], url_path="subscriptions")
    def subscriptions(self, request):
        """
        Danh sách subscription đang hoạt động để admin theo dõi hạn dùng theo công ty.
        """
        queryset = (
            CompanySubscription.objects.select_related(
                "company",
                "company__user",
                "plan",
            )
            .filter(status=CompanySubscription.Status.ACTIVE)
            .order_by("end_date", "-created_at")
        )

        search = request.query_params.get("search")
        if search:
            queryset = queryset.filter(
                Q(company__company_name__icontains=search)
                | Q(company__user__email__icontains=search)
                | Q(plan__name__icontains=search)
            )

        now_date = timezone.now().date()

        def map_item(sub):
            days_left = (sub.end_date - now_date).days
            return {
                "id": sub.id,
                "company_id": sub.company_id,
                "company_name": sub.company.company_name if sub.company else None,
                "company_email": sub.company.user.email
                if sub.company and sub.company.user
                else None,
                "plan_name": sub.plan.name if sub.plan else None,
                "plan_slug": sub.plan.slug if sub.plan else None,
                "start_date": sub.start_date,
                "end_date": sub.end_date,
                "status": sub.status,
                "days_left": days_left,
                "is_expiring_soon": days_left <= 7,
            }

        page = self.paginate_queryset(queryset)
        if page is not None:
            return self.get_paginated_response([map_item(sub) for sub in page])

        return Response([map_item(sub) for sub in queryset])

    @action(detail=False, methods=["get"], url_path="export")
    def export_csv(self, request):
        """
        Xuất danh sách giao dịch ra file Excel.
        """
        queryset = self.get_queryset()

        headers = [
            "Mã giao dịch",
            "Công ty",
            "Email",
            "Loại",
            "Phương thức",
            "Trạng thái",
            "Số tiền",
            "Tiền tệ",
            "Ngày tạo",
        ]
        rows = (
            [
                txn.reference_code or f"TX-{txn.id}",
                txn.company.company_name if txn.company else "N/A",
                txn.company.user.email if txn.company and txn.company.user else "N/A",
                txn.get_type_display(),
                txn.payment_method.name if txn.payment_method else "N/A",
                txn.get_status_display(),
                txn.amount,
                txn.currency,
                txn.created_at.strftime("%Y-%m-%d %H:%M:%S")
                if txn.created_at
                else "",
            ]
            for txn in queryset
        )

        return make_excel_response(
            filename="transactions.xlsx",
            headers=headers,
            rows=rows,
            sheet_name="Tai chinh",
        )


class AdminSubscriptionPlanViewSet(viewsets.ModelViewSet):
    """
    Admin quản lý gói thuê bao hệ thống.
    """

    permission_classes = [IsAdmin]
    serializer_class = SubscriptionPlanSerializer
    pagination_class = StandardResultsSetPagination
    http_method_names = ["get", "patch", "head", "options"]

    def get_queryset(self):
        queryset = SubscriptionPlan.objects.all().order_by(
            "price", "duration_days", "id"
        )
        search = self.request.query_params.get("search")
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search)
                | Q(slug__icontains=search)
                | Q(currency__icontains=search)
            )
        return queryset

    def partial_update(self, request, *args, **kwargs):
        # Chỉ cho phép admin chỉnh các trường vận hành trong trang System Settings.
        allowed_fields = {"price", "duration_days", "is_active"}
        payload = {k: v for k, v in request.data.items() if k in allowed_fields}
        serializer = self.get_serializer(self.get_object(), data=payload, partial=True)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return Response(serializer.data, status=status.HTTP_200_OK)
