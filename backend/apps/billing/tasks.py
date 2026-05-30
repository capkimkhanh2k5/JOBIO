import logging
from celery import shared_task
from django.utils import timezone
from django.conf import settings
from apps.billing.models import Transaction, CompanySubscription, SubscriptionPlan
from apps.billing.services.subscriptions import SubscriptionService
from apps.email.services import EmailService
from apps.recruitment.jobs.models import Job
from datetime import timedelta

logger = logging.getLogger(__name__)


@shared_task(name="apps.billing.tasks.send_payment_confirmation_email_task")
def send_payment_confirmation_email_task(transaction_id):
    """
    Tác vụ chạy ngầm để gửi email xác nhận sau khi thanh toán thành công.
    """
    try:
        # 1. Lấy thông tin giao dịch
        txn = Transaction.objects.select_related("company", "company__user").get(
            id=transaction_id
        )

        if txn.status != Transaction.Status.COMPLETED:
            logger.warning(
                f"Attempted to send confirmation for incomplete txn: {transaction_id}"
            )
            return False

        # 2. Lấy thông tin người nhận
        recipient_email = txn.company.user.email
        company_name = txn.company.company_name

        # 3. Lấy thông tin Subscription (nếu có)
        subscription = None
        plan_name = "N/A"
        end_date = "N/A"

        plan_id = SubscriptionService.get_transaction_plan_id(txn)
        if plan_id:
            try:
                subscription = (
                    CompanySubscription.objects.select_related("plan")
                    .filter(
                        company=txn.company,
                        plan_id=plan_id,
                        status=CompanySubscription.Status.ACTIVE,
                    )
                    .order_by("-created_at")
                    .first()
                )
                if not subscription:
                    subscription = (
                        CompanySubscription.objects.select_related("plan")
                        .filter(
                            company=txn.company,
                            plan_id=plan_id,
                        )
                        .order_by("-created_at")
                        .first()
                    )

                plan_name = subscription.plan.name
                end_date = subscription.end_date.strftime("%d/%m/%Y")
            except Exception as e:
                logger.error(f"Error fetching subscription for email: {e}")

        # 4. Soạn nội dung email (HTML)
        subject = f"Xác nhận thanh toán thành công - Gói {plan_name}"

        html_body = f"""
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
            <div style="text-align: center; margin-bottom: 24px;">
                <h2 style="color: #2563eb; margin-bottom: 8px;">Thanh toán thành công!</h2>
                <p style="color: #64748b;">Cảm ơn bạn đã tin dùng dịch vụ của JOBIO</p>
            </div>
            
            <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 24px;">
                <h4 style="margin-top: 0; color: #1e293b; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px;">Thông tin đơn hàng</h4>
                <table style="width: 100%; font-size: 14px; color: #475569; border-collapse: collapse;">
                    <tr>
                        <td style="padding: 8px 0;"><strong>Công ty:</strong></td>
                        <td style="text-align: right; padding: 8px 0;">{company_name}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0;"><strong>Gói dịch vụ:</strong></td>
                        <td style="text-align: right; padding: 8px 0;">{plan_name}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0;"><strong>Số tiền:</strong></td>
                        <td style="text-align: right; color: #059669; font-weight: bold; padding: 8px 0;">{txn.amount:,.0f} {txn.currency}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0;"><strong>Mã tham chiếu:</strong></td>
                        <td style="text-align: right; padding: 8px 0;">{txn.reference_code}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0;"><strong>Ngày hết hạn:</strong></td>
                        <td style="text-align: right; padding: 8px 0;">{end_date}</td>
                    </tr>
                </table>
            </div>
            
            <p style="font-size: 14px; color: #475569; line-height: 1.6;">
                Tài khoản của bạn đã được nâng cấp lên gói <strong>{plan_name}</strong>. Bạn có thể bắt đầu sử dụng đầy đủ các tính năng dành cho Nhà tuyển dụng chuyên nghiệp ngay bây giờ.
            </p>
            
            <div style="text-align: center; margin-top: 32px;">
                <a href="{settings.FRONTEND_URL}/dashboard" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 14px;">Quay lại Dashboard</a>
            </div>
            
            <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 12px; color: #94a3b8;">
                <p>&copy; {timezone.now().year} JOBIO Recruitment Platform. All rights reserved.</p>
                <p>Email này được gửi tự động, vui lòng không trả lời.</p>
            </div>
        </div>
        """

        # 5. Gửi email thông qua EmailService
        success = EmailService.send_email(
            recipient=recipient_email, subject=subject, body=html_body
        )

        if success:
            logger.info(
                f"Payment confirmation email sent to {recipient_email} for txn {txn.reference_code}"
            )
        else:
            logger.error(
                f"Failed to send payment confirmation email to {recipient_email}"
            )

        return success

    except Transaction.DoesNotExist:
        logger.error(f"Transaction {transaction_id} not found for email task")
    except Exception as e:
        logger.error(f"Error in payment confirmation task: {str(e)}")
    return False


@shared_task(name="apps.billing.tasks.cleanup_expired_transactions")
def cleanup_expired_transactions():
    """
    Quét các giao dịch PENDING quá hạn và kiểm tra trạng thái thực tế.
    """

    timeout_minutes = settings.PAYMENT_PENDING_TIMEOUT_MINUTES
    threshold = timezone.now() - timedelta(minutes=timeout_minutes)
    pending_txns = Transaction.objects.filter(
        status=Transaction.Status.PENDING, created_at__lt=threshold
    )

    count = 0
    for txn in pending_txns:
        logger.info(f"Checking expired transaction: {txn.reference_code}")
        try:
            from apps.billing.services.vnpay import VNPayService

            # Query VNPay
            result = VNPayService.query_vnpay_transaction(txn.reference_code)

            # Phản hồi từ VNPay QueryDR: vnp_ResponseCode, vnp_TransactionStatus
            # vnp_TransactionStatus: 00 (Thành công), 02 (Lỗi), 04 (Hoàn tiền), 05 (Đang xử lý),...
            if result.get("vnp_ResponseCode") == "00":
                status = result.get("vnp_TransactionStatus")
                if status == "00":
                    # QueryDR không trả callback signature nên cập nhật trực tiếp.
                    txn.status = Transaction.Status.COMPLETED
                    txn.vnp_TransactionNo = (
                        result.get("vnp_TransactionNo") or txn.vnp_TransactionNo
                    )
                    txn.vnp_BankCode = result.get("vnp_BankCode") or txn.vnp_BankCode
                    txn.vnp_CardType = result.get("vnp_CardType") or txn.vnp_CardType
                    txn.vnp_OrderInfo = result.get("vnp_OrderInfo") or txn.vnp_OrderInfo
                    txn.save()

                    plan_id = SubscriptionService.get_transaction_plan_id(txn)
                    if plan_id:
                        try:
                            plan = SubscriptionPlan.objects.get(id=plan_id)
                            SubscriptionService.activate_paid_subscription(
                                txn.company, plan
                            )
                        except Exception as e:
                            logger.error(
                                f"Failed activating subscription from cleanup for txn {txn.reference_code}: {e}"
                            )
                elif status in ["02", "03", "04", "06", "07", "09"]:
                    # Giao dịch lỗi hoặc đã bị hủy
                    txn.status = Transaction.Status.FAILED
                    txn.save()
                elif status == "05":
                    # Vẫn đang chờ hoặc đang xử lý, giữ nguyên
                    pass
            else:
                # Không tìm thấy giao dịch trên VNPay hoặc lỗi checksum
                # Quá thời hạn mà không thấy thì coi như fail
                txn.status = Transaction.Status.FAILED
                txn.save()
            count += 1
        except Exception as e:
            logger.error(f"Error cleaning up txn {txn.reference_code}: {e}")

    return f"Cleaned up {count} transactions"


@shared_task(name="apps.billing.tasks.cleanup_expired_subscriptions")
def cleanup_expired_subscriptions():
    """
    Quét các gói dịch vụ ACTIVE đã quá hạn (end_date < today)
    và chuyển sang trạng thái EXPIRED, đồng thời gỡ nhãn featured của các jobs.
    """
    now = timezone.localdate()
    expired_subs = CompanySubscription.objects.filter(
        status=CompanySubscription.Status.ACTIVE, end_date__lt=now
    )

    comp_ids = list(expired_subs.values_list("company_id", flat=True))
    count = expired_subs.count()

    if count > 0:
        # 1. Chuyển trạng thái subscription
        expired_subs.update(status=CompanySubscription.Status.EXPIRED)

        # 2. Gỡ nhãn featured của các jobs thuộc các công ty này
        Job.objects.filter(company_id__in=comp_ids, featured=True).update(
            featured=False, featured_until=None
        )

        logger.info(
            f"Successfully expired {count} subscriptions and cleaned up jobs for companies: {comp_ids}"
        )

    return f"Expired {count} subscriptions"
