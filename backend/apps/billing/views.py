import logging
from datetime import timedelta

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.shortcuts import redirect
from django.utils import timezone
from django.db import models

from apps.billing.models import SubscriptionPlan, CompanySubscription, PaymentMethod, Transaction
from apps.billing.serializers import (
    SubscriptionPlanSerializer, 
    CompanySubscriptionSerializer, 
    TransactionSerializer,
    SubscribeInputSerializer
)
from apps.billing.services.subscriptions import SubscriptionService
from apps.billing.services.payments import PaymentService
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

        sub = SubscriptionService.get_active_subscription(company_profile.id)
        if not sub:
            return Response({"error": "Subscription not found"}, status=status.HTTP_404_NOT_FOUND)
            
        serializer = self.get_serializer(sub)
        return Response(serializer.data)

    @action(detail=False, methods=['post'], url_path='subscribe')
    def subscribe(self, request):
        input_ser = SubscribeInputSerializer(data=request.data)
        input_ser.is_valid(raise_exception=True)
        
        company_profile = getattr(request.user, 'company_profile', None)
        plan = SubscriptionPlan.objects.filter(id=input_ser.validated_data['plan_id'], is_active=True).first()
        if not plan:
            return Response({"error": "Gói đăng ký không tồn tại hoặc đã ngừng hoạt động."}, status=status.HTTP_400_BAD_REQUEST)
        
        # Get IP Address
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
            
        try:
            active_sub = SubscriptionService.get_active_subscription(company_profile.id)
            is_same_family = active_sub and SubscriptionService.is_same_plan_family(active_sub.plan, plan)
            if active_sub and not is_same_family:
                return Response(
                    {
                        "error": "Bạn đang có gói hoạt động. Vui lòng gia hạn cùng gói hiện tại hoặc chờ hết hạn để đổi gói.",
                        "code": "ACTIVE_SUBSCRIPTION_EXISTS",
                        "current_plan": active_sub.plan.name,
                        "current_end_date": str(active_sub.end_date),
                    },
                    status=status.HTTP_409_CONFLICT,
                )

            # Default to VNPay, auto-create if missing (Robustness)
            pm, created = PaymentMethod.objects.get_or_create(
                code='vnpay',
                defaults={
                    'name': 'VNPay Gateway',
                    'is_active': True,
                    'config': {} 
                }
            )

            # Reuse pending transaction for same plan to avoid duplicate checkout creation.
            pending_txn = Transaction.objects.filter(
                company=company_profile,
                status=Transaction.Status.PENDING,
                type=Transaction.Type.SUBSCRIPTION,
                metadata__plan_id=plan.id,
                created_at__gte=timezone.now() - timedelta(minutes=15),
            ).order_by('-created_at').first()
            if pending_txn:
                reused_payment_url = VNPayService.get_payment_url(
                    order_id=pending_txn.reference_code,
                    amount=pending_txn.amount,
                    order_desc=f"Subscribe to {plan.name}",
                    ip_addr=ip,
                )
                return Response(
                    {
                        "payment_url": reused_payment_url,
                        "transaction_ref": pending_txn.reference_code,
                        "reused": True,
                    },
                    status=status.HTTP_200_OK,
                )
            
            # Calculate Amount (Check Plan Logic)
            amount = plan.price # Simplification
            txn_metadata = {
                "plan_id": plan.id,
                "plan_slug": plan.slug,
                "plan_name": plan.name,
                "payment_method_code": pm.code,
                "action": 'renew' if is_same_family else 'new',
                "company_id": company_profile.id,
            }
            
            txn, payment_url = PaymentService.process_payment(
                company=company_profile,
                amount=amount,
                payment_method=pm, 
                description=f"Subscribe to {plan.name}",
                ip_addr=ip,
                metadata=txn_metadata,
            )

            action = txn_metadata['action']
            txn.description = f"Subscribe to {plan.name}|PLAN_ID:{plan.id}|ACTION:{action}"
            txn.metadata = txn_metadata
            txn.save()

            return Response({
                "payment_url": payment_url, 
                "transaction_ref": txn.reference_code
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['get'], url_path='pre-check')
    def pre_check(self, request):
        """
        Validate current subscription state before opening checkout.
        Returns a machine-readable status for the frontend.
        """
        company_profile = getattr(request.user, 'company_profile', None)
        if not company_profile:
            return Response({"error": "User is not a company"}, status=status.HTTP_403_FORBIDDEN)

        plan_id = request.query_params.get('plan_id')
        if not plan_id:
            return Response({"error": "plan_id is required"}, status=status.HTTP_400_BAD_REQUEST)

        plan = SubscriptionPlan.objects.filter(id=plan_id, is_active=True).first()
        if not plan:
            return Response({"error": "Gói đăng ký không tồn tại hoặc đã ngừng hoạt động."}, status=status.HTTP_404_NOT_FOUND)

        active_sub = SubscriptionService.get_active_subscription(company_profile.id)
        pending_txn = Transaction.objects.filter(
            company=company_profile,
            status=Transaction.Status.PENDING,
            type=Transaction.Type.SUBSCRIPTION,
            metadata__plan_id=plan.id,
            created_at__gte=timezone.now() - timedelta(minutes=15),
        ).order_by('-created_at').first()

        result = {
            "can_checkout": True,
            "mode": "new",
            "plan": {
                "id": plan.id,
                "name": plan.name,
                "slug": plan.slug,
                "duration_days": plan.duration_days,
                "price": str(plan.price),
            },
            "current_subscription": None,
            "pending_transaction": None,
        }

        if active_sub:
            is_same_family = SubscriptionService.is_same_plan_family(active_sub.plan, plan)
            result["current_subscription"] = {
                "id": active_sub.id,
                "plan_id": active_sub.plan_id,
                "plan_name": active_sub.plan.name,
                "status": active_sub.status,
                "end_date": str(active_sub.end_date),
            }

            if is_same_family:
                result["mode"] = "renew"
                result["message"] = "Bạn đang có gói cùng hạng. Thanh toán sẽ cộng dồn thêm thời gian và cập nhật chu kỳ mới."
            else:
                result["mode"] = "blocked"
                result["can_checkout"] = False
                result["message"] = "Bạn đang có gói hoạt động khác. Vui lòng gia hạn gói hiện tại trước khi đổi gói."
                result["code"] = "ACTIVE_SUBSCRIPTION_EXISTS"
                return Response(result, status=status.HTTP_200_OK)

        if pending_txn:
            result["mode"] = "pending_reuse"
            result["pending_transaction"] = {
                "id": pending_txn.id,
                "reference_code": pending_txn.reference_code,
                "created_at": pending_txn.created_at.isoformat(),
            }
            result["message"] = "Đã có giao dịch chờ thanh toán cho gói này, hệ thống sẽ tái sử dụng giao dịch đó."

        if "message" not in result:
            result["message"] = "Có thể tiếp tục thanh toán cho gói này."

        return Response(result, status=status.HTTP_200_OK)

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
        if not hasattr(self.request.user, 'company_profile'):
            return Transaction.objects.none()
            
        queryset = Transaction.objects.filter(company=self.request.user.company_profile).order_by('-created_at')
        
        # Filtering
        status = self.request.query_params.get('status')
        if status:
            queryset = queryset.filter(status=status)
            
        # Search
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                models.Q(reference_code__icontains=search) | 
                models.Q(description__icontains=search)
            )
            
        return queryset
