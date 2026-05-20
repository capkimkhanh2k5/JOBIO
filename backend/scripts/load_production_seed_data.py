import inspect
import json
import os
import sys
from pathlib import Path

import django
from django.apps import apps
from django.core.management.color import no_style
from django.db import connection, models, transaction
from django.db.models.signals import post_save, pre_save


sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from django.contrib.auth.hashers import identify_hasher, make_password  # noqa: E402
from django.contrib.auth.models import Permission  # noqa: E402
from django.contrib.contenttypes.models import ContentType  # noqa: E402


TABLES_ORDER = [
    "django_content_type",
    "provinces",
    "communes",
    "addresses",
    "industries",
    "auth_group",
    "auth_permission",
    "report_types",
    "media_types",
    "languages",
    "payment_methods",
    "benefit_categories",
    "activity_log_types",
    "notification_types",
    "cv_template_categories",
    "skill_categories",
    "interview_types",
    "subscription_plans",
    "skills",
    "users",
    "cv_templates",
    "companies",
    "users_groups",
    "users_user_permissions",
    "auth_group_permissions",
    "recruiters",
    "job_categories",
    "jobs",
    "job_locations",
    "recruiter_education",
    "recruiter_experience",
    "recruiter_skills",
    "recruiter_languages",
    "recruiter_projects",
    "recruiter_certifications",
    "recruiter_cvs",
    "file_uploads",
    "applications",
    "company_benefits",
    "company_media",
    "company_followers",
    "company_subscriptions",
    "transactions",
    "saved_jobs",
    "job_alerts",
    "reports",
    "application_status_history",
    "interviews",
    "job_alerts_skills",
    "job_alert_skills",
    "job_alerts_locations",
    "job_alert_matches",
    "job_skills",
    "notifications",
    "activity_logs",
    "blog_category",
    "blog_tag",
    "blog_post",
    "job_views",
    "system_settings",
    "user_passkeys",
    "token_blacklist_outstandingtoken",
    "token_blacklist_blacklistedtoken",
]

REQUIRED_NON_EMPTY_TABLES = [
    "users",
    "companies",
    "jobs",
    "applications",
]

CONTENT_TYPE_ID_MAP = {}
PERMISSION_ID_MAP = {}

CP1252_REVERSE = {
    bytes([code]).decode("cp1252"): code
    for code in range(128, 256)
    if code not in {129, 141, 143, 144, 157}
}


def resolve_data_dir():
    if len(sys.argv) > 1:
        return Path(sys.argv[1])

    root_dir = Path(__file__).resolve().parents[2]
    return root_dir / "DataSet" / "Data_Final"


def disconnect_side_effect_signals():
    signal_receivers = [
        (
            "apps.billing.signals",
            "billing.Transaction",
            "store_old_transaction_status",
            pre_save,
        ),
        (
            "apps.billing.signals",
            "billing.Transaction",
            "notify_admin_on_completed_transaction",
            post_save,
        ),
        (
            "apps.company.companies.signals",
            "company_companies.Company",
            "store_old_company_status",
            pre_save,
        ),
        (
            "apps.company.companies.signals",
            "company_companies.Company",
            "notify_admin_on_new_company",
            post_save,
        ),
        (
            "apps.recruitment.applications.signals",
            "recruitment_applications.Application",
            "store_old_status",
            pre_save,
        ),
        (
            "apps.recruitment.applications.signals",
            "recruitment_applications.Application",
            "notify_on_application_event",
            post_save,
        ),
        (
            "apps.recruitment.interviews.signals",
            "recruitment_interviews.Interview",
            "notify_candidate_on_interview_scheduled",
            post_save,
        ),
        (
            "apps.system.reports.signals",
            "system_reports.Report",
            "notify_admin_on_new_report",
            post_save,
        ),
        (
            "apps.communication.job_alerts.signals",
            "recruitment_jobs.Job",
            "trigger_job_matching",
            post_save,
        ),
    ]

    for module_path, model_name, receiver_name, signal in signal_receivers:
        try:
            module = __import__(module_path, fromlist=[receiver_name])
            receiver = getattr(module, receiver_name)
            app_label, model_class_name = model_name.split(".", 1)
            sender = apps.get_model(app_label, model_class_name)
            signal.disconnect(receiver, sender=sender)
        except Exception:
            continue


def repair_mojibake(value):
    if not isinstance(value, str):
        return value

    if value == "employer":
        return "company"

    if all(ord(char) <= 127 for char in value):
        return value

    try:
        raw_bytes = bytearray()
        changed = False
        for char in value:
            codepoint = ord(char)
            if codepoint <= 127:
                raw_bytes.append(codepoint)
                continue

            changed = True

            if codepoint <= 255:
                raw_bytes.append(codepoint)
                continue

            mapped = CP1252_REVERSE.get(char)
            if mapped is None:
                return value
            raw_bytes.append(mapped)

        if not changed:
            return value

        repaired = raw_bytes.decode("utf-8")
    except (UnicodeEncodeError, UnicodeDecodeError, ValueError):
        return value

    return repaired or value


def load_json(path):
    with path.open("r", encoding="utf-8-sig") as handle:
        return json.load(handle)


def build_models_by_table():
    models_by_table = {}
    for model_obj in apps.get_models(include_auto_created=True):
        if not (
            inspect.isclass(model_obj)
            and issubclass(model_obj, models.Model)
            and model_obj is not models.Model
            and model_obj._meta.managed
            and not model_obj._meta.proxy
        ):
            continue

        table_name = getattr(model_obj._meta, "db_table", "").lower()
        if table_name:
            models_by_table[table_name] = model_obj

    return models_by_table


def ordered_seed_files(data_dir):
    json_files = {path.stem: path for path in data_dir.glob("*.json")}
    ordered_tables = [table for table in TABLES_ORDER if table in json_files]
    ordered_tables.extend(sorted(set(json_files) - set(ordered_tables)))
    return [(table, json_files[table]) for table in ordered_tables]


def normalize_row(row):
    return {key: repair_mojibake(value) for key, value in dict(row).items()}


def load_content_types(path):
    for row in load_json(path):
        row_data = normalize_row(row)
        seed_id = row_data.get("id")
        app_label = row_data["app_label"]
        model = row_data["model"]
        content_type, _ = ContentType.objects.update_or_create(
            app_label=app_label,
            model=model,
            defaults={},
        )
        if seed_id is not None:
            CONTENT_TYPE_ID_MAP[seed_id] = content_type.id


def load_permissions(path):
    for row in load_json(path):
        row_data = normalize_row(row)
        seed_id = row_data.pop("id", None)
        content_type_id = row_data.get("content_type_id")
        if content_type_id in CONTENT_TYPE_ID_MAP:
            row_data["content_type_id"] = CONTENT_TYPE_ID_MAP[content_type_id]

        permission, _ = Permission.objects.update_or_create(
            content_type_id=row_data["content_type_id"],
            codename=row_data["codename"],
            defaults={"name": row_data["name"]},
        )
        if seed_id is not None:
            PERMISSION_ID_MAP[seed_id] = permission.id


def remap_known_foreign_keys(table_name, row_data):
    if table_name in {"auth_group_permissions", "users_user_permissions"}:
        permission_id = row_data.get("permission_id")
        if permission_id in PERMISSION_ID_MAP:
            row_data["permission_id"] = PERMISSION_ID_MAP[permission_id]


def load_model_table(table_name, model_obj, path):
    data = load_json(path)
    binary_fields = [
        field.name
        for field in model_obj._meta.fields
        if isinstance(field, models.BinaryField)
    ]

    for row in data:
        for field_name in binary_fields:
            if field_name in row and isinstance(row[field_name], str):
                row[field_name] = row[field_name].encode("utf-8")

        row_data = normalize_row(row)
        remap_known_foreign_keys(table_name, row_data)
        record_id = row_data.pop("id", None)

        if table_name == "users":
            plain_password = row_data.pop("plain_password", None)
            if plain_password:
                row_data["password"] = make_password(plain_password)
            elif "password" in row_data and row_data["password"]:
                try:
                    identify_hasher(row_data["password"])
                except Exception:
                    row_data["password"] = make_password(row_data["password"])

        if record_id is not None:
            model_obj.objects.update_or_create(id=record_id, defaults=row_data)
        else:
            model_obj.objects.create(**row_data)


def reset_sequences():
    models_to_reset = [
        model_obj
        for model_obj in apps.get_models(include_auto_created=True)
        if model_obj._meta.managed and not model_obj._meta.proxy
    ]

    with connection.cursor() as cursor:
        statements = connection.ops.sequence_reset_sql(no_style(), models_to_reset)
        for statement in statements:
            cursor.execute(statement)


def assert_required_data(models_by_table):
    for table_name in REQUIRED_NON_EMPTY_TABLES:
        model_obj = models_by_table.get(table_name)
        if model_obj is None:
            raise RuntimeError(f"Missing Django model for required table: {table_name}")
        if model_obj.objects.count() == 0:
            raise RuntimeError(f"Required table was not seeded: {table_name}")


def load_seed_data(data_dir):
    models_by_table = build_models_by_table()

    if not data_dir.is_dir():
        raise RuntimeError(f"Seed data directory does not exist: {data_dir}")

    seed_files = ordered_seed_files(data_dir)
    if not seed_files:
        raise RuntimeError(f"No JSON seed files found in: {data_dir}")

    disconnect_side_effect_signals()

    with transaction.atomic():
        with connection.cursor() as cursor:
            cursor.execute("SET CONSTRAINTS ALL DEFERRED")

        for table_name, path in seed_files:
            if table_name == "django_content_type":
                load_content_types(path)
                continue

            if table_name == "auth_permission":
                load_permissions(path)
                continue

            model_obj = models_by_table.get(table_name)
            if model_obj is None:
                continue

            load_model_table(table_name, model_obj, path)

        reset_sequences()
        assert_required_data(models_by_table)


def main():
    try:
        load_seed_data(resolve_data_dir())
    except Exception as exc:
        print(f"Production seed import failed: {exc}", file=sys.stderr)
        raise SystemExit(1)


if __name__ == "__main__":
    main()
