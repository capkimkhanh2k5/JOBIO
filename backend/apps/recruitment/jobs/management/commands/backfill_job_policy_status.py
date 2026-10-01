from django.core.management.base import BaseCommand

from apps.moderation.services import validate_job_for_publish
from apps.recruitment.jobs.models import Job


class Command(BaseCommand):
    help = "Backfill IT-domain and moderation status for existing jobs."

    def add_arguments(self, parser):
        parser.add_argument("--limit", type=int, default=500)
        parser.add_argument(
            "--published-only",
            action="store_true",
            help="Only validate published jobs.",
        )

    def handle(self, *args, **options):
        limit = max(1, int(options["limit"]))
        queryset = Job.objects.select_related(
            "category", "created_by"
        ).prefetch_related("required_skills__skill")
        if options["published_only"]:
            queryset = queryset.filter(status=Job.Status.PUBLISHED)

        processed = 0
        blocked = 0
        for job in queryset.order_by("-updated_at")[:limit]:
            readiness = validate_job_for_publish(
                job, user=getattr(job, "created_by", None), persist=True
            )
            processed += 1
            if not readiness["allowed"]:
                blocked += 1
            self.stdout.write(
                f"job={job.id} allowed={readiness['allowed']} "
                f"errors={len(readiness['errors'])}"
            )

        self.stdout.write(
            self.style.SUCCESS(
                f"Processed {processed} jobs; blocked_or_review={blocked}"
            )
        )
