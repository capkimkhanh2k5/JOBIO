from datetime import timedelta

from django.conf import settings
from django.db import transaction
from django.utils import timezone

from apps.billing.models import Transaction, PaymentMethod
from apps.billing.services.vnpay import VNPayService


class PaymentService:
    @staticmethod
    def fail_stale_pending_transactions(*, company=None, plan_id=None) -> int:
        """
        Mark locally expired pending transactions as failed.

        VNPay can still send a late success callback; VNPayService already allows
        a valid success callback to recover a previously failed transaction.
        """
        now = timezone.now()
        threshold = now - timedelta(minutes=settings.PAYMENT_PENDING_TIMEOUT_MINUTES)
        queryset = Transaction.objects.filter(
            status=Transaction.Status.PENDING,
            type=Transaction.Type.SUBSCRIPTION,
            created_at__lt=threshold,
        )

        if company is not None:
            queryset = queryset.filter(company=company)
        if plan_id is not None:
            queryset = queryset.filter(metadata__plan_id=plan_id)

        return queryset.update(status=Transaction.Status.FAILED, updated_at=now)

    @staticmethod
    def fail_existing_pending_checkout(*, company, plan_id) -> int:
        """
        Supersede unfinished checkout attempts for the same company and plan.

        VNPay expects a unique vnp_TxnRef per payment attempt. Reusing a pending
        reference can send users to VNPay's code=01 page.
        """
        now = timezone.now()
        return Transaction.objects.filter(
            company=company,
            status=Transaction.Status.PENDING,
            type=Transaction.Type.SUBSCRIPTION,
            metadata__plan_id=plan_id,
        ).update(status=Transaction.Status.FAILED, updated_at=now)

    @staticmethod
    def process_payment(
        company,
        amount,
        payment_method: PaymentMethod,
        description: str = "",
        ip_addr: str = "127.0.0.1",
        metadata: dict | None = None,
    ) -> tuple[Transaction, str]:
        """
        Initiate payment process.
        Returns:
            (Transaction, payment_url)
        """

        VNPayService.ensure_configured(
            "VNP_TMN_CODE", "VNP_HASH_SECRET", "VNP_URL", "VNP_RETURN_URL"
        )

        # 1. Create Pending Transaction
        with transaction.atomic():
            txn = Transaction.objects.create(
                company=company,
                payment_method=payment_method,
                amount=amount,
                status=Transaction.Status.PENDING,
                description=description,
                ip_address=ip_addr,
                metadata=metadata or {},
            )

            # Generate unique reference code based on ID
            txn.reference_code = f"ORDER_{txn.id}_{company.id}"
            txn.save()

        # 2. Generate Payment URL (VNPay)

        payment_url = VNPayService.get_payment_url(
            order_id=txn.reference_code,
            amount=amount,
            order_desc=description,
            ip_addr=ip_addr,
        )

        return txn, payment_url
