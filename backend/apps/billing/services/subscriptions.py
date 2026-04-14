from django.utils import timezone
from django.core.exceptions import ValidationError
from apps.billing.models import CompanySubscription
from datetime import timedelta

class SubscriptionService:
    """
    Service to handle company subscription logic and helper methods.
    """

    @staticmethod
    def get_active_subscription(company_id: int):
        """
        Retrieves the currently active subscription for a company.
        A subscription is active if:
        1. status is 'ACTIVE'
        2. end_date is >= today
        """
        now = timezone.now().date()
        
        return CompanySubscription.objects.filter(
            company_id=company_id,
            status=CompanySubscription.Status.ACTIVE,
            start_date__lte=now,
            end_date__gte=now
        ).select_related('plan').first()

    @staticmethod
    def get_plan_limits(company_id: int):
        """
        Helper to get the feature limits for a company's active plan.
        Returns a dictionary or defaults if no active plan.
        """
        sub = SubscriptionService.get_active_subscription(company_id)
        if not sub:
            # Default limits for no plan (if applicable) or strict zero
            return {
                'job_post_limit': 0,
                'featured_job_limit': 0,
                'top_job': False
            }
        
        return sub.plan.features

    @staticmethod
    def subscribe(company, plan):
        """
        Creates a new subscription record for a company.
        Dates are calculated based on plan.duration_days.
        """
        
        start_date = timezone.now().date()
        end_date = start_date + timedelta(days=plan.duration_days)
        
        return CompanySubscription.objects.create(
            company=company,
            plan=plan,
            start_date=start_date,
            end_date=end_date,
            status=CompanySubscription.Status.PENDING,
            auto_renew=True
        )

    @staticmethod
    def cancel_subscription(company):
        """
        Disable auto-renew for current active subscription.
        """
        sub = CompanySubscription.objects.filter(
            company=company,
            status=CompanySubscription.Status.ACTIVE
        ).first()

        if not sub:
            raise ValidationError("No active subscription found.")

        sub.auto_renew = False
        sub.save(update_fields=['auto_renew', 'updated_at'])
        return sub
