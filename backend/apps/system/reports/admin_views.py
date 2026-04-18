import csv
from django.http import HttpResponse
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q
from django.utils import timezone

from apps.core.users.permissions import IsAdmin
from .models import Report
from .serializers import AdminReportSerializer, AdminReportStatusUpdateSerializer
from apps.core.pagination import StandardResultsSetPagination

class AdminReportViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet dành riêng cho Admin để quản lý báo cáo vi phạm
    """
    permission_classes = [IsAdmin]
    serializer_class = AdminReportSerializer
    pagination_class = StandardResultsSetPagination

    def get_queryset(self):
        queryset = Report.objects.select_related('reporter', 'report_type', 'resolved_by').all().order_by('-created_at')
        
        status_param = self.request.query_params.get('status')
        if status_param and status_param != 'all':
            queryset = queryset.filter(status=status_param)
            
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(description__icontains=search) | 
                Q(reporter__email__icontains=search) |
                Q(entity_type__icontains=search) |
                Q(report_type__type_name__icontains=search)
            )
            
        return queryset

    @action(detail=False, methods=['get'])
    def stats(self, request):
        """
        Lấy thống kê tổng quan báo cáo
        """
        total_reports = Report.objects.count()
        pending_reports = Report.objects.filter(status=Report.Status.PENDING).count()
        resolved_reports = Report.objects.filter(status=Report.Status.RESOLVED).count()
        rejected_reports = Report.objects.filter(status=Report.Status.REJECTED).count()

        return Response({
            "total_reports": total_reports,
            "pending_reports": pending_reports,
            "resolved_reports": resolved_reports,
            "rejected_reports": rejected_reports
        })

    @action(detail=True, methods=['patch'])
    def update_status(self, request, pk=None):
        """
        Cập nhật trạng thái báo cáo (Chỉ dành cho Admin)
        """
        try:
            report = self.get_queryset().get(pk=pk)
        except Report.DoesNotExist:
            return Response({"detail": "Không tìm thấy báo cáo."}, status=status.HTTP_404_NOT_FOUND)

        serializer = AdminReportStatusUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        new_status = serializer.validated_data['status']
        resolution_notes = serializer.validated_data.get('resolution_notes', '')

        report.status = new_status
        report.resolution_notes = resolution_notes
        report.resolved_by = request.user
        report.resolved_at = timezone.now()
        report.save()

        # Serialize lại để trả về
        result_serializer = AdminReportSerializer(report)
        return Response(result_serializer.data)

    @action(detail=False, methods=['get'], url_path='export')
    def export_csv(self, request):
        """
        Xuất danh sách báo cáo ra file CSV
        """
        queryset = self.get_queryset()
        
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="reports.csv"'
        
        writer = csv.writer(response)
        writer.writerow(['ID Báo cáo', 'Loại vi phạm', 'Người báo cáo', 'Đối tượng', 'ID Đối tượng', 'Trạng thái', 'Ngày báo cáo', 'Người xử lý', 'Ghi chú'])
        
        for report in queryset:
            writer.writerow([
                f"REP-{report.id}",
                report.report_type.type_name if report.report_type else "N/A",
                report.reporter.email if report.reporter else "N/A",
                report.entity_type,
                report.entity_id,
                report.get_status_display(),
                report.created_at.strftime('%Y-%m-%d %H:%M:%S'),
                report.resolved_by.email if report.resolved_by else "N/A",
                report.resolution_notes or ""
            ])
            
        return response
