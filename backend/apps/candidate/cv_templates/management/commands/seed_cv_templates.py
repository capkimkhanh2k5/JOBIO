"""
Management command to seed CV templates and categories.
Run: python manage.py seed_cv_templates
"""
from django.core.management.base import BaseCommand

TEMPLATE_DATA = [
    {
        "name": "Modern Classic",
        "file_name": "modern.html",
        "description": "Layout 2 cột cổ điển, thanh lịch với sidebar thông tin liên hệ và kỹ năng.",
        "tags": ["modern", "classic", "sidebar"],
    },
    {
        "name": "ATS Prime",
        "file_name": "ATS_Prime.html",
        "description": "Tối ưu cho hệ thống ATS, đơn cột, chuyên nghiệp, phù hợp tất cả ngành nghề.",
        "tags": ["ats", "professional", "single-column"],
    },
    {
        "name": "Editorial Bold",
        "file_name": "editorialBold.html",
        "description": "Phong cách báo chí với typography đậm nét, nổi bật và sáng tạo.",
        "tags": ["editorial", "bold", "creative"],
    },
    {
        "name": "Modern Hybrid",
        "file_name": "modernHybird.html",
        "description": "Kết hợp layout hiện đại với sidebar màu sắc, phù hợp kỹ thuật và sáng tạo.",
        "tags": ["hybrid", "modern", "colorful"],
    },
    {
        "name": "Modern Hybrid Pro",
        "file_name": "modernHybird2.html",
        "description": "Phiên bản nâng cao của Modern Hybrid với bố cục chi tiết hơn.",
        "tags": ["hybrid", "pro", "detailed"],
    },
    {
        "name": "Modern Luxury",
        "file_name": "modernLuxury.html",
        "description": "Sang trọng và tinh tế, phù hợp các vị trí cấp cao và ngành cao cấp.",
        "tags": ["luxury", "premium", "elegant"],
    },
]

CATEGORIES = [
    {"name": "Tất cả", "slug": "all", "display_order": 0},
    {"name": "Chuyên nghiệp", "slug": "professional", "display_order": 1},
    {"name": "Sáng tạo", "slug": "creative", "display_order": 2},
    {"name": "Tối giản", "slug": "minimal", "display_order": 3},
]


class Command(BaseCommand):
    help = "Seed CV template categories and templates into the database"

    def add_arguments(self, parser):
        parser.add_argument(
            "--clear",
            action="store_true",
            help="Clear existing templates before seeding",
        )

    def handle(self, *args, **options):
        from apps.candidate.cv_templates.models import CVTemplate
        from apps.candidate.cv_template_categories.models import CVTemplateCategory

        # Clear if requested
        if options["clear"]:
            CVTemplate.objects.all().delete()
            CVTemplateCategory.objects.all().delete()
            self.stdout.write(self.style.WARNING("Cleared existing templates and categories."))

        # Create/update categories
        category_map = {}
        for cat_data in CATEGORIES:
            cat, created = CVTemplateCategory.objects.update_or_create(
                slug=cat_data["slug"],
                defaults={
                    "name": cat_data["name"],
                    "display_order": cat_data["display_order"],
                    "is_active": True,
                },
            )
            category_map[cat_data["slug"]] = cat
            action = "Created" if created else "Updated"
            self.stdout.write(f"  {action} category: {cat.name}")

        # Default category = "professional"
        default_category = category_map.get("professional", category_map["all"])

        # Map templates to categories heuristically
        category_assignment = {
            "modern.html": "professional",
            "ATS_Prime.html": "professional",
            "editorialBold.html": "creative",
            "modernHybird.html": "professional",
            "modernHybird2.html": "professional",
            "modernLuxury.html": "professional",
        }

        # Create/update templates
        created_count = 0
        updated_count = 0
        for tpl in TEMPLATE_DATA:
            cat_slug = category_assignment.get(tpl["file_name"], "professional")
            cat = category_map.get(cat_slug, default_category)

            obj, created = CVTemplate.objects.update_or_create(
                file_name=tpl["file_name"],
                defaults={
                    "name": tpl["name"],
                    "category": cat,
                    "is_premium": False,
                    "price": 0,
                    "is_active": True,
                    "template_data": {"tags": tpl["tags"], "description": tpl["description"]},
                },
            )
            if created:
                created_count += 1
                self.stdout.write(self.style.SUCCESS(f"  Created template: {obj.name} (id={obj.id})"))
            else:
                updated_count += 1
                self.stdout.write(f"  Updated template: {obj.name} (id={obj.id})")

        self.stdout.write(
            self.style.SUCCESS(
                f"\nDone! Created {created_count} templates, updated {updated_count} templates."
            )
        )
