from django.core.management.base import BaseCommand, CommandError

from apps.candidate.recruiter_cvs.models import RecruiterCV
from apps.candidate.recruiters.models import Recruiter
from apps.recruitment.jobs.models import CandidateRecommendationEmbedding
from apps.recruitment.jobs.services.recommendations import generate_candidate_embedding


class Command(BaseCommand):
    help = "Rebuild PGVector candidate embeddings from profile and CV source data."

    def add_arguments(self, parser):
        parser.add_argument(
            "--limit",
            type=int,
            default=500,
            help="Maximum recruiters to rebuild. Use 0 to rebuild all recruiters.",
        )
        parser.add_argument(
            "--skip-cvs",
            action="store_true",
            help="Only rebuild profile vectors, not per-CV vectors.",
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

        recruiter_queryset = Recruiter.objects.order_by("-updated_at").values_list(
            "id", flat=True
        )
        if limit:
            recruiter_queryset = recruiter_queryset[:limit]
        recruiter_ids = list(recruiter_queryset)

        processed = 0
        for recruiter_id in recruiter_ids:
            if options["dry_run"]:
                self.stdout.write(f"recruiter={recruiter_id} profile dry_run")
            else:
                self._prepare_record(recruiter_id, None, "profile", options["force"])
                result = generate_candidate_embedding(recruiter_id)
                self.stdout.write(f"recruiter={recruiter_id} profile {result}")
                processed += 1

            if options["skip_cvs"]:
                continue

            cv_ids = RecruiterCV.objects.filter(recruiter_id=recruiter_id).values_list(
                "id", flat=True
            )
            for cv_id in cv_ids:
                if options["dry_run"]:
                    self.stdout.write(f"recruiter={recruiter_id} cv={cv_id} dry_run")
                    continue
                self._prepare_record(recruiter_id, cv_id, "cv", options["force"])
                result = generate_candidate_embedding(recruiter_id, cv_id, "cv")
                self.stdout.write(f"recruiter={recruiter_id} cv={cv_id} {result}")
                processed += 1

        self.stdout.write(self.style.SUCCESS(f"Processed {processed} embeddings"))

    def _prepare_record(self, recruiter_id, cv_id, source_type, force):
        if not force:
            return
        CandidateRecommendationEmbedding.objects.filter(
            recruiter_id=recruiter_id,
            cv_id=cv_id,
            source_type=source_type,
        ).update(
            status=CandidateRecommendationEmbedding.Status.PENDING,
            source_hash="",
            model_version="",
            dimensions=0,
            embedding=None,
            error="",
        )
