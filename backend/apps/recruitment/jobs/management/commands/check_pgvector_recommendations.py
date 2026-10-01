from django.core.management.base import BaseCommand, CommandError

from apps.recruitment.jobs.models import CandidateRecommendationEmbedding, JobEmbedding
from apps.recruitment.jobs.services import recommendations


class Command(BaseCommand):
    help = "Check DB-ready recommendation records against PGVector embeddings."

    def add_arguments(self, parser):
        parser.add_argument(
            "--limit",
            type=int,
            default=500,
            help="Maximum DB-ready records to check per type. Use 0 to check all.",
        )
        parser.add_argument("--jobs-only", action="store_true")
        parser.add_argument("--candidates-only", action="store_true")
        parser.add_argument("--no-fail", action="store_true")

    def handle(self, *args, **options):
        limit = int(options["limit"])
        if limit < 0:
            raise CommandError("--limit must be 0 or greater.")
        check_jobs = not options["candidates_only"]
        check_candidates = not options["jobs_only"]

        missing = 0
        checked = 0
        if check_jobs:
            job_records = JobEmbedding.objects.filter(
                status=JobEmbedding.Status.READY
            ).order_by("-updated_at")
            if limit:
                job_records = job_records[:limit]
            for record in job_records:
                checked += 1
                if not recommendations._vector_store_record_has_expected_embedding(
                    record
                ):
                    missing += 1
                    self.stdout.write(
                        self.style.WARNING(f"missing job_vector job={record.job_id}")
                    )

        if check_candidates:
            candidate_records = CandidateRecommendationEmbedding.objects.filter(
                status=CandidateRecommendationEmbedding.Status.READY
            ).order_by("-updated_at")
            if limit:
                candidate_records = candidate_records[:limit]
            for record in candidate_records:
                checked += 1
                if not recommendations._vector_store_record_has_expected_embedding(
                    record
                ):
                    missing += 1
                    self.stdout.write(
                        self.style.WARNING(
                            "missing candidate_vector "
                            f"recruiter={record.recruiter_id} "
                            f"source={record.source_type} cv={record.cv_id or ''}"
                        )
                    )

        summary = f"Checked {checked} PGVector embeddings; missing_or_stale={missing}"
        if missing and not options["no_fail"]:
            raise CommandError(summary)
        self.stdout.write(self.style.SUCCESS(summary))
