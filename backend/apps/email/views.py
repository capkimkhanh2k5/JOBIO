from datetime import timedelta

from django.db.models import Count, Q
from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response
from apps.email.models import EmailTemplate, EmailTemplateCategory, SentEmail
from apps.email.serializers import (
    EmailTemplateSerializer, 
    EmailTemplateCategorySerializer, 
    SentEmailSerializer
)
from apps.email.services import EmailService

class EmailTemplateCategoryViewSet(viewsets.ModelViewSet):
    queryset = EmailTemplateCategory.objects.all()
    serializer_class = EmailTemplateCategorySerializer
    permission_classes = [IsAdminUser]
    lookup_field = 'slug'

    def get_queryset(self):
        queryset = super().get_queryset().order_by('-created_at')
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search)
                | Q(slug__icontains=search)
                | Q(description__icontains=search)
            )
        return queryset

class EmailTemplateViewSet(viewsets.ModelViewSet):
    queryset = EmailTemplate.objects.select_related('category').all()
    serializer_class = EmailTemplateSerializer
    permission_classes = [IsAdminUser]
    lookup_field = 'slug'

    def get_queryset(self):
        queryset = super().get_queryset().order_by('-created_at')
        search = self.request.query_params.get('search')
        category = self.request.query_params.get('category')
        is_active = self.request.query_params.get('is_active')

        if search:
            queryset = queryset.filter(
                Q(name__icontains=search)
                | Q(slug__icontains=search)
                | Q(subject__icontains=search)
                | Q(body__icontains=search)
                | Q(category__name__icontains=search)
            )

        if category:
            queryset = queryset.filter(Q(category__slug=category) | Q(category_id=category))

        if is_active in {'true', 'false'}:
            queryset = queryset.filter(is_active=is_active == 'true')

        return queryset

    @action(detail=True, methods=['post'], url_path='test-send')
    def test_send(self, request, slug=None):
        template = self.get_object()
        recipient = request.data.get('recipient')
        if not recipient:
            return Response({"error": "Recipient required"}, status=status.HTTP_400_BAD_REQUEST)
        
        # Test sending
        success = EmailService.send_email(
            recipient=recipient,
            subject=f"[TEST] {template.subject}",
            template_slug=template.slug,
            context=request.data.get('context', {})
        )
        
        if success:
            return Response({"status": "sent"})
        else:
            return Response({"status": "failed"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class SentEmailViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = SentEmail.objects.select_related('template').all()
    serializer_class = SentEmailSerializer
    permission_classes = [IsAdminUser]

    def get_queryset(self):
        queryset = super().get_queryset().order_by('-created_at')
        search = self.request.query_params.get('search')
        status_filter = self.request.query_params.get('status')
        template = self.request.query_params.get('template')

        if search:
            queryset = queryset.filter(
                Q(recipient__icontains=search)
                | Q(subject__icontains=search)
                | Q(content__icontains=search)
                | Q(template__name__icontains=search)
                | Q(template__slug__icontains=search)
            )

        if status_filter:
            queryset = queryset.filter(status=status_filter)

        if template:
            queryset = queryset.filter(Q(template__slug=template) | Q(template_id=template))

        return queryset

    @action(detail=False, methods=['get'], url_path='stats')
    def stats(self, request):
        """GET /api/email/logs/stats/ - Thống kê Email"""
        queryset = SentEmail.objects.all()
        
        total_sent = queryset.count()
        success_count = queryset.filter(status=SentEmail.Status.SENT).count()
        failed_count = queryset.filter(status=SentEmail.Status.FAILED).count()
        pending_count = queryset.filter(status=SentEmail.Status.PENDING).count()
        
        success_rate = (success_count / total_sent * 100) if total_sent > 0 else 0
        failed_rate = (failed_count / total_sent * 100) if total_sent > 0 else 0
        pending_rate = (pending_count / total_sent * 100) if total_sent > 0 else 0
        
        # Daily trend - last 30 days
        now = timezone.now()
        daily_trend = []
        for i in range(30):
            day = now - timedelta(days=i)
            day_start = day.replace(hour=0, minute=0, second=0, microsecond=0)
            day_end = day_start + timedelta(days=1)
            
            day_count = queryset.filter(
                created_at__gte=day_start,
                created_at__lt=day_end
            ).count()
            daily_trend.append({
                'date': day_start.date().isoformat(),
                'count': day_count
            })
        daily_trend.reverse()
        
        # By template
        by_template = queryset.values('template__name').annotate(
            count=Count('id')
        ).order_by('-count')[:10]
        
        # Last sent
        last_sent = queryset.first()
        last_sent_time = last_sent.created_at.isoformat() if last_sent else None
        
        return Response({
            'total_sent': total_sent,
            'success_count': success_count,
            'success_rate': round(success_rate, 2),
            'failed_count': failed_count,
            'failed_rate': round(failed_rate, 2),
            'pending_count': pending_count,
            'pending_rate': round(pending_rate, 2),
            'daily_trend': daily_trend,
            'by_template': list(by_template),
            'last_sent': last_sent_time,
        })
