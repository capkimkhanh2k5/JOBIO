from django.core.management.base import BaseCommand

from apps.recruitment.jobs.models import Job
from apps.recruitment.jobs.services.recommendations import generate_job_embedding


class Command(BaseCommand):
    help = "Backfill semantic recommendation embeddings for published jobs."

    def add_arguments(self, parser):
        parser.add_argument("--limit", type=int, default=500)

    def handle(self, *args, **options):
        limit = max(1, int(options["limit"]))
        job_ids = list(
            Job.objects.filter(
                status=Job.Status.PUBLISHED,
                domain_status=Job.DomainStatus.IT_APPROVED,
                moderation_status=Job.ModerationStatus.APPROVED,
            )
            .order_by("-updated_at")
            .values_list("id", flat=True)[:limit]
        )
        for job_id in job_ids:
            result = generate_job_embedding(job_id)
            self.stdout.write(f"job={job_id} {result}")
        self.stdout.write(self.style.SUCCESS(f"Processed {len(job_ids)} jobs"))
