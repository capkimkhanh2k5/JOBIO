import csv
from django.http import HttpResponse
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Sum, Count, Q
from django.utils import timezone
from datetime import timedelta

from apps.core.users.permissions import IsAdmin
from apps.billing.models import Transaction, CompanySubscription
from apps.billing.serializers import AdminTransactionSerializer
from apps.core.pagination import StandardResultsSetPagination

class AdminFinancialViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet dành riêng cho Admin để quản lý tài chính
    """
    permission_classes = [IsAdmin]
    serializer_class = AdminTransactionSerializer
    pagination_class = StandardResultsSetPagination

    def get_queryset(self):
        queryset = Transaction.objects.select_related('company', 'company__user', 'payment_method').all().order_by('-created_at')
        
        status = self.request.query_params.get('status')
        if status and status != 'all':
            queryset = queryset.filter(status=status)
            
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(reference_code__icontains=search) | 
                Q(description__icontains=search) |
                Q(company__company_name__icontains=search) |
                Q(company__user__email__icontains=search)
            )
            
        return queryset

    @action(detail=False, methods=['get'])
    def stats(self, request):
        """
        Lấy thống kê tổng quan tài chính
        """
        now = timezone.now()
        first_day_of_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

        # Tổng doanh thu (Chỉ tính giao dịch COMPLETED)
        total_revenue = Transaction.objects.filter(status=Transaction.Status.COMPLETED).aggregate(total=Sum('amount'))['total'] or 0
        
        # Doanh thu tháng này
        monthly_revenue = Transaction.objects.filter(
            status=Transaction.Status.COMPLETED,
            created_at__gte=first_day_of_month
        ).aggregate(total=Sum('amount'))['total'] or 0

        # Số giao dịch tháng này
        monthly_transactions = Transaction.objects.filter(
            created_at__gte=first_day_of_month
        ).count()

        # Số gói Pro đang active (Tất cả các gói trả phí)
        active_subscriptions = CompanySubscription.objects.filter(
            status=CompanySubscription.Status.ACTIVE,
            plan__price__gt=0
        ).count()

        # Giá trị trung bình của giao dịch thành công
        successful_txns = Transaction.objects.filter(status=Transaction.Status.COMPLETED)
        avg_txn_value = 0
        if successful_txns.exists():
            avg_txn_value = float(total_revenue) / successful_txns.count()

        return Response({
            "total_revenue": total_revenue,
            "monthly_revenue": monthly_revenue,
            "monthly_transactions": monthly_transactions,
            "active_subscriptions": active_subscriptions,
            "avg_transaction_value": avg_txn_value
        })

    @action(detail=False, methods=['get'], url_path='export')
    def export_csv(self, request):
        """
        Xuất danh sách giao dịch ra file CSV
        """
        queryset = self.get_queryset()
        
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="transactions.csv"'
        
        writer = csv.writer(response)
        writer.writerow(['Mã GD', 'Công ty', 'Email', 'Loại', 'Trạng thái', 'Số tiền', 'Ngày tạo'])
        
        for txn in queryset:
            writer.writerow([
                txn.reference_code or f"TX-{txn.id}",
                txn.company.company_name if txn.company else "N/A",
                txn.company.user.email if txn.company and txn.company.user else "N/A",
                txn.get_type_display(),
                txn.get_status_display(),
                f"{txn.amount} {txn.currency}",
                txn.created_at.strftime('%Y-%m-%d %H:%M:%S')
            ])
            
        return response
