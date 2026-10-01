from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from apps.core.users.permissions import IsAdmin, is_admin_user
from apps.core.caching import CacheService

from .models import Skill
from .serializers import (
    SkillListSerializer,
    SkillDetailSerializer,
    SkillCreateSerializer,
    SkillCategoryTreeSerializer,
)


class SkillViewSet(viewsets.ModelViewSet):
    """
    ViewSet cho Kỹ năng.
    URL: /api/skills/

    Endpoints:
    - GET /              → list (public)
    - GET /:id/          → retrieve (public)
    - POST /             → create (admin)
    - PUT /:id/          → update (admin)
    - PATCH /:id/        → partial_update (admin)
    - DELETE /:id/       → destroy (admin)
    - GET /search/       → search by name (public)
    - GET /popular/      → top 20 by usage_count (public)
    - GET /categories/   → skill categories tree (public)
    """

    def get_queryset(self):
        queryset = Skill.objects.select_related("category")
        if not is_admin_user(self.request.user):
            queryset = queryset.filter(
                is_active=True, domain=Skill.Domain.IT, is_publishable=True
            )

        # Filter by category
        category_id = self.request.query_params.get("category_id")
        if category_id:
            queryset = queryset.filter(category_id=category_id)

        # Filter by verified status
        is_verified = self.request.query_params.get("is_verified")
        if is_verified is not None:
            queryset = queryset.filter(is_verified=is_verified.lower() == "true")

        domain = self.request.query_params.get("domain")
        if domain:
            queryset = queryset.filter(domain=domain)

        return queryset.order_by("name")

    def get_serializer_class(self):
        if self.action == "retrieve":
            return SkillDetailSerializer
        if self.action in ["create", "update", "partial_update"]:
            return SkillCreateSerializer
        if self.action == "categories":
            return SkillCategoryTreeSerializer
        return SkillListSerializer

    def get_permissions(self):
        """
        Public: list, retrieve, search, popular, categories
        Admin: create, update, partial_update, destroy
        """
        if self.action in ["list", "retrieve", "search", "popular", "categories"]:
            return [AllowAny()]
        return [IsAdmin()]

    def perform_create(self, serializer):
        instance = serializer.save()
        CacheService.invalidate_taxonomy()
        return instance

    def perform_update(self, serializer):
        instance = serializer.save()
        CacheService.invalidate_taxonomy()
        return instance

    def perform_destroy(self, instance):
        instance.delete()
        CacheService.invalidate_taxonomy()

    @action(detail=False, methods=["get"])
    def search(self, request):
        """
        GET /api/skills/search/?q=python
        Tìm kiếm kỹ năng theo tên (autocomplete)
        """
        query = request.query_params.get("q", "")

        if len(query) < 2:
            return Response([])

        skills = (
            Skill.objects.filter(
                name__icontains=query,
                is_active=True,
                domain=Skill.Domain.IT,
                is_publishable=True,
            )
            .select_related("category")
            .order_by("name")[:20]
        )

        serializer = SkillListSerializer(skills, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=["get"])
    def popular(self, request):
        """
        GET /api/skills/popular/
        Top 20 kỹ năng phổ biến theo usage_count
        """
        skills = (
            Skill.objects.filter(
                is_active=True, domain=Skill.Domain.IT, is_publishable=True
            )
            .select_related("category")
            .order_by("-usage_count")[:20]
        )
        serializer = SkillListSerializer(skills, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=["get"])
    def categories(self, request):
        """
        GET /api/skills/categories/
        Danh mục kỹ năng dạng cây phân cấp
        """
        from apps.candidate.skill_categories.models import SkillCategory

        root_categories = (
            SkillCategory.objects.filter(is_active=True, parent__isnull=True)
            .prefetch_related("children", "skills")
            .order_by("display_order", "name")
        )

        serializer = SkillCategoryTreeSerializer(root_categories, many=True)
        return Response(serializer.data)
