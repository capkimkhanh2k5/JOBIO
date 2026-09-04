import re
import sys

# We will just strip specific unused imports from the known files based on our previous typecheck logs.
files_to_fix = [
    "src/components/candidate/cv/CVBuilder.tsx",
    "src/components/company/candidates/CandidateBoard.tsx",
    "src/components/company/company-profile/CompanyInfoForm.tsx",
    "src/components/company/company-profile/VerificationSection.tsx",
    "src/components/company/wizard/Step4SeoReview.tsx",
    "src/components/jobs/JobCard.tsx",
    "src/components/jobs/JobSkillsList.tsx",
    "src/components/profile/CertificationsSection.tsx",
    "src/components/profile/EducationSection.tsx",
    "src/components/profile/ExperienceSection.tsx",
    "src/components/profile/LanguagesSection.tsx",
    "src/components/profile/ProjectsSection.tsx",
    "src/components/profile/SkillsSection.tsx",
    "src/pages/Home.tsx",
    "src/pages/Pricing.tsx"
]

for file_path in files_to_fix:
    full_path = "frontend/" + file_path
    try:
        with open(full_path, "r") as f:
            content = f.read()
            
        # Specific component/icon removals
        content = re.sub(r"import\s+\{[^}]*\}\s+from\s+['\"]lucide-react['\"];?\n?", "", content) if "CandidateBoard.tsx" in file_path else content
        content = re.sub(r",\s*CardContent\b", "", content)
        content = re.sub(r"\bCardContent\s*,\s*", "", content)
        content = re.sub(r",\s*CardDescription\b", "", content)
        content = re.sub(r"\bCardDescription\s*,\s*", "", content)
        content = re.sub(r",\s*CardHeader\b", "", content)
        content = re.sub(r"\bCardHeader\s*,\s*", "", content)
        content = re.sub(r",\s*CardTitle\b", "", content)
        content = re.sub(r"\bCardTitle\s*,\s*", "", content)
        content = re.sub(r",\s*CardFooter\b", "", content)
        content = re.sub(r"\bCardFooter\s*,\s*", "", content)
        
        content = re.sub(r",\s*DialogHeader\b", "", content)
        content = re.sub(r"\bDialogHeader\s*,\s*", "", content)
        content = re.sub(r",\s*DialogTitle\b", "", content)
        content = re.sub(r"\bDialogTitle\s*,\s*", "", content)
        
        content = re.sub(r",\s*Badge\b", "", content)
        content = re.sub(r"\bBadge\s*,\s*", "", content)

        content = re.sub(r",\s*ArrowUpRight\b", "", content)
        content = re.sub(r"\bArrowUpRight\s*,\s*", "", content)
        
        # Unused variables
        content = re.sub(r"const\s+experience\s*=[^;]+;", "", content)
        content = re.sub(r"const\s+summary\s*=[^;]+;", "", content)
        content = re.sub(r"const\s+isExactActivePlan\s*=[^;]+;", "", content)
        
        with open(full_path, "w") as f:
            f.write(content)
    except FileNotFoundError:
        pass

print("Fixed")
