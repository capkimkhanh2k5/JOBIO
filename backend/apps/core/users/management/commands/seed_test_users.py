from django.core.management.base import BaseCommand
from django.db import transaction
from apps.core.users.models import CustomUser
from apps.company.companies.models import Company
from django.utils.text import slugify

class Command(BaseCommand):
    help = 'Seed test accounts for different roles: admin, company, candidate'

    def handle(self, *args, **options):
        # Data configuration
        password = '123456'
        users_to_create = [
            {
                'email': 'admin@jobio.com',
                'full_name': 'Admin User',
                'role': CustomUser.Role.ADMIN,
                'is_staff': True,
                'is_superuser': True
            },
            {
                'email': 'company@jobio.com',
                'full_name': 'Company Owner',
                'role': CustomUser.Role.COMPANY,
                'company_name': 'JOBIO Technology Corp'
            },
            {
                'email': 'user@jobio.com',
                'full_name': 'Candidate User',
                'role': CustomUser.Role.CANDIDATE
            }
        ]

        with transaction.atomic():
            for user_data in users_to_create:
                email = user_data['email']
                full_name = user_data['full_name']
                role = user_data['role']
                
                # 1. Create User
                user, created = CustomUser.objects.get_or_create(
                    email=email,
                    defaults={
                        'full_name': full_name,
                        'role': role,
                        'is_staff': user_data.get('is_staff', False),
                        'is_superuser': user_data.get('is_superuser', False),
                        'status': 'active'
                    }
                )
                
                if created:
                    user.set_password(password)
                    user.save()
                    self.stdout.write(self.style.SUCCESS(f'Created user: {email}'))
                else:
                    self.stdout.write(self.style.WARNING(f'User {email} already exists.'))

                # 2. Special handling for Company
                if role == CustomUser.Role.COMPANY:
                    company_name = user_data['company_name']
                    company, c_created = Company.objects.get_or_create(
                        user=user,
                        defaults={
                            'company_name': company_name,
                            'slug': slugify(company_name),
                            'verification_status': Company.VerificationStatus.VERIFIED
                        }
                    )
                    if c_created:
                        self.stdout.write(self.style.SUCCESS(f'Created company profile: {company_name}'))
                    else:
                        self.stdout.write(self.style.WARNING(f'Company profile for {email} already exists.'))

        self.stdout.write(self.style.SUCCESS('Successfully seeded test accounts.'))
