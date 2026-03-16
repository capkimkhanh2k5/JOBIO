import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.candidate.recruiters.models import Recruiter

print("--- Detailed Recruiter Data ---")
for r in Recruiter.objects.all():
    print(f"ID: {r.id}, Name: {r.user.full_name}")
    print(f"  Public: {r.is_profile_public}, Status: {r.job_search_status}")
    print(f"  Salary: {r.desired_salary_min} - {r.desired_salary_max} {r.salary_currency}")
    print(f"  Exp: {r.years_of_experience}, Location: {r.address.province.province_name if r.address and r.address.province else 'N/A'}")

print("\n--- Filter Simulation (Frontend Defaults) ---")
# Defaults: search_status='all', salary_max=10000, experience_min=0, location='all'
from apps.candidate.recruiters.selectors.recruiters import search_recruiters
filters = {
    'search_status': 'all',
    'salary_max': 10000,
    'experience_min': 0,
    'location': 'all'
}
results = search_recruiters(filters)
print(f"Results with {filters}: {results.count()}")

# Try without salary_max
filters_no_salary = {'search_status': 'all'}
results_no_salary = search_recruiters(filters_no_salary)
print(f"Results without salary filter: {results_no_salary.count()}")
