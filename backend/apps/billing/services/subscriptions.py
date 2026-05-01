from django.utils import timezone
from django.core.exceptions import ValidationError
from apps.billing.models import CompanySubscription
from datetime import timedelta
from apps.billing.models import Transaction
import json
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
        ).select_related('plan').order_by('-end_date', '-created_at').first()

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
        now = timezone.now()
        today = now.date()
        CompanySubscription.objects.filter(
            company=company,
            status=CompanySubscription.Status.ACTIVE,
        ).update(
            status=CompanySubscription.Status.CANCELLED,
            auto_renew=False,
            updated_at=now,
        )

        CompanySubscription.objects.filter(
            company=company,
            status=CompanySubscription.Status.PENDING,
            start_date__gte=today,
        ).update(
            status=CompanySubscription.Status.CANCELLED,
            auto_renew=False,
            updated_at=now,
        )

        start_date = timezone.now().date()
        end_date = start_date + timedelta(days=plan.duration_days)

        sub = CompanySubscription.objects.create(
            company=company,
            plan=plan,
            start_date=start_date,
            end_date=end_date,
            status=CompanySubscription.Status.ACTIVE,
            auto_renew=True
        )

        Transaction.objects.create(
            company=company,
            amount=plan.price,
            currency=getattr(plan, 'currency', 'VND'),
            type=Transaction.Type.SUBSCRIPTION,
            status=Transaction.Status.COMPLETED if plan.price == 0 else Transaction.Status.PENDING,
            description=f'Subscription for {plan.name}',
            metadata={'plan_id': plan.id, 'plan_slug': plan.slug},
        )

        return sub

    @staticmethod
    def cancel_subscription(company):
        """
        Disable auto-renew for current active subscription.
        """
        sub = CompanySubscription.objects.filter(
            company=company,
            status=CompanySubscription.Status.ACTIVE,
            start_date__lte=timezone.now().date(),
            end_date__gte=timezone.now().date(),
        ).order_by('-end_date', '-created_at').first()

        if not sub:
            sub = CompanySubscription.objects.filter(
                company=company,
                status=CompanySubscription.Status.PENDING
            ).order_by('-created_at').first()

        if not sub:
            raise ValidationError("No active subscription found.")

        sub.auto_renew = False
        sub.save(update_fields=['auto_renew', 'updated_at'])
        return sub

    @staticmethod
    def renew_subscription(subscription):
        """Renew an existing subscription if auto_renew is enabled."""
        if not subscription.auto_renew:
            raise ValidationError("Auto-renew is disabled.")

        subscription.end_date = subscription.end_date + timedelta(days=subscription.plan.duration_days)
        subscription.save(update_fields=['end_date', 'updated_at'])

        Transaction.objects.create(
            company=subscription.company,
            amount=subscription.plan.price,
            currency=getattr(subscription.plan, 'currency', 'VND'),
            type=Transaction.Type.SUBSCRIPTION,
            status=Transaction.Status.PENDING,
            description=f'Renew subscription for {subscription.plan.name}',
            metadata={'plan_id': subscription.plan.id, 'plan_slug': subscription.plan.slug},
        )

        return subscription

    @staticmethod
    def change_subscription(company, plan):
        """Backward-compatible plan change helper used by older tests."""
        now = timezone.now()
        current_sub = CompanySubscription.objects.filter(
            company=company,
            status=CompanySubscription.Status.ACTIVE,
        ).order_by('-end_date', '-created_at').first()

        today = now.date()
        if current_sub and plan.price > current_sub.plan.price:
            CompanySubscription.objects.filter(
                company=company,
                status=CompanySubscription.Status.ACTIVE,
            ).update(
                status=CompanySubscription.Status.CANCELLED,
                auto_renew=False,
                updated_at=now,
            )

            new_sub = CompanySubscription.objects.create(
                company=company,
                plan=plan,
                start_date=today,
                end_date=today + timedelta(days=plan.duration_days),
                status=CompanySubscription.Status.ACTIVE,
                auto_renew=True,
            )
        else:
            if current_sub:
                current_sub.auto_renew = False
                current_sub.save(update_fields=['auto_renew', 'updated_at'])

            start_date = (current_sub.end_date + timedelta(days=1)) if current_sub else today
            new_sub = CompanySubscription.objects.create(
                company=company,
                plan=plan,
                start_date=start_date,
                end_date=start_date + timedelta(days=plan.duration_days),
                status=CompanySubscription.Status.PENDING,
                auto_renew=True,
            )

        Transaction.objects.create(
            company=company,
            amount=plan.price,
            currency=getattr(plan, 'currency', 'VND'),
            type=Transaction.Type.SUBSCRIPTION,
            status=Transaction.Status.PENDING,
            description=f'Change subscription to {plan.name}',
            metadata={'plan_id': plan.id, 'plan_slug': plan.slug},
        )

        return new_sub

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
        if isinstance(metadata, str):
            try:
                metadata = json.loads(metadata)
            except (TypeError, ValueError):
                metadata = {}
        if not isinstance(metadata, dict):
            metadata = {}
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
        now = timezone.now()
        active_sub = CompanySubscription.objects.filter(
            company=company,
            status=CompanySubscription.Status.ACTIVE,
            start_date__lte=today,
            end_date__gte=today,
        ).select_related('plan').order_by('-end_date', '-created_at').first()

        if active_sub and SubscriptionService.is_same_plan_family(active_sub.plan, plan):
            base_end_date = active_sub.end_date if active_sub.end_date >= today else today
            active_sub.end_date = base_end_date + timedelta(days=plan.duration_days)
            active_sub.auto_renew = True
            active_sub.plan = plan
            active_sub.save(update_fields=['plan', 'end_date', 'auto_renew', 'updated_at'])

            CompanySubscription.objects.filter(
                company=company,
                status=CompanySubscription.Status.ACTIVE,
            ).exclude(id=active_sub.id).update(
                status=CompanySubscription.Status.CANCELLED,
                auto_renew=False,
                updated_at=now,
            )
            return active_sub

        CompanySubscription.objects.filter(
            company=company,
            status=CompanySubscription.Status.ACTIVE,
        ).update(
            status=CompanySubscription.Status.CANCELLED,
            auto_renew=False,
            updated_at=now,
        )

        return CompanySubscription.objects.create(
            company=company,
            plan=plan,
            start_date=today,
            end_date=today + timedelta(days=plan.duration_days),
            status=CompanySubscription.Status.ACTIVE,
            auto_renew=True,
        )
