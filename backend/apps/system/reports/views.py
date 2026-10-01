from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.core.throttles import ReportCreateRateThrottle

from .models import Report
from .serializers import ReportCreateSerializer


class ReportCreateView(generics.CreateAPIView):
    """
    Endpoint cho user đã đăng nhập gửi báo cáo vi phạm.
    """

    serializer_class = ReportCreateSerializer
    permission_classes = [IsAuthenticated]
    throttle_classes = [ReportCreateRateThrottle]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        duplicate_exists = Report.objects.filter(
            reporter=request.user,
            report_type=serializer.validated_data["report_type"],
            entity_type=serializer.validated_data["entity_type"],
            entity_id=serializer.validated_data["entity_id"],
            status__in=[Report.Status.PENDING, Report.Status.REVIEWING],
        ).exists()
        if duplicate_exists:
            return Response(
                {"detail": "Bạn đã gửi báo cáo cho đối tượng này và đang chờ xử lý."},
                status=status.HTTP_409_CONFLICT,
            )

        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(
            serializer.data, status=status.HTTP_201_CREATED, headers=headers
        )

    def perform_create(self, serializer):
        serializer.save(reporter=self.request.user)
