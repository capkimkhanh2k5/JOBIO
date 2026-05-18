from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase, APIClient
from django.contrib.auth import get_user_model
from decimal import Decimal
import hmac
import hashlib
import urllib.parse
from django.conf import settings
from django.utils import timezone
from datetime import timedelta
from urllib.parse import parse_qs, urlparse
from unittest.mock import patch

from apps.billing.services.vnpay import VNPayService
from apps.billing.tasks import cleanup_expired_transactions
from apps.billing.models import (
    Transaction,
    CompanySubscription,
    PaymentMethod,
    SubscriptionPlan,
)
from apps.company.companies.models import Company
from apps.company.industries.models import Industry

User = get_user_model()


class TestVNPayIntegration(APITestCase):
    def setUp(self):
        # Create Data
        self.user = User.objects.create_user(
            email="company@test.com", password="password123", role="company"
        )
        self.industry = Industry.objects.create(name="Tech", slug="tech")
        self.company_profile = Company.objects.create(
            user=self.user,
            company_name="Test Company",
            slug="test-company",
            industry=self.industry,
        )
        self.plan = SubscriptionPlan.objects.create(
            name="Pro Plan",
            slug="pro",
            price=Decimal("100000"),
            currency="VND",
            duration_days=30,
        )
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

    def test_vnpay_service_url_generation(self):
        """Test URL generation logic matches VNPay requirements"""
        url = VNPayService.get_payment_url(
            order_id="TEST_REF",
            amount=Decimal("100000"),
            order_desc="Thanh toán gói Cơ bản! 100%",
            ip_addr="127.0.0.1",
        )
        query = parse_qs(urlparse(url).query)
        self.assertIn("vnp_SecureHash", query)
        self.assertEqual(query["vnp_Amount"][0], "10000000")
        self.assertEqual(query["vnp_OrderInfo"][0], "Thanh toan goi Co ban 100")
        self.assertRegex(query["vnp_CreateDate"][0], r"^\d{14}$")
        self.assertRegex(query["vnp_ExpireDate"][0], r"^\d{14}$")
        self.assertEqual(query["vnp_IpAddr"][0], "127.0.0.1")
        self.assertEqual(query["vnp_OrderType"][0], "other")

    def test_subscribe_api_auto_creates_payment_method(self):
        """Test that subscribe API auto-seeds 'vnpay' payment method"""

        # Ensure no payment method exists initially
        PaymentMethod.objects.all().delete()

        url = reverse("company-subscriptions-subscribe")
        data = {"plan_id": self.plan.id}

        response = self.client.post(url, data)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("payment_url", response.data)

        # Verify PaymentMethod was created
        pm = PaymentMethod.objects.filter(code="vnpay").first()
        self.assertIsNotNone(pm)
        self.assertEqual(pm.name, "VNPay Gateway")

        # Verify Transaction Created
        txn = Transaction.objects.first()
        self.assertEqual(txn.status, Transaction.Status.PENDING)
        self.assertEqual(txn.payment_method, pm)

    def test_payment_return_flow_success(self):
        """Test full cyclic flow: Subscribe -> Get URL -> Return -> Activate"""

        # 1. Subscribe
        url = reverse("company-subscriptions-subscribe")
        response = self.client.post(url, {"plan_id": self.plan.id})
        txn_ref = response.data["transaction_ref"]

        # 2. Simulate User Paying on VNPay -> Validating Return URL
        params = {
            "vnp_Amount": "10000000",
            "vnp_BankCode": "NCB",
            "vnp_CardType": "ATM",
            "vnp_OrderInfo": "Subscribe",
            "vnp_PayDate": "20260101000000",
            "vnp_ResponseCode": "00",
            "vnp_TmnCode": getattr(settings, "VNP_TMN_CODE", "EMBIL7EU"),
            "vnp_TransactionNo": "12345678",
            "vnp_TxnRef": txn_ref,
        }

        # Generate Signature
        sorted_params = sorted(params.items())
        query_str = urllib.parse.urlencode(sorted_params)

        # Use settings (handling mock if needed)
        secret = getattr(
            settings, "VNP_HASH_SECRET", "FP2480JF752TUW5PZWV8MSHCE4FAWB2V"
        )

        secure_hash = hmac.new(
            secret.encode("utf-8"), query_str.encode("utf-8"), hashlib.sha512
        ).hexdigest()

        params["vnp_SecureHash"] = secure_hash

        # 3. Call Return API
        return_url = reverse("company-subscriptions-payment-return")
        response = self.client.get(return_url, {**params, "redirect": "0"})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["message"], "Confirm success")

        # 4. Verify DB State
        txn = Transaction.objects.get(reference_code=txn_ref)
        self.assertEqual(txn.status, Transaction.Status.COMPLETED)
        self.assertEqual(txn.vnp_TransactionNo, "12345678")
        self.assertEqual(txn.metadata.get("plan_id"), self.plan.id)
        self.assertEqual(txn.metadata.get("plan_name"), self.plan.name)

        # Verify Subscription Activated
        sub = CompanySubscription.objects.filter(
            company=self.company_profile,
            plan=self.plan,
            status=CompanySubscription.Status.ACTIVE,
        ).first()
        self.assertIsNotNone(sub)
        self.assertEqual(sub.status, CompanySubscription.Status.ACTIVE)

    def test_payment_return_redirects_to_frontend(self):
        """Browser callback should redirect to the frontend result page."""
        url = reverse("company-subscriptions-subscribe")
        response = self.client.post(url, {"plan_id": self.plan.id})
        txn_ref = response.data["transaction_ref"]

        params = {
            "vnp_Amount": "10000000",
            "vnp_BankCode": "NCB",
            "vnp_CardType": "ATM",
            "vnp_OrderInfo": "Subscribe",
            "vnp_PayDate": "20260101000000",
            "vnp_ResponseCode": "00",
            "vnp_TmnCode": getattr(settings, "VNP_TMN_CODE", "EMBIL7EU"),
            "vnp_TransactionNo": "12345678",
            "vnp_TxnRef": txn_ref,
        }

        sorted_params = sorted(params.items())
        query_str = urllib.parse.urlencode(sorted_params)
        secret = getattr(
            settings, "VNP_HASH_SECRET", "FP2480JF752TUW5PZWV8MSHCE4FAWB2V"
        )
        secure_hash = hmac.new(
            secret.encode("utf-8"), query_str.encode("utf-8"), hashlib.sha512
        ).hexdigest()
        params["vnp_SecureHash"] = secure_hash

        return_url = reverse("company-subscriptions-payment-return")
        browser_client = APIClient()
        response = browser_client.get(return_url, params)

        self.assertEqual(response.status_code, status.HTTP_302_FOUND)
        self.assertIn("/company/payment-result", response["Location"])
        self.assertIn("txnId=", response["Location"])
        self.assertIn("status=success", response["Location"])

    def test_friendly_payment_return_url_allows_anonymous_and_redirects(self):
        """The public friendly return URL must not require auth (VNPay browser callback)."""
        url = reverse("company-subscriptions-subscribe")
        response = self.client.post(url, {"plan_id": self.plan.id})
        txn_ref = response.data["transaction_ref"]

        params = {
            "vnp_Amount": "10000000",
            "vnp_BankCode": "NCB",
            "vnp_CardType": "ATM",
            "vnp_OrderInfo": "Subscribe",
            "vnp_PayDate": "20260101000000",
            "vnp_ResponseCode": "00",
            "vnp_TmnCode": getattr(settings, "VNP_TMN_CODE", "EMBIL7EU"),
            "vnp_TransactionNo": "12345678",
            "vnp_TxnRef": txn_ref,
        }

        sorted_params = sorted(params.items())
        query_str = urllib.parse.urlencode(sorted_params)
        secret = getattr(
            settings, "VNP_HASH_SECRET", "FP2480JF752TUW5PZWV8MSHCE4FAWB2V"
        )
        secure_hash = hmac.new(
            secret.encode("utf-8"), query_str.encode("utf-8"), hashlib.sha512
        ).hexdigest()
        params["vnp_SecureHash"] = secure_hash

        browser_client = APIClient()
        response = browser_client.get("/billing/payment-return", params)

        self.assertEqual(response.status_code, status.HTTP_302_FOUND)
        self.assertIn("/company/payment-result", response["Location"])
        self.assertIn("txnId=", response["Location"])
        self.assertIn("status=success", response["Location"])

    def test_precheck_blocks_different_active_plan(self):
        """Pre-check should block checkout when another active plan exists."""
        other_plan = SubscriptionPlan.objects.create(
            name="Enterprise Plan",
            slug="enterprise",
            price=Decimal("500000"),
            currency="VND",
            duration_days=30,
        )

        active_sub = CompanySubscription.objects.create(
            company=self.company_profile,
            plan=self.plan,
            start_date=timezone.now().date(),
            end_date=timezone.now().date() + timedelta(days=30),
            status=CompanySubscription.Status.ACTIVE,
            auto_renew=True,
        )
        self.assertIsNotNone(active_sub)

        response = self.client.get(
            reverse("company-subscriptions-pre-check"), {"plan_id": other_plan.id}
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.data["can_checkout"])
        self.assertEqual(response.data["mode"], "blocked")
        self.assertEqual(response.data["code"], "ACTIVE_SUBSCRIPTION_EXISTS")

    def test_subscribe_reuses_pending_transaction_for_same_plan(self):
        """Repeated subscribe calls for the same plan should reuse the pending transaction."""
        first = self.client.post(
            reverse("company-subscriptions-subscribe"), {"plan_id": self.plan.id}
        )
        second = self.client.post(
            reverse("company-subscriptions-subscribe"), {"plan_id": self.plan.id}
        )

        self.assertEqual(first.status_code, status.HTTP_200_OK)
        self.assertEqual(second.status_code, status.HTTP_200_OK)
        self.assertEqual(first.data["transaction_ref"], second.data["transaction_ref"])
        self.assertTrue(second.data.get("reused"))

    def test_precheck_allows_same_family_different_duration(self):
        """Pre-check should allow renewal when current and target plans are the same tier family."""
        max_3 = SubscriptionPlan.objects.create(
            name="Max (3 tháng)",
            slug="max-3-thang",
            price=Decimal("1890000"),
            currency="VND",
            duration_days=90,
        )
        max_6 = SubscriptionPlan.objects.create(
            name="Max (6 tháng)",
            slug="max-6-thang",
            price=Decimal("3490000"),
            currency="VND",
            duration_days=180,
        )

        CompanySubscription.objects.create(
            company=self.company_profile,
            plan=max_3,
            start_date=timezone.now().date(),
            end_date=timezone.now().date() + timedelta(days=90),
            status=CompanySubscription.Status.ACTIVE,
            auto_renew=True,
        )

        response = self.client.get(
            reverse("company-subscriptions-pre-check"), {"plan_id": max_6.id}
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["can_checkout"])
        self.assertEqual(response.data["mode"], "renew")

    def test_activate_paid_subscription_extends_when_same_family(self):
        """Successful payment should extend the active subscription for same-tier plans."""
        max_3 = SubscriptionPlan.objects.create(
            name="Max (3 tháng)",
            slug="max-3-thang",
            price=Decimal("1890000"),
            currency="VND",
            duration_days=90,
        )
        max_6 = SubscriptionPlan.objects.create(
            name="Max (6 tháng)",
            slug="max-6-thang",
            price=Decimal("3490000"),
            currency="VND",
            duration_days=180,
        )

        active_sub = CompanySubscription.objects.create(
            company=self.company_profile,
            plan=max_3,
            start_date=timezone.now().date(),
            end_date=timezone.now().date() + timedelta(days=90),
            status=CompanySubscription.Status.ACTIVE,
            auto_renew=True,
        )

        subscribe_resp = self.client.post(
            reverse("company-subscriptions-subscribe"), {"plan_id": max_6.id}
        )
        self.assertEqual(subscribe_resp.status_code, status.HTTP_200_OK)
        txn_ref = subscribe_resp.data["transaction_ref"]

        params = {
            "vnp_Amount": str(int(max_6.price * 100)),
            "vnp_BankCode": "NCB",
            "vnp_CardType": "ATM",
            "vnp_OrderInfo": "Subscribe",
            "vnp_PayDate": "20260101000000",
            "vnp_ResponseCode": "00",
            "vnp_TmnCode": getattr(settings, "VNP_TMN_CODE", "EMBIL7EU"),
            "vnp_TransactionNo": "12345679",
            "vnp_TxnRef": txn_ref,
        }
        sorted_params = sorted(params.items())
        query_str = urllib.parse.urlencode(sorted_params)
        secret = getattr(
            settings, "VNP_HASH_SECRET", "FP2480JF752TUW5PZWV8MSHCE4FAWB2V"
        )
        params["vnp_SecureHash"] = hmac.new(
            secret.encode("utf-8"), query_str.encode("utf-8"), hashlib.sha512
        ).hexdigest()

        self.client.get(
            reverse("company-subscriptions-payment-return"), {**params, "redirect": "0"}
        )

        active_sub.refresh_from_db()
        self.assertEqual(active_sub.plan_id, max_6.id)
        self.assertEqual(active_sub.status, CompanySubscription.Status.ACTIVE)
        self.assertEqual(
            active_sub.end_date, timezone.now().date() + timedelta(days=270)
        )

    def test_vnpay_ipn_idempotent_response(self):
        """IPN callback should return RspCode=02 for already processed transaction"""
        # 1. Subscribe
        url = reverse("company-subscriptions-subscribe")
        response = self.client.post(url, {"plan_id": self.plan.id})
        txn_ref = response.data["transaction_ref"]

        # 2. Prepare callback params
        params = {
            "vnp_Amount": "10000000",
            "vnp_BankCode": "NCB",
            "vnp_CardType": "ATM",
            "vnp_OrderInfo": "Subscribe",
            "vnp_PayDate": "20260101000000",
            "vnp_ResponseCode": "00",
            "vnp_TmnCode": getattr(settings, "VNP_TMN_CODE", "EMBIL7EU"),
            "vnp_TransactionNo": "12345678",
            "vnp_TxnRef": txn_ref,
        }

        sorted_params = sorted(params.items())
        query_str = urllib.parse.urlencode(sorted_params)
        secret = getattr(
            settings, "VNP_HASH_SECRET", "FP2480JF752TUW5PZWV8MSHCE4FAWB2V"
        )
        secure_hash = hmac.new(
            secret.encode("utf-8"), query_str.encode("utf-8"), hashlib.sha512
        ).hexdigest()
        params["vnp_SecureHash"] = secure_hash

        # 3. First process by return endpoint
        return_url = reverse("company-subscriptions-payment-return")
        self.client.get(return_url, params)

        # 4. IPN should now report already confirmed
        ipn_url = reverse("company-subscriptions-vnpay-ipn")
        ipn_response = self.client.get(ipn_url, params)

        self.assertEqual(ipn_response.status_code, status.HTTP_200_OK)
        self.assertEqual(ipn_response.data["RspCode"], "02")

    def test_payment_return_recovers_from_late_success_after_failed(self):
        """A signed delayed success callback should recover txn from FAILED to COMPLETED."""
        subscribe_resp = self.client.post(
            reverse("company-subscriptions-subscribe"), {"plan_id": self.plan.id}
        )
        self.assertEqual(subscribe_resp.status_code, status.HTTP_200_OK)
        txn_ref = subscribe_resp.data["transaction_ref"]

        base_params = {
            "vnp_Amount": "10000000",
            "vnp_BankCode": "NCB",
            "vnp_CardType": "ATM",
            "vnp_OrderInfo": "Subscribe",
            "vnp_PayDate": "20260101000000",
            "vnp_TmnCode": getattr(settings, "VNP_TMN_CODE", "EMBIL7EU"),
            "vnp_TransactionNo": "12345670",
            "vnp_TxnRef": txn_ref,
        }
        secret = getattr(
            settings, "VNP_HASH_SECRET", "FP2480JF752TUW5PZWV8MSHCE4FAWB2V"
        )

        # First callback marks transaction as failed.
        failed_params = {**base_params, "vnp_ResponseCode": "24"}
        failed_query = urllib.parse.urlencode(sorted(failed_params.items()))
        failed_params["vnp_SecureHash"] = hmac.new(
            secret.encode("utf-8"),
            failed_query.encode("utf-8"),
            hashlib.sha512,
        ).hexdigest()
        failed_resp = self.client.get(
            reverse("company-subscriptions-payment-return"),
            {**failed_params, "redirect": "0"},
        )
        self.assertEqual(failed_resp.status_code, status.HTTP_400_BAD_REQUEST)

        txn = Transaction.objects.get(reference_code=txn_ref)
        self.assertEqual(txn.status, Transaction.Status.FAILED)

        # Delayed callback from VNPay with success should recover transaction.
        success_params = {
            **base_params,
            "vnp_ResponseCode": "00",
            "vnp_TransactionNo": "12345671",
        }
        success_query = urllib.parse.urlencode(sorted(success_params.items()))
        success_params["vnp_SecureHash"] = hmac.new(
            secret.encode("utf-8"),
            success_query.encode("utf-8"),
            hashlib.sha512,
        ).hexdigest()
        success_resp = self.client.get(
            reverse("company-subscriptions-payment-return"),
            {**success_params, "redirect": "0"},
        )

        self.assertEqual(success_resp.status_code, status.HTTP_200_OK)
        self.assertEqual(success_resp.data["message"], "Confirm success")

        txn.refresh_from_db()
        self.assertEqual(txn.status, Transaction.Status.COMPLETED)

        sub = CompanySubscription.objects.filter(
            company=self.company_profile,
            plan=self.plan,
            status=CompanySubscription.Status.ACTIVE,
        ).first()
        self.assertIsNotNone(sub)

    def test_cleanup_failed_then_late_success_callback_recovers(self):
        """Cleanup marking txn as failed must not block a later valid success callback."""
        subscribe_resp = self.client.post(
            reverse("company-subscriptions-subscribe"), {"plan_id": self.plan.id}
        )
        self.assertEqual(subscribe_resp.status_code, status.HTTP_200_OK)
        txn_ref = subscribe_resp.data["transaction_ref"]

        txn = Transaction.objects.get(reference_code=txn_ref)
        Transaction.objects.filter(id=txn.id).update(
            created_at=timezone.now() - timedelta(minutes=10)
        )

        with patch(
            "apps.billing.services.vnpay.VNPayService.query_vnpay_transaction",
            return_value={"vnp_ResponseCode": "01"},
        ):
            cleanup_expired_transactions()

        txn.refresh_from_db()
        self.assertEqual(txn.status, Transaction.Status.FAILED)

        params = {
            "vnp_Amount": "10000000",
            "vnp_BankCode": "NCB",
            "vnp_CardType": "ATM",
            "vnp_OrderInfo": "Subscribe",
            "vnp_PayDate": "20260101000000",
            "vnp_ResponseCode": "00",
            "vnp_TmnCode": getattr(settings, "VNP_TMN_CODE", "EMBIL7EU"),
            "vnp_TransactionNo": "12345672",
            "vnp_TxnRef": txn_ref,
        }
        secret = getattr(
            settings, "VNP_HASH_SECRET", "FP2480JF752TUW5PZWV8MSHCE4FAWB2V"
        )
        signed_query = urllib.parse.urlencode(sorted(params.items()))
        params["vnp_SecureHash"] = hmac.new(
            secret.encode("utf-8"),
            signed_query.encode("utf-8"),
            hashlib.sha512,
        ).hexdigest()

        response = self.client.get(
            reverse("company-subscriptions-payment-return"), {**params, "redirect": "0"}
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        txn.refresh_from_db()
        self.assertEqual(txn.status, Transaction.Status.COMPLETED)
        self.assertTrue(
            CompanySubscription.objects.filter(
                company=self.company_profile,
                plan=self.plan,
                status=CompanySubscription.Status.ACTIVE,
            ).exists()
        )
