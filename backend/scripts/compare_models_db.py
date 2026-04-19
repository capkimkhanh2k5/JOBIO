
import os
import django
from django.conf import settings
from django.db import connection

import sys
from pathlib import Path

# Add project root to sys.path
BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.append(str(BASE_DIR))

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

def check_orphaned_tables():
    # Get all models currently in the code
    from django.apps import apps
    all_models = apps.get_models()
    model_tables = set()
    for model in all_models:
        model_tables.add(model._meta.db_table)
        # Check for auto-created M2M tables
        for field in model._meta.get_fields():
            if getattr(field, 'many_to_many', False):
                # ManyToManyRel and ManyToManyField both have many_to_many=True
                # But only ManyToManyField has 'through' on its remote_field
                if hasattr(field, 'remote_field') and hasattr(field.remote_field, 'through'):
                    model_tables.add(field.remote_field.through._meta.db_table)
    
    # Get all tables in the database
    with connection.cursor() as cursor:
        cursor.execute("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
        """)
        db_tables = {row[0] for row in cursor.fetchall()}
    
    # Find tables that are in the DB but not in the models
    orphaned_tables = db_tables - model_tables
    
    django_standard_tables = {
        'django_migrations', 'django_content_type', 'django_session', 
        'django_admin_log', 'auth_permission', 'auth_group', 
        'auth_group_permissions', 'auth_user', 'auth_user_groups', 'auth_user_user_permissions'
    }
    
    filtered_orphaned = orphaned_tables - django_standard_tables
    
    print("--- Database Tables vs Models Check ---")
    print(f"Total model-related tables in code: {len(model_tables)}")
    print(f"Total tables in database: {len(db_tables)}")
    
    print("\n--- All Database Tables ---")
    for t in sorted(db_tables):
        print(f" - {t}")

    print("\nKeywords Search (reference, assistance, chat, ...) in DB tables:")
    keywords = ['reference', 'assistance', 'chat']
    found_keywords = [t for t in db_tables if any(k in t.lower() for k in keywords)]
    if found_keywords:
        for t in sorted(found_keywords):
            status = " [OK - Has Model]" if t in model_tables else " [ORPHANED]"
            print(f" - {t}{status}")
    else:
        print("No tables found containing these keywords.")

    print("\nOrphaned tables (In DB but no model in code):")
    if not filtered_orphaned:
        print("None found (excluding standard django tables).")
    else:
        for table in sorted(filtered_orphaned):
            print(f" - {table}")
            
    print("\nMissing tables (In code but no table in DB):")
    missing_tables = model_tables - db_tables
    if not missing_tables:
        print("None found.")
    else:
        for table in sorted(missing_tables):
            print(f" - {table}")

if __name__ == "__main__":
    check_orphaned_tables()
