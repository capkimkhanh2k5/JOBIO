"""
Settings cho chạy tests - chỉ bao gồm apps cần thiết
"""

import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent


def env_list(name: str, default: str = "") -> list[str]:
    return [
        item.strip() for item in os.getenv(name, default).split(",") if item.strip()
    ]


SECRET_KEY = "test-secret-key-for-testing-only"
DEBUG = True
ALLOWED_HOSTS = ["*"]

INSTALLED_APPS = [
    "daphne",
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    # Third party
    "rest_framework",
    "rest_framework_simplejwt",
    "rest_framework_simplejwt.token_blacklist",
    "drf_spectacular",
    "corsheaders",
    "channels",
    # Core
    "apps.core.users",
    "apps.moderation",
    # Blog Domain
    "apps.blog",
    # 'apps.blog.blog_posts',
    # 'apps.blog.blog_categories',
    # 'apps.blog.blog_tags',
    # 'apps.blog.blog_post_tags',
    # 'apps.blog.blog_comments',
    # Company Domain (cho company tests)
    "apps.company.companies.apps.CompaniesConfig",
    "apps.company.industries",
    "apps.company.benefit_categories",
    "apps.company.company_benefits",
    "apps.company.media_types",
    "apps.company.company_media",
    # Geography Domain (FK dependencies)
    "apps.geography.provinces",
    "apps.geography.communes",
    "apps.geography.addresses",
    # System Domain (FK dependencies cho Activity Logs)
    "apps.system.activity_logs",
    "apps.system.activity_log_types",
    "apps.system.system_settings",
    "apps.system.file_uploads",
    "apps.system.report_types",
    "apps.system.reports",
    # Candidate Domain (recruiters, education, experience, skills, certifications, languages, projects)
    "apps.candidate.recruiters",
    "apps.candidate.recruiter_education",
    "apps.candidate.recruiter_experience",
    "apps.candidate.recruiter_skills",
    "apps.candidate.recruiter_certifications",
    "apps.candidate.recruiter_languages",
    "apps.candidate.recruiter_projects",
    "apps.candidate.skill_categories",
    "apps.candidate.skills",
    "apps.candidate.languages",
    # Social Domain
    "apps.social.company_followers",
    # Recruitment Domain (jobs)
    "apps.recruitment.jobs",
    "apps.recruitment.job_categories",
    "apps.recruitment.applications",
    "apps.recruitment.application_status_history",
    "apps.billing",
    "apps.recruitment.job_skills",
    "apps.recruitment.job_locations",
    "apps.recruitment.saved_jobs",
    "apps.recruitment.job_views",
    "apps.recruitment.interviews",
    "apps.recruitment.interview_types",
    # Candidate Domain (CV Builder)
    "apps.candidate.cv_templates",
    "apps.candidate.cv_template_categories",
    "apps.candidate.recruiter_cvs",
    "apps.email",
    "apps.communication.notifications",
    "apps.communication.notification_types",
    "apps.communication.job_alerts",
]

MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "apps.core.security_headers.SecurityHeadersMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "config.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [BASE_DIR / "templates"],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "config.wsgi.application"
ASGI_APPLICATION = "config.asgi.application"

CHANNEL_LAYERS = {
    "default": {
        "BACKEND": "channels.layers.InMemoryChannelLayer",
    }
}

# Database - dùng SQLite cho local tests (không cần Docker)
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": os.getenv("E2E_SQLITE_NAME", ":memory:"),
    }
}

AUTH_PASSWORD_VALIDATORS = []

LANGUAGE_CODE = "en-us"
TIME_ZONE = "Asia/Ho_Chi_Minh"
USE_I18N = True
USE_TZ = True
STATIC_URL = "static/"
STATIC_ROOT = BASE_DIR / "staticfiles"

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

AUTH_USER_MODEL = "core_users.CustomUser"

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ),
    "DEFAULT_PERMISSION_CLASSES": [
        "rest_framework.permissions.IsAuthenticatedOrReadOnly",
    ],
    "DEFAULT_PAGINATION_CLASS": "apps.core.pagination.StandardResultsSetPagination",
    "PAGE_SIZE": 20,
    "DEFAULT_THROTTLE_CLASSES": [
        "rest_framework.throttling.AnonRateThrottle",
        "rest_framework.throttling.UserRateThrottle",
    ],
    "DEFAULT_THROTTLE_RATES": {
        "anon": "10000/hour",
        "user": "10000/hour",
        "login": "10000/hour",
        "token_refresh": "10000/hour",
        "register": "10000/hour",
        "password_reset": "10000/hour",
        "email_verification": "10000/hour",
        "social_auth": "10000/hour",
        "two_factor_verify": "10000/hour",
        "report_create": "10000/hour",
        "burst": "10000/hour",
        "sustained": "10000/hour",
        "payment": "10000/hour",
        "job_search": "10000/hour",
        "application_submit": "10000/hour",
        "notification_stream": "10000/hour",
        "ai_matching": "10000/hour",
        "file_upload": "10000/hour",
    },
    "DEFAULT_SCHEMA_CLASS": "drf_spectacular.openapi.AutoSchema",
}

from datetime import timedelta  # noqa: E402

SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=15),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=1),
    "ROTATE_REFRESH_TOKENS": True,
    "BLACKLIST_AFTER_ROTATION": True,
    "ALGORITHM": "HS256",
    "SIGNING_KEY": SECRET_KEY,
    "AUTH_HEADER_TYPES": ("Bearer",),
}
REMEMBER_ME_REFRESH_TOKEN_LIFETIME = timedelta(days=7)

SPECTACULAR_SETTINGS = {
    "TITLE": "JOBIO API",
    "DESCRIPTION": "OpenAPI schema for JOBIO recruitment platform.",
    "VERSION": "1.0.0",
    "SERVE_PERMISSIONS": ["rest_framework.permissions.AllowAny"],
}

FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:4000")
CORS_ALLOWED_ORIGINS = env_list(
    "CORS_ALLOWED_ORIGINS",
    "http://localhost:4000,http://127.0.0.1:4000,http://localhost:5173,http://127.0.0.1:5173",
)
CSRF_TRUSTED_ORIGINS = env_list(
    "CSRF_TRUSTED_ORIGINS",
    "http://localhost:4000,http://127.0.0.1:4000,http://localhost:5173,http://127.0.0.1:5173",
)
CORS_ALLOW_ALL_ORIGINS = False
CORS_ALLOW_CREDENTIALS = True
SESSION_COOKIE_HTTPONLY = True
X_FRAME_OPTIONS = "DENY"
CONTENT_SECURITY_POLICY = (
    "default-src 'self'; object-src 'none'; frame-ancestors 'self'"
)
NOTIFICATION_STREAM_MAX_CONNECTIONS_PER_USER = 2
NOTIFICATION_STREAM_POLL_SECONDS = 1
NOTIFICATION_STREAM_MAX_DURATION_SECONDS = 60

OPENAI_API_KEY = ""
MODERATION_ENABLED = True
MODERATION_PROVIDER = "rule"
MODERATION_TEXT_MODEL = "omni-moderation-latest"
MODERATION_IMAGE_MODEL = "omni-moderation-latest"
JOB_DOMAIN_MIN_CONFIDENCE = 0.85
RECOMMENDATION_SEMANTIC_ENABLED = True
RECOMMENDATION_EMBEDDING_PROVIDER = "fake"
RECOMMENDATION_EMBEDDING_MODEL = "fake-embedding"
RECOMMENDATION_EMBEDDING_DIMENSIONS = 1024
RECOMMENDATION_SYNC_EMBEDDINGS = False
RECOMMENDATION_VECTOR_STORE = "pgvector"
RECOMMENDATION_VECTOR_VERSION = "test_v2"
RECOMMENDATION_REQUIRE_SAFETENSORS = True

# Tắt password hashers nặng để test nhanh hơn
PASSWORD_HASHERS = [
    "django.contrib.auth.hashers.MD5PasswordHasher",
]

# ===== VN Pay Configuration (TestDummy) =====
VNP_TMN_CODE = "EMBIL7EU"
VNP_HASH_SECRET = "FP2480JF752TUW5PZWV8MSHCE4FAWB2V"
VNP_URL = "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html"
VNP_QUERY_URL = "https://sandbox.vnpayment.vn/merchant_webapi/api/transaction"
VNP_RETURN_URL = (
    "http://localhost:8000/api/billing/company-subscriptions/payment-return/"
)
VNP_FRONTEND_RETURN_URL = "http://localhost:4000/company/payment-result"

PAYMENT_PENDING_TIMEOUT_MINUTES = 5
PAYMENT_PENDING_CLEANUP_INTERVAL_SECONDS = 60
