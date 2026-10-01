from django.core.management.base import BaseCommand, CommandError

from apps.recruitment.jobs.models import Job, JobEmbedding
from apps.recruitment.jobs.services.recommendations import generate_job_embedding


class Command(BaseCommand):
    help = "Rebuild PGVector job embeddings from source job data."

    def add_arguments(self, parser):
        parser.add_argument(
            "--limit",
            type=int,
            default=500,
            help="Maximum jobs to rebuild. Use 0 to rebuild all matching jobs.",
        )
        parser.add_argument(
            "--force",
            action="store_true",
            help="Regenerate even when DB metadata and vector look fresh.",
        )
        parser.add_argument("--dry-run", action="store_true")

    def handle(self, *args, **options):
        limit = int(options["limit"])
        if limit < 0:
            raise CommandError("--limit must be 0 or greater.")

        job_queryset = (
            Job.objects.filter(
                status=Job.Status.PUBLISHED,
                domain_status=Job.DomainStatus.IT_APPROVED,
                moderation_status=Job.ModerationStatus.APPROVED,
            )
            .order_by("-updated_at")
            .values_list("id", flat=True)
        )
        if limit:
            job_queryset = job_queryset[:limit]
        job_ids = list(job_queryset)

        processed = 0
        for job_id in job_ids:
            if options["dry_run"]:
                self.stdout.write(f"job={job_id} dry_run")
                continue
            if options["force"]:
                JobEmbedding.objects.filter(job_id=job_id).update(
                    status=JobEmbedding.Status.PENDING,
                    source_hash="",
                    model_version="",
                    dimensions=0,
                    embedding=None,
                    error="",
                )
            result = generate_job_embedding(job_id)
            self.stdout.write(f"job={job_id} {result}")
            processed += 1

        self.stdout.write(self.style.SUCCESS(f"Processed {processed} jobs"))
