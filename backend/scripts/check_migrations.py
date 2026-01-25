
import os
from django.conf import settings
import django

# Setup Django
import sys
sys.path.append('/app')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.apps import apps

print("🔍 Checking for apps with models but NO migrations...")

unmigrated_apps = []

for app_config in apps.get_app_configs():
    # Only check our local apps (apps.*)
    if not app_config.name.startswith('apps.'):
        continue
        
    # Check if app has models
    if not app_config.models:
        continue
        
    # Check if migrations module exists
    module_name = app_config.module.__name__
    migrations_module = f"{module_name}.migrations"
    
    try:
        # Use simple directory check instead of import to be robust
        app_path = app_config.path
        migrations_path = os.path.join(app_path, 'migrations')
        has_migrations = os.path.isdir(migrations_path) and os.path.exists(os.path.join(migrations_path, '__init__.py'))
        
        if not has_migrations:
            print(f"⚠️  App '{app_config.label}' ({app_config.name}) has models but NO 'migrations' folder.")
            unmigrated_apps.append(app_config.name)
            
    except Exception as e:
        print(f"Error checking {app_config.name}: {e}")

if not unmigrated_apps:
    print("✅ All local apps with models have migrations folders.")
else:
    print(f"\n❌ Found {len(unmigrated_apps)} unmigrated apps. Django uses 'sync_apps' for these, which causes foreign key issues during tests.")
    print("Try running: python manage.py makemigrations " + " ".join([app.split('.')[-1] for app in unmigrated_apps]))
