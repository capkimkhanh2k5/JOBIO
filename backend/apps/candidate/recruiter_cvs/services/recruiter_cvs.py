from django.db import transaction
from django.utils import timezone
from datetime import timedelta

from ..models import RecruiterCV

from apps.candidate.cv_templates.models import CVTemplate
from apps.candidate.recruiter_skills.models import RecruiterSkill
from apps.candidate.recruiter_education.models import RecruiterEducation
from apps.candidate.recruiter_experience.models import RecruiterExperience
from apps.candidate.recruiter_certifications.models import RecruiterCertification
from apps.candidate.recruiter_projects.models import RecruiterProject
from apps.candidate.recruiter_languages.models import RecruiterLanguage

@transaction.atomic
def set_cv_as_default(cv: RecruiterCV) -> RecruiterCV:
    """
    Đặt CV làm mặc định (reset các CV khác).
    """
    RecruiterCV.objects.filter(
        recruiter=cv.recruiter, 
        is_default=True
    ).exclude(id=cv.id).update(is_default=False)
    
    cv.is_default = True
    cv.save()
    return cv

#TODO: Cần hoàn thiện download CV sau
def generate_cv_download(cv: RecruiterCV, file_format: str = 'pdf') -> dict:
    """
    Tạo URL download CV (mock).
    """
    # Increment download count
    cv.download_count += 1
    cv.save(update_fields=['download_count'])
    
    # Mock response
    expires_at = timezone.now() + timedelta(hours=1)
    
    return {
        "download_url": f"https://example.com/cv/{cv.id}/download.{file_format}",
        "format": file_format,
        "expires_at": expires_at.isoformat(),
        "message": "Mock URL - integrate PDF generator later"
    }

#TODO: Cần hoàn thiện preview CV sau
def generate_cv_preview(cv: RecruiterCV) -> dict:
    """
    Tạo preview cho CV (mock).
    """
    # Increment view count
    cv.view_count += 1
    cv.save(update_fields=['view_count'])
    
    # Mock response
    return {
        "preview_url": f"https://example.com/cv/{cv.id}/preview/",
        "preview_data": cv.cv_data,
        "template_id": cv.template_id,
        "message": "Mock preview - integrate template renderer later"
    }


@transaction.atomic
def auto_generate_cv(recruiter, template_id: int = None) -> RecruiterCV:
    """
    Tự động tạo CV từ recruiter profile với đầy đủ dữ liệu.
    Fetch từ: skills, education, experience, certifications, projects, languages
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
    skills = RecruiterSkill.objects.filter(recruiter=recruiter).select_related('skill')
    for rs in skills:
        skills_data.append({
            "name": rs.skill.name if rs.skill else rs.skill_name,
            "proficiency_level": rs.proficiency_level,
            "years_of_experience": rs.years_of_experience,
        })
    
    # Fetch education
    education_data = []
    educations = RecruiterEducation.objects.filter(recruiter=recruiter).order_by('-start_date')
    for edu in educations:
        education_data.append({
            "school_name": edu.school_name,
            "degree": edu.degree,
            "field_of_study": edu.field_of_study or "",
            "start_date": edu.start_date.isoformat() if edu.start_date else None,
            "end_date": edu.end_date.isoformat() if edu.end_date else None,
            "is_current": edu.is_current,
            "description": edu.description or "",
        })
    
    # Fetch experience
    experience_data = []
    experiences = RecruiterExperience.objects.filter(recruiter=recruiter).order_by('-start_date')
    for exp in experiences:
        experience_data.append({
            "company_name": exp.company_name,
            "position": exp.position,
            "location": exp.location or "",
            "start_date": exp.start_date.isoformat() if exp.start_date else None,
            "end_date": exp.end_date.isoformat() if exp.end_date else None,
            "is_current": exp.is_current,
            "description": exp.description or "",
        })
    
    # Fetch certifications
    certifications_data = []
    certifications = RecruiterCertification.objects.filter(recruiter=recruiter).order_by('-issue_date')
    for cert in certifications:
        certifications_data.append({
            "name": cert.name,
            "issuing_organization": cert.issuing_organization or "",
            "issue_date": cert.issue_date.isoformat() if cert.issue_date else None,
            "expiry_date": cert.expiry_date.isoformat() if cert.expiry_date else None,
            "credential_id": cert.credential_id or "",
            "credential_url": cert.credential_url or "",
        })
    
    # Fetch projects
    projects_data = []
    projects = RecruiterProject.objects.filter(recruiter=recruiter).order_by('-start_date')
    for proj in projects:
        projects_data.append({
            "name": proj.name,
            "description": proj.description or "",
            "url": proj.url or "",
            "start_date": proj.start_date.isoformat() if proj.start_date else None,
            "end_date": proj.end_date.isoformat() if proj.end_date else None,
            "technologies": proj.technologies or [],
        })
    
    # Fetch languages
    languages_data = []
    languages = RecruiterLanguage.objects.filter(recruiter=recruiter).select_related('language')
    for lang in languages:
        languages_data.append({
            "name": lang.language.name if lang.language else "",
            "proficiency_level": lang.proficiency_level,
        })
    
    # Build cv_data from recruiter profile
    cv_data = {
        "personal": {
            "full_name": recruiter.user.full_name,
            "email": recruiter.user.email,
            "phone": getattr(recruiter.user, 'phone_number', ''),
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
        is_public=True
    )
    
    return cv

