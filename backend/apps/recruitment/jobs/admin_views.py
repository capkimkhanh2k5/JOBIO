import csv
from django.http import HttpResponse
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Sum, Q

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
        queryset = Job.objects.select_related('company', 'company__user', 'category', 'created_by').all().order_by('-created_at')
        
        status_param = self.request.query_params.get('status')
        if status_param and status_param != 'all':
            # Kiểm tra xem status_param có phải là một trong các status hợp lệ của Job model
            valid_statuses = [s[0] for s in Job.Status.choices]
            if status_param in valid_statuses:
                queryset = queryset.filter(status=status_param)
            
        search = self.request.query_params.get('search')
        if search:
            search_filter = (
                Q(title__icontains=search) |
                Q(company__company_name__icontains=search) |
                Q(company__user__email__icontains=search) |
                Q(slug__icontains=search)
            )
            if search.isdigit():
                search_filter |= Q(id=int(search))
            queryset = queryset.filter(search_filter)
            
        return queryset

    @action(detail=False, methods=['get'])
    def stats(self, request):
        """
        Lấy thống kê tổng quan việc làm
        """
        total_jobs = Job.objects.count()
        active_jobs = Job.objects.filter(status=Job.Status.PUBLISHED).count()
        
        # Tổng view của tất cả các job
        total_views = Job.objects.aggregate(total=Sum('view_count'))['total'] or 0
        
        # Tổng đơn ứng tuyển
        total_applications = Job.objects.aggregate(total=Sum('application_count'))['total'] or 0

        return Response({
            "total_jobs": total_jobs,
            "active_jobs": active_jobs,
            "total_views": total_views,
            "total_applications": total_applications
        })

    @action(detail=False, methods=['get'], url_path='export')
    def export_csv(self, request):
        """
        Xuất danh sách việc làm ra file CSV
        """
        queryset = self.get_queryset()
        
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="jobs.csv"'
        
        writer = csv.writer(response)
        writer.writerow(['ID', 'Tiêu đề', 'Công ty', 'Email Công ty', 'Loại công việc', 'Cấp bậc', 'Lượt xem', 'Lượt ứng tuyển', 'Trạng thái', 'Ngày tạo'])
        
        for job in queryset:
            writer.writerow([
                f"JOB-{job.id}",
                job.title,
                job.company.company_name if job.company else "N/A",
                job.company.user.email if job.company and job.company.user else "N/A",
                job.get_job_type_display(),
                job.get_level_display(),
                job.view_count,
                job.application_count,
                job.get_status_display(),
                job.created_at.strftime('%Y-%m-%d %H:%M:%S')
            ])
            
        return response
