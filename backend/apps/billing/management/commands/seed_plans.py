from django.core.management.base import BaseCommand
from apps.billing.models import SubscriptionPlan
from django.utils.text import slugify

class Command(BaseCommand):
    help = 'Seed initial subscription plans'

    def handle(self, *args, **options):
        # SubscriptionPlan.objects.all().delete()
        # self.stdout.write(self.style.WARNING('Deleted old subscription plans.'))

        plans_data = [
            # PLUS TIER
            {
                'name': 'Plus (3 tháng)',
                'slug': 'plus-3-thang',
                'price': 299000,
                'duration_days': 90,
                'features': {
                    'job_post_limit': 5,
                    'featured_job_limit': 0,
                    'top_job': False,
                    'mass_email': False,
                    'priority_support': False,
                    'employer_branding': False
                }
            },
            {
                'name': 'Plus (6 tháng)',
                'slug': 'plus-6-thang',
                'price': 499000,
                'duration_days': 180,
                'features': {
                    'job_post_limit': 12,
                    'featured_job_limit': 0,
                    'top_job': False,
                    'mass_email': False,
                    'priority_support': False,
                    'employer_branding': False
                }
            },
            {
                'name': 'Plus (1 năm)',
                'slug': 'plus-1-nam',
                'price': 899000,
                'duration_days': 365,
                'features': {
                    'job_post_limit': 30,
                    'featured_job_limit': 0,
                    'top_job': False,
                    'mass_email': False,
                    'priority_support': False,
                    'employer_branding': False
                }
            },
            
            # PRO TIER
            {
                'name': 'Pro (3 tháng)',
                'slug': 'pro-3-thang',
                'price': 690000,
                'duration_days': 90,
                'features': {
                    'job_post_limit': 20,
                    'featured_job_limit': 3,
                    'top_job': True,
                    'mass_email': False,
                    'priority_support': True,
                    'employer_branding': False
                }
            },
            {
                'name': 'Pro (6 tháng)',
                'slug': 'pro-6-thang',
                'price': 1190000,
                'duration_days': 180,
                'features': {
                    'job_post_limit': 45,
                    'featured_job_limit': 8,
                    'top_job': True,
                    'mass_email': False,
                    'priority_support': True,
                    'employer_branding': False
                }
            },
            {
                'name': 'Pro (1 năm)',
                'slug': 'pro-1-nam',
                'price': 1990000,
                'duration_days': 365,
                'features': {
                    'job_post_limit': 100,
                    'featured_job_limit': 20,
                    'top_job': True,
                    'mass_email': False,
                    'priority_support': True,
                    'employer_branding': False
                }
            },

            # MAX TIER
            {
                'name': 'Max (3 tháng)',
                'slug': 'max-3-thang',
                'price': 1890000,
                'duration_days': 90,
                'features': {
                    'job_post_limit': 300,
                    'featured_job_limit': 30,
                    'top_job': True,
                    'mass_email': True,
                    'priority_support': True,
                    'employer_branding': True
                }
            },
            {
                'name': 'Max (6 tháng)',
                'slug': 'max-6-thang',
                'price': 3490000,
                'duration_days': 180,
                'features': {
                    'job_post_limit': 700,
                    'featured_job_limit': 75,
                    'top_job': True,
                    'mass_email': True,
                    'priority_support': True,
                    'employer_branding': True
                }
            },
            {
                'name': 'Max (1 năm)',
                'slug': 'max-1-nam',
                'price': 5990000,
                'duration_days': 365,
                'features': {
                    'job_post_limit': 1500,
                    'featured_job_limit': 200,
                    'top_job': True,
                    'mass_email': True,
                    'priority_support': True,
                    'employer_branding': True
                }
            },
        ]

        for data in plans_data:
            plan, created = SubscriptionPlan.objects.update_or_create(
                slug=data['slug'],
                defaults=data
            )
            if created:
                self.stdout.write(self.style.SUCCESS(f'Created plan: {plan.name}'))
            else:
                self.stdout.write(self.style.SUCCESS(f'Updated plan: {plan.name}'))

        self.stdout.write(self.style.SUCCESS('Successfully seeded subscription plans.'))
