import logging

from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.conf import settings
from django.http import HttpResponse
from django.utils.text import get_valid_filename

from .models import RecruiterCV
from .serializers import (
    RecruiterCVListSerializer,
    RecruiterCVDetailSerializer,
    RecruiterCVCreateSerializer,
)

from apps.candidate.recruiters.models import Recruiter
from apps.core.users.permissions import is_admin_user
from apps.recruitment.applications.models import Application

from .services.recruiter_cvs import auto_generate_cv
from .services.recruiter_cvs import generate_cv_preview
from .services.recruiter_cvs import generate_cv_download
from .services.recruiter_cvs import set_cv_as_default
from .services.recruiter_cvs import delete_cv_preserving_default
from .services.recruiter_cvs import upload_cv_pdf
from .services.recruiter_cvs import create_cv_direct_upload_signature
from .services.recruiter_cvs import create_cv_from_direct_upload
from .services.cv_rewrite import (
    CVRewriteUnavailable,
    CVRewriteValidationError,
    rewrite_cv_section,
)

DEFAULT_MAX_PDF_SIZE = 10 * 1024 * 1024
logger = logging.getLogger(__name__)


class RecruiterCVViewSet(viewsets.ModelViewSet):
    """
    ViewSet cho CV của người tìm việc.
    URL: /api/recruiters/:recruiter_id/cvs/

    Endpoints:
    - GET /              → list
    - POST /             → create
    - GET /:id/          → retrieve
    - PUT /:id/          → update
    - PATCH /:id/        → partial_update
    - DELETE /:id/       → destroy
    """

    permission_classes = [IsAuthenticated]
    pagination_class = None

    def get_queryset(self):
        recruiter_id = self.kwargs.get("recruiter_id")
        queryset = RecruiterCV.objects.filter(recruiter_id=recruiter_id).select_related(
            "template"
        )
        user = self.request.user
        if is_admin_user(user):
            pass
        elif getattr(user, "role", None) == "company":
            queryset = queryset.filter(applications__job__company__user=user).distinct()
        else:
            queryset = queryset.filter(recruiter__user=user)
        return queryset.order_by("-is_default", "-updated_at")

    def get_serializer_class(self):
        if self.action == "retrieve":
            return RecruiterCVDetailSerializer
        if self.action in ["create", "update", "partial_update"]:
            return RecruiterCVCreateSerializer
        return RecruiterCVListSerializer

    def _company_can_view_recruiter_cvs(self, request, recruiter):
        if getattr(request.user, "role", None) != "company":
            return False
        return Application.objects.filter(
            recruiter=recruiter,
            cv__isnull=False,
            job__company__user=request.user,
        ).exists()

    def _get_recruiter_or_403(self, request, owner_only=False):
        """
        Kiểm tra quyền sở hữu và trả về recruiter
        """

        recruiter_id = self.kwargs.get("recruiter_id")
        try:
            recruiter = Recruiter.objects.get(id=recruiter_id)
        except Recruiter.DoesNotExist:
            return None, Response(
                {"detail": "Recruiter not found"}, status=status.HTTP_404_NOT_FOUND
            )

        if is_admin_user(request.user):
            return recruiter, None

        if recruiter.user == request.user:
            return recruiter, None

        if not owner_only and self._company_can_view_recruiter_cvs(request, recruiter):
            return recruiter, None

        if recruiter.user != request.user:
            return None, Response(
                {"detail": "Permission denied"}, status=status.HTTP_403_FORBIDDEN
            )

        return recruiter, None

    def list(self, request, *args, **kwargs):
        recruiter, error = self._get_recruiter_or_403(request)
        if error:
            return error
        return super().list(request, *args, **kwargs)

    def create(self, request, *args, **kwargs):
        recruiter, error = self._get_recruiter_or_403(request, owner_only=True)
        if error:
            return error

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # Xử lý is_default - chỉ có một CV có thể là mặc định
        if serializer.validated_data.get("is_default"):
            RecruiterCV.objects.filter(recruiter=recruiter, is_default=True).update(
                is_default=False
            )

        # Auto-populate cv_data from recruiter profile if empty (or create manual)
        create_mode = request.data.get("create_mode", "from_profile")
        req_lang = request.data.get("language", "vi")
        cv_data = serializer.validated_data.get("cv_data", {})

        if not cv_data:
            if create_mode == "manual":
                cv_data = {
                    "language": req_lang,
                    "personal": {},
                    "skills": [],
                    "education": [],
                    "experience": [],
                    "projects": [],
                    "certifications": [],
                    "languages": [],
                }
            else:
                from .services.recruiter_cvs import build_cv_data_from_profile

                cv_data = build_cv_data_from_profile(recruiter)
                cv_data["language"] = req_lang
        else:
            if isinstance(cv_data, dict):
                cv_data["language"] = cv_data.get("language") or req_lang

        serializer.validated_data["cv_data"] = cv_data
        serializer.save(recruiter=recruiter)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def retrieve(self, request, *args, **kwargs):
        recruiter, error = self._get_recruiter_or_403(request)
        if error:
            return error
        return super().retrieve(request, *args, **kwargs)

    def update(self, request, *args, **kwargs):
        recruiter, error = self._get_recruiter_or_403(request, owner_only=True)
        if error:
            return error

        instance = self.get_object()

        # Xử lý is_default
        if request.data.get("is_default"):
            RecruiterCV.objects.filter(recruiter=recruiter, is_default=True).exclude(
                id=instance.id
            ).update(is_default=False)

        return super().update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        recruiter, error = self._get_recruiter_or_403(request, owner_only=True)
        if error:
            return error
        cv = self.get_object()
        delete_cv_preserving_default(cv)
        return Response(status=status.HTTP_204_NO_CONTENT)

    def set_default(self, request, *args, **kwargs):
        """
        PATCH /:cvId/default/
        Đặt CV làm mặc định
        """

        recruiter, error = self._get_recruiter_or_403(request, owner_only=True)
        if error:
            return error

        cv = self.get_object()
        updated = set_cv_as_default(cv)
        return Response(RecruiterCVListSerializer(updated).data)

    def download(self, request, *args, **kwargs):
        """
        POST /:cvId/download/
        Download CV (Real PDF Generation)
        """

        recruiter, error = self._get_recruiter_or_403(request)
        if error:
            return error

        cv = self.get_object()

        # Check if user wants to force regenerate
        force = request.data.get("force", False)

        try:
            result = generate_cv_download(cv, force_regenerate=force)
            result["download_url"] = self._build_cv_file_url(request, cv, download=True)
            return Response(result)
        except Exception as e:
            return Response(
                {"detail": f"Error generating PDF: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    def file(self, request, *args, **kwargs):
        """
        GET /:cvId/file/
        Protected PDF proxy for uploaded/generated candidate CV files.
        """
        recruiter, error = self._get_recruiter_or_403(request)
        if error:
            return error

        cv = self.get_object()

        try:
            cv_url = cv.cv_url
            if not cv_url or cv.template_id:
                result = generate_cv_download(cv)
                cv_url = result.get("download_url")
            if not cv_url:
                return Response(
                    {"detail": "CV file is not available."},
                    status=status.HTTP_404_NOT_FOUND,
                )

            from apps.candidate.recruiter_cvs.tasks import _download_pdf

            pdf_bytes = _download_pdf(cv_url)
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_502_BAD_GATEWAY)
        except Exception as exc:
            return Response(
                {"detail": f"Error loading CV file: {str(exc)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        filename = get_valid_filename(f"{cv.cv_name or 'CV'}.pdf")
        disposition = (
            "attachment"
            if str(request.query_params.get("download", "")).lower() in {"1", "true"}
            else "inline"
        )
        response = HttpResponse(pdf_bytes, content_type="application/pdf")
        response["Content-Disposition"] = f'{disposition}; filename="{filename}"'
        response["Cache-Control"] = "private, max-age=60"
        return response

    def preview(self, request, *args, **kwargs):
        """
        POST /:cvId/preview/
        Preview CV (Real HTML Render)
        """

        recruiter, error = self._get_recruiter_or_403(request)
        if error:
            return error

        cv = self.get_object()
        try:
            result = generate_cv_preview(cv)
            # If client accepts 'text/html', return raw HTML
            if "text/html" in request.META.get("HTTP_ACCEPT", ""):
                from django.http import HttpResponse

                return HttpResponse(result["html_content"])

            return Response(result)
        except Exception as e:
            return Response(
                {"detail": f"Error rendering preview: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    def _build_cv_file_url(self, request, cv, download=False):
        path = f"/api/candidates/{cv.recruiter_id}/cvs/{cv.id}/file/"
        if download:
            path = f"{path}?download=1"
        return request.build_absolute_uri(path)

    def rewrite_section(self, request, *args, **kwargs):
        """
        POST /:cvId/rewrite-section/
        Return an AI rewrite suggestion for a CV section. The client decides
        whether to apply it to cv_data and save.
        """
        recruiter, error = self._get_recruiter_or_403(request, owner_only=True)
        if error:
            return error

        cv = self.get_object()
        if not cv.template_id:
            return Response(
                {"detail": "Uploaded PDF CVs cannot be rewritten inline."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            result = rewrite_cv_section(
                section=request.data.get("section"),
                text=request.data.get("text"),
                context=request.data.get("context") or {},
                user_identifier=f"user:{request.user.id}:cv:{cv.id}",
            )
        except CVRewriteValidationError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        except CVRewriteUnavailable as exc:
            return Response(
                {"detail": str(exc)}, status=status.HTTP_503_SERVICE_UNAVAILABLE
            )

        return Response(result)

    def set_privacy(self, request, *args, **kwargs):
        """
        PATCH /:cvId/privacy/
        Đổi chế độ công khai
        """
        recruiter, error = self._get_recruiter_or_403(request, owner_only=True)
        if error:
            return error

        cv = self.get_object()
        is_public = request.data.get("is_public")

        if is_public is None:
            return Response(
                {"detail": "is_public field is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        cv.is_public = is_public
        cv.save(update_fields=["is_public"])
        return Response(RecruiterCVListSerializer(cv).data)

    def upload_cv(self, request, *args, **kwargs):
        """
        POST /upload/
        Upload file PDF CV lên Cloudinary và tạo RecruiterCV mới (CV_Upload).
        """
        recruiter, error = self._get_recruiter_or_403(request, owner_only=True)
        if error:
            return error

        file = request.FILES.get("file")
        if not file:
            return Response(
                {"detail": "Trường 'file' là bắt buộc."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if file.content_type != "application/pdf":
            return Response(
                {"detail": "Chỉ chấp nhận file PDF."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        max_pdf_size = getattr(settings, "CV_UPLOAD_MAX_BYTES", DEFAULT_MAX_PDF_SIZE)
        if file.size > max_pdf_size:
            return Response(
                {
                    "detail": f"Kích thước file không được vượt quá {max_pdf_size // (1024 * 1024)}MB."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        cv_name = request.data.get("cv_name", "").strip() or None

        try:
            cv = upload_cv_pdf(recruiter, file, cv_name)
            return Response(
                RecruiterCVListSerializer(cv).data,
                status=status.HTTP_201_CREATED,
            )
        except ValueError as e:
            return Response(
                {"detail": f"Upload thất bại: {str(e)}"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        except Exception:
            logger.exception("Unexpected CV PDF upload failure")
            return Response(
                {"detail": "Upload thất bại. Vui lòng thử lại sau."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    def upload_signature(self, request, *args, **kwargs):
        """
        POST /upload/signature/
        Return signed Cloudinary params for direct browser upload.
        """
        recruiter, error = self._get_recruiter_or_403(request, owner_only=True)
        if error:
            return error

        cv_name = request.data.get("cv_name", "").strip() or None
        try:
            return Response(create_cv_direct_upload_signature(recruiter, cv_name))
        except ValueError as e:
            return Response(
                {"detail": str(e)}, status=status.HTTP_503_SERVICE_UNAVAILABLE
            )

    def upload_complete(self, request, *args, **kwargs):
        """
        POST /upload/complete/
        Finalize a signed direct Cloudinary CV upload after backend validation.
        """
        recruiter, error = self._get_recruiter_or_403(request, owner_only=True)
        if error:
            return error

        cv_name = request.data.get("cv_name", "").strip() or None
        try:
            cv = create_cv_from_direct_upload(recruiter, request.data, cv_name)
            return Response(
                RecruiterCVListSerializer(cv).data,
                status=status.HTTP_201_CREATED,
            )
        except ValueError as e:
            return Response(
                {"detail": f"Upload thất bại: {str(e)}"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        except Exception:
            logger.exception("Unexpected direct CV upload finalize failure")
            return Response(
                {"detail": "Upload thất bại. Vui lòng thử lại sau."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    def generate(self, request, *args, **kwargs):
        """
        POST /generate/
        Tự động tạo CV từ profile
        """

        recruiter, error = self._get_recruiter_or_403(request, owner_only=True)
        if error:
            return error

        template_id = request.data.get("template_id")
        cv = auto_generate_cv(recruiter, template_id)
        return Response(
            RecruiterCVDetailSerializer(cv).data, status=status.HTTP_201_CREATED
        )
