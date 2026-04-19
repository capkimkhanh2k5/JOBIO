import os
import sys
import json
import django
import inspect
from django.db import models

# --- CONFIGURATION CHUẨN BỊ MÔI TRƯỜNG ---
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

import schema_django


def resolve_data_dir():
    if len(sys.argv) > 1:
        return sys.argv[1]

    current_dir = os.path.dirname(os.path.abspath(__file__))
    parent_dir = os.path.dirname(current_dir)

    candidates = [
        os.path.join(parent_dir, "DataSet", "Data_Final"),
        os.path.join(current_dir, "Data_Final_To_Load"),
        os.path.join(current_dir, "DataSet", "Data_Final"),
    ]

    for candidate in candidates:
        if os.path.isdir(candidate):
            return candidate

    return candidates[0]


DATA_DIR = resolve_data_dir()

print(f"Bắt đầu nạp dữ liệu từ: {DATA_DIR}")

models_dict = {}
for name, obj in inspect.getmembers(schema_django):
    if inspect.isclass(obj) and issubclass(obj, models.Model) and obj is not models.Model:
        table_name = getattr(obj._meta, 'db_table', '').lower()
        if table_name:
            models_dict[table_name] = obj

# Sắp xếp thứ tự các bảng để không bị dính lỗi Khoá Ngoại (Foreign Key constraint)
TABLES_ORDER = [
    # Cấp -1 - Hệ thống và Địa giới hành chính (Phải nạp trước Addresses)
    'django_content_type', 'provinces', 'communes',
    
    # Cấp 0 - Địa chỉ và Danh mục cơ bản
    'addresses', 'industries', 'auth_group', 'auth_permission', 'report_types',
    'media_types', 'languages', 'payment_methods', 'benefit_categories',
    'activity_log_types', 'notification_types', 'email_emailtemplatecategory',
    'cv_template_categories', 'skill_categories', 'interview_types', 'subscription_plans',
    
    # Cấp 1 - Users và các bảng phụ thuộc trực tiếp
    'skills', 'users', 'email_emailtemplate', 'cv_templates',
    
    # Cấp 2
    'companies', 'users_groups', 'users_user_permissions', 'auth_group_permissions',
    
    # Cấp 3
    'recruiters', 'job_categories',
    
    # Cấp 4
    'jobs', 'recruiter_education', 'recruiter_experience', 'recruiter_skills',
    'recruiter_languages', 'recruiter_projects',
    'recruiter_certifications', 'recruiter_cvs', 'file_uploads',
    
    # Cấp 5
    'applications', 'company_benefits', 'company_media', 'company_followers',
    'company_subscriptions', 'saved_jobs', 'job_alerts', 'reports',
    'email_sentemail',
    
    # Cấp 6
    'application_status_history', 'interviews', 'job_alerts_skills',
    'job_skills', 'notifications', 'activity_logs'
]

def load_table(table_name, model_obj, json_file):
    if not os.path.exists(json_file):
        return
    
    with open(json_file, 'r', encoding='utf-8') as f:
        try:
            data = json.load(f)
        except:
            return

    # Kiểm tra xem Model có BinaryField không
    binary_fields = [f.name for f in model_obj._meta.fields if isinstance(f, models.BinaryField)]
    
    instances = []
    for row in data:
        # Tự động convert string sang bytes cho BinaryField
        for bf in binary_fields:
            if bf in row and isinstance(row[bf], str):
                row[bf] = row[bf].encode('utf-8')
        instances.append(model_obj(**row))
        
    try:
        model_obj.objects.bulk_create(instances, ignore_conflicts=True)
        print(f"[OK] Đã nạp thành công dữ liệu bảng: {table_name} ({len(instances)} rows)")
    except Exception as e:
        print(f"[ERROR] Quá trình nạp bảng {table_name} thất bại. Chi tiết lỗi: {str(e)}")

# Chạy theo order
for table in TABLES_ORDER:
    if table in models_dict:
        load_table(table, models_dict[table], os.path.join(DATA_DIR, f"{table}.json"))

# Quét các bảng còn lại
for filename in os.listdir(DATA_DIR):
    if filename.endswith(".json"):
        tbl = filename[:-5]
        if tbl not in TABLES_ORDER and tbl in models_dict:
            load_table(tbl, models_dict[tbl], os.path.join(DATA_DIR, filename))

print("\n--- HOÀN TẤT NẠP DỮ LIỆU ---")
