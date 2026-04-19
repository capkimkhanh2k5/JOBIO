import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.company.industries.models import Industry

try:
    industries = Industry.objects.all().order_by('id')
    print(f"Total industries: {len(industries)}")
    for ind in industries:
        print(f"ID: {ind.id}, Name: {ind.name}")
except Exception as e:
    print(f"Error: {e}")
