import os
import sys
import json
import inspect
from datetime import datetime, timezone as datetime_timezone

import django
from django.apps import apps
from django.db import models, transaction
from django.db.models.signals import post_save, pre_save
from django.contrib.auth.hashers import identify_hasher, make_password
from django.utils import timezone
from django.utils.dateparse import parse_datetime

# --- CONFIGURATION CHUẨN BỊ MÔI TRƯỜNG ---
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from django.contrib.auth.models import Permission  # noqa: E402
from django.contrib.contenttypes.models import ContentType  # noqa: E402


def disable_import_side_effects():
    """Disable post-save side effects that should not run during seed imports."""
    try:
        from apps.communication.job_alerts.signals import trigger_job_matching
        from apps.recruitment.jobs.models import Job

        post_save.disconnect(trigger_job_matching, sender=Job)
    except Exception as exc:
        print(f"[WARN] Could not disable job matching signal: {exc}")

    try:
        from apps.system.reports.signals import notify_admin_on_new_report
        from apps.system.reports.models import Report

        post_save.disconnect(notify_admin_on_new_report, sender=Report)
    except Exception as exc:
        print(f"[WARN] Could not disable report notification signal: {exc}")

    try:
        from apps.recruitment.interviews.signals import (
            notify_candidate_on_interview_scheduled,
        )
        from apps.recruitment.interviews.models import Interview

        post_save.disconnect(notify_candidate_on_interview_scheduled, sender=Interview)
    except Exception as exc:
        print(f"[WARN] Could not disable interview notification signal: {exc}")

    try:
        from apps.billing.signals import (
            notify_admin_on_completed_transaction,
            store_old_transaction_status,
        )
        from apps.billing.models import Transaction

        pre_save.disconnect(store_old_transaction_status, sender=Transaction)
        post_save.disconnect(
            notify_admin_on_completed_transaction,
            sender=Transaction,
        )
    except Exception as exc:
        print(f"[WARN] Could not disable billing notification signal: {exc}")


disable_import_side_effects()

CONTENT_TYPE_ID_MAP = {}
PERMISSION_ID_MAP = {}


def resolve_data_dir():
    if len(sys.argv) > 1:
        return sys.argv[1]

    current_dir = os.path.dirname(os.path.abspath(__file__))
    parent_dir = os.path.dirname(current_dir)
    root_dir = os.path.dirname(parent_dir)

    candidates = [
        os.path.join(root_dir, "DataSet", "Data_Final"),
        os.path.join(parent_dir, "DataSet", "Data_Final"),
        os.path.join(current_dir, "Data_Final_To_Load"),
    ]

    for candidate in candidates:
        if os.path.isdir(candidate):
            return candidate

    return candidates[0]


DATA_DIR = resolve_data_dir()

print(f"Bắt đầu nạp dữ liệu từ: {DATA_DIR}")

models_dict = {}
for obj in apps.get_models(include_auto_created=True):
    if (
        inspect.isclass(obj)
        and issubclass(obj, models.Model)
        and obj is not models.Model
        and obj._meta.managed
        and not obj._meta.proxy
    ):
        table_name = getattr(obj._meta, "db_table", "").lower()
        if table_name:
            models_dict[table_name] = obj


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
    "job_skills",
    "notifications",
    "activity_logs",
    "token_blacklist_outstandingtoken",
    "token_blacklist_blacklistedtoken",
]


CP1252_REVERSE = {
    bytes([code]).decode("cp1252"): code
    for code in range(128, 256)
    if code not in {129, 141, 143, 144, 157}
}


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


def load_json(json_file):
    with open(json_file, "r", encoding="utf-8-sig") as f:
        return json.load(f)


def normalize_row(row):
    return {key: repair_mojibake(value) for key, value in dict(row).items()}


def parse_seed_datetime(value):
    if not isinstance(value, str):
        return value

    parsed = parse_datetime(value)
    if parsed is None:
        return value

    if timezone.is_naive(parsed):
        return timezone.make_aware(parsed, datetime_timezone.utc)

    return parsed


def restore_seed_timestamps(model_obj, instance_id, row_data):
    timestamp_updates = {}
    for field_name in ("created_at", "updated_at"):
        if field_name in row_data:
            timestamp_updates[field_name] = parse_seed_datetime(row_data[field_name])

    if timestamp_updates:
        model_obj.objects.filter(pk=instance_id).update(**timestamp_updates)


def load_content_types(json_file):
    try:
        data = load_json(json_file)
    except Exception as e:
        print(f"[ERROR] Không thể đọc file seed {json_file}: {str(e)}")
        return

    created_count = 0
    updated_count = 0

    try:
        with transaction.atomic():
            for row in data:
                row_data = normalize_row(row)
                seed_id = row_data.get("id")
                content_type, created = ContentType.objects.update_or_create(
                    app_label=row_data["app_label"],
                    model=row_data["model"],
                    defaults={},
                )
                if seed_id is not None:
                    CONTENT_TYPE_ID_MAP[seed_id] = content_type.id
                if created:
                    created_count += 1
                else:
                    updated_count += 1

        print(
            f"[OK] Đã đồng bộ bảng: django_content_type "
            f"(created={created_count}, updated={updated_count}, total={len(data)})"
        )
    except Exception as e:
        print(
            "[ERROR] Quá trình nạp bảng django_content_type thất bại. "
            f"Chi tiết lỗi: {str(e)}"
        )


def load_permissions(json_file):
    try:
        data = load_json(json_file)
    except Exception as e:
        print(f"[ERROR] Không thể đọc file seed {json_file}: {str(e)}")
        return

    created_count = 0
    updated_count = 0

    try:
        with transaction.atomic():
            for row in data:
                row_data = normalize_row(row)
                seed_id = row_data.pop("id", None)
                content_type_id = row_data.get("content_type_id")
                if content_type_id in CONTENT_TYPE_ID_MAP:
                    row_data["content_type_id"] = CONTENT_TYPE_ID_MAP[content_type_id]

                permission, created = Permission.objects.update_or_create(
                    content_type_id=row_data["content_type_id"],
                    codename=row_data["codename"],
                    defaults={"name": row_data["name"]},
                )
                if seed_id is not None:
                    PERMISSION_ID_MAP[seed_id] = permission.id
                if created:
                    created_count += 1
                else:
                    updated_count += 1

        print(
            f"[OK] Đã đồng bộ bảng: auth_permission "
            f"(created={created_count}, updated={updated_count}, total={len(data)})"
        )
    except Exception as e:
        print(
            "[ERROR] Quá trình nạp bảng auth_permission thất bại. "
            f"Chi tiết lỗi: {str(e)}"
        )


def remap_known_foreign_keys(table_name, row_data):
    if table_name in {"auth_group_permissions", "users_user_permissions"}:
        permission_id = row_data.get("permission_id")
        if permission_id in PERMISSION_ID_MAP:
            row_data["permission_id"] = PERMISSION_ID_MAP[permission_id]


def load_table(table_name, model_obj, json_file):
    if not os.path.exists(json_file):
        return

    if table_name == "django_content_type":
        load_content_types(json_file)
        return

    if table_name == "auth_permission":
        load_permissions(json_file)
        return

    try:
        data = load_json(json_file)
    except Exception as e:
        print(f"[ERROR] Không thể đọc file seed {json_file}: {str(e)}")
        return

    binary_fields = [
        f.name for f in model_obj._meta.fields if isinstance(f, models.BinaryField)
    ]
    created_count = 0
    updated_count = 0

    try:
        with transaction.atomic():
            for row in data:
                for bf in binary_fields:
                    if bf in row and isinstance(row[bf], str):
                        row[bf] = row[bf].encode("utf-8")

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
                    instance, created = model_obj.objects.update_or_create(
                        id=record_id, defaults=row_data
                    )
                    restore_seed_timestamps(model_obj, instance.id, row_data)
                    if created:
                        created_count += 1
                    else:
                        updated_count += 1
                else:
                    instance = model_obj.objects.create(**row_data)
                    restore_seed_timestamps(model_obj, instance.id, row_data)
                    created_count += 1

        print(
            f"[OK] Đã đồng bộ bảng: {table_name} "
            f"(created={created_count}, updated={updated_count}, total={len(data)})"
        )
    except Exception as e:
        print(
            f"[ERROR] Quá trình nạp bảng {table_name} thất bại. Chi tiết lỗi: {str(e)}"
        )


loaded_tables = set()

for table in TABLES_ORDER:
    json_file = os.path.join(DATA_DIR, f"{table}.json")
    if table in models_dict and os.path.exists(json_file):
        load_table(table, models_dict[table], json_file)
        loaded_tables.add(table)


for filename in sorted(os.listdir(DATA_DIR)):
    if filename.endswith(".json"):
        tbl = filename[:-5]
        if tbl not in TABLES_ORDER and tbl in models_dict:
            load_table(tbl, models_dict[tbl], os.path.join(DATA_DIR, filename))
            loaded_tables.add(tbl)


skipped_tables = sorted(
    filename[:-5]
    for filename in os.listdir(DATA_DIR)
    if filename.endswith(".json") and filename[:-5] not in loaded_tables
)

if skipped_tables:
    print(
        "[WARN] Bỏ qua các file JSON không khớp model/table hiện tại: "
        + ", ".join(skipped_tables)
    )


print("\n--- HOÀN TẤT NẠP DỮ LIỆU ---")
