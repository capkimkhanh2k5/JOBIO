import re
import unicodedata
from difflib import SequenceMatcher

from django.db import transaction
from django.utils import timezone

from apps.candidate.recruiter_skills.models import RecruiterSkill
from apps.candidate.skills.models import Skill
from apps.recruitment.jobs.models import (
    CandidateRecommendationProfile,
    CanonicalTitle,
    Job,
    JobRecommendationProfile,
    JobTitleAlias,
    RecommendationProcessingLog,
    SkillAlias,
)


SENIORITY_TERMS = {
    "intern": (
        "intern",
        "internship",
        "trainee",
        "thuc tap",
        "thuc tap sinh",
        "internship program",
    ),
    "fresher": (
        "fresher",
        "fresh graduate",
        "entry level",
        "new graduate",
        "graduate developer",
        "graduate engineer",
    ),
    "junior": ("junior", "jr", "junior level"),
    "middle": ("middle", "mid", "mid level", "intermediate"),
    "senior": ("senior", "sr", "senior level"),
    "lead": ("lead", "tech lead", "technical lead", "team lead", "principal", "staff"),
    "manager": (
        "manager",
        "engineering manager",
        "head",
        "head of engineering",
        "it manager",
    ),
}

WORKPLACE_TERMS = {
    "remote": ("remote", "work from home", "wfh", "tu xa", "lam viec tu xa"),
    "hybrid": (
        "hybrid",
        "linh hoat",
        "remote hybrid",
        "hybrid working",
        "hybrid work",
    ),
    "onsite": (
        "onsite",
        "on-site",
        "office",
        "van phong",
        "lam viec tai van phong",
    ),
}

LOCATION_TERMS = {
    "Ho Chi Minh": (
        "hcm",
        "ho chi minh",
        "hochiminh",
        "sai gon",
        "saigon",
        "tphcm",
        "tp hcm",
        "ho chi minh city",
    ),
    "Ha Noi": ("ha noi", "hanoi", "hn", "ha noi city"),
    "Da Nang": ("da nang", "danang", "dn"),
    "Can Tho": ("can tho", "cantho"),
    "Binh Duong": ("binh duong", "binhduong"),
    "Dong Nai": ("dong nai", "dongnai"),
    "Remote": ("remote", "wfh", "tu xa"),
}

FALLBACK_TITLE_ALIASES = {
    # Backend
    "backend developer": "Backend Developer",
    "backend engineer": "Backend Developer",
    "back end developer": "Backend Developer",
    "back end engineer": "Backend Developer",
    "be developer": "Backend Developer",
    "server side developer": "Backend Developer",
    "server side engineer": "Backend Developer",
    "api developer": "Backend Developer",
    "java backend developer": "Backend Developer",
    "nodejs backend developer": "Backend Developer",
    "python backend developer": "Backend Developer",
    "php backend developer": "Backend Developer",
    "golang backend developer": "Backend Developer",
    # Frontend
    "frontend developer": "Frontend Developer",
    "frontend engineer": "Frontend Developer",
    "front end developer": "Frontend Developer",
    "front end engineer": "Frontend Developer",
    "fe developer": "Frontend Developer",
    "web frontend developer": "Frontend Developer",
    "react developer": "Frontend Developer",
    "vue developer": "Frontend Developer",
    "angular developer": "Frontend Developer",
    "javascript developer": "Frontend Developer",
    # Fullstack
    "fullstack developer": "Fullstack Developer",
    "full stack developer": "Fullstack Developer",
    "fullstack engineer": "Fullstack Developer",
    "full stack engineer": "Fullstack Developer",
    "mern stack developer": "Fullstack Developer",
    "mean stack developer": "Fullstack Developer",
    # Mobile
    "mobile developer": "Mobile Developer",
    "mobile engineer": "Mobile Developer",
    "android developer": "Mobile Developer",
    "ios developer": "Mobile Developer",
    "flutter developer": "Mobile Developer",
    "react native developer": "Mobile Developer",
    "kotlin developer": "Mobile Developer",
    "swift developer": "Mobile Developer",
    # DevOps / Cloud
    "devops engineer": "DevOps Engineer",
    "devops developer": "DevOps Engineer",
    "sre": "DevOps Engineer",
    "site reliability engineer": "DevOps Engineer",
    "platform engineer": "DevOps Engineer",
    "infrastructure engineer": "DevOps Engineer",
    "cloud engineer": "Cloud Engineer",
    "aws engineer": "Cloud Engineer",
    "azure engineer": "Cloud Engineer",
    "gcp engineer": "Cloud Engineer",
    "cloud devops engineer": "Cloud Engineer",
    # Data / AI
    "data engineer": "Data Engineer",
    "big data engineer": "Data Engineer",
    "etl developer": "Data Engineer",
    "data analyst": "Data Analyst",
    "business intelligence analyst": "Data Analyst",
    "bi analyst": "Data Analyst",
    "data scientist": "Data Scientist",
    "machine learning engineer": "Machine Learning Engineer",
    "ml engineer": "Machine Learning Engineer",
    "ai engineer": "AI Engineer",
    "computer vision engineer": "AI Engineer",
    "nlp engineer": "AI Engineer",
    "mlops engineer": "MLOps Engineer",
    # QA / Testing
    "qa engineer": "QA Engineer",
    "quality assurance engineer": "QA Engineer",
    "tester": "QA Engineer",
    "manual tester": "QA Engineer",
    "automation tester": "Automation Tester",
    "test automation engineer": "Automation Tester",
    "sdet": "Automation Tester",
    "software development engineer in test": "Automation Tester",
    # Security
    "security engineer": "Security Engineer",
    "cybersecurity engineer": "Security Engineer",
    "information security engineer": "Security Engineer",
    "soc analyst": "Security Engineer",
    "penetration tester": "Security Engineer",
    "pentester": "Security Engineer",
    "devsecops engineer": "Security Engineer",
    # System / Network / DBA
    "system administrator": "System Administrator",
    "sysadmin": "System Administrator",
    "system engineer": "System Administrator",
    "network engineer": "Network Engineer",
    "database administrator": "Database Administrator",
    "dba": "Database Administrator",
    # Embedded / Game
    "embedded developer": "Embedded Developer",
    "embedded engineer": "Embedded Developer",
    "firmware engineer": "Embedded Developer",
    "iot developer": "Embedded Developer",
    "game developer": "Game Developer",
    "unity developer": "Game Developer",
    "unreal developer": "Game Developer",
    # BA / PM / Design
    "business analyst": "Business Analyst",
    "ba": "Business Analyst",
    "system analyst": "Business Analyst",
    "product owner": "Product Owner",
    "po": "Product Owner",
    "ui ux designer": "UI/UX Designer",
    "ux ui designer": "UI/UX Designer",
    "ui designer": "UI/UX Designer",
    "ux designer": "UI/UX Designer",
    "product designer": "UI/UX Designer",
    "product manager": "Product Manager",
    "pm": "Product Manager",
    "project manager": "Project Manager",
    "scrum master": "Scrum Master",
    # General software
    "software engineer": "Software Engineer",
    "software developer": "Software Engineer",
    "application developer": "Software Engineer",
    "app developer": "Software Engineer",
    "web developer": "Software Engineer",
    "it engineer": "IT Engineer",
    "technical consultant": "Technical Consultant",
    "solution architect": "Solution Architect",
    "solutions architect": "Solution Architect",
}

FALLBACK_SKILL_ALIASES = {
    # Programming languages
    "js": "JavaScript",
    "javascript": "JavaScript",
    "ts": "TypeScript",
    "typescript": "TypeScript",
    "java": "Java",
    "python": "Python",
    "php": "PHP",
    "golang": "Go",
    "go": "Go",
    "csharp": "C#",
    "c#": "C#",
    "dotnet": ".NET",
    ".net": ".NET",
    "c++": "C++",
    "cpp": "C++",
    "c": "C",
    "kotlin": "Kotlin",
    "swift": "Swift",
    "dart": "Dart",
    "flutter": "Flutter",
    "ruby": "Ruby",
    "scala": "Scala",
    "rust": "Rust",
    # Frontend
    "html": "HTML",
    "html5": "HTML",
    "css": "CSS",
    "css3": "CSS",
    "sass": "Sass",
    "scss": "Sass",
    "reactjs": "React",
    "react js": "React",
    "react": "React",
    "nextjs": "Next.js",
    "next js": "Next.js",
    "vuejs": "Vue.js",
    "vue js": "Vue.js",
    "vue": "Vue.js",
    "nuxtjs": "Nuxt.js",
    "angular": "Angular",
    "tailwind": "Tailwind CSS",
    "tailwindcss": "Tailwind CSS",
    "bootstrap": "Bootstrap",
    "react native": "React Native",
    # Backend
    "nodejs": "Node.js",
    "node js": "Node.js",
    "node": "Node.js",
    "express": "Express.js",
    "expressjs": "Express.js",
    "nestjs": "NestJS",
    "nest js": "NestJS",
    "spring": "Spring",
    "springboot": "Spring Boot",
    "spring boot": "Spring Boot",
    "django": "Django",
    "flask": "Flask",
    "fastapi": "FastAPI",
    "laravel": "Laravel",
    "symfony": "Symfony",
    "rails": "Ruby on Rails",
    "ruby on rails": "Ruby on Rails",
    "asp.net": "ASP.NET",
    "asp net": "ASP.NET",
    # API / Architecture
    "restful api": "REST API",
    "rest api": "REST API",
    "rest": "REST API",
    "graphql": "GraphQL",
    "grpc": "gRPC",
    "microservice": "Microservices",
    "microservices": "Microservices",
    "event driven": "Event-driven Architecture",
    "ddd": "Domain-driven Design",
    # Database
    "mysql": "MySQL",
    "postgres": "PostgreSQL",
    "postgresql": "PostgreSQL",
    "sql server": "SQL Server",
    "mssql": "SQL Server",
    "oracle": "Oracle Database",
    "mongodb": "MongoDB",
    "mongo": "MongoDB",
    "redis": "Redis",
    "elasticsearch": "Elasticsearch",
    "elastic search": "Elasticsearch",
    "opensearch": "OpenSearch",
    "cassandra": "Cassandra",
    "dynamodb": "DynamoDB",
    "sqlite": "SQLite",
    # DevOps / Cloud
    "docker": "Docker",
    "k8s": "Kubernetes",
    "kubernetes": "Kubernetes",
    "jenkins": "Jenkins",
    "gitlab ci": "GitLab CI/CD",
    "github actions": "GitHub Actions",
    "ci cd": "CI/CD",
    "cicd": "CI/CD",
    "terraform": "Terraform",
    "ansible": "Ansible",
    "nginx": "Nginx",
    "linux": "Linux",
    "aws": "AWS",
    "amazon web services": "AWS",
    "azure": "Azure",
    "gcp": "Google Cloud Platform",
    "google cloud": "Google Cloud Platform",
    # Data / AI
    "pandas": "Pandas",
    "numpy": "NumPy",
    "spark": "Apache Spark",
    "apache spark": "Apache Spark",
    "hadoop": "Hadoop",
    "airflow": "Apache Airflow",
    "kafka": "Apache Kafka",
    "power bi": "Power BI",
    "tableau": "Tableau",
    "tensorflow": "TensorFlow",
    "pytorch": "PyTorch",
    "sklearn": "Scikit-learn",
    "scikit learn": "Scikit-learn",
    "opencv": "OpenCV",
    "nlp": "NLP",
    "computer vision": "Computer Vision",
    "llm": "Large Language Model",
    "rag": "RAG",
    # Testing
    "selenium": "Selenium",
    "cypress": "Cypress",
    "playwright": "Playwright",
    "jest": "Jest",
    "junit": "JUnit",
    "pytest": "Pytest",
    "postman": "Postman",
    "manual testing": "Manual Testing",
    "automation testing": "Automation Testing",
    "unit test": "Unit Testing",
    "integration test": "Integration Testing",
    # Security
    "oauth": "OAuth",
    "oauth2": "OAuth2",
    "jwt": "JWT",
    "sso": "SSO",
    "owasp": "OWASP",
    "penetration testing": "Penetration Testing",
    "pentest": "Penetration Testing",
    # Tools / Others
    "git": "Git",
    "github": "GitHub",
    "gitlab": "GitLab",
    "jira": "Jira",
    "figma": "Figma",
    "agile": "Agile",
    "scrum": "Scrum",
}

INTERMEDIATE_TITLES = {
    "Software Engineer",
    "IT Engineer",
    "Technical Consultant",
}

TITLE_CONTEXT_SKILLS = {
    "Backend Developer": {
        "Java",
        "Spring",
        "Spring Boot",
        "Node.js",
        "Express.js",
        "NestJS",
        "Python",
        "Django",
        "Flask",
        "FastAPI",
        "PHP",
        "Laravel",
        "Go",
        "REST API",
        "GraphQL",
        "Microservices",
    },
    "Frontend Developer": {
        "JavaScript",
        "TypeScript",
        "React",
        "Next.js",
        "Vue.js",
        "Nuxt.js",
        "Angular",
        "HTML",
        "CSS",
        "Tailwind CSS",
    },
    "Mobile Developer": {
        "Flutter",
        "Dart",
        "React Native",
        "Kotlin",
        "Swift",
    },
    "DevOps Engineer": {
        "Docker",
        "Kubernetes",
        "Jenkins",
        "GitLab CI/CD",
        "GitHub Actions",
        "CI/CD",
        "Terraform",
        "Ansible",
        "Nginx",
        "Linux",
    },
    "Cloud Engineer": {"AWS", "Azure", "Google Cloud Platform", "Terraform"},
    "Data Engineer": {
        "Apache Spark",
        "Hadoop",
        "Apache Airflow",
        "Apache Kafka",
        "Python",
        "SQL Server",
        "PostgreSQL",
    },
    "AI Engineer": {
        "TensorFlow",
        "PyTorch",
        "Scikit-learn",
        "OpenCV",
        "NLP",
        "Computer Vision",
        "Large Language Model",
        "RAG",
    },
    "Automation Tester": {
        "Selenium",
        "Cypress",
        "Playwright",
        "Jest",
        "JUnit",
        "Pytest",
        "Automation Testing",
    },
}


def normalize_key(value: str) -> str:
    text = str(value or "").strip().lower()
    text = (
        text.replace("c++", " cpp ")
        .replace("c#", " csharp ")
        .replace(".net", " dotnet ")
    )
    text = unicodedata.normalize("NFKD", text)
    text = "".join(ch for ch in text if not unicodedata.combining(ch))
    text = re.sub(r"[^a-z0-9]+", " ", text)
    return " ".join(text.split())


def compact_text(*values: str, limit: int = 12000) -> str:
    text = " ".join(
        str(value or "").strip() for value in values if str(value or "").strip()
    )
    return " ".join(text.split())[:limit]


def extract_seniority(text: str) -> str:
    normalized = f" {normalize_key(text)} "
    for seniority, terms in SENIORITY_TERMS.items():
        if any(f" {normalize_key(term)} " in normalized for term in terms):
            return seniority
    return "unknown"


def extract_workplace_type(text: str, is_remote: bool = False) -> str:
    if is_remote:
        return "remote"
    normalized = f" {normalize_key(text)} "
    for workplace_type, terms in WORKPLACE_TERMS.items():
        if any(f" {normalize_key(term)} " in normalized for term in terms):
            return workplace_type
    return "onsite"


def extract_location_city(text: str) -> str:
    normalized = f" {normalize_key(text)} "
    for city, terms in LOCATION_TERMS.items():
        if any(f" {normalize_key(term)} " in normalized for term in terms):
            return city
    return ""


def extract_skills(*texts: str) -> list[str]:
    searchable = normalize_key(" ".join(str(text or "") for text in texts))
    aliases = _skill_alias_map()
    found = set()
    for alias, canonical in aliases.items():
        if alias and re.search(
            rf"(?<![a-z0-9]){re.escape(alias)}(?![a-z0-9])", searchable
        ):
            found.add(canonical)
    return sorted(found, key=str.lower)


def preprocess_job_title(
    title: str, description: str = "", is_remote: bool = False
) -> dict:
    title = str(title or "").strip()
    combined = compact_text(title, description, limit=4000)
    seniority = extract_seniority(title)
    if seniority == "unknown":
        seniority = extract_seniority(combined)
    workplace_type = extract_workplace_type(combined, is_remote=is_remote)
    location_city = extract_location_city(combined)
    title_skills = extract_skills(title, description)
    title_core = _strip_title_noise(
        title, seniority, workplace_type, location_city, title_skills
    )
    resolved = resolve_canonical_title(title_core or title, context_skills=title_skills)
    return {
        "title_raw": title,
        "title_core": title_core or title,
        "seniority": seniority,
        "workplace_type": workplace_type,
        "location_city": location_city,
        "skills": title_skills,
        **resolved,
    }


def resolve_canonical_title(
    title: str, context_skills: list[str] | None = None
) -> dict:
    normalized = normalize_key(title)
    if not normalized:
        return _title_result(None, 0.0, "empty")

    alias = (
        JobTitleAlias.objects.filter(normalized_alias=normalized)
        .select_related("canonical_title")
        .order_by("-weight", "canonical_title__name")
        .first()
    )
    if alias and alias.canonical_title.is_active:
        return _adjust_title_with_skill_context(
            _title_result(
                alias.canonical_title,
                min(0.99, 0.9 + alias.weight * 0.08),
                "exact_alias",
            ),
            context_skills,
        )

    direct_alias_title = _resolve_title_from_fallback(normalized)
    if direct_alias_title:
        return _adjust_title_with_skill_context(
            _title_result(direct_alias_title, 0.94, "fallback_alias"),
            context_skills,
        )

    title_obj = CanonicalTitle.objects.filter(
        name__iexact=title, is_active=True
    ).first()
    if not title_obj:
        title_obj = CanonicalTitle.objects.filter(
            name__iexact=normalized, is_active=True
        ).first()
    if title_obj:
        return _adjust_title_with_skill_context(
            _title_result(title_obj, 0.97, "exact_title"),
            context_skills,
        )

    best_title, best_score = _best_fuzzy_title(normalized)
    if best_title and best_score >= 0.9:
        return _adjust_title_with_skill_context(
            _title_result(best_title, best_score, "fuzzy_alias"),
            context_skills,
        )
    if best_title and best_score >= 0.72:
        return _adjust_title_with_skill_context(
            _title_result(best_title, best_score, "token_similarity"),
            context_skills,
        )
    return _title_result(None, best_score or 0.0, "unknown")


def _resolve_title_from_fallback(normalized: str):
    fallback_name = FALLBACK_TITLE_ALIASES.get(normalized)
    if not fallback_name:
        return None
    return CanonicalTitle.objects.filter(
        name__iexact=fallback_name, is_active=True
    ).first()


def _adjust_title_with_skill_context(
    result: dict, context_skills: list[str] | None
) -> dict:
    canonical_title = result.get("canonical_title")
    if not canonical_title or canonical_title.name not in INTERMEDIATE_TITLES:
        return result
    inferred_title = _infer_title_from_skill_context(context_skills or [])
    if not inferred_title:
        return result
    inferred = CanonicalTitle.objects.filter(
        name__iexact=inferred_title,
        is_active=True,
    ).first()
    if not inferred:
        return result
    return _title_result(
        inferred,
        max(0.82, result.get("title_confidence", 0.0)),
        "skill_context",
    )


def _infer_title_from_skill_context(skills: list[str]) -> str | None:
    skill_names = {
        str(skill or "").strip() for skill in skills if str(skill or "").strip()
    }
    if not skill_names:
        return None
    scores = {
        title: len(skill_names & context_skills)
        for title, context_skills in TITLE_CONTEXT_SKILLS.items()
    }
    best_title, best_score = max(scores.items(), key=lambda item: item[1])
    return best_title if best_score else None


@transaction.atomic
def process_job_recommendation_profile(job: Job) -> JobRecommendationProfile:
    description_clean = compact_text(job.description, job.requirements, job.benefits)
    title_data = preprocess_job_title(
        job.title,
        description=description_clean,
        is_remote=job.is_remote,
    )
    existing_skills = _job_skill_names(job)
    extracted_skills = extract_skills(job.title, job.description, job.requirements)
    required_skills = sorted(
        {*existing_skills["required"], *extracted_skills, *title_data["skills"]},
        key=str.lower,
    )
    preferred_skills = sorted(set(existing_skills["preferred"]), key=str.lower)
    location_city = title_data["location_city"] or _job_location_city(job)

    profile, _ = JobRecommendationProfile.objects.get_or_create(job=job)
    profile.title_raw = title_data["title_raw"]
    profile.title_core = title_data["title_core"]
    profile.canonical_title = title_data["canonical_title"]
    profile.title_confidence = title_data["title_confidence"]
    profile.title_normalization_method = title_data["title_normalization_method"]
    profile.description_clean = description_clean
    profile.skills_required = required_skills
    profile.skills_preferred = preferred_skills
    profile.seniority = (
        title_data["seniority"] if title_data["seniority"] != "unknown" else job.level
    )
    profile.workplace_type = title_data["workplace_type"]
    profile.location_city = location_city
    profile.status = JobRecommendationProfile.Status.PROCESSED
    profile.processed_at = timezone.now()
    profile.error = ""
    profile.save()
    _log_processing(
        "job",
        job.id,
        "normalization",
        job.title,
        _profile_payload(profile),
        profile.title_confidence,
    )
    return profile


@transaction.atomic
def process_candidate_recommendation_profile(
    recruiter,
) -> CandidateRecommendationProfile:
    current_title = recruiter.current_position or ""
    skills = _candidate_skill_names(recruiter)
    text = compact_text(current_title, recruiter.bio, " ".join(skills))
    title_data = preprocess_job_title(current_title, description=text)
    province = ""
    if recruiter.address_id and getattr(recruiter.address, "province", None):
        province = recruiter.address.province.province_name

    profile, _ = CandidateRecommendationProfile.objects.get_or_create(
        recruiter=recruiter
    )
    profile.current_title_raw = current_title
    profile.current_title_core = title_data["title_core"]
    profile.current_title_canonical = title_data["canonical_title"]
    profile.title_confidence = title_data["title_confidence"]
    profile.title_normalization_method = title_data["title_normalization_method"]
    profile.skills = skills
    profile.years_experience = recruiter.years_of_experience or 0
    profile.preferred_locations = [province] if province else []
    profile.preferred_workplace_type = (
        "remote" if "remote" in normalize_key(text) else ""
    )
    profile.status = CandidateRecommendationProfile.Status.PROCESSED
    profile.processed_at = timezone.now()
    profile.error = ""
    profile.save()
    _log_processing(
        "candidate",
        recruiter.id,
        "normalization",
        text,
        _candidate_profile_payload(profile),
        profile.title_confidence,
    )
    return profile


def _strip_title_noise(
    title: str,
    seniority: str,
    workplace_type: str,
    location_city: str,
    skills: list[str],
) -> str:
    original = str(title or "")
    normalized = original
    removals = []
    removals.extend(SENIORITY_TERMS.get(seniority, ()))
    removals.extend(WORKPLACE_TERMS.get(workplace_type, ()))
    if location_city:
        removals.extend(LOCATION_TERMS.get(location_city, (location_city,)))
    removals.extend(skills)
    for term in sorted(set(removals), key=len, reverse=True):
        if not term:
            continue
        normalized = re.sub(re.escape(term), " ", normalized, flags=re.IGNORECASE)
    normalized = re.sub(r"[\(\)\[\]\|,/]+", " ", normalized)
    normalized = re.sub(r"\s*[-–—]\s*", " ", normalized)
    normalized = " ".join(normalized.split())
    normalized = normalized.strip(" -|,/")
    if _title_still_contains_noise(normalized, removals):
        normalized = _strip_normalized_title_noise(original, removals)
    return normalized[:255]


def _title_still_contains_noise(title: str, removals: list[str]) -> bool:
    normalized_title = f" {normalize_key(title)} "
    return any(
        f" {normalize_key(term)} " in normalized_title
        for term in removals
        if normalize_key(term)
    )


def _strip_normalized_title_noise(title: str, removals: list[str]) -> str:
    normalized = f" {normalize_key(title)} "
    terms = sorted(
        {normalize_key(term) for term in removals if normalize_key(term)},
        key=len,
        reverse=True,
    )
    for term in terms:
        normalized = re.sub(
            rf"(?<![a-z0-9]){re.escape(term)}(?![a-z0-9])",
            " ",
            normalized,
        )
    return " ".join(normalized.split()).title()


def _title_result(canonical_title, confidence: float, method: str) -> dict:
    return {
        "canonical_title": canonical_title,
        "title_confidence": round(float(confidence or 0.0), 4),
        "title_normalization_method": method,
    }


def _skill_alias_map() -> dict[str, str]:
    aliases = {
        normalize_key(alias): canonical
        for alias, canonical in FALLBACK_SKILL_ALIASES.items()
        if normalize_key(alias)
    }
    for skill in Skill.objects.filter(is_active=True).only("name"):
        aliases[normalize_key(skill.name)] = skill.name
    for alias in SkillAlias.objects.select_related("skill").filter(
        skill__is_active=True
    ):
        aliases[normalize_key(alias.alias_name)] = alias.skill.name
        aliases[normalize_key(alias.normalized_alias)] = alias.skill.name
    return aliases


def _best_fuzzy_title(normalized: str):
    candidates = []
    for alias in JobTitleAlias.objects.select_related("canonical_title").filter(
        canonical_title__is_active=True
    ):
        candidates.append((alias.normalized_alias, alias.canonical_title))
    for title in CanonicalTitle.objects.filter(is_active=True):
        candidates.append((normalize_key(title.name), title))
    for alias, canonical_name in FALLBACK_TITLE_ALIASES.items():
        title = CanonicalTitle.objects.filter(
            name__iexact=canonical_name, is_active=True
        ).first()
        if title:
            candidates.append((normalize_key(alias), title))

    best_title = None
    best_score = 0.0
    normalized_tokens = set(normalized.split())
    for candidate, title in candidates:
        candidate_key = normalize_key(candidate)
        sequence_score = SequenceMatcher(None, normalized, candidate_key).ratio()
        candidate_tokens = set(candidate_key.split())
        token_score = 0.0
        if normalized_tokens and candidate_tokens:
            token_score = len(normalized_tokens & candidate_tokens) / len(
                normalized_tokens | candidate_tokens
            )
        score = max(sequence_score, token_score)
        if score > best_score:
            best_score = score
            best_title = title
    return best_title, round(best_score, 4)


def _job_skill_names(job: Job) -> dict[str, set[str]]:
    required = set()
    preferred = set()
    skills = job.required_skills.select_related("skill").all()
    for job_skill in skills:
        if not job_skill.skill_id or not job_skill.skill:
            continue
        target = required if job_skill.is_required else preferred
        target.add(job_skill.skill.name)
    return {"required": required, "preferred": preferred}


def _candidate_skill_names(recruiter) -> list[str]:
    return sorted(
        {
            item.skill.name
            for item in RecruiterSkill.objects.filter(
                recruiter=recruiter
            ).select_related("skill")
            if item.skill_id and item.skill
        },
        key=str.lower,
    )


def _job_location_city(job: Job) -> str:
    if job.address_id and getattr(job.address, "province", None):
        return job.address.province.province_name
    for location in job.locations.select_related("address__province").all()[:1]:
        if location.address_id and getattr(location.address, "province", None):
            return location.address.province.province_name
    return "Remote" if job.is_remote else ""


def _profile_payload(profile: JobRecommendationProfile) -> dict:
    return {
        "title_core": profile.title_core,
        "canonical_title": profile.canonical_title.name
        if profile.canonical_title
        else None,
        "skills_required": profile.skills_required,
        "seniority": profile.seniority,
        "workplace_type": profile.workplace_type,
        "location_city": profile.location_city,
        "method": profile.title_normalization_method,
    }


def _candidate_profile_payload(profile: CandidateRecommendationProfile) -> dict:
    return {
        "title_core": profile.current_title_core,
        "canonical_title": profile.current_title_canonical.name
        if profile.current_title_canonical
        else None,
        "skills": profile.skills,
        "years_experience": profile.years_experience,
        "preferred_locations": profile.preferred_locations,
        "method": profile.title_normalization_method,
    }


def _log_processing(entity_type, entity_id, step, input_text, output_json, confidence):
    try:
        RecommendationProcessingLog.objects.create(
            entity_type=entity_type,
            entity_id=entity_id,
            step=step,
            input_text=str(input_text or "")[:4000],
            output_json=output_json,
            confidence=confidence,
            status="processed",
        )
    except Exception:
        pass
