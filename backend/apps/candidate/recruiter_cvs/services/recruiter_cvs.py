from django.db import transaction
from django.utils import timezone
from django.template.loader import render_to_string
from django.core.files.base import ContentFile

from ..models import RecruiterCV

from apps.candidate.cv_templates.models import CVTemplate
from apps.candidate.recruiter_skills.models import RecruiterSkill
from apps.candidate.recruiter_education.models import RecruiterEducation
from apps.candidate.recruiter_experience.models import RecruiterExperience
from apps.candidate.recruiter_certifications.models import RecruiterCertification
from apps.candidate.recruiter_projects.models import RecruiterProject
from apps.candidate.recruiter_languages.models import RecruiterLanguage
from apps.company.companies.utils.cloudinary import save_raw_file


@transaction.atomic
def set_cv_as_default(cv: RecruiterCV) -> RecruiterCV:
    """
    Äáº·t CV lÃ m máº·c Ä‘á»‹nh (reset cÃ¡c CV khÃ¡c).
    """
    RecruiterCV.objects.filter(recruiter=cv.recruiter, is_default=True).exclude(
        id=cv.id
    ).update(is_default=False)

    cv.is_default = True
    cv.save()
    return cv


def build_cv_data_from_profile(recruiter) -> dict:
    """
    Build cv_data dict from recruiter profile.
    Used for auto-populating new CVs and for preview rendering.
    """
    skills_data = []
    for rs in RecruiterSkill.objects.filter(recruiter=recruiter).select_related(
        "skill"
    ):
        skills_data.append(
            {
                "name": rs.skill.name,
                "proficiency_level": rs.proficiency_level,
                "years_of_experience": rs.years_of_experience or 0,
            }
        )

    education_data = []
    for edu in RecruiterEducation.objects.filter(recruiter=recruiter).order_by(
        "-start_date"
    ):
        education_data.append(
            {
                "school_name": edu.school_name,
                "degree": edu.degree or "",
                "field_of_study": edu.field_of_study or "",
                "start_date": edu.start_date.isoformat() if edu.start_date else None,
                "end_date": edu.end_date.isoformat() if edu.end_date else None,
                "is_current": edu.is_current,
                "description": edu.description or "",
            }
        )

    experience_data = []
    for exp in RecruiterExperience.objects.filter(recruiter=recruiter).order_by(
        "-start_date"
    ):
        experience_data.append(
            {
                "company_name": exp.company_name,
                "position": exp.job_title,
                "job_title": exp.job_title,
                "start_date": exp.start_date.isoformat() if exp.start_date else None,
                "end_date": exp.end_date.isoformat() if exp.end_date else None,
                "is_current": exp.is_current,
                "description": exp.description or "",
            }
        )

    certifications_data = []
    for cert in RecruiterCertification.objects.filter(recruiter=recruiter).order_by(
        "-issue_date"
    ):
        certifications_data.append(
            {
                "name": cert.certification_name,
                "issuing_organization": cert.issuing_organization or "",
                "issue_date": cert.issue_date.isoformat() if cert.issue_date else None,
                "expiry_date": cert.expiry_date.isoformat()
                if cert.expiry_date
                else None,
                "credential_id": cert.credential_id or "",
                "credential_url": cert.credential_url or "",
            }
        )

    projects_data = []
    for proj in RecruiterProject.objects.filter(recruiter=recruiter).order_by(
        "-start_date"
    ):
        technologies = []
        if proj.technologies_used:
            if isinstance(proj.technologies_used, list):
                technologies = proj.technologies_used
            else:
                technologies = [
                    t.strip()
                    for t in str(proj.technologies_used).split(",")
                    if t.strip()
                ]
        projects_data.append(
            {
                "name": proj.project_name,
                "description": proj.description or "",
                "project_url": proj.project_url or "",
                "start_date": proj.start_date.isoformat() if proj.start_date else None,
                "end_date": proj.end_date.isoformat() if proj.end_date else None,
                "technologies": technologies,
            }
        )

    languages_data = []
    for lang in RecruiterLanguage.objects.filter(recruiter=recruiter).select_related(
        "language"
    ):
        languages_data.append(
            {
                "name": lang.language.language_name if lang.language else "",
                "proficiency_level": lang.proficiency_level,
            }
        )

    return {
        "personal": {
            "full_name": recruiter.user.full_name,
            "email": recruiter.user.email,
            "phone": getattr(recruiter.user, "phone_number", "") or "",
            "current_position": recruiter.current_position or "",
            "bio": recruiter.bio or "",
            "avatar_url": getattr(recruiter.user, "avatar_url", "") or "",
            "years_of_experience": recruiter.years_of_experience or 0,
        },
        "location": {},
        "links": {
            "linkedin": recruiter.linkedin_url or "",
            "github": recruiter.github_url or "",
            "portfolio": recruiter.portfolio_url or "",
            "facebook": recruiter.facebook_url or "",
        },
        "skills": skills_data,
        "education": education_data,
        "experience": experience_data,
        "certifications": certifications_data,
        "projects": projects_data,
        "languages": languages_data,
    }


def render_cv_to_html(cv: RecruiterCV) -> str:
    """
    Render CV data to HTML string using the template associated with the CV.
    Falls back to modern.html if no template is set.
    """
    # Determine which HTML template file to use
    if cv.template and cv.template.file_name:
        template_name = f"cv/{cv.template.file_name}"
    else:
        template_name = "cv/modern.html"

    context = {"data": cv.cv_data, "cv": cv}

    html_string = render_to_string(template_name, context)
    return html_string


# Mapping from browser template filename â†’ WeasyPrint-compatible PDF template
_PDF_TEMPLATE_MAP = {
    "modern.html": "cv/pdf/modern_pdf.html",
    "ATS_Prime.html": "cv/pdf/ATS_Prime_pdf.html",
    "editorialBold.html": "cv/pdf/editorialBold_pdf.html",
    "modernHybird.html": "cv/pdf/modernHybird_pdf.html",
    "modernHybird2.html": "cv/pdf/modernHybird2_pdf.html",
    "modernLuxury.html": "cv/pdf/modernLuxury_pdf.html",
}


def render_cv_to_pdf_html(cv: RecruiterCV) -> str:
    """
    Render CV data to a WeasyPrint-compatible HTML string.
    Uses dedicated PDF templates (no Tailwind CDN, no Google Fonts CDN).
    Falls back to the browser template if no PDF template exists.
    """
    file_name = cv.template.file_name if cv.template else None

    # Use dedicated PDF template if available
    if file_name and file_name in _PDF_TEMPLATE_MAP:
        template_name = _PDF_TEMPLATE_MAP[file_name]
    elif file_name:
        # Fallback: try pdf/<name>_pdf.html
        pdf_name = file_name.replace(".html", "_pdf.html")
        template_name = f"cv/pdf/{pdf_name}"
        # Check if it exists, otherwise use browser template
        from django.template.loader import get_template
        from django.template import TemplateDoesNotExist
        try:
            get_template(template_name)
        except TemplateDoesNotExist:
            template_name = f"cv/{file_name}"
    else:
        template_name = "cv/modern.html"

    context = {"data": cv.cv_data, "cv": cv}
    return render_to_string(template_name, context)


def generate_cv_download(cv: RecruiterCV, force_regenerate: bool = False) -> dict:
    """
    Generate PDF for CV using WeasyPrint.
    Uses dedicated WeasyPrint-compatible PDF templates (no Tailwind CDN, no Google Fonts CDN).
    Uploads to Cloudinary and returns URL.
    """
    # Use cached URL if exists and not forced
    if cv.cv_url and not force_regenerate:
        cv.download_count += 1
        cv.save(update_fields=["download_count"])
        return {
            "download_url": cv.cv_url,
            "format": "pdf",
            "message": "Retrieved from cache",
        }

    import weasyprint

    # Use PDF-specific template -- no external CDN dependencies
    html_string = render_cv_to_pdf_html(cv)
    pdf_bytes = weasyprint.HTML(string=html_string).write_pdf()
    content_file = ContentFile(pdf_bytes, name=f"{cv.cv_name}.pdf")
    cv_url = save_raw_file("CVs", content_file, f"cv_{cv.id}")

    cv.cv_url = cv_url
    cv.download_count += 1
    cv.save(update_fields=["cv_url", "download_count"])

    return {"download_url": cv_url, "format": "pdf", "message": "Generated new PDF"}

def generate_cv_preview(cv: RecruiterCV) -> dict:
    """
    Return HTML for preview using the CV's associated template.
    For CV_Upload (template=None, cv_url set), returns an HTML page embedding the PDF.
    """
    cv.view_count += 1
    cv.save(update_fields=["view_count"])

    try:
        html_content = render_cv_to_html(cv)
    except Exception:
        html_content = f"<html><body><pre>{cv.cv_data}</pre></body></html>"

    return {"html_content": html_content, "template_id": cv.template_id}


@transaction.atomic
def upload_cv_pdf(recruiter, file, cv_name: str = None) -> RecruiterCV:
    """
    Upload file PDF lÃªn Cloudinary vÃ  táº¡o RecruiterCV má»›i (CV_Upload).

    Args:
        recruiter: Recruiter instance thá»±c hiá»‡n upload.
        file: File object (InMemoryUploadedFile hoáº·c tÆ°Æ¡ng tá»±) chá»©a ná»™i dung PDF.
        cv_name: TÃªn CV tÃ¹y chá»n. Náº¿u khÃ´ng cung cáº¥p, dÃ¹ng tÃªn file gá»‘c bá» pháº§n má»Ÿ rá»™ng .pdf.

    Returns:
        RecruiterCV instance vá»«a Ä‘Æ°á»£c táº¡o (CV_Upload).
    """
    # Upload lÃªn Cloudinary
    content_file = ContentFile(file.read(), name=file.name)
    cv_url = save_raw_file("CVs", content_file, f"cv_upload_{recruiter.id}")

    # TÃªn CV: dÃ¹ng cv_name náº¿u cÃ³, ngÆ°á»£c láº¡i dÃ¹ng tÃªn file gá»‘c bá» pháº§n má»Ÿ rá»™ng .pdf
    if not cv_name:
        cv_name = file.name
        if cv_name.lower().endswith(".pdf"):
            cv_name = cv_name[:-4]

    cv = RecruiterCV.objects.create(
        recruiter=recruiter,
        template=None,
        cv_name=cv_name,
        cv_data={},
        cv_url=cv_url,
        is_default=False,
        is_public=True,
    )
    return cv


@transaction.atomic
def auto_generate_cv(recruiter, template_id: int = None) -> RecruiterCV:
    """
    Tá»± Ä‘á»™ng táº¡o CV tá»« recruiter profile vá»›i Ä‘áº§y Ä‘á»§ dá»¯ liá»‡u.
    Fetch tá»«: skills, education, experience, certifications, projects, languages
    """

    # Get template
    template = None
    if template_id:
        try:
            template = CVTemplate.objects.get(id=template_id, is_active=True)
        except CVTemplate.DoesNotExist:
            pass

    # Fetch skills
    skills_data = []
    skills = RecruiterSkill.objects.filter(recruiter=recruiter).select_related("skill")
    for rs in skills:
        skills_data.append(
            {
                "name": rs.skill.name if rs.skill else rs.skill_name,
                "proficiency_level": rs.proficiency_level,
                "years_of_experience": rs.years_of_experience,
            }
        )

    # Fetch education
    education_data = []
    educations = RecruiterEducation.objects.filter(recruiter=recruiter).order_by(
        "-start_date"
    )
    for edu in educations:
        education_data.append(
            {
                "school_name": edu.school_name,
                "degree": edu.degree,
                "field_of_study": edu.field_of_study or "",
                "start_date": edu.start_date.isoformat() if edu.start_date else None,
                "end_date": edu.end_date.isoformat() if edu.end_date else None,
                "is_current": edu.is_current,
                "description": edu.description or "",
            }
        )

    # Fetch experience
    experience_data = []
    experiences = RecruiterExperience.objects.filter(recruiter=recruiter).order_by(
        "-start_date"
    )
    for exp in experiences:
        experience_data.append(
            {
                "company_name": exp.company_name,
                "job_title": exp.job_title,
                # "location": exp.location or "", # Model doesn't have location string, check if needed
                "start_date": exp.start_date.isoformat() if exp.start_date else None,
                "end_date": exp.end_date.isoformat() if exp.end_date else None,
                "is_current": exp.is_current,
                "description": exp.description or "",
            }
        )

    # Fetch certifications
    certifications_data = []
    certifications = RecruiterCertification.objects.filter(
        recruiter=recruiter
    ).order_by("-issue_date")
    for cert in certifications:
        certifications_data.append(
            {
                "name": cert.certification_name,  # fixed field name
                "issuing_organization": cert.issuing_organization or "",
                "issue_date": cert.issue_date.isoformat() if cert.issue_date else None,
                "expiry_date": cert.expiry_date.isoformat()
                if cert.expiry_date
                else None,
                "credential_id": cert.credential_id or "",
                "credential_url": cert.credential_url or "",
            }
        )

    # Fetch projects
    projects_data = []
    projects = RecruiterProject.objects.filter(recruiter=recruiter).order_by(
        "-start_date"
    )
    for proj in projects:
        projects_data.append(
            {
                "project_name": proj.project_name,
                "description": proj.description or "",
                "project_url": proj.project_url or "",
                "start_date": proj.start_date.isoformat() if proj.start_date else None,
                "end_date": proj.end_date.isoformat() if proj.end_date else None,
                "technologies_used": proj.technologies_used or "",
            }
        )

    # Fetch languages
    languages_data = []
    languages = RecruiterLanguage.objects.filter(recruiter=recruiter).select_related(
        "language"
    )
    for lang in languages:
        languages_data.append(
            {
                "name": lang.language.language_name
                if lang.language
                else "",  # field is language_name
                "proficiency_level": lang.proficiency_level,
            }
        )

    # Build cv_data from recruiter profile
    cv_data = {
        "personal": {
            "full_name": recruiter.user.full_name,
            "email": recruiter.user.email,
            "phone": getattr(recruiter.user, "phone_number", ""),
            "current_position": recruiter.current_position or "",
            "bio": recruiter.bio or "",
            "years_of_experience": recruiter.years_of_experience or 0,
        },
        "location": {},
        "links": {
            "linkedin": recruiter.linkedin_url or "",
            "github": recruiter.github_url or "",
            "portfolio": recruiter.portfolio_url or "",
            "facebook": recruiter.facebook_url or "",
        },
        "skills": skills_data,
        "education": education_data,
        "experience": experience_data,
        "certifications": certifications_data,
        "projects": projects_data,
        "languages": languages_data,
    }

    # Create CV
    cv = RecruiterCV.objects.create(
        recruiter=recruiter,
        template=template,
        cv_name=f"Auto-generated CV - {timezone.now().strftime('%Y-%m-%d')}",
        cv_data=cv_data,
        is_default=False,
        is_public=True,
    )

    return cv


