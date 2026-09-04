from django.core.management.base import BaseCommand

from apps.recruitment.job_categories.models import JobCategory


IT_CATEGORIES = [
    "Software Engineering",
    "Frontend",
    "Backend",
    "Fullstack",
    "Mobile",
    "DevOps/SRE",
    "Data/AI",
    "QA/Test",
    "Security",
    "UI/UX Product Tech",
    "IT Support/System/Admin",
]


class Command(BaseCommand):
    help = "Seed the approved IT-only job category taxonomy."

    def handle(self, *args, **options):
        for index, name in enumerate(IT_CATEGORIES, start=1):
            category, created = JobCategory.objects.get_or_create(
                name=name,
                defaults={
                    "domain": JobCategory.Domain.IT,
                    "is_publishable": True,
                    "is_active": True,
                    "display_order": index,
                },
            )
            if not created:
                category.domain = JobCategory.Domain.IT
                category.is_publishable = True
                category.is_active = True
                category.display_order = category.display_order or index
                category.save(
                    update_fields=[
                        "domain",
                        "is_publishable",
                        "is_active",
                        "display_order",
                        "updated_at",
                    ]
                )
            self.stdout.write(f"{'created' if created else 'updated'} {name}")

        self.stdout.write(self.style.SUCCESS("IT job categories are ready."))
