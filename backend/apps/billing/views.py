from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser, AllowAny

from apps.billing.models import SubscriptionPlan, CompanySubscription, PaymentMethod, Transaction
from apps.billing.serializers import (
    SubscriptionPlanSerializer, 
    CompanySubscriptionSerializer, 
    PaymentMethodSerializer, 
    TransactionSerializer,
    SubscribeInputSerializer
)
from apps.billing.services.subscriptions import SubscriptionService
from apps.billing.services.payments import PaymentService
from apps.billing.services.plans import PlanService
from apps.core.permissions import IsCompanyOwner
from apps.billing.services.vnpay import VNPayService, VNPaySecurityError


class SubscriptionPlanViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = SubscriptionPlan.objects.filter(is_active=True)
    serializer_class = SubscriptionPlanSerializer
    permission_classes = [AllowAny]
    lookup_field = 'slug'

class CompanySubscriptionViewSet(viewsets.GenericViewSet):
    permission_classes = [IsAuthenticated, IsCompanyOwner]
    serializer_class = CompanySubscriptionSerializer
    
    def get_queryset(self):
        return CompanySubscription.objects.filter(company__user=self.request.user)

    @action(detail=False, methods=['get'], url_path='current')
    def current(self, request):
        company_profile = getattr(request.user, 'company_profile', None)
        if not company_profile:
            return Response({"error": "User is not a company"}, status=status.HTTP_403_FORBIDDEN)
            
        sub = CompanySubscription.objects.filter(company=company_profile, status=CompanySubscription.Status.ACTIVE).first()
        if not sub:
            return Response({"detail": "No active subscription"}, status=status.HTTP_404_NOT_FOUND)
            
        serializer = self.get_serializer(sub)
        return Response(serializer.data)

    @action(detail=False, methods=['post'], url_path='subscribe')
    def subscribe(self, request):
        input_ser = SubscribeInputSerializer(data=request.data)
        input_ser.is_valid(raise_exception=True)
        
        company_profile = getattr(request.user, 'company_profile', None)
        plan = SubscriptionPlan.objects.get(id=input_ser.validated_data['plan_id'])
        
        # Get IP Address
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
            
        try:
            # Default to VNPay, auto-create if missing (Robustness)
            pm, created = PaymentMethod.objects.get_or_create(
                code='vnpay',
                defaults={
                    'name': 'VNPay Gateway',
                    'is_active': True,
                    'config': {} 
                }
            )
            
            # Calculate Amount (Check Plan Logic)
            amount = plan.price # Simplification
            
            txn, payment_url = PaymentService.process_payment(
                company=company_profile,
                amount=amount,
                payment_method=pm, 
                description=f"Subscribe to {plan.name}",
                ip_addr=ip
            )
            
            # Store Plan ID in Transaction for callback processing? 
            # Or better: Create Inactive Subscription first?
            # Creating Inactive Subscription is safer:
            sub = SubscriptionService.subscribe(company_profile, plan)
            # Override to inactive
            sub.status = CompanySubscription.Status.EXPIRED # Pending/Inactive
            sub.save()
            
            # Link TXN to Sub? (Using description or Reference Code hack for now as Models don't have direct link)
            txn.description = f"PLAN_ID:{plan.id}|SUB_ID:{sub.id}"
            txn.save()

            return Response({
                "payment_url": payment_url, 
                "transaction_ref": txn.reference_code
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['get'], url_path='payment-return', permission_classes=[AllowAny])
    def payment_return(self, request):
        """
        Handle VNPay Return URL (Callback from User Browser).
        Enhanced với security validation và idempotency.
        """
        try:
            # Use secure callback processing
            result = VNPayService.process_callback_secure(request.GET)
            
            if result['success']:
                return Response({
                    "message": result['message'],
                    "transaction_ref": result['transaction'].reference_code if result['transaction'] else None,
                    "subscription_id": str(result['subscription'].id) if result['subscription'] else None
                })
            else:
                return Response({
                    "error": result['message'],
                    "transaction_ref": result['transaction'].reference_code if result['transaction'] else None
                }, status=status.HTTP_400_BAD_REQUEST)
                
        except VNPaySecurityError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"error": f"Internal error: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['post'], url_path='cancel')
    def cancel(self, request):
        company_profile = getattr(request.user, 'company_profile', None)
        try:
            sub = SubscriptionService.cancel_subscription(company_profile)
            return Response({"status": "cancelled", "end_date": sub.end_date})
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

class TransactionViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [IsAuthenticated, IsCompanyOwner]
    serializer_class = TransactionSerializer
    
    def get_queryset(self):
        if hasattr(self.request.user, 'company_profile'):
            return Transaction.objects.filter(company=self.request.user.company_profile).order_by('-created_at')
        return Transaction.objects.none()
