import os

os.environ["DEBUG"] = "1"
os.environ.setdefault("SECRET_KEY", "test-secret-key-for-test-settings-only")

from .settings import *  # noqa: F403

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": ":memory:",
    }
}
