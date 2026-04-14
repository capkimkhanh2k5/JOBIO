from django.utils import timezone
from django.core.exceptions import ValidationError
from apps.billing.models import CompanySubscription
from datetime import timedelta
import re

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

    @staticmethod
    def parse_plan_id_from_transaction_description(description: str):
        """Extract PLAN_ID from transaction description metadata."""
        match = re.search(r"PLAN_ID:(\d+)", str(description or ""))
        if not match:
            return None
        try:
            return int(match.group(1))
        except (TypeError, ValueError):
            return None

    @staticmethod
    def get_plan_family(plan):
        """Derive a plan family key (tier) from slug/name, e.g. max-3-thang -> max."""
        if not plan:
            return None

        slug = str(getattr(plan, 'slug', '') or '').strip().lower()
        if slug:
            return slug.split('-')[0]

        name = str(getattr(plan, 'name', '') or '').strip().lower()
        if name:
            return name.split()[0]

        return None

    @staticmethod
    def is_same_plan_family(plan_a, plan_b):
        family_a = SubscriptionService.get_plan_family(plan_a)
        family_b = SubscriptionService.get_plan_family(plan_b)
        return bool(family_a and family_b and family_a == family_b)

    @staticmethod
    def get_transaction_plan_id(transaction):
        """Read plan_id from structured metadata first, then fallback to legacy description parsing."""
        metadata = getattr(transaction, 'metadata', None) or {}
        plan_id = metadata.get('plan_id')
        if plan_id is not None:
            try:
                return int(plan_id)
            except (TypeError, ValueError):
                pass
        return SubscriptionService.parse_plan_id_from_transaction_description(getattr(transaction, 'description', ''))

    @staticmethod
    def activate_paid_subscription(company, plan):
        """
        Activate/renew subscription after successful payment.
        - If company already has active same plan: extend end_date.
        - If company has active different plan: replace it immediately (fallback safety).
        - If no active plan: create a new active subscription.
        """
        today = timezone.now().date()
        active_sub = CompanySubscription.objects.filter(
            company=company,
            status=CompanySubscription.Status.ACTIVE,
            start_date__lte=today,
            end_date__gte=today,
        ).select_related('plan').first()

        if active_sub and SubscriptionService.is_same_plan_family(active_sub.plan, plan):
            base_end_date = active_sub.end_date if active_sub.end_date >= today else today
            active_sub.end_date = base_end_date + timedelta(days=plan.duration_days)
            active_sub.auto_renew = True
            active_sub.plan = plan
            active_sub.save(update_fields=['plan', 'end_date', 'auto_renew', 'updated_at'])
            return active_sub

        if active_sub and active_sub.plan_id != plan.id:
            active_sub.status = CompanySubscription.Status.CANCELLED
            active_sub.auto_renew = False
            active_sub.save(update_fields=['status', 'auto_renew', 'updated_at'])

        return CompanySubscription.objects.create(
            company=company,
            plan=plan,
            start_date=today,
            end_date=today + timedelta(days=plan.duration_days),
            status=CompanySubscription.Status.ACTIVE,
            auto_renew=True,
        )
