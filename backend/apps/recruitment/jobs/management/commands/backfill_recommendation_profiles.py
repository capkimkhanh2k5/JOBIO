from django.core.management.base import BaseCommand

from apps.candidate.recruiters.models import Recruiter
from apps.recruitment.jobs.models import Job
from apps.recruitment.jobs.services.normalization import (
    process_candidate_recommendation_profile,
    process_job_recommendation_profile,
)


class Command(BaseCommand):
    help = (
        "Backfill normalized recommendation metadata for jobs and candidate profiles."
    )

    def add_arguments(self, parser):
        parser.add_argument("--limit", type=int, default=500)
        parser.add_argument(
            "--entity",
            choices=["jobs", "candidates", "all"],
            default="all",
        )

    def handle(self, *args, **options):
        limit = max(1, int(options["limit"]))
        entity = options["entity"]
        processed = 0

        if entity in {"jobs", "all"}:
            jobs = (
                Job.objects.select_related("address__province", "category")
                .prefetch_related(
                    "required_skills__skill", "locations__address__province"
                )
                .order_by("-updated_at")[:limit]
            )
            for job in jobs:
                profile = process_job_recommendation_profile(job)
                self.stdout.write(
                    f"job={job.id} status={profile.status} title={profile.title_core}"
                )
                processed += 1

        if entity in {"candidates", "all"}:
            recruiters = Recruiter.objects.select_related(
                "address__province", "user"
            ).order_by("-updated_at")[:limit]
            for recruiter in recruiters:
                profile = process_candidate_recommendation_profile(recruiter)
                self.stdout.write(
                    "recruiter="
                    f"{recruiter.id} status={profile.status} title={profile.current_title_core}"
                )
                processed += 1

        self.stdout.write(self.style.SUCCESS(f"Processed {processed} profiles"))
