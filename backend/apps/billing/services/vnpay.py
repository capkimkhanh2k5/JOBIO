import hashlib
import hmac
import logging
import re
import urllib.parse
import unicodedata
from datetime import datetime, timedelta
from decimal import Decimal, InvalidOperation
from django.conf import settings
from django.db import transaction
from django.utils import timezone
from apps.billing.models import CompanySubscription, Transaction, SubscriptionPlan
from apps.billing.services.subscriptions import SubscriptionService

# send_payment_confirmation_email_task sẽ được import bên trong method để tránh circular import
import requests
from zoneinfo import ZoneInfo

logger = logging.getLogger(__name__)


class VNPaySecurityError(Exception):
    """Exception cho các lỗi bảo mật VNPay."""

    pass


class VNPayService:
    """
    Service for handling VNPay payment gateway integration.
    """

    @staticmethod
    def ensure_configured(*names: str) -> None:
        missing = [
            name for name in names if not str(getattr(settings, name, "")).strip()
        ]
        if missing:
            logger.error("VNPay configuration missing: %s", ", ".join(missing))
            raise VNPaySecurityError("Payment gateway not properly configured")

    @staticmethod
    def _normalize_vnpay_order_info(order_desc: str) -> str:
        """Normalize order info to ASCII text accepted by VNPay."""
        normalized = (
            unicodedata.normalize("NFKD", str(order_desc or ""))
            .encode("ascii", "ignore")
            .decode("ascii")
        )
        normalized = re.sub(r"[^A-Za-z0-9 ]+", " ", normalized)
        normalized = re.sub(r"\s+", " ", normalized).strip()
        return normalized[:255] or "Thanh toan"

    @staticmethod
    def _format_vnpay_datetime(value: datetime) -> str:
        """Format datetime in VNPay-required GMT+7 string format."""
        vnpay_tz = ZoneInfo("Asia/Ho_Chi_Minh")
        return value.astimezone(vnpay_tz).strftime("%Y%m%d%H%M%S")

    @staticmethod
    def _build_hash_data(params) -> str:
        filtered_params = {
            key: val
            for key, val in params.items()
            if key.startswith("vnp_")
            and key not in ["vnp_SecureHash", "vnp_SecureHashType"]
        }
        return "&".join(
            f"{key}={urllib.parse.quote_plus(str(val))}"
            for key, val in sorted(filtered_params.items())
        )

    @staticmethod
    def _sign_hash_data(hash_data: str) -> str:
        vnp_hash_secret = settings.VNP_HASH_SECRET
        return hmac.new(
            vnp_hash_secret.encode("utf-8"), hash_data.encode("utf-8"), hashlib.sha512
        ).hexdigest()

    @staticmethod
    def _secure_hash_matches(expected_hash: str, received_hash: str) -> bool:
        return hmac.compare_digest(
            str(expected_hash).upper(),
            str(received_hash).upper(),
        )

    @staticmethod
    def get_payment_url(order_id, amount, order_desc, ip_addr):
        """
        Generate VNPay payment URL.

        Args:
            order_id (str): Unique transaction reference.
            amount (Decimal): Amount in VND.
            order_desc (str): Description of the order.
            ip_addr (str): Client IP address.

        Returns:
            str: Full redirect URL to VNPay.
        """

        VNPayService.ensure_configured(
            "VNP_TMN_CODE", "VNP_HASH_SECRET", "VNP_URL", "VNP_RETURN_URL"
        )

        # 1. Prepare Base Params
        clean_desc = VNPayService._normalize_vnpay_order_info(order_desc)
        create_date = VNPayService._format_vnpay_datetime(timezone.now())
        expire_date = VNPayService._format_vnpay_datetime(
            timezone.now() + timedelta(minutes=settings.PAYMENT_PENDING_TIMEOUT_MINUTES)
        )

        try:
            amount_value = int(Decimal(str(amount)) * Decimal("100"))
        except (InvalidOperation, TypeError, ValueError) as exc:
            raise ValueError(f"Invalid VNPay amount: {amount}") from exc

        vnp_params = {
            "vnp_Version": "2.1.0",
            "vnp_Command": "pay",
            "vnp_TmnCode": settings.VNP_TMN_CODE,
            "vnp_Amount": amount_value,  # Required: Amount * 100
            "vnp_CurrCode": "VND",
            "vnp_TxnRef": str(order_id),
            "vnp_OrderInfo": clean_desc,
            "vnp_OrderType": "other",
            "vnp_Locale": "vn",
            "vnp_ReturnUrl": settings.VNP_RETURN_URL,
            "vnp_IpAddr": ip_addr if ip_addr and ":" not in ip_addr else "127.0.0.1",
            "vnp_CreateDate": create_date,
            "vnp_ExpireDate": expire_date,
        }

        # 2. Create canonical query string & raw hash data
        hasData = VNPayService._build_hash_data(vnp_params)

        # 3. Generate Checksum (HMAC-SHA512)
        vnp_SecureHash = VNPayService._sign_hash_data(hasData)

        # 4. Build Final URL
        payment_url = f"{settings.VNP_URL}?{hasData}&vnp_SecureHash={vnp_SecureHash}"

        logger.info(
            "Generated VNPay payment URL for txn %s amount=%s gateway=%s",
            order_id,
            amount,
            settings.VNP_URL,
        )

        return payment_url

    @staticmethod
    def validate_payment(query_params):
        """
        Validate VNPay response checksum.

        Args:
            query_params (dict): Request query parameters (request.GET)

        Returns:
            bool: True if checksum is valid, False otherwise.
        """
        vnp_SecureHash = query_params.get("vnp_SecureHash")
        if not vnp_SecureHash:
            return False

        # Recreate Hash Data and verify using constant-time comparison.
        hasData = VNPayService._build_hash_data(query_params)
        secureHash = VNPayService._sign_hash_data(hasData)

        return VNPayService._secure_hash_matches(secureHash, vnp_SecureHash)

    @staticmethod
    def validate_payment_secure(query_params):
        """
        Enhanced secure validation với logging và error handling.

        Args:
            query_params (dict): Request query parameters

        Returns:
            tuple: (is_valid: bool, error_message: str or None)

        Raises:
            VNPaySecurityError: Nếu signature không hợp lệ
        """
        vnp_SecureHash = query_params.get("vnp_SecureHash")
        vnp_TxnRef = query_params.get("vnp_TxnRef", "unknown")
        vnp_TmnCode = query_params.get("vnp_TmnCode")

        if not vnp_SecureHash:
            logger.warning(f"VNPay callback missing signature. TxnRef: {vnp_TxnRef}")
            return False, "Missing vnp_SecureHash"

        if not settings.VNP_TMN_CODE:
            logger.error("VNP_TMN_CODE not configured!")
            raise VNPaySecurityError("Payment gateway not properly configured")

        if vnp_TmnCode != settings.VNP_TMN_CODE:
            logger.warning(
                f"VNPay callback has invalid terminal code. TxnRef: {vnp_TxnRef}. "
                f"Expected: {settings.VNP_TMN_CODE}, Got: {vnp_TmnCode}"
            )
            return False, "Invalid terminal code"

        # Check required fields
        required_fields = [
            "vnp_TxnRef",
            "vnp_Amount",
            "vnp_ResponseCode",
            "vnp_TransactionNo",
        ]
        missing_fields = [f for f in required_fields if not query_params.get(f)]
        if missing_fields:
            logger.warning(
                f"VNPay callback missing fields: {missing_fields}. TxnRef: {vnp_TxnRef}"
            )
            return False, f"Missing required fields: {missing_fields}"

        # Recreate Hash Data and verify using constant-time comparison.
        VNPayService.ensure_configured("VNP_HASH_SECRET")
        hasData = VNPayService._build_hash_data(query_params)
        secureHash = VNPayService._sign_hash_data(hasData)

        if not VNPayService._secure_hash_matches(secureHash, vnp_SecureHash):
            logger.warning(
                f"VNPay signature mismatch! TxnRef: {vnp_TxnRef}. "
                f"Expected: {secureHash[:20]}..., Got: {vnp_SecureHash[:20]}..."
            )
            return False, "Invalid signature"

        logger.info(f"VNPay signature verified successfully. TxnRef: {vnp_TxnRef}")
        return True, None

    @staticmethod
    def _get_transaction_plan(transaction_obj: Transaction) -> SubscriptionPlan:
        plan_id = SubscriptionService.get_transaction_plan_id(transaction_obj)
        if not plan_id:
            raise ValueError("Missing PLAN_ID metadata in transaction")
        return SubscriptionPlan.objects.select_for_update().get(id=plan_id)

    @staticmethod
    def _completed_subscription_for_transaction(
        transaction_obj: Transaction, plan: SubscriptionPlan
    ) -> CompanySubscription | None:
        completed_date = timezone.localdate(
            transaction_obj.updated_at or transaction_obj.created_at
        )
        candidates = (
            CompanySubscription.objects.select_for_update()
            .select_related("plan")
            .filter(
                company=transaction_obj.company,
                start_date__lte=completed_date,
                end_date__gte=completed_date,
            )
            .order_by("-end_date", "-created_at")
        )
        for subscription in candidates:
            if (
                subscription.plan_id == plan.id
                or SubscriptionService.is_same_plan_family(subscription.plan, plan)
            ):
                return subscription
        return None

    @staticmethod
    def _activate_subscription_for_transaction(
        transaction_obj: Transaction,
    ) -> CompanySubscription:
        plan = VNPayService._get_transaction_plan(transaction_obj)
        return SubscriptionService.activate_paid_subscription(
            transaction_obj.company, plan
        )

    @staticmethod
    def _recover_completed_subscription(
        transaction_obj: Transaction,
    ) -> CompanySubscription:
        plan = VNPayService._get_transaction_plan(transaction_obj)
        current_subscription = (
            CompanySubscription.objects.select_for_update()
            .select_related("plan")
            .filter(
                company=transaction_obj.company,
                status=CompanySubscription.Status.ACTIVE,
                start_date__lte=timezone.localdate(),
                end_date__gte=timezone.localdate(),
            )
            .order_by("-end_date", "-created_at")
            .first()
        )
        if current_subscription:
            return current_subscription

        subscription = VNPayService._completed_subscription_for_transaction(
            transaction_obj, plan
        )
        if subscription:
            return subscription
        return SubscriptionService.activate_paid_subscription(
            transaction_obj.company, plan
        )

    @staticmethod
    def _queue_payment_confirmation_email(transaction_id: int, txn_ref: str) -> None:
        def enqueue() -> None:
            try:
                from apps.billing.tasks import send_payment_confirmation_email_task

                send_payment_confirmation_email_task.delay(transaction_id)
            except Exception as exc:
                logger.error(
                    "Failed to queue confirmation email for txn %s: %s",
                    txn_ref,
                    exc,
                )

        transaction.on_commit(enqueue)

    @staticmethod
    def process_callback_secure(query_params):
        """
        Xử lý callback/IPN từ VNPay một cách an toàn với idempotency check và amount validation.

        Args:
            query_params (dict): Request query parameters

        Returns:
            dict: {
                'success': bool,
                'message': str,
                'rsp_code': str (VNPay standard code),
                'transaction': Transaction or None,
                'subscription': CompanySubscription or None
            }
        """

        # 1. Validate signature
        is_valid, error_msg = VNPayService.validate_payment_secure(query_params)
        if not is_valid:
            logger.error(f"VNPay Security Validation Failed: {error_msg}")
            return {
                "success": False,
                "message": f"Security validation failed: {error_msg}",
                "rsp_code": "97",  # Signature mismatch
                "transaction": None,
                "subscription": None,
            }

        txn_ref = query_params.get("vnp_TxnRef")
        response_code = query_params.get("vnp_ResponseCode")
        vnp_amount_raw = query_params.get("vnp_Amount")

        # 2 -> 5. Lock and process inside single atomic block to prevent race condition
        with transaction.atomic():
            try:
                txn = Transaction.objects.select_for_update().get(
                    reference_code=txn_ref
                )
            except Transaction.DoesNotExist:
                logger.error(f"VNPay Transaction not found: {txn_ref}")
                return {
                    "success": False,
                    "message": "Order not found",
                    "rsp_code": "01",
                    "transaction": None,
                    "subscription": None,
                }

            # 3. Amount Validation (Phòng chống giả mạo giá)
            try:
                # VNPay gửi số tiền * 100
                vnp_amount = (Decimal(vnp_amount_raw) / Decimal("100")).quantize(
                    Decimal("0.01")
                )
                txn_amount = Decimal(txn.amount).quantize(Decimal("0.01"))
                if txn_amount != vnp_amount:
                    logger.error(
                        f"VNPay Amount mismatch! Txn: {txn.amount}, VNPay: {vnp_amount}. Ref: {txn_ref}"
                    )
                    return {
                        "success": False,
                        "message": "Invalid amount",
                        "rsp_code": "04",
                        "transaction": txn,
                        "subscription": None,
                    }
            except (InvalidOperation, ValueError, TypeError):
                return {
                    "success": False,
                    "message": "Invalid amount format",
                    "rsp_code": "99",
                    "transaction": txn,
                    "subscription": None,
                }

            # 4. Idempotency Check: Đã xử lý rồi?
            if txn.status == Transaction.Status.COMPLETED:
                logger.info(
                    f"VNPay Transaction already processed: {txn_ref} with status {txn.status}"
                )
                try:
                    subscription = VNPayService._recover_completed_subscription(txn)
                except Exception as e:
                    logger.error(
                        "Completed VNPay txn %s has no recoverable subscription: %s",
                        txn_ref,
                        e,
                    )
                    return {
                        "success": False,
                        "message": "Subscription activation failed",
                        "rsp_code": "99",
                        "transaction": txn,
                        "subscription": None,
                    }
                return {
                    "success": True,
                    "message": "Order already confirmed",
                    "rsp_code": "02",
                    "transaction": txn,
                    "subscription": subscription,
                }

            # Allow delayed success callback to recover transactions that were marked failed earlier.
            if txn.status == Transaction.Status.FAILED and response_code != "00":
                logger.info(f"VNPay Transaction already failed: {txn_ref}")
                return {
                    "success": False,
                    "message": "Order already failed",
                    "rsp_code": "02",
                    "transaction": txn,
                    "subscription": None,
                }
            if txn.status == Transaction.Status.FAILED and response_code == "00":
                logger.warning(
                    f"VNPay delayed success received for previously failed txn: {txn_ref}. Attempting recovery."
                )

            # Cập nhật thông tin từ VNPay
            txn.vnp_TransactionNo = query_params.get("vnp_TransactionNo")
            txn.vnp_BankCode = query_params.get("vnp_BankCode")
            txn.vnp_CardType = query_params.get("vnp_CardType")
            txn.vnp_OrderInfo = query_params.get("vnp_OrderInfo")

            subscription = None

            if response_code == "00":
                # Thanh toán thành công
                try:
                    subscription = VNPayService._activate_subscription_for_transaction(
                        txn
                    )
                except Exception as e:
                    logger.error(
                        f"Failed to activate subscription for txn {txn_ref}: {str(e)}"
                    )
                    metadata = txn.metadata if isinstance(txn.metadata, dict) else {}
                    txn.metadata = {
                        **metadata,
                        "subscription_activation_error": str(e)[:200],
                    }
                    txn.save()
                    return {
                        "success": False,
                        "message": "Subscription activation failed",
                        "rsp_code": "99",
                        "transaction": txn,
                        "subscription": None,
                    }

                txn.status = Transaction.Status.COMPLETED
                txn.save()
                logger.info(
                    f"Subscription {subscription.id} activated successfully via IPN/Callback. Ref: {txn_ref}"
                )
                VNPayService._queue_payment_confirmation_email(txn.id, txn_ref)

                return {
                    "success": True,
                    "message": "Confirm success",
                    "rsp_code": "00",
                    "transaction": txn,
                    "subscription": subscription,
                }
            else:
                # Thanh toán thất bại
                txn.status = Transaction.Status.FAILED
                txn.save()

                # Giải mã lỗi cho ReturnURL (IPN vẫn trả về Confirm success)
                error_messages = {
                    "07": "Trừ tiền thành công nhưng giao dịch bị nghi ngờ",
                    "09": "Thẻ/Tài khoản chưa đăng ký dịch vụ Internet Banking",
                    "10": "Xác thực thông tin thẻ/tài khoản không đúng quá 3 lần",
                    "11": "Đã hết hạn chờ thanh toán",
                    "12": "Thẻ/Tài khoản bị khóa",
                    "13": "Sai mật khẩu OTP",
                    "24": "Khách hàng hủy giao dịch",
                    "51": "Tài khoản không đủ số dư",
                    "65": "Vượt quá hạn mức giao dịch trong ngày",
                    "75": "Ngân hàng thanh toán đang bảo trì",
                    "79": "Sai mật khẩu thanh toán quá số lần quy định",
                    "99": "Lỗi không xác định",
                }

                error_msg = error_messages.get(
                    response_code, f"Mã lỗi: {response_code}"
                )
                logger.warning(
                    f"Payment failed at VNPay for txn {txn_ref}: {error_msg}"
                )

                return {
                    "success": False,
                    "message": error_msg,
                    "rsp_code": "00",  # VNPay vẫn coi là IPN nhận thành công
                    "transaction": txn,
                    "subscription": None,
                }

    @staticmethod
    def build_frontend_result_url(result):
        """
        Build frontend redirect URL after processing return callback.
        """
        base_url = (
            getattr(settings, "VNP_FRONTEND_RETURN_URL", "").strip()
            or f"{settings.FRONTEND_URL}/employer/payment-result"
        )

        txn = result.get("transaction")
        query = {
            "status": "success" if result.get("success") else "failed",
            "message": result.get("message", ""),
        }

        if txn:
            query["txnId"] = str(txn.id)
            query["txnRef"] = txn.reference_code

        query_str = urllib.parse.urlencode(query)
        separator = "&" if "?" in base_url else "?"
        return f"{base_url}{separator}{query_str}"

    @staticmethod
    def query_vnpay_transaction(txn_ref):
        """
        Gọi API QueryDR của VNPay để truy vấn trạng thái giao dịch.

        Args:
            txn_ref (str): Reference code của giao dịch.

        Returns:
            dict: Kết quả trả về từ VNPay API.
        """

        VNPayService.ensure_configured(
            "VNP_TMN_CODE", "VNP_HASH_SECRET", "VNP_QUERY_URL"
        )

        try:
            txn = Transaction.objects.get(reference_code=txn_ref)
        except Transaction.DoesNotExist:
            return {"success": False, "message": "Transaction not found"}

        vnp_RequestId = timezone.localtime().strftime("%H%M%S")
        vnp_Version = "2.1.0"
        vnp_Command = "querydr"
        vnp_TmnCode = settings.VNP_TMN_CODE
        vnp_TxnRef = txn_ref
        vnp_OrderInfo = f"Query transaction {txn_ref}"
        vnp_TransactionDate = VNPayService._format_vnpay_datetime(txn.created_at)
        vnp_CreateDate = VNPayService._format_vnpay_datetime(timezone.now())
        vnp_IpAddr = "127.0.0.1"  # Thường là IP của server

        # Tạo chuỗi Hash cho QueryDR:
        # format: RequestId|Version|Command|TmnCode|TxnRef|TransactionDate|CreateDate|IpAddr|OrderInfo
        hash_data = f"{vnp_RequestId}|{vnp_Version}|{vnp_Command}|{vnp_TmnCode}|{vnp_TxnRef}|{vnp_TransactionDate}|{vnp_CreateDate}|{vnp_IpAddr}|{vnp_OrderInfo}"

        vnp_HashSecret = settings.VNP_HASH_SECRET
        vnp_SecureHash = hmac.new(
            vnp_HashSecret.encode("utf-8"), hash_data.encode("utf-8"), hashlib.sha512
        ).hexdigest()

        data = {
            "vnp_RequestId": vnp_RequestId,
            "vnp_Version": vnp_Version,
            "vnp_Command": vnp_Command,
            "vnp_TmnCode": vnp_TmnCode,
            "vnp_TxnRef": vnp_TxnRef,
            "vnp_OrderInfo": vnp_OrderInfo,
            "vnp_TransactionDate": vnp_TransactionDate,
            "vnp_CreateDate": vnp_CreateDate,
            "vnp_IpAddr": vnp_IpAddr,
            "vnp_SecureHash": vnp_SecureHash,
        }

        try:
            response = requests.post(settings.VNP_QUERY_URL, json=data, timeout=10)
            return response.json()
        except Exception as e:
            logger.error(f"Error calling VNPay QueryDR API: {e}")
            return {"success": False, "message": str(e)}
