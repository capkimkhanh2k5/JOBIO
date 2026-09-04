from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.parsers import MultiPartParser, FormParser

from django.contrib.auth import get_user_model
from django.db import transaction
from django.db.models import Count, Q
from django.utils import timezone
from django.conf import settings
from apps.email.services import EmailService
from apps.company.companies.services.suggestions import CompanySuggestionService
from apps.core.users.permissions import is_admin_user

from .models import Company, CompanyMember
from .permissions import can_manage_company_members, can_manage_company_profile
from .serializers import (
    CompanySerializer,
    CompanyCreateSerializer,
    CompanyUpdateSerializer,
    CompanyMemberSerializer,
    CompanyMemberWriteSerializer,
    JobListSerializer,
    CompanyFollowerSerializer,
    CompanyStatsSerializer,
)
from .services.companies import (
    create_company,
    update_company,
    delete_company,
    upload_company_logo,
    upload_company_banner,
    CompanyCreateInput,
    CompanyUpdateInput,
)
from .selectors.companies import list_companies, get_company_by_id, get_company_by_slug


class IsCompanyOwner:
    """
    Permission: Chỉ chủ sở hữu mới được chỉnh sửa
    """

    def has_object_permission(self, request, view, obj):
        return obj.user == request.user


class CompanyViewSet(viewsets.GenericViewSet):
    """
    ViewSet cho quản lý Company.
    """

    serializer_class = CompanySerializer

    def _permission_denied(self, detail="You don't have permission to update this company"):
        return Response({"detail": detail}, status=status.HTTP_403_FORBIDDEN)

    def _seat_limit_for_company(self, company):
        try:
            from apps.billing.models import CompanySubscription

            subscription = (
                CompanySubscription.objects.select_related("plan")
                .filter(
                    company=company,
                    status=CompanySubscription.Status.ACTIVE,
                )
                .first()
            )
            features = (subscription.plan.features if subscription else {}) or {}
            value = (
                features.get("seat_limit")
                or features.get("max_seats")
                or features.get("member_limit")
            )
            return int(value) if value else None
        except Exception:
            return None

    def _seat_limit_error(self, company, activating_existing=False):
        seat_limit = self._seat_limit_for_company(company)
        if not seat_limit:
            return None

        active_count = CompanyMember.objects.filter(
            company=company,
            status__in=[CompanyMember.Status.ACTIVE, CompanyMember.Status.INVITED],
        ).count()
        if not activating_existing:
            active_count += 1

        if active_count > seat_limit:
            return Response(
                {"detail": f"Gói hiện tại chỉ cho phép tối đa {seat_limit} thành viên."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        return None

    def _serialize_company(self, company):
        return CompanySerializer(company, context={"request": self.request})

    def get_queryset(self):
        """
        Lấy queryset cho viewset
        """
        return list_companies(filters=self.request.query_params)

    def get_permissions(self):
        """
        Lấy permissions cho viewset
        """
        public_actions = [
            "list",
            "retrieve",
            "retrieve_by_slug",
            "search_companies",
            "featured_companies",
            "company_suggestions",
            "company_stats",
            "company_jobs",
            "company_followers",
        ]
        if self.action in public_actions:
            return [AllowAny()]
        return [IsAuthenticated()]

    def list(self, request):
        """
        GET /api/companies/ - Danh sách công ty (công khai)
        """
        verification_status = request.query_params.get("verification_status")
        if verification_status == "pending" and not is_admin_user(request.user):
            return Response(
                {"detail": "You don't have permission to view pending companies"},
                status=status.HTTP_403_FORBIDDEN,
            )

        queryset = self.get_queryset()
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    def create(self, request):
        """
        POST /api/companies/ - Tạo hồ sơ công ty
        """
        if getattr(request.user, "role", None) != "company":
            return Response(
                {"detail": "Only company accounts can create a company profile"},
                status=status.HTTP_403_FORBIDDEN,
            )

        # Validate input
        serializer = CompanyCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # Gọi service layer
        try:
            company = create_company(
                user=request.user, data=CompanyCreateInput(**serializer.validated_data)
            )
        except ValueError as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)

        # Trả về response
        output_serializer = self._serialize_company(company)
        return Response(output_serializer.data, status=status.HTTP_201_CREATED)

    def retrieve(self, request, pk=None):
        """
        GET /api/companies/:id/ - Chi tiết công ty
        """
        company = get_company_by_id(company_id=pk)
        if not company:
            return Response(
                {"detail": "Not found company"}, status=status.HTTP_404_NOT_FOUND
            )

        serializer = self._serialize_company(company)
        return Response(serializer.data)

    def update(self, request, pk=None):
        """
        PUT /api/companies/:id/ - Cập nhật thông tin công ty
        """
        company = get_company_by_id(company_id=pk)
        if not company:
            return Response(
                {"detail": "Not found company"}, status=status.HTTP_404_NOT_FOUND
            )

        if not can_manage_company_profile(company, request.user):
            return self._permission_denied()

        # Validate input
        serializer = CompanyUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # Gọi service layer
        updated_company = update_company(
            company, CompanyUpdateInput(**serializer.validated_data)
        )

        output_serializer = self._serialize_company(updated_company)
        return Response(output_serializer.data)

    def partial_update(self, request, pk=None):
        """
        PATCH /api/companies/:id/ - Cập nhật thông tin công ty (từng phần)
        """
        return self.update(request, pk)

    def destroy(self, request, pk=None):
        """
        DELETE /api/companies/:id/ - Xóa công ty
        """
        company = get_company_by_id(company_id=pk)
        if not company:
            return Response(
                {"detail": "Not found company"}, status=status.HTTP_404_NOT_FOUND
            )

        if not can_manage_company_profile(company, request.user):
            return self._permission_denied("You don't have permission to delete this company")

        delete_company(company)
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=False, methods=["get"], url_path="me")
    def me(self, request):
        """
        GET /api/companies/me/ - Lấy công ty của user hiện tại
        """
        company = Company.objects.filter(user=request.user).first()
        if not company:
            company = (
                Company.objects.filter(
                    members__user=request.user,
                    members__status=CompanyMember.Status.ACTIVE,
                )
                .distinct()
                .first()
            )
        if not company:
            return Response(
                {"detail": "You don't have a company profile"},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = self._serialize_company(company)
        return Response(serializer.data)

    @action(detail=False, methods=["get"], url_path="slug/(?P<slug>[^/.]+)")
    def retrieve_by_slug(self, request, slug=None):
        """
        GET /api/companies/slug/:slug/ - Chi tiết theo slug
        """
        company = get_company_by_slug(slug=slug)
        if not company:
            return Response(
                {"detail": "Not found company"}, status=status.HTTP_404_NOT_FOUND
            )

        serializer = self._serialize_company(company)
        return Response(serializer.data)

    @action(
        detail=True,
        methods=["post"],
        url_path="logo",
        parser_classes=[MultiPartParser, FormParser],
    )
    def upload_logo(self, request, pk=None):
        """
        POST /api/companies/:id/logo - Upload logo
        """
        company = get_company_by_id(company_id=pk)
        if not company:
            return Response(
                {"detail": "Not found company"}, status=status.HTTP_404_NOT_FOUND
            )

        if not can_manage_company_profile(company, request.user):
            return self._permission_denied()

        file = request.FILES.get("logo")
        if not file:
            return Response(
                {"detail": "File not provided"}, status=status.HTTP_400_BAD_REQUEST
            )

        try:
            logo_url = upload_company_logo(company, file)
            if company.user_id:
                company.user.avatar_url = logo_url
                company.user.save(update_fields=["avatar_url", "updated_at"])
            return Response(
                {
                    "logo_url": logo_url,
                    "avatar_url": logo_url,
                    "moderation_status": "approved",
                    "moderation_reasons": [],
                    "safe_preview_url": logo_url,
                },
                status=status.HTTP_200_OK,
            )
        except ValueError as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(
        detail=True,
        methods=["post"],
        url_path="banner",
        parser_classes=[MultiPartParser, FormParser],
    )
    def upload_banner(self, request, pk=None):
        """
        POST /api/companies/:id/banner - Upload banner
        """
        company = get_company_by_id(company_id=pk)
        if not company:
            return Response(
                {"detail": "Not found company"}, status=status.HTTP_404_NOT_FOUND
            )

        if not can_manage_company_profile(company, request.user):
            return self._permission_denied()

        file = request.FILES.get("banner")
        if not file:
            return Response(
                {"detail": "File not provided"}, status=status.HTTP_400_BAD_REQUEST
            )

        try:
            banner_url = upload_company_banner(company, file)
            return Response(
                {
                    "banner_url": banner_url,
                    "moderation_status": "approved",
                    "moderation_reasons": [],
                    "safe_preview_url": banner_url,
                },
                status=status.HTTP_200_OK,
            )
        except ValueError as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=["get"], url_path="jobs")
    def company_jobs(self, request, pk=None):
        """
        GET /api/companies/:id/jobs - Lấy danh sách công việc của công ty
        """

        company = get_company_by_id(company_id=pk)
        if not company:
            return Response(
                {"detail": "Not found company"}, status=status.HTTP_404_NOT_FOUND
            )

        from apps.recruitment.jobs.models import Job

        jobs = company.jobs.filter(
            status=Job.Status.PUBLISHED,
            domain_status=Job.DomainStatus.IT_APPROVED,
            moderation_status=Job.ModerationStatus.APPROVED,
        )

        serializer = JobListSerializer(jobs, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=["get"], url_path="followers")
    def company_followers(self, request, pk=None):
        """
        GET /api/companies/:id/followers - Lấy danh sách người theo dõi của công ty
        """

        company = get_company_by_id(company_id=pk)
        if not company:
            return Response(
                {"detail": "Not found company"}, status=status.HTTP_404_NOT_FOUND
            )

        followers = company.followers.all()

        serializer = CompanyFollowerSerializer(followers, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=["get"], url_path="stats")
    def company_stats(self, request, pk=None):
        """
        GET /api/companies/:id/stats - Lấy thống kê của công ty
        """

        company = get_company_by_id(company_id=pk)
        if not company:
            return Response(
                {"detail": "Not found company"}, status=status.HTTP_404_NOT_FOUND
            )

        job_count = company.jobs.filter(status="published").count()
        follower_count = company.followers.count()
        application_count = company.jobs.filter(status="published").aggregate(
            Count("applications")
        )

        stats = {
            "job_count": job_count,
            "follower_count": follower_count,
            "application_count": application_count,
        }

        serializer = CompanyStatsSerializer(stats)
        return Response(serializer.data)

    @action(detail=True, methods=["post"], url_path="verify")
    def request_verification(self, request, pk=None):
        """
        POST /api/companies/:id/verify - Yêu cầu xác thực
        """
        company = get_company_by_id(company_id=pk)
        if not company:
            return Response(
                {"detail": "Not found company"}, status=status.HTTP_404_NOT_FOUND
            )

        if not can_manage_company_profile(company, request.user):
            return self._permission_denied()

        if company.verification_status == "verified":
            return Response(
                {"detail": "Company is already verified"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        company.verification_status = "pending"
        company.save()

        # Send Admin Notification
        admin_email = getattr(
            settings, "ADMIN_EMAIL", settings.DEFAULT_FROM_EMAIL
        )  # Fallback

        EmailService.send_email(
            recipient=admin_email,
            subject=f"[JobPortal] Yêu cầu xác thực mới: {company.company_name}",
            template_path="emails/company/verification_request.html",
            context={
                "company_name": company.company_name,
                "requester_name": request.user.full_name,
                "requester_email": request.user.email,
                "created_at": company.created_at.strftime("%d/%m/%Y"),
                "admin_dashboard_link": f"{settings.FRONTEND_URL}/admin/moderation?id={company.id}",
            },
        )

        return Response(
            {"detail": "Verification request sent successfully"},
            status=status.HTTP_200_OK,
        )

    @action(detail=True, methods=["get", "post"], url_path="members")
    def members(self, request, pk=None):
        company = get_company_by_id(company_id=pk)
        if not company:
            return Response(
                {"detail": "Not found company"}, status=status.HTTP_404_NOT_FOUND
            )
        if not can_manage_company_members(company, request.user):
            return self._permission_denied("You don't have permission to manage members")

        if request.method.lower() == "get":
            members = company.members.select_related("user", "invited_by").order_by(
                "role", "user__email"
            )
            return Response(CompanyMemberSerializer(members, many=True).data)

        serializer = CompanyMemberWriteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        User = get_user_model()
        user_id = serializer.validated_data.get("user_id")
        email = serializer.validated_data.get("email")
        member_user = (
            User.objects.filter(id=user_id).first()
            if user_id
            else User.objects.filter(email__iexact=email).first()
        )
        if not member_user:
            return Response(
                {"detail": "Không tìm thấy tài khoản để thêm vào công ty."},
                status=status.HTTP_404_NOT_FOUND,
            )
        if getattr(member_user, "role", None) != "company":
            return Response(
                {"detail": "Chỉ tài khoản role company mới có thể là thành viên công ty."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        next_status = serializer.validated_data.get(
            "status", CompanyMember.Status.ACTIVE
        )
        existing = CompanyMember.objects.filter(company=company, user=member_user).first()
        if existing and existing.role == CompanyMember.Role.OWNER:
            return Response(
                {"detail": "Owner membership cannot be changed from this endpoint."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        needs_seat = not existing or (
            existing.status == CompanyMember.Status.DISABLED
            and next_status in {CompanyMember.Status.ACTIVE, CompanyMember.Status.INVITED}
        )
        if needs_seat:
            limit_error = self._seat_limit_error(company)
            if limit_error:
                return limit_error

        member, _created = CompanyMember.objects.update_or_create(
            company=company,
            user=member_user,
            defaults={
                "role": serializer.validated_data["role"],
                "status": next_status,
                "invited_by": request.user,
            },
        )
        return Response(
            CompanyMemberSerializer(member).data,
            status=status.HTTP_201_CREATED,
        )

    @action(
        detail=True,
        methods=["patch", "delete"],
        url_path=r"members/(?P<member_id>[^/.]+)",
    )
    def member_detail(self, request, pk=None, member_id=None):
        company = get_company_by_id(company_id=pk)
        if not company:
            return Response(
                {"detail": "Not found company"}, status=status.HTTP_404_NOT_FOUND
            )
        if not can_manage_company_members(company, request.user):
            return self._permission_denied("You don't have permission to manage members")

        member = (
            CompanyMember.objects.select_related("user", "invited_by")
            .filter(company=company, id=member_id)
            .first()
        )
        if not member:
            return Response(
                {"detail": "Member not found"}, status=status.HTTP_404_NOT_FOUND
            )
        if member.role == CompanyMember.Role.OWNER:
            return Response(
                {"detail": "Owner membership cannot be changed from this endpoint."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if request.method.lower() == "delete":
            member.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)

        serializer = CompanyMemberWriteSerializer(
            data={
                "user_id": member.user_id,
                "role": request.data.get("role", member.role),
                "status": request.data.get("status", member.status),
            }
        )
        serializer.is_valid(raise_exception=True)

        next_status = serializer.validated_data.get("status", member.status)
        if (
            member.status == CompanyMember.Status.DISABLED
            and next_status in {CompanyMember.Status.ACTIVE, CompanyMember.Status.INVITED}
        ):
            limit_error = self._seat_limit_error(company)
            if limit_error:
                return limit_error

        member.role = serializer.validated_data["role"]
        member.status = next_status
        member.save(update_fields=["role", "status", "updated_at"])
        return Response(CompanyMemberSerializer(member).data)

    @action(detail=True, methods=["patch"], url_path="verification")
    def admin_verification(self, request, pk=None):
        """
        PATCH /api/companies/:id/verification - Duyệt/từ chối xác thực
        """
        if not is_admin_user(request.user):
            return Response(
                {"detail": "You don't have permission to update this company"},
                status=status.HTTP_403_FORBIDDEN,
            )

        company = get_company_by_id(company_id=pk)
        if not company:
            return Response(
                {"detail": "Not found company"}, status=status.HTTP_404_NOT_FOUND
            )

        new_status = request.data.get("status")
        if new_status not in ["verified", "rejected"]:
            return Response(
                {"detail": "Invalid status"}, status=status.HTTP_400_BAD_REQUEST
            )

        company.verification_status = new_status
        if new_status == "verified":
            company.verified_at = timezone.now()
            company.verified_by = request.user
        company.save()

        return Response(
            {"detail": "Company verified successfully"}, status=status.HTTP_200_OK
        )

    @action(detail=False, methods=["get"], url_path="search")
    def search_companies(self, request):
        """
        GET /api/companies/search - Tìm kiếm công ty
        """

        q = request.query_params.get("q", "")
        industry = request.query_params.get("industry", None)
        size = request.query_params.get("size", None)
        location = request.query_params.get("location", None)

        companies = Company.objects.filter(company_name__icontains=q)
        if industry:
            companies = companies.filter(industry_id=industry)
        if size:
            companies = companies.filter(company_size=size)
        if location:
            companies = companies.filter(
                Q(address__icontains=location) | Q(headquarters__icontains=location)
            )

        serializer = CompanySerializer(companies, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=["get"], url_path="featured")
    def featured_companies(self, request):
        """
        GET /api/companies/featured - Lấy danh sách công ty nổi bật
        """
        companies = Company.objects.filter(verification_status="verified").order_by(
            "-follower_count"
        )[:10]
        serializer = CompanySerializer(companies, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=["get"], url_path="suggestions")
    def company_suggestions(self, request):
        """
        GET /api/companies/suggestions - Lấy danh sách công ty gợi ý

        Logic gợi ý:
        1. Dựa trên kỹ năng của ứng viên (Recruiter Profile)
        2. Nếu chưa đăng nhập hoặc không có profile, trả về Top Verified Companies
        """
        companies = CompanySuggestionService.get_suggestions(request.user)
        serializer = CompanySerializer(companies, many=True)

        return Response(serializer.data)

    @action(detail=True, methods=["post"], url_path="claim")
    def claim_company(self, request, pk=None):
        """
        POST /api/companies/:id/claim - Yêu cầu claim ownership
        """
        company = get_company_by_id(company_id=pk)
        if not company:
            return Response(
                {"detail": "Not found company"}, status=status.HTTP_404_NOT_FOUND
            )

        if company.user is not None:
            return Response(
                {"detail": "Company already claimed"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user = request.user
        if not user.is_authenticated:
            return Response(
                {"detail": "You don't have permission to update this company"},
                status=status.HTTP_403_FORBIDDEN,
            )

        if getattr(user, "role", None) != "company":
            return Response(
                {"detail": "Only company accounts can claim a company"},
                status=status.HTTP_403_FORBIDDEN,
            )

        if Company.objects.filter(user=user).exists():
            return Response(
                {"detail": "User already has a company profile"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        with transaction.atomic():
            locked_company = (
                Company.objects.select_for_update().filter(id=company.id).first()
            )
            if not locked_company:
                return Response(
                    {"detail": "Not found company"}, status=status.HTTP_404_NOT_FOUND
                )
            if locked_company.user_id is not None:
                return Response(
                    {"detail": "Company already claimed"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            locked_company.user = user
            locked_company.save(update_fields=["user", "updated_at"])
            CompanyMember.objects.get_or_create(
                company=locked_company,
                user=user,
                defaults={
                    "role": CompanyMember.Role.OWNER,
                    "status": CompanyMember.Status.ACTIVE,
                },
            )

        return Response(
            {"detail": "Company claimed successfully"}, status=status.HTTP_200_OK
        )

    @action(detail=False, methods=["get"], url_path="moderation-stats")
    def moderation_stats(self, request):
        """
        GET /api/companies/moderation-stats/ - Thống kê kiểm duyệt cho Admin
        """
        if not is_admin_user(request.user):
            return Response(
                {"detail": "You don't have permission to view moderation stats"},
                status=status.HTTP_403_FORBIDDEN,
            )

        pending_companies = Company.objects.filter(
            verification_status="pending"
        ).count()
        verified_companies = Company.objects.filter(
            verification_status="verified"
        ).count()
        rejected_companies = Company.objects.filter(
            verification_status="rejected"
        ).count()
        return Response(
            {
                "pending_companies": pending_companies,
                "verified_companies": verified_companies,
                "rejected_companies": rejected_companies,
            }
        )
