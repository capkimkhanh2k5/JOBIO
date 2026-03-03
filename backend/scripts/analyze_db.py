#!/usr/bin/env python3
"""Analyze database schema comprehensively."""
import django, os, sys

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
django.setup()

from django.apps import apps
from django.db import models as dm

all_models = apps.get_models()

# 1. Categorize
INTERNAL = ('admin', 'auth', 'contenttypes', 'sessions', 'token_blacklist', 'django_eventstream')
django_models = [m for m in all_models if m._meta.app_label in INTERNAL]
app_models = [m for m in all_models if m._meta.app_label not in INTERNAL]

print("=" * 70)
print(f"TỔNG SỐ BẢNG DATABASE: {len(all_models)}")
print(f"  - Django/Third-party: {len(django_models)} bảng")
print(f"  - Business logic:     {len(app_models)} bảng")
print("=" * 70)

# 2. Group by domain
DOMAIN_MAP = {
    'analytics': 'Analytics',
    'assessment': 'Assessment',
    'billing': 'Billing',
    'blog': 'Blog',
    'campaigns': 'Recruitment',
    'candidate': 'Candidate',
    'communication': 'Communication',
    'company': 'Company',
    'core': 'Core',
    'email': 'Email',
    'geography': 'Geography',
    'recruitment': 'Recruitment',
    'social': 'Social',
    'system': 'System',
}

domains = {}
for m in app_models:
    label = m._meta.app_label
    prefix = label.split('_')[0]
    domain = DOMAIN_MAP.get(prefix, prefix)
    domains.setdefault(domain, []).append(m)

print("\n📊 PHÂN BỔ THEO DOMAIN:")
print("-" * 70)
for domain in sorted(domains.keys()):
    ms = domains[domain]
    print(f"\n  {domain} ({len(ms)} bảng):")
    for m in sorted(ms, key=lambda x: x._meta.db_table):
        fields = len([f for f in m._meta.get_fields() if hasattr(f, 'column')])
        print(f"    - {m._meta.db_table:45s} ({fields} cột)")

# 3. Optimization checks
print("\n" + "=" * 70)
print("🔍 KIỂM TRA TỐI ƯU HÓA")
print("=" * 70)

# Check timestamps
print("\n  1️⃣  TIMESTAMPS (created_at / updated_at):")
missing_created = []
missing_updated = []
has_both = []
IMMUTABLE_TABLES = {
    'audit_logs', 'search_history', 'job_search_history', 'job_views',
    'application_status_history', 'activity_logs', 'company_followers',
    'skill_endorsements', 'review_reactions', 'job_alert_skills',
    'job_alert_matches',
}
for m in app_models:
    field_names = [f.name for f in m._meta.get_fields() if hasattr(f, 'column')]
    has_c = 'created_at' in field_names
    has_u = 'updated_at' in field_names
    tbl = m._meta.db_table
    if has_c and has_u:
        has_both.append(tbl)
    elif has_c and not has_u:
        if tbl not in IMMUTABLE_TABLES:
            missing_updated.append(tbl)
        else:
            has_both.append(tbl)  # immutable, ok
    elif not has_c:
        missing_created.append(tbl)

print(f"     ✅ Đầy đủ timestamps: {len(has_both)} bảng")
if missing_updated:
    print(f"     ⚠️  Thiếu updated_at (mutable): {len(missing_updated)}")
    for t in missing_updated:
        print(f"        - {t}")
if missing_created:
    print(f"     ⚠️  Thiếu created_at: {len(missing_created)}")
    for t in missing_created:
        print(f"        - {t}")
if not missing_updated and not missing_created:
    print("     ✅ Tất cả bảng business đều có timestamps phù hợp!")

# Check indexes
print("\n  2️⃣  INDEXES:")
indexed_fks = 0
total_fks = 0
missing_idx = []
for m in app_models:
    for f in m._meta.get_fields():
        if hasattr(f, 'column'):
            if isinstance(f, (dm.ForeignKey, dm.OneToOneField)):
                total_fks += 1
                if f.db_index or f.unique:
                    indexed_fks += 1
                else:
                    missing_idx.append(f"{m._meta.db_table}.{f.name}")

print(f"     Foreign Keys có index: {indexed_fks}/{total_fks}")
if missing_idx:
    print(f"     ⚠️  FK thiếu index: {len(missing_idx)}")
    for idx in missing_idx:
        print(f"        - {idx}")
else:
    print("     ✅ Tất cả FK đều có index!")

# Check status/type fields with index
print("\n  3️⃣  STATUS/TYPE FIELDS:")
status_fields = []
for m in app_models:
    for f in m._meta.get_fields():
        if hasattr(f, 'column') and hasattr(f, 'choices') and f.choices:
            has_idx = getattr(f, 'db_index', False) or getattr(f, 'unique', False)
            status_fields.append((f"{m._meta.db_table}.{f.name}", has_idx))

indexed_status = sum(1 for _, idx in status_fields if idx)
print(f"     Status/Choice fields có index: {indexed_status}/{len(status_fields)}")
no_idx = [(n, i) for n, i in status_fields if not i]
if no_idx:
    print(f"     ⚠️  Thiếu index trên status/choice fields:")
    for n, _ in no_idx:
        print(f"        - {n}")

# Check unique constraints
print("\n  4️⃣  UNIQUE CONSTRAINTS:")
unique_count = 0
for m in app_models:
    for f in m._meta.get_fields():
        if hasattr(f, 'column') and getattr(f, 'unique', False):
            unique_count += 1
    if m._meta.unique_together:
        unique_count += len(m._meta.unique_together)

print(f"     Tổng unique constraints: {unique_count}")

# Check Meta classes
print("\n  5️⃣  META CLASSES:")
no_meta_table = []
has_ordering = 0
for m in app_models:
    if m._meta.ordering:
        has_ordering += 1

print(f"     Models có ordering: {has_ordering}/{len(app_models)}")

# Summary
print("\n" + "=" * 70)
print("📋 TỔNG KẾT")
print("=" * 70)

issues = len(missing_updated) + len(missing_created) + len(missing_idx) + len(no_idx)
if issues == 0:
    print("  ✅ HỆ THỐNG DATABASE ĐÃ ĐƯỢC TỐI ƯU TỐT!")
    print("     - Timestamps đầy đủ cho tất cả bảng")
    print("     - Indexes trên tất cả FK")
    print("     - Status/Choice fields có index")
else:
    print(f"  ⚠️  Còn {issues} vấn đề cần xem xét")
