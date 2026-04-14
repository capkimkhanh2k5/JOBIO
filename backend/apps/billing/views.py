import logging

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser, AllowAny
from django.shortcuts import redirect

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


logger = logging.getLogger(__name__)


class SubscriptionPlanViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = SubscriptionPlan.objects.filter(is_active=True)
    serializer_class = SubscriptionPlanSerializer
    permission_classes = [AllowAny]
    lookup_field = 'slug'
    pagination_class = None

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
            return Response(None, status=status.HTTP_200_OK)
            
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
            
            sub = SubscriptionService.subscribe(company_profile, plan)

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

            # Browser redirect flow from VNPay should land on frontend result page.
            frontend_redirect = request.query_params.get('redirect', '1') != '0'
            if frontend_redirect:
                return redirect(VNPayService.build_frontend_result_url(result))
            
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

    @action(detail=False, methods=['get'], url_path='vnpay-ipn', permission_classes=[AllowAny])
    def vnpay_ipn(self, request):
        """
        Xử lý Instant Payment Notification (IPN) từ VNPay.
        Đảm bảo cập nhật trạng thái ngay cả khi người dùng tắt trình duyệt.
        """
        try:
            # Xử lý thông qua service chung
            result = VNPayService.process_callback_secure(request.GET)

            rsp_code = result.get('rsp_code', '99')
            if result.get('success') and result.get('message') != 'Order already confirmed':
                message = 'Confirm Success'
            elif rsp_code == '02':
                message = 'Order already confirmed'
            elif rsp_code == '01':
                message = 'Order not found'
            elif rsp_code == '04':
                message = 'Invalid amount'
            elif rsp_code == '97':
                message = 'Invalid Checksum'
            else:
                message = 'Confirm Success' if rsp_code == '00' else result.get('message', 'Unknown error')
            
            # Phản hồi JSON theo yêu cầu của VNPay
            return Response({
                "RspCode": rsp_code,
                "Message": message
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"IPN Processing Error: {str(e)}")
            return Response({
                "RspCode": "99",
                "Message": "Unknown error"
            }, status=status.HTTP_200_OK) # Luôn trả về 200 cho VNPay IPN

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
