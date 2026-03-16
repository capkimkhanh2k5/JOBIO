import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.candidate.recruiters.models import Recruiter
from apps.candidate.recruiters.selectors.recruiters import search_recruiters

print("--- RECRUITER LIST ---")
recruiters = Recruiter.objects.all()
print(f"Total: {recruiters.count()}")
for r in recruiters:
    print(f"ID: {r.id} | Name: {r.user.full_name} | Public: {r.is_profile_public} | Status: {r.job_search_status} | Exp: {r.years_of_experience} | Salary: {r.desired_salary_min}")

print("\n--- TEST: DEFAULT FILTERS (100M salary, 0 exp) ---")
filters_default = {
    'search_status': 'all',
    'salary_max': 100000000,
    'experience_min': 0,
    'location': 'all',
    'skills': []
}
results_def = search_recruiters(filters_default)
print(f"Results: {results_def.count()}")

print("\n--- TEST: USER FILTERS (2M salary, 1 exp) ---")
filters_user = {
    'search_status': 'all',
    'salary_max': 2000000,
    'experience_min': 1,
    'location': 'all',
    'skills': []
}
results_user = search_recruiters(filters_user)
print(f"Results: {results_user.count()}")

print("\n--- TEST: NO SALARY FILTER (0 exp) ---")
filters_no_sal = {
    'search_status': 'all',
    'experience_min': 0,
    'location': 'all',
}
results_no_sal = search_recruiters(filters_no_sal)
print(f"Results: {results_no_sal.count()}")
