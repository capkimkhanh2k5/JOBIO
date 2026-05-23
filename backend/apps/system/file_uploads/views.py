from rest_framework import viewsets, status, parsers
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from django.db.models import Count, Sum, Avg, Q
from .models import FileUpload
from .serializers import FileUploadSerializer
from .services.file_uploads import save_upload
from apps.core.users.permissions import is_admin_user


class FileUploadViewSet(viewsets.ModelViewSet):
    """
    ViewSet for File Uploads
    """

    queryset = FileUpload.objects.all()
    serializer_class = FileUploadSerializer
    permission_classes = [IsAuthenticated]
    parser_classes = [parsers.MultiPartParser, parsers.FormParser]

    def get_queryset(self):
        """
        Người dùng chỉ thấy các file upload của mình trừ khi là admin
        """
        if is_admin_user(self.request.user):
            queryset = FileUpload.objects.all()
        else:
            queryset = FileUpload.objects.filter(user=self.request.user)

        search = self.request.query_params.get("search")
        file_type = self.request.query_params.get("file_type")
        entity_type = self.request.query_params.get("entity_type")
        date_from = self.request.query_params.get("date_from")
        date_to = self.request.query_params.get("date_to")

        if search:
            queryset = queryset.filter(
                Q(original_name__icontains=search)
                | Q(file_name__icontains=search)
                | Q(user__full_name__icontains=search)
                | Q(user__email__icontains=search)
            )
        if file_type:
            queryset = queryset.filter(file_type=file_type)
        if entity_type:
            queryset = queryset.filter(entity_type=entity_type)
        if date_from:
            queryset = queryset.filter(created_at__gte=date_from)
        if date_to:
            queryset = queryset.filter(created_at__lte=date_to)

        return queryset.order_by("-created_at")

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        file_obj = request.FILES.get("file")
        if not file_obj:
            return Response(
                {"detail": "No file provided"}, status=status.HTTP_400_BAD_REQUEST
            )

        try:
            upload = save_upload(
                user=request.user,
                file_obj=file_obj,
                entity_type=request.data.get("entity_type"),
                entity_id=request.data.get("entity_id"),
                is_public=request.data.get("is_public") == "true",
            )
            return Response(
                FileUploadSerializer(upload).data, status=status.HTTP_201_CREATED
            )
        except Exception as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=["get"], url_path="stats")
    def stats(self, request):
        """GET /api/file-uploads/stats/ - Thống kê File Uploads"""
        queryset = self.get_queryset()

        total_files = queryset.count()
        total_bytes = queryset.aggregate(Sum("file_size"))["file_size__sum"] or 0
        avg_size = queryset.aggregate(Avg("file_size"))["file_size__avg"] or 0

        storage_by_type = (
            queryset.values("file_type")
            .annotate(count=Count("id"), total_bytes=Sum("file_size"))
            .order_by("-total_bytes")
        )

        storage_by_entity = (
            queryset.values("entity_type")
            .annotate(count=Count("id"), total_bytes=Sum("file_size"))
            .order_by("-total_bytes")
        )

        return Response(
            {
                "total_files": total_files,
                "total_bytes": total_bytes,
                "avg_size": int(avg_size),
                "storage_by_type": list(storage_by_type),
                "storage_by_entity": list(storage_by_entity),
            }
        )
