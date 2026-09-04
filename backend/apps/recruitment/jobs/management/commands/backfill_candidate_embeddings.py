from django.core.management.base import BaseCommand

from apps.candidate.recruiter_cvs.models import RecruiterCV
from apps.candidate.recruiters.models import Recruiter
from apps.recruitment.jobs.services.recommendations import generate_candidate_embedding


class Command(BaseCommand):
    help = "Backfill semantic recommendation embeddings for candidate profiles and CVs."

    def add_arguments(self, parser):
        parser.add_argument("--limit", type=int, default=500)
        parser.add_argument("--include-cvs", action="store_true")

    def handle(self, *args, **options):
        limit = max(1, int(options["limit"]))
        recruiter_ids = list(
            Recruiter.objects.order_by("-updated_at").values_list("id", flat=True)[:limit]
        )
        processed = 0
        for recruiter_id in recruiter_ids:
            self.stdout.write(f"recruiter={recruiter_id} {generate_candidate_embedding(recruiter_id)}")
            processed += 1
            if options["include_cvs"]:
                cv_ids = RecruiterCV.objects.filter(recruiter_id=recruiter_id).values_list(
                    "id", flat=True
                )
                for cv_id in cv_ids:
                    result = generate_candidate_embedding(recruiter_id, cv_id, "cv")
                    self.stdout.write(f"recruiter={recruiter_id} cv={cv_id} {result}")
                    processed += 1
        self.stdout.write(self.style.SUCCESS(f"Processed {processed} embeddings"))
