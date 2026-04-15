"""
Billing Views Tests - Django TestCase Version
"""
from datetime import timedelta

from rest_framework import status
from rest_framework.test import APITestCase
from django.urls import reverse
from django.contrib.auth import get_user_model
from django.utils import timezone

from apps.billing.models import SubscriptionPlan, CompanySubscription, PaymentMethod, Transaction
from apps.company.companies.models import Company
from apps.company.industries.models import Industry

User = get_user_model()


class TestSubscriptionPlanViewSet(APITestCase):
    """Tests for SubscriptionPlan ViewSet"""
    
    @classmethod
    def setUpTestData(cls):
        cls.plan = SubscriptionPlan.objects.create(
            name="Pro Plan",
            slug="pro",
            price=1000000,
            currency="VND",
            duration_days=30
        )
    
    def test_list_plans_public(self):
        """Public users can list subscription plans"""
        url = reverse('subscription-plans-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['slug'], self.plan.slug)


class TestCompanySubscriptionViewSet(APITestCase):
    """Tests for CompanySubscription ViewSet"""
    
    @classmethod
    def setUpTestData(cls):
        cls.industry = Industry.objects.create(name="Tech", slug="tech")
        cls.user = User.objects.create_user(
            email="company@test.com",
            password="password123",
            first_name="Test",
            last_name="Owner",
            role='company'
        )
        cls.company = Company.objects.create(
            user=cls.user,
            company_name="Test Company",
            slug="test-company",
            industry=cls.industry,
            description="A test company"
        )
        cls.plan = SubscriptionPlan.objects.create(
            name="Pro Plan",
            slug="pro-sub",
            price=1000000,
            currency="VND",
            duration_days=30
        )
        
    def setUp(self):
        self.client.force_authenticate(user=self.user)
    
    def test_get_current_subscription_none(self):
        """Get current subscription returns 404 when none exists"""
        url = reverse('company-subscriptions-current')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
    
    def test_subscribe_success(self):
        """User can subscribe to a plan - returns payment URL for VNPay flow"""
        url = reverse('company-subscriptions-subscribe')
        data = {'plan_id': self.plan.id}
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('payment_url', response.data)
        self.assertIn('transaction_ref', response.data)
    
    def test_cancel_subscription(self):
        """User can cancel their subscription"""
        # First subscribe via service directly (not through VNPay flow)
        from apps.billing.services.subscriptions import SubscriptionService
        sub = SubscriptionService.subscribe(self.company, self.plan)
        
        # Then cancel
        url_cancel = reverse('company-subscriptions-cancel')
        response = self.client.post(url_cancel)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'cancelled')
        
        # Verify auto_renew is False in DB
        sub.refresh_from_db()
        self.assertFalse(sub.auto_renew)

    def test_get_current_subscription_ignores_expired_active(self):
        """Current endpoint should not return ACTIVE subscriptions that are already out of date."""
        CompanySubscription.objects.create(
            company=self.company,
            plan=self.plan,
            start_date=timezone.now().date() - timedelta(days=31),
            end_date=timezone.now().date() - timedelta(days=1),
            status=CompanySubscription.Status.ACTIVE,
        )

        url = reverse('company-subscriptions-current')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_pre_check_ignores_stale_pending_transaction(self):
        """Pre-check should only surface reusable pending transactions inside reuse window."""
        payment_method = PaymentMethod.objects.create(name='VNPay', code='vnpay')
        tx = Transaction.objects.create(
            company=self.company,
            payment_method=payment_method,
            amount=self.plan.price,
            type=Transaction.Type.SUBSCRIPTION,
            status=Transaction.Status.PENDING,
            reference_code='ORDER_STALE_1',
            metadata={'plan_id': self.plan.id},
        )
        Transaction.objects.filter(id=tx.id).update(created_at=timezone.now() - timedelta(minutes=30))

        url = reverse('company-subscriptions-pre-check')
        response = self.client.get(url, {'plan_id': self.plan.id})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertNotEqual(response.data.get('mode'), 'pending_reuse')


class TestTransactionViewSet(APITestCase):
    """Tests for Transaction ViewSet"""
    
    @classmethod
    def setUpTestData(cls):
        cls.industry = Industry.objects.create(name="Finance", slug="finance")
        cls.user = User.objects.create_user(
            email="transaction_test@test.com",
            password="password123",
            first_name="Trans",
            last_name="User",
            role='company'
        )
        cls.company = Company.objects.create(
            user=cls.user,
            company_name="Trans Company",
            slug="trans-company",
            industry=cls.industry,
            description="A transaction test company"
        )
        
    def setUp(self):
        self.client.force_authenticate(user=self.user)
    
    def test_list_transactions(self):
        """List transactions for company - transactions created via subscribe flow"""
        # Subscribe creates a transaction via PaymentService.process_payment
        plan = SubscriptionPlan.objects.create(
            name="List Test Plan", 
            slug="list-test-plan", 
            price=100000, 
            duration_days=30
        )
        
        url_sub = reverse('company-subscriptions-subscribe')
        self.client.post(url_sub, {'plan_id': plan.id})
        
        url = reverse('transactions-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # At least 1 transaction should exist
        self.assertGreaterEqual(len(response.data), 1)
