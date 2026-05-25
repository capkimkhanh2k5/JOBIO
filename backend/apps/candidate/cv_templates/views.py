from pathlib import Path

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from apps.core.users.permissions import IsAdmin, is_admin_user

from .models import CVTemplate
from .serializers import (
    CVTemplateListSerializer,
    CVTemplateDetailSerializer,
    CVTemplateCategorySerializer,
    CVTemplateCreateSerializer,
)


TEMPLATE_LIBRARY = {
    "modern.html": {
        "name": "Modern Classic",
        "category": "professional",
        "description": "Layout 2 cot co dien, thanh lich voi sidebar thong tin lien he va ky nang.",
        "tags": ["modern", "classic", "sidebar"],
    },
    "ATS_Prime.html": {
        "name": "ATS Prime",
        "category": "professional",
        "description": "Toi uu cho he thong ATS, don cot, chuyen nghiep.",
        "tags": ["ats", "professional", "single-column"],
    },
    "editorialBold.html": {
        "name": "Editorial Bold",
        "category": "creative",
        "description": "Phong cach editorial voi typography dam net va noi bat.",
        "tags": ["editorial", "bold", "creative"],
    },
    "modernHybird.html": {
        "name": "Modern Hybrid",
        "category": "professional",
        "description": "Bo cuc hien dai ket hop sidebar mau sac.",
        "tags": ["hybrid", "modern", "colorful"],
    },
    "modernHybird2.html": {
        "name": "Modern Hybrid Pro",
        "category": "professional",
        "description": "Phien ban nang cao cua Modern Hybrid voi bo cuc chi tiet hon.",
        "tags": ["hybrid", "pro", "detailed"],
    },
    "modernLuxury.html": {
        "name": "Modern Luxury",
        "category": "professional",
        "description": "Phong cach sang trong, phu hop vai tro cap cao.",
        "tags": ["luxury", "premium", "elegant"],
    },
}

DEFAULT_CATEGORIES = [
    {"name": "Tat ca", "slug": "all", "display_order": 0},
    {"name": "Chuyen nghiep", "slug": "professional", "display_order": 1},
    {"name": "Sang tao", "slug": "creative", "display_order": 2},
    {"name": "Toi gian", "slug": "minimal", "display_order": 3},
]


def ensure_cv_templates_seeded():
    from apps.candidate.cv_template_categories.models import CVTemplateCategory

    templates_dir = Path(__file__).resolve().parents[3] / "templates" / "cv"
    if not templates_dir.exists():
        return

    category_map = {}
    for category_data in DEFAULT_CATEGORIES:
        category, _ = CVTemplateCategory.objects.get_or_create(
            slug=category_data["slug"],
            defaults={
                "name": category_data["name"],
                "display_order": category_data["display_order"],
                "is_active": True,
            },
        )
        if not category.is_active:
            category.is_active = True
            category.save(update_fields=["is_active"])
        category_map[category.slug] = category

    html_files = sorted(file.name for file in templates_dir.glob("*.html"))
    if not html_files:
        return

    CVTemplate.objects.exclude(file_name__in=html_files).update(is_active=False)

    for file_name in html_files:
        meta = TEMPLATE_LIBRARY.get(
            file_name,
            {
                "name": Path(file_name)
                .stem.replace("_", " ")
                .replace("-", " ")
                .title(),
                "category": "professional",
                "description": f"Template HTML dong bo tu file {file_name}.",
                "tags": ["html"],
            },
        )
        category = category_map.get(meta["category"], category_map["professional"])
        template = CVTemplate.objects.filter(file_name=file_name).order_by("id").first()
        if template:
            CVTemplate.objects.filter(file_name=file_name).exclude(pk=template.pk).update(
                is_active=False
            )
            for field, value in {
                "name": meta["name"],
                "category": category,
                "is_premium": False,
                "price": 0,
                "is_active": True,
                "template_data": {
                    "tags": meta["tags"],
                    "description": meta["description"],
                },
            }.items():
                setattr(template, field, value)
            template.save(
                update_fields=[
                    "name",
                    "category",
                    "is_premium",
                    "price",
                    "is_active",
                    "template_data",
                    "updated_at",
                ]
            )
        else:
            CVTemplate.objects.create(
                file_name=file_name,
                name=meta["name"],
                category=category,
                is_premium=False,
                price=0,
                is_active=True,
                template_data={
                    "tags": meta["tags"],
                    "description": meta["description"],
                },
            )


class CVTemplateViewSet(viewsets.ModelViewSet):
    """
    ViewSet cho mẫu CV.
    URL: /api/cv-templates/

    Endpoints:
    - GET /             → list (public)
    - GET /:id/         → retrieve (public)
    - GET /categories/  → list categories (public)
    - GET /premium/     → premium templates (public)
    - GET /popular/     → popular templates (public)
    - POST /            → create (admin)
    - PUT /:id/         → update (admin)
    - DELETE /:id/      → destroy (admin)
    """

    def get_queryset(self):
        ensure_cv_templates_seeded()
        queryset = CVTemplate.objects.select_related("category")

        # Admin thấy tất cả, user chỉ thấy active
        if not is_admin_user(self.request.user):
            queryset = queryset.filter(is_active=True)

        # Filter by category
        category = self.request.query_params.get("category")
        if category:
            queryset = queryset.filter(category__slug=category)

        # Filter by premium
        is_premium = self.request.query_params.get("is_premium")
        if is_premium is not None:
            queryset = queryset.filter(is_premium=is_premium.lower() == "true")

        return queryset.order_by("-usage_count", "-rating")

    def get_serializer_class(self):
        if self.action == "retrieve":
            return CVTemplateDetailSerializer
        if self.action in ["create", "update", "partial_update"]:
            return CVTemplateCreateSerializer
        return CVTemplateListSerializer

    def get_permissions(self):
        """
        Public: list, retrieve, categories, premium, popular
        Authenticated: preview
        Admin: create, update, partial_update, destroy
        """
        if self.action in ["list", "retrieve", "categories", "premium", "popular"]:
            return [AllowAny()]
        if self.action == "preview":
            from rest_framework.permissions import IsAuthenticated

            return [IsAuthenticated()]
        return [IsAdmin()]

    @action(detail=False, methods=["get"])
    def categories(self, request):
        """
        GET /api/cv-templates/categories/
        Danh sách danh mục mẫu CV
        """
        from apps.candidate.cv_template_categories.models import CVTemplateCategory

        categories = (
            CVTemplateCategory.objects.filter(is_active=True)
            .prefetch_related("templates")
            .order_by("name")
        )

        serializer = CVTemplateCategorySerializer(categories, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=["get"])
    def premium(self, request):
        """
        GET /api/cv-templates/premium/
        Danh sách mẫu CV premium
        """
        queryset = (
            CVTemplate.objects.filter(is_active=True, is_premium=True)
            .select_related("category")
            .order_by("-rating", "-usage_count")
        )

        serializer = CVTemplateListSerializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=["get"])
    def popular(self, request):
        """
        GET /api/cv-templates/popular/
        Danh sách mẫu CV phổ biến (top 10)
        """
        queryset = (
            CVTemplate.objects.filter(is_active=True)
            .select_related("category")
            .order_by("-usage_count")[:10]
        )

        serializer = CVTemplateListSerializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=["post"], permission_classes=[])
    def preview(self, request, pk=None):
        """
        POST /api/cv-templates/:id/preview/
        Render template HTML với data thực của recruiter.
        Body: { "recruiter_id": <int> }
        Response: { "html": "<full html string>" }
        """
        from django.template.loader import render_to_string
        from apps.candidate.recruiters.models import Recruiter
        from apps.candidate.recruiter_skills.models import RecruiterSkill
        from apps.candidate.recruiter_education.models import RecruiterEducation
        from apps.candidate.recruiter_experience.models import RecruiterExperience
        from apps.candidate.recruiter_certifications.models import (
            RecruiterCertification,
        )
        from apps.candidate.recruiter_projects.models import RecruiterProject
        from apps.candidate.recruiter_languages.models import RecruiterLanguage

        template_obj = self.get_object()

        if not template_obj.file_name:
            return Response(
                {"detail": "Template chưa có file HTML được gán."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        recruiter_id = request.data.get("recruiter_id")
        if not recruiter_id:
            return Response(
                {"detail": "recruiter_id is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            recruiter = Recruiter.objects.select_related("user").get(id=recruiter_id)
        except Recruiter.DoesNotExist:
            return Response(
                {"detail": "Recruiter not found."}, status=status.HTTP_404_NOT_FOUND
            )

        # Build profile data (same structure as auto_generate_cv)
        skills_data = []
        for rs in RecruiterSkill.objects.filter(recruiter=recruiter).select_related(
            "skill"
        ):
            skills_data.append(
                {
                    "name": rs.skill.name,  # skill FK is always required (non-null)
                    "proficiency_level": rs.proficiency_level,
                    "years_of_experience": rs.years_of_experience,
                }
            )

        education_data = []
        for edu in RecruiterEducation.objects.filter(recruiter=recruiter).order_by(
            "-start_date"
        ):
            education_data.append(
                {
                    "school_name": edu.school_name,
                    "degree": edu.degree,
                    "field_of_study": edu.field_of_study or "",
                    "start_date": edu.start_date.isoformat()
                    if edu.start_date
                    else None,
                    "end_date": edu.end_date.isoformat() if edu.end_date else None,
                    "is_current": edu.is_current,
                    "description": edu.description or "",
                }
            )

        experience_data = []
        for exp in RecruiterExperience.objects.filter(recruiter=recruiter).order_by(
            "-start_date"
        ):
            experience_data.append(
                {
                    "company_name": exp.company_name,
                    "position": exp.job_title,
                    "job_title": exp.job_title,
                    "start_date": exp.start_date.isoformat()
                    if exp.start_date
                    else None,
                    "end_date": exp.end_date.isoformat() if exp.end_date else None,
                    "is_current": exp.is_current,
                    "description": exp.description or "",
                }
            )

        certifications_data = []
        for cert in RecruiterCertification.objects.filter(recruiter=recruiter).order_by(
            "-issue_date"
        ):
            certifications_data.append(
                {
                    "name": cert.certification_name,  # fixed: field is certification_name not name
                    "issuing_organization": cert.issuing_organization or "",
                    "issue_date": cert.issue_date.isoformat()
                    if cert.issue_date
                    else None,
                }
            )

        projects_data = []
        for proj in RecruiterProject.objects.filter(recruiter=recruiter).order_by(
            "-start_date"
        ):
            technologies = []
            if proj.technologies_used:
                if isinstance(proj.technologies_used, list):
                    technologies = proj.technologies_used
                else:
                    technologies = [
                        t.strip()
                        for t in str(proj.technologies_used).split(",")
                        if t.strip()
                    ]
            projects_data.append(
                {
                    "name": proj.project_name,
                    "description": proj.description or "",
                    "project_url": proj.project_url or "",
                    "start_date": proj.start_date.isoformat()
                    if proj.start_date
                    else None,
                    "end_date": proj.end_date.isoformat() if proj.end_date else None,
                    "technologies": technologies,
                }
            )

        languages_data = []
        for lang in RecruiterLanguage.objects.filter(
            recruiter=recruiter
        ).select_related("language"):
            languages_data.append(
                {
                    "name": lang.language.language_name
                    if lang.language
                    else "",  # field is language_name
                    "proficiency_level": lang.proficiency_level,
                }
            )

        cv_data = {
            "personal": {
                "full_name": recruiter.user.full_name,
                "email": recruiter.user.email,
                "phone": getattr(recruiter.user, "phone_number", "") or "",
                "current_position": recruiter.current_position or "",
                "bio": recruiter.bio or "",
                "avatar_url": getattr(recruiter.user, "avatar_url", "") or "",
                "years_of_experience": recruiter.years_of_experience or 0,
            },
            "location": {},
            "links": {
                "linkedin": recruiter.linkedin_url or "",
                "github": recruiter.github_url or "",
                "portfolio": recruiter.portfolio_url or "",
                "facebook": recruiter.facebook_url or "",
            },
            "skills": skills_data,
            "education": education_data,
            "experience": experience_data,
            "certifications": certifications_data,
            "projects": projects_data,
            "languages": languages_data,
        }

        template_name = f"cv/{template_obj.file_name}"
        try:
            html = render_to_string(template_name, {"data": cv_data})
        except Exception as e:
            import logging

            logger = logging.getLogger(__name__)
            logger.error(
                f"Error rendering CV template '{template_name}': {e}", exc_info=True
            )
            return Response(
                {"detail": f"Error rendering template: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        return Response({"html": html})
