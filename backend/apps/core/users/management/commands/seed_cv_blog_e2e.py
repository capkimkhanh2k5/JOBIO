import json
from datetime import timedelta
from pathlib import Path

from django.conf import settings
from django.core.cache import cache
from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone

from apps.blog.models import Category, Post, Tag
from apps.candidate.cv_template_categories.models import CVTemplateCategory
from apps.candidate.cv_templates.models import CVTemplate
from apps.candidate.recruiter_cvs.models import RecruiterCV
from apps.candidate.recruiter_skills.models import RecruiterSkill
from apps.candidate.recruiters.models import Recruiter
from apps.candidate.skill_categories.models import SkillCategory
from apps.candidate.skills.models import Skill
from apps.company.companies.models import Company
from apps.core.users.models import CustomUser
from apps.geography.addresses.models import Address
from apps.geography.provinces.models import Province
from apps.recruitment.applications.models import Application
from apps.recruitment.job_categories.models import JobCategory
from apps.recruitment.job_locations.models import JobLocation
from apps.recruitment.job_skills.models import JobSkill
from apps.recruitment.jobs.models import Job


SLUG_PREFIX = "e2e-cv-blog"
EMAILS = {
    "admin": "e2e_cv_blog_admin@jobio-e2e.dev",
    "candidate": "e2e_cv_blog_candidate@jobio-e2e.dev",
    "company": "e2e_cv_blog_company@jobio-e2e.dev",
}
LEGACY_EMAILS = {
    "e2e_cv_blog_admin@jobio.test",
    "e2e_cv_blog_candidate@jobio.test",
    "e2e_cv_blog_company@jobio.test",
}
PASSWORD = "JobioE2E!123"


class Command(BaseCommand):
    help = (
        "Seed disposable local data for CV upload, suggested jobs, and blog E2E tests."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "--reset",
            action="store_true",
            help="Delete existing e2e_cv_blog records before seeding.",
        )

    @transaction.atomic
    def handle(self, *args, **options):
        if options["reset"]:
            cache.clear()
            self._reset()

        now = timezone.now()
        admin = self._upsert_user(
            EMAILS["admin"],
            "E2E Blog Admin",
            CustomUser.Role.ADMIN,
            is_staff=True,
            is_superuser=True,
        )
        candidate_user = self._upsert_user(
            EMAILS["candidate"], "E2E Candidate", CustomUser.Role.CANDIDATE
        )
        company_user = self._upsert_user(
            EMAILS["company"], "E2E Company Owner", CustomUser.Role.COMPANY
        )

        province, _ = Province.objects.update_or_create(
            province_name="E2E CV Blog City",
            defaults={
                "province_type": Province.ProvinceType.MUNICIPALITY,
                "region": Province.Region.SOUTH,
                "is_active": True,
            },
        )
        address, _ = Address.objects.update_or_create(
            address_line="E2E CV Blog Street",
            province=province,
            defaults={"is_verified": True},
        )

        company, _ = Company.objects.update_or_create(
            slug=f"{SLUG_PREFIX}-company",
            defaults={
                "user": company_user,
                "company_name": "E2E CV Blog Company",
                "description": "Disposable company for E2E verification.",
                "address": address,
                "verification_status": Company.VerificationStatus.VERIFIED,
                "verified_at": now,
                "verified_by": admin,
                "logo_url": "https://placehold.co/128x128/png?text=E2E",
            },
        )

        recruiter, _ = Recruiter.objects.update_or_create(
            user=candidate_user,
            defaults={
                "address": address,
                "current_position": "Python Developer",
                "years_of_experience": 4,
                "desired_salary_min": 20000000,
                "desired_salary_max": 40000000,
            },
        )

        skill_category, _ = SkillCategory.objects.update_or_create(
            slug=f"{SLUG_PREFIX}-skills",
            defaults={"name": "E2E CV Blog Skills", "is_active": True},
        )
        skill, _ = Skill.objects.update_or_create(
            slug=f"{SLUG_PREFIX}-python",
            defaults={
                "name": "E2E Python",
                "category": skill_category,
                "is_active": True,
                "is_verified": True,
            },
        )
        RecruiterSkill.objects.update_or_create(
            recruiter=recruiter,
            skill=skill,
            defaults={
                "proficiency_level": RecruiterSkill.ProficiencyLevel.ADVANCED,
                "years_of_experience": 4,
                "is_verified": True,
            },
        )

        template = (
            CVTemplate.objects.filter(file_name="modern.html").order_by("id").first()
        )
        if template:
            if not template.is_active:
                template.is_active = True
                template.save(update_fields=["is_active", "updated_at"])
        else:
            template_category, _ = CVTemplateCategory.objects.update_or_create(
                slug=f"{SLUG_PREFIX}-templates",
                defaults={"name": "E2E CV Blog Templates", "is_active": True},
            )
            template = CVTemplate.objects.create(
                name="E2E CV Blog Modern",
                category=template_category,
                file_name="modern.html",
                is_active=True,
                is_premium=False,
            )

        job_category, _ = JobCategory.objects.update_or_create(
            slug=f"{SLUG_PREFIX}-engineering",
            defaults={"name": "E2E CV Blog Engineering", "is_active": True},
        )
        job, _ = Job.objects.update_or_create(
            slug=f"{SLUG_PREFIX}-python-developer",
            defaults={
                "company": company,
                "title": "E2E Python Developer",
                "category": job_category,
                "job_type": Job.JobType.FULL_TIME,
                "level": Job.Level.SENIOR,
                "experience_years_min": 3,
                "salary_min": 25000000,
                "salary_max": 45000000,
                "description": "Build production APIs for the JOBIO E2E flow.",
                "requirements": "E2E Python, Django, APIs",
                "address": address,
                "application_deadline": now.date() + timedelta(days=30),
                "status": Job.Status.PUBLISHED,
                "featured": True,
                "featured_until": now.date() + timedelta(days=7),
                "published_at": now,
                "created_by": company_user,
            },
        )
        JobSkill.objects.update_or_create(
            job=job,
            skill=skill,
            defaults={
                "is_required": True,
                "proficiency_level": JobSkill.ProficiencyLevel.ADVANCED,
                "years_required": 3,
            },
        )
        JobLocation.objects.update_or_create(
            job=job,
            address=address,
            defaults={"is_primary": True},
        )

        blog_category, _ = Category.objects.update_or_create(
            slug=f"{SLUG_PREFIX}-career",
            defaults={
                "name": "E2E CV Blog Career",
                "description": "Disposable category for E2E verification.",
            },
        )
        blog_tag, _ = Tag.objects.update_or_create(
            slug=f"{SLUG_PREFIX}-hiring",
            defaults={"name": "E2E Hiring"},
        )
        published_post = self._upsert_post(
            author=company_user,
            company=company,
            category=blog_category,
            tag=blog_tag,
            slug=f"{SLUG_PREFIX}-published-post",
            title="E2E CV Blog Published Post",
            status=Post.Status.PUBLISHED,
            published_at=now,
        )
        self._upsert_post(
            author=company_user,
            company=company,
            category=blog_category,
            tag=blog_tag,
            slug=f"{SLUG_PREFIX}-draft-post",
            title="E2E CV Blog Draft Post",
            status=Post.Status.DRAFT,
            published_at=None,
        )

        sample_pdf = self._write_sample_pdf()

        self.stdout.write(
            json.dumps(
                {
                    "candidate": {"email": EMAILS["candidate"], "password": PASSWORD},
                    "company": {"email": EMAILS["company"], "password": PASSWORD},
                    "admin": {"email": EMAILS["admin"], "password": PASSWORD},
                    "candidate_id": recruiter.id,
                    "template_id": template.id,
                    "job_id": job.id,
                    "blog_post_slug": published_post.slug,
                    "sample_pdf": str(sample_pdf),
                },
                ensure_ascii=False,
            )
        )

    def _reset(self):
        users = list(
            CustomUser.objects.filter(email__in=[*EMAILS.values(), *LEGACY_EMAILS])
        )
        user_ids = [user.id for user in users]

        Application.objects.filter(recruiter__user_id__in=user_ids).delete()
        RecruiterCV.objects.filter(recruiter__user_id__in=user_ids).delete()
        Job.objects.filter(slug__startswith=SLUG_PREFIX).delete()
        Post.objects.filter(slug__startswith=SLUG_PREFIX).delete()
        Tag.objects.filter(slug__startswith=SLUG_PREFIX).delete()
        Category.objects.filter(slug__startswith=SLUG_PREFIX).delete()
        CVTemplate.objects.filter(name__startswith="E2E CV Blog").delete()
        CVTemplateCategory.objects.filter(slug__startswith=SLUG_PREFIX).delete()
        Company.objects.filter(slug__startswith=SLUG_PREFIX).delete()
        Recruiter.objects.filter(user_id__in=user_ids).delete()
        CustomUser.objects.filter(id__in=user_ids).delete()
        JobCategory.objects.filter(slug__startswith=SLUG_PREFIX).delete()
        Skill.objects.filter(slug__startswith=SLUG_PREFIX).delete()
        SkillCategory.objects.filter(slug__startswith=SLUG_PREFIX).delete()
        Address.objects.filter(address_line="E2E CV Blog Street").delete()
        Province.objects.filter(province_name="E2E CV Blog City").delete()

    def _upsert_user(
        self,
        email: str,
        full_name: str,
        role: str,
        *,
        is_staff: bool = False,
        is_superuser: bool = False,
    ) -> CustomUser:
        user, _ = CustomUser.objects.update_or_create(
            email=email,
            defaults={
                "full_name": full_name,
                "role": role,
                "status": CustomUser.Status.ACTIVE,
                "email_verified": True,
                "is_staff": is_staff,
                "is_superuser": is_superuser,
            },
        )
        user.set_password(PASSWORD)
        user.save(update_fields=["password"])
        return user

    def _upsert_post(
        self,
        *,
        author,
        company,
        category,
        tag,
        slug: str,
        title: str,
        status: str,
        published_at,
    ) -> Post:
        post, _ = Post.objects.update_or_create(
            slug=slug,
            defaults={
                "author": author,
                "company": company,
                "category": category,
                "title": title,
                "summary": f"{title} summary",
                "content": f"<p>{title} content for Playwright verification.</p>",
                "thumbnail": "https://placehold.co/1200x675/png?text=E2E+Blog",
                "status": status,
                "published_at": published_at,
                "is_featured": status == Post.Status.PUBLISHED,
            },
        )
        post.tags.set([tag])
        return post

    def _write_sample_pdf(self) -> Path:
        output_dir = Path(settings.MEDIA_ROOT) / "e2e_cv_blog"
        output_dir.mkdir(parents=True, exist_ok=True)
        output_path = output_dir / "e2e_cv_blog_sample.pdf"
        try:
            import fitz

            doc = fitz.open()
            try:
                page = doc.new_page(width=595, height=842)
                page.insert_text(
                    (72, 72),
                    f"E2E Candidate\nEmail: {EMAILS['candidate']}\n"
                    "Skills: E2E Python, Django, APIs\nExperience: 4 years",
                    fontsize=11,
                )
                output_path.write_bytes(doc.tobytes())
            finally:
                doc.close()
        except Exception:
            output_path.write_bytes(
                b"%PDF-1.4\n1 0 obj<<>>endobj\n"
                b"2 0 obj<< /Length 44 >>stream\n"
                b"BT /F1 12 Tf 72 720 Td (E2E CV Blog PDF) Tj ET\n"
                b"endstream endobj\ntrailer<<>>\n%%EOF\n"
            )
        return output_path
