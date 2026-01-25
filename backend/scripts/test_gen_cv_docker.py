
import os
import sys
import django
from django.conf import settings
from pathlib import Path
import datetime

# Ensure project root is in path
sys.path.append('/app')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.candidate.recruiter_cvs.services.recruiter_cvs import render_cv_to_html
from apps.candidate.recruiter_cvs.models import RecruiterCV
from apps.candidate.recruiters.models import Recruiter
from apps.core.users.models import CustomUser
import weasyprint

def run():
    print("🚀 Starting Test PDF Generation...")
    
    # 1. Get or Create Dummy User/Recruiter
    email = "test_gen_cv@example.com"
    try:
        user, _ = CustomUser.objects.get_or_create(email=email, defaults={'full_name': 'Nguyen Van A', 'password': 'password123'})
        recruiter, _ = Recruiter.objects.get_or_create(user=user)
    except Exception as e:
        print(f"Error creating user: {e}")
        return

    # 2. Create Dummy CV Data
    cv_data = {
        "personal": {
            "full_name": "Nguyen Van A",
            "email": "test.cv@example.com",
            "phone": "0909123456",
            "current_position": "Senior Software Engineer",
            "bio": "Experienced developer with a passion for clean code.",
            "avatar_url": "https://via.placeholder.com/150"
        },
        "skills": [
            {"name": "Python", "proficiency_level": "expert"},
            {"name": "Django", "proficiency_level": "advanced"},
            {"name": "Docker", "proficiency_level": "intermediate"}
        ],
        "experience": [
            {
                "company_name": "Tech Corp",
                "position": "Backend Lead",
                "start_date": "2020-01-01",
                "end_date": "2023-01-01",
                "is_current": False,
                "description": "Led a team of 5 developers. Architected microservices."
            },
             {
                "company_name": "Startup Inc",
                "position": "Junior Dev",
                "start_date": "2018-01-01",
                "end_date": "2019-12-31",
                "is_current": False,
                "description": "Maintained legacy codebase."
            }
        ],
        "education": [
             {
                "school_name": "Vietnam University",
                "degree": "Bachelor",
                "field_of_study": "Computer Science",
                "start_date": "2014-09-01",
                "end_date": "2018-06-01",
                "is_current": False,
                "description": "Graduated with Honors."
            }
        ],
        "projects": [
            {
                "name": "E-Commerce Platform",
                "description": "Built a scalable e-commerce site handling 10k RPS.",
                "start_date": "2021-06-01",
                "technologies": ["Python", "Redis", "PostgreSQL"]
            }
        ],
        "languages": [
            {"name": "English", "proficiency_level": "advanced"},
            {"name": "Vietnamese", "proficiency_level": "native"}
        ],
        "certifications": [],
        "links": {
            "github": "https://github.com/nguyenvana",
            "linkedin": "https://linkedin.com/in/nguyenvana"
        }
    }
    
    cv, _ = RecruiterCV.objects.get_or_create(
        recruiter=recruiter,
        cv_name="Test Generated CV",
        defaults={'cv_data': cv_data}
    )
    cv.cv_data = cv_data
    cv.save()

    print(f"📝 CV Created: ID {cv.id}")

    # 3. Render HTML
    print("🎨 Rendering HTML...")
    html_string = render_cv_to_html(cv)
    
    # 4. Generate PDF
    print("🖨️ Generating PDF with WeasyPrint...")
    try:
        pdf_bytes = weasyprint.HTML(string=html_string).write_pdf()
    except Exception as e:
        print(f"❌ WeasyPrint Failed: {e}")
        return

    # 5. Save to Media folder (mapped volume)
    output_filename = "test_cv.pdf"
    media_root = settings.MEDIA_ROOT
    # Ensure media root exists (might be using Cloudinary storage, so might not exist locally)
    if not os.path.exists(media_root):
        os.makedirs(media_root, exist_ok=True)
        
    output_path = os.path.join(media_root, output_filename)
    
    with open(output_path, 'wb') as f:
        f.write(pdf_bytes)
    
    print(f"✅ PDF successfully saved to container path: {output_path}")
    print("You can access it on host at: backend/media/test_cv.pdf")

if __name__ == "__main__":
    run()
