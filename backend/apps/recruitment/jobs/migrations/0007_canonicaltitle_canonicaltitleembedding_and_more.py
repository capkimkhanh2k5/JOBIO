import django.db.models.deletion
from django.db import migrations, models
import re
import unicodedata


CANONICAL_TITLES = [
    (
        "Backend Developer",
        "Develops server-side applications, APIs, databases, authentication, microservices, and business logic.",
        "Software Engineering",
    ),
    (
        "Frontend Developer",
        "Builds client-side web applications, user interfaces, and browser experiences.",
        "Software Engineering",
    ),
    (
        "Fullstack Developer",
        "Works across frontend and backend application layers.",
        "Software Engineering",
    ),
    (
        "Mobile Developer",
        "Builds iOS, Android, React Native, Flutter, or mobile application experiences.",
        "Software Engineering",
    ),
    (
        "DevOps Engineer",
        "Builds CI/CD, infrastructure automation, reliability, monitoring, and deployment systems.",
        "Infrastructure",
    ),
    (
        "Cloud Engineer",
        "Designs and operates cloud infrastructure, networking, compute, storage, and managed services.",
        "Infrastructure",
    ),
    (
        "Data Engineer",
        "Builds data pipelines, warehouses, ETL/ELT workflows, and analytical data platforms.",
        "Data",
    ),
    (
        "Data Analyst",
        "Analyzes business or product data, builds reports, dashboards, and insights.",
        "Data",
    ),
    (
        "Data Scientist",
        "Builds statistical, predictive, and analytical models from data.",
        "Data",
    ),
    (
        "Data Architect",
        "Designs enterprise data models, data platforms, governance, and analytical architecture.",
        "Data",
    ),
    (
        "Machine Learning Engineer",
        "Builds, deploys, and maintains machine learning models and ML systems.",
        "AI/ML",
    ),
    (
        "AI Engineer",
        "Builds AI-powered applications, NLP, computer vision, LLM, and applied machine learning systems.",
        "AI/ML",
    ),
    (
        "MLOps Engineer",
        "Operates ML platforms, model deployment, feature stores, experiment tracking, and ML reliability.",
        "AI/ML",
    ),
    (
        "QA Engineer",
        "Tests software quality through manual, exploratory, and structured test practices.",
        "Quality",
    ),
    (
        "Automation Tester",
        "Builds automated test suites, test frameworks, and quality pipelines.",
        "Quality",
    ),
    (
        "Business Analyst",
        "Analyzes requirements, processes, stakeholders, and product/business needs.",
        "Product",
    ),
    (
        "UI/UX Designer",
        "Designs user flows, interfaces, interaction patterns, and product experiences.",
        "Design",
    ),
    (
        "Product Manager",
        "Defines product strategy, priorities, roadmaps, and delivery outcomes.",
        "Product",
    ),
    (
        "Product Owner",
        "Owns product backlog, requirements, acceptance criteria, and delivery priorities.",
        "Product",
    ),
    (
        "Project Manager",
        "Plans, coordinates, and tracks technology delivery across teams and stakeholders.",
        "Product",
    ),
    (
        "Scrum Master",
        "Facilitates agile ceremonies, removes delivery blockers, and improves team processes.",
        "Product",
    ),
    (
        "Security Engineer",
        "Secures applications, infrastructure, systems, and development workflows.",
        "Security",
    ),
    (
        "System Administrator",
        "Operates servers, operating systems, accounts, networks, and IT systems.",
        "Infrastructure",
    ),
    (
        "Network Engineer",
        "Designs, configures, and operates network infrastructure, routing, switching, and connectivity.",
        "Infrastructure",
    ),
    (
        "IT Support",
        "Supports users, endpoints, service desks, software, hardware, and operational IT issues.",
        "Infrastructure",
    ),
    (
        "Database Administrator",
        "Operates relational databases, backups, performance, reliability, and access.",
        "Data",
    ),
    (
        "Embedded Developer",
        "Builds firmware, embedded software, IoT, and low-level device integrations.",
        "Software Engineering",
    ),
    (
        "Game Developer",
        "Builds gameplay systems, engines, tools, and interactive entertainment experiences.",
        "Software Engineering",
    ),
    (
        "Software Engineer",
        "General software engineering role requiring skill context to classify backend, frontend, mobile, or another specialization.",
        "Software Engineering",
    ),
    (
        "IT Engineer",
        "General IT engineering role requiring context to classify system, network, cloud, support, or software specialization.",
        "Infrastructure",
    ),
    (
        "Technical Consultant",
        "Advises customers or teams on technical solutions, implementation, integration, and architecture.",
        "Consulting",
    ),
    (
        "Solution Architect",
        "Designs end-to-end technical solutions, integrations, infrastructure, and system architecture.",
        "Architecture",
    ),
    (
        "Technical Lead",
        "Leads technical direction, architecture decisions, engineering execution, and code quality.",
        "Engineering Leadership",
    ),
]


TITLE_ALIASES = {
    "Backend Developer": [
        "BE Developer",
        "Backend Engineer",
        "Back-end Developer",
        "Back End Developer",
        "Back End Engineer",
        "Java Backend Developer",
        "NodeJS Backend Developer",
        "Python Backend Developer",
        "PHP Backend Developer",
        "Golang Backend Developer",
        "Software Engineer Backend",
        "Server-side Developer",
        "Server-side Engineer",
        "API Developer",
    ],
    "Frontend Developer": [
        "FE Developer",
        "Frontend Engineer",
        "Front-end Engineer",
        "Front End Developer",
        "Front End Engineer",
        "React Developer",
        "Vue Developer",
        "Angular Developer",
        "JavaScript Developer",
        "Web Frontend Developer",
        "Web UI Developer",
    ],
    "Fullstack Developer": [
        "Full Stack Developer",
        "Fullstack Engineer",
        "Full-stack Engineer",
        "MERN Stack Developer",
        "MEAN Stack Developer",
    ],
    "Mobile Developer": [
        "Mobile Engineer",
        "Android Developer",
        "iOS Developer",
        "React Native Developer",
        "Flutter Developer",
        "Kotlin Developer",
        "Swift Developer",
    ],
    "DevOps Engineer": [
        "DevOps Developer",
        "SRE",
        "Site Reliability Engineer",
        "Platform Engineer",
        "Infrastructure Engineer",
    ],
    "Cloud Engineer": [
        "AWS Engineer",
        "Azure Engineer",
        "GCP Engineer",
        "Cloud DevOps Engineer",
    ],
    "Data Engineer": ["ETL Developer", "Big Data Engineer"],
    "Data Analyst": ["BI Analyst", "Business Intelligence Analyst"],
    "Data Architect": ["Enterprise Data Architect"],
    "Machine Learning Engineer": ["ML Engineer"],
    "AI Engineer": ["Computer Vision Engineer", "NLP Engineer"],
    "MLOps Engineer": ["ML Ops Engineer", "Machine Learning Operations Engineer"],
    "QA Engineer": [
        "Tester",
        "Manual Tester",
        "Software Tester",
        "Quality Assurance Engineer",
    ],
    "Automation Tester": [
        "QA Automation Engineer",
        "Automation QA",
        "Test Automation Engineer",
        "SDET",
        "Software Development Engineer in Test",
    ],
    "Business Analyst": ["BA", "System Analyst"],
    "UI/UX Designer": ["UX Designer", "UI Designer", "Product Designer"],
    "Product Manager": ["PM"],
    "Product Owner": ["PO"],
    "Project Manager": ["IT Project Manager"],
    "Scrum Master": ["Agile Scrum Master"],
    "Security Engineer": [
        "Cybersecurity Engineer",
        "Information Security Engineer",
        "SOC Analyst",
        "Penetration Tester",
        "Pentester",
        "DevSecOps Engineer",
        "Application Security Engineer",
    ],
    "System Administrator": ["SysAdmin", "Linux Administrator", "System Engineer"],
    "Network Engineer": ["Network Administrator"],
    "Database Administrator": ["DBA", "PostgreSQL DBA"],
    "Embedded Developer": ["Embedded Engineer", "Firmware Engineer", "IoT Developer"],
    "Game Developer": ["Unity Developer", "Unreal Developer"],
    "Software Engineer": [
        "Software Developer",
        "Application Developer",
        "App Developer",
        "Web Developer",
    ],
    "Technical Consultant": ["Technical Consulting Engineer"],
    "Solution Architect": ["Solutions Architect"],
    "Technical Lead": ["Tech Lead", "Team Lead"],
    "IT Support": ["Helpdesk", "Service Desk", "IT Helpdesk"],
    "IT Engineer": ["Information Technology Engineer"],
}


SKILL_ALIASES = {
    "JavaScript": ["JS", "Javascript"],
    "TypeScript": ["TS"],
    "Java": [],
    "Python": [],
    "PHP": [],
    "Go": ["Golang"],
    "C#": ["CSharp"],
    ".NET": ["DotNet"],
    "C++": ["CPP"],
    "C": [],
    "Kotlin": [],
    "Swift": [],
    "Dart": [],
    "Ruby": [],
    "Scala": [],
    "Rust": [],
    "HTML": ["HTML5"],
    "CSS": ["CSS3"],
    "Sass": ["SCSS"],
    "React": ["ReactJS", "React.js"],
    "React Native": [],
    "Next.js": ["NextJS", "Next JS"],
    "Vue.js": ["VueJS", "Vue JS", "Vue"],
    "Nuxt.js": ["NuxtJS"],
    "Angular": [],
    "Tailwind CSS": ["Tailwind", "TailwindCSS"],
    "Bootstrap": [],
    "Node.js": ["NodeJS", "Node"],
    "Express.js": ["Express", "ExpressJS"],
    "NestJS": ["Nest JS"],
    "Spring": [],
    "Spring Boot": ["SpringBoot"],
    "Django": [],
    "Flask": [],
    "FastAPI": [],
    "Laravel": [],
    "Symfony": [],
    "Ruby on Rails": ["Rails"],
    "ASP.NET": ["ASP Net"],
    "GraphQL": [],
    "gRPC": [],
    "Microservices": ["Microservice"],
    "Event-driven Architecture": ["Event Driven"],
    "Domain-driven Design": ["DDD"],
    "MySQL": [],
    "PostgreSQL": ["Postgres"],
    "SQL Server": ["MSSQL"],
    "Oracle Database": ["Oracle"],
    "MongoDB": ["Mongo"],
    "Redis": [],
    "Elasticsearch": ["Elastic Search"],
    "OpenSearch": [],
    "Cassandra": [],
    "DynamoDB": [],
    "SQLite": [],
    "Docker": [],
    "Kubernetes": ["K8s"],
    "Jenkins": [],
    "GitLab CI/CD": ["GitLab CI"],
    "GitHub Actions": [],
    "CI/CD": ["CICD", "CI CD"],
    "Terraform": [],
    "Ansible": [],
    "Nginx": [],
    "Linux": [],
    "AWS": ["Amazon Web Services"],
    "Azure": [],
    "Google Cloud Platform": ["GCP", "Google Cloud"],
    "Pandas": [],
    "NumPy": [],
    "Apache Spark": ["Spark"],
    "Hadoop": [],
    "Apache Airflow": ["Airflow"],
    "Apache Kafka": ["Kafka"],
    "Power BI": [],
    "Tableau": [],
    "TensorFlow": [],
    "PyTorch": [],
    "Scikit-learn": ["Sklearn", "Scikit Learn"],
    "OpenCV": [],
    "NLP": [],
    "Computer Vision": [],
    "Large Language Model": ["LLM"],
    "RAG": [],
    "Selenium": [],
    "Cypress": [],
    "Playwright": [],
    "Jest": [],
    "JUnit": [],
    "Pytest": [],
    "Postman": [],
    "Manual Testing": [],
    "Automation Testing": [],
    "Unit Testing": ["Unit Test"],
    "Integration Testing": ["Integration Test"],
    "OAuth": [],
    "OAuth2": [],
    "JWT": [],
    "SSO": [],
    "OWASP": [],
    "Penetration Testing": ["Pentest"],
    "Git": [],
    "GitHub": [],
    "GitLab": [],
    "Jira": [],
    "Figma": [],
    "Agile": [],
    "Scrum": [],
    "REST API": ["RESTful API", "REST"],
}


def normalize_key(value):
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


def seed_recommendation_taxonomy(apps, schema_editor):
    CanonicalTitle = apps.get_model("recruitment_jobs", "CanonicalTitle")
    JobTitleAlias = apps.get_model("recruitment_jobs", "JobTitleAlias")
    Skill = apps.get_model("candidate_skills", "Skill")
    SkillAlias = apps.get_model("recruitment_jobs", "SkillAlias")

    titles_by_name = {}
    for name, description, category in CANONICAL_TITLES:
        title, _ = CanonicalTitle.objects.get_or_create(
            name=name,
            defaults={
                "description": description,
                "category": category,
                "is_active": True,
            },
        )
        titles_by_name[name] = title

    for title_name, aliases in TITLE_ALIASES.items():
        title = titles_by_name.get(title_name)
        if not title:
            continue
        for alias in aliases + [title_name]:
            JobTitleAlias.objects.get_or_create(
                normalized_alias=normalize_key(alias),
                canonical_title=title,
                defaults={"alias_name": alias, "language": "en", "weight": 1.0},
            )

    for skill_name, aliases in SKILL_ALIASES.items():
        skill = Skill.objects.filter(name__iexact=skill_name).first()
        if not skill:
            continue
        for alias in aliases + [skill_name]:
            SkillAlias.objects.get_or_create(
                normalized_alias=normalize_key(alias),
                skill=skill,
                defaults={"alias_name": alias},
            )


class Migration(migrations.Migration):
    dependencies = [
        ("candidate_recruiters", "0004_remove_job_search_status_and_is_profile_public"),
        ("candidate_skills", "0003_skill_domain_publishable"),
        ("recruitment_jobs", "0006_job_policy_status"),
    ]

    operations = [
        migrations.CreateModel(
            name="CanonicalTitle",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("name", models.CharField(max_length=120, unique=True)),
                ("description", models.TextField(blank=True, default="")),
                ("category", models.CharField(blank=True, default="", max_length=80)),
                ("is_active", models.BooleanField(db_index=True, default=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
            ],
            options={
                "db_table": "canonical_titles",
                "ordering": ["name"],
            },
        ),
        migrations.CreateModel(
            name="RecommendationProcessingLog",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                (
                    "entity_type",
                    models.CharField(
                        choices=[("job", "Job"), ("candidate", "Candidate")],
                        max_length=20,
                    ),
                ),
                ("entity_id", models.PositiveIntegerField(db_index=True)),
                ("step", models.CharField(max_length=80)),
                ("input_text", models.TextField(blank=True, default="")),
                ("output_json", models.JSONField(blank=True, default=dict)),
                ("confidence", models.FloatField(blank=True, null=True)),
                (
                    "status",
                    models.CharField(db_index=True, default="processed", max_length=20),
                ),
                ("error_message", models.TextField(blank=True, default="")),
                ("created_at", models.DateTimeField(auto_now_add=True, db_index=True)),
            ],
            options={
                "db_table": "recommendation_processing_logs",
                "indexes": [
                    models.Index(
                        fields=["entity_type", "entity_id", "created_at"],
                        name="idx_rec_log_entity_created",
                    )
                ],
            },
        ),
        migrations.CreateModel(
            name="CandidateRecommendationProfile",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                (
                    "current_title_raw",
                    models.CharField(blank=True, default="", max_length=255),
                ),
                (
                    "current_title_core",
                    models.CharField(blank=True, default="", max_length=255),
                ),
                ("title_confidence", models.FloatField(default=0.0)),
                (
                    "title_normalization_method",
                    models.CharField(blank=True, default="", max_length=40),
                ),
                ("skills", models.JSONField(blank=True, default=list)),
                ("years_experience", models.IntegerField(default=0)),
                ("preferred_locations", models.JSONField(blank=True, default=list)),
                (
                    "preferred_workplace_type",
                    models.CharField(blank=True, default="", max_length=30),
                ),
                (
                    "status",
                    models.CharField(
                        choices=[
                            ("pending", "Pending"),
                            ("processed", "Processed"),
                            ("failed", "Failed"),
                        ],
                        db_index=True,
                        default="pending",
                        max_length=20,
                    ),
                ),
                ("processed_at", models.DateTimeField(blank=True, null=True)),
                ("error", models.TextField(blank=True, default="")),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "recruiter",
                    models.OneToOneField(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="recommendation_profile",
                        to="candidate_recruiters.recruiter",
                    ),
                ),
                (
                    "current_title_canonical",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="candidate_profiles",
                        to="recruitment_jobs.canonicaltitle",
                    ),
                ),
            ],
            options={
                "db_table": "candidate_recommendation_profiles",
                "indexes": [
                    models.Index(fields=["status"], name="idx_cand_rec_prof_status"),
                    models.Index(
                        fields=["current_title_canonical"],
                        name="idx_cand_rec_prof_title",
                    ),
                ],
            },
        ),
        migrations.CreateModel(
            name="JobRecommendationProfile",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("title_raw", models.CharField(blank=True, default="", max_length=255)),
                (
                    "title_core",
                    models.CharField(blank=True, default="", max_length=255),
                ),
                ("title_confidence", models.FloatField(default=0.0)),
                (
                    "title_normalization_method",
                    models.CharField(blank=True, default="", max_length=40),
                ),
                ("description_clean", models.TextField(blank=True, default="")),
                ("skills_required", models.JSONField(blank=True, default=list)),
                ("skills_preferred", models.JSONField(blank=True, default=list)),
                (
                    "seniority",
                    models.CharField(blank=True, default="unknown", max_length=30),
                ),
                (
                    "workplace_type",
                    models.CharField(blank=True, default="unknown", max_length=30),
                ),
                (
                    "location_city",
                    models.CharField(blank=True, default="", max_length=120),
                ),
                (
                    "status",
                    models.CharField(
                        choices=[
                            ("pending", "Pending"),
                            ("processed", "Processed"),
                            ("failed", "Failed"),
                        ],
                        db_index=True,
                        default="pending",
                        max_length=20,
                    ),
                ),
                ("processed_at", models.DateTimeField(blank=True, null=True)),
                ("error", models.TextField(blank=True, default="")),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "canonical_title",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="job_profiles",
                        to="recruitment_jobs.canonicaltitle",
                    ),
                ),
                (
                    "job",
                    models.OneToOneField(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="recommendation_profile",
                        to="recruitment_jobs.job",
                    ),
                ),
            ],
            options={
                "db_table": "job_recommendation_profiles",
                "indexes": [
                    models.Index(fields=["status"], name="idx_job_rec_profile_status"),
                    models.Index(
                        fields=["canonical_title"], name="idx_job_rec_profile_title"
                    ),
                ],
            },
        ),
        migrations.CreateModel(
            name="JobTitleAlias",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("alias_name", models.CharField(max_length=160)),
                ("normalized_alias", models.CharField(db_index=True, max_length=160)),
                ("language", models.CharField(default="en", max_length=20)),
                ("weight", models.FloatField(default=1.0)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "canonical_title",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="aliases",
                        to="recruitment_jobs.canonicaltitle",
                    ),
                ),
            ],
            options={
                "db_table": "job_title_aliases",
                "indexes": [
                    models.Index(
                        fields=["normalized_alias"], name="idx_title_alias_norm"
                    )
                ],
                "constraints": [
                    models.UniqueConstraint(
                        fields=("normalized_alias", "canonical_title"),
                        name="uq_title_alias_canonical",
                    )
                ],
            },
        ),
        migrations.CreateModel(
            name="SkillAlias",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("alias_name", models.CharField(max_length=120)),
                ("normalized_alias", models.CharField(db_index=True, max_length=120)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "skill",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="recommendation_aliases",
                        to="candidate_skills.skill",
                    ),
                ),
            ],
            options={
                "db_table": "skill_aliases",
                "indexes": [
                    models.Index(
                        fields=["normalized_alias"], name="idx_skill_alias_norm"
                    )
                ],
                "constraints": [
                    models.UniqueConstraint(
                        fields=("normalized_alias", "skill"),
                        name="uq_skill_alias_skill",
                    )
                ],
            },
        ),
        migrations.RunPython(
            seed_recommendation_taxonomy,
            reverse_code=migrations.RunPython.noop,
        ),
    ]
