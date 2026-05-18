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
from apps.billing.models import Transaction, SubscriptionPlan
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
    def _normalize_vnpay_order_info(order_desc: str) -> str:
        """Normalize order info to ASCII text accepted by VNPay."""
        normalized = unicodedata.normalize("NFKD", str(order_desc or "")).encode("ascii", "ignore").decode("ascii")
        normalized = re.sub(r"[^A-Za-z0-9 ]+", " ", normalized)
        normalized = re.sub(r"\s+", " ", normalized).strip()
        return normalized[:255] or "Thanh toan"

    @staticmethod
    def _format_vnpay_datetime(value: datetime) -> str:
        """Format datetime in VNPay-required GMT+7 string format."""
        vnpay_tz = ZoneInfo("Asia/Ho_Chi_Minh")
        return value.astimezone(vnpay_tz).strftime('%Y%m%d%H%M%S')
    
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
        
        # 1. Prepare Base Params
        clean_desc = VNPayService._normalize_vnpay_order_info(order_desc)
        create_date = VNPayService._format_vnpay_datetime(timezone.now())
        expire_date = VNPayService._format_vnpay_datetime(timezone.now() + timedelta(minutes=15))

        try:
            amount_value = int(Decimal(str(amount)) * Decimal("100"))
        except (InvalidOperation, TypeError, ValueError) as exc:
            raise ValueError(f"Invalid VNPay amount: {amount}") from exc
        
        vnp_params = {
            'vnp_Version': '2.1.0',
            'vnp_Command': 'pay',
            'vnp_TmnCode': settings.VNP_TMN_CODE,
            'vnp_Amount': amount_value,  # Required: Amount * 100
            'vnp_CurrCode': 'VND',
            'vnp_TxnRef': str(order_id),
            'vnp_OrderInfo': clean_desc,
            'vnp_OrderType': 'other', 
            'vnp_Locale': 'vn', 
            'vnp_ReturnUrl': settings.VNP_RETURN_URL,
            'vnp_IpAddr': ip_addr if ip_addr and ":" not in ip_addr else "127.0.0.1",
            'vnp_CreateDate': create_date,
            'vnp_ExpireDate': expire_date,
        }
        
        # 2. Sort Params by Key (Alphabetical)
        inputData = sorted(vnp_params.items())
        
        # 3. Create Query String & Raw Hash Data
        hasData = "&".join([f"{key}={urllib.parse.quote_plus(str(val))}" for key, val in inputData])
        
        # 4. Generate Checksum (HMAC-SHA512)
        vnp_HashSecret = settings.VNP_HASH_SECRET
        vnp_SecureHash = hmac.new(
            vnp_HashSecret.encode('utf-8'), 
            hasData.encode('utf-8'), 
            hashlib.sha512
        ).hexdigest()
        
        # 5. Build Final URL
        payment_url = f"{settings.VNP_URL}?{hasData}&vnp_SecureHash={vnp_SecureHash}"

        logger.info("Generated VNPay payment URL for txn %s: %s", order_id, payment_url)
        
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
        vnp_SecureHash = query_params.get('vnp_SecureHash')
        if not vnp_SecureHash:
            return False
            
        # Filter and Sort params
        inputData = {}
        for key, val in query_params.items():
            if key.startswith('vnp_') and key not in ['vnp_SecureHash', 'vnp_SecureHashType']:
                inputData[key] = val
        
        inputData = sorted(inputData.items())
        
        # Recreate Hash Data
        hasData = ''
        seq = 0
        for key, val in inputData:
            if seq == 1:
                hasData = hasData + "&" + str(key) + '=' + urllib.parse.quote_plus(str(val))
            else:
                seq = 1
                hasData = str(key) + '=' + urllib.parse.quote_plus(str(val))
        
        # Verify
        vnp_HashSecret = settings.VNP_HASH_SECRET
        secureHash = hmac.new(
            vnp_HashSecret.encode('utf-8'), 
            hasData.encode('utf-8'), 
            hashlib.sha512
        ).hexdigest()
        
        return secureHash == vnp_SecureHash

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
        vnp_SecureHash = query_params.get('vnp_SecureHash')
        vnp_TxnRef = query_params.get('vnp_TxnRef', 'unknown')
        vnp_TmnCode = query_params.get('vnp_TmnCode')
        
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
        required_fields = ['vnp_TxnRef', 'vnp_Amount', 'vnp_ResponseCode', 'vnp_TransactionNo']
        missing_fields = [f for f in required_fields if not query_params.get(f)]
        if missing_fields:
            logger.warning(f"VNPay callback missing fields: {missing_fields}. TxnRef: {vnp_TxnRef}")
            return False, f"Missing required fields: {missing_fields}"
            
        # Filter and Sort params
        inputData = {}
        for key, val in query_params.items():
            if key.startswith('vnp_') and key not in ['vnp_SecureHash', 'vnp_SecureHashType']:
                inputData[key] = val
        
        inputData = sorted(inputData.items())
        
        # Recreate Hash Data
        hasData = ''
        seq = 0
        for key, val in inputData:
            if seq == 1:
                hasData = hasData + "&" + str(key) + '=' + urllib.parse.quote_plus(str(val))
            else:
                seq = 1
                hasData = str(key) + '=' + urllib.parse.quote_plus(str(val))
        
        # Verify
        vnp_HashSecret = settings.VNP_HASH_SECRET
        if not vnp_HashSecret:
            logger.error("VNP_HASH_SECRET not configured!")
            raise VNPaySecurityError("Payment gateway not properly configured")
            
        secureHash = hmac.new(
            vnp_HashSecret.encode('utf-8'), 
            hasData.encode('utf-8'), 
            hashlib.sha512
        ).hexdigest()
        
        if secureHash != vnp_SecureHash:
            logger.warning(
                f"VNPay signature mismatch! TxnRef: {vnp_TxnRef}. "
                f"Expected: {secureHash[:20]}..., Got: {vnp_SecureHash[:20]}..."
            )
            return False, "Invalid signature"
        
        logger.info(f"VNPay signature verified successfully. TxnRef: {vnp_TxnRef}")
        return True, None

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
                'success': False,
                'message': f'Security validation failed: {error_msg}',
                'rsp_code': '97', # Signature mismatch
                'transaction': None,
                'subscription': None
            }
        
        txn_ref = query_params.get('vnp_TxnRef')
        response_code = query_params.get('vnp_ResponseCode')
        vnp_amount_raw = query_params.get('vnp_Amount')
        
        # 2 -> 5. Lock and process inside single atomic block to prevent race condition
        with transaction.atomic():
            try:
                txn = Transaction.objects.select_for_update().get(reference_code=txn_ref)
            except Transaction.DoesNotExist:
                logger.error(f"VNPay Transaction not found: {txn_ref}")
                return {
                    'success': False,
                    'message': 'Order not found',
                    'rsp_code': '01',
                    'transaction': None,
                    'subscription': None
                }

            # 3. Amount Validation (Phòng chống giả mạo giá)
            try:
                # VNPay gửi số tiền * 100
                vnp_amount = (Decimal(vnp_amount_raw) / Decimal('100')).quantize(Decimal('0.01'))
                txn_amount = Decimal(txn.amount).quantize(Decimal('0.01'))
                if txn_amount != vnp_amount:
                    logger.error(f"VNPay Amount mismatch! Txn: {txn.amount}, VNPay: {vnp_amount}. Ref: {txn_ref}")
                    return {
                        'success': False,
                        'message': 'Invalid amount',
                        'rsp_code': '04',
                        'transaction': txn,
                        'subscription': None
                    }
            except (InvalidOperation, ValueError, TypeError):
                return {
                    'success': False,
                    'message': 'Invalid amount format',
                    'rsp_code': '99',
                    'transaction': txn,
                    'subscription': None
                }

            # 4. Idempotency Check: Đã xử lý rồi?
            if txn.status == Transaction.Status.COMPLETED:
                logger.info(f"VNPay Transaction already processed: {txn_ref} with status {txn.status}")
                return {
                    'success': True,
                    'message': 'Order already confirmed',
                    'rsp_code': '02',
                    'transaction': txn,
                    'subscription': None
                }

            # Allow delayed success callback to recover transactions that were marked failed earlier.
            if txn.status == Transaction.Status.FAILED and response_code != '00':
                logger.info(f"VNPay Transaction already failed: {txn_ref}")
                return {
                    'success': False,
                    'message': 'Order already failed',
                    'rsp_code': '02',
                    'transaction': txn,
                    'subscription': None
                }
            if txn.status == Transaction.Status.FAILED and response_code == '00':
                logger.warning(f"VNPay delayed success received for previously failed txn: {txn_ref}. Attempting recovery.")

            # Cập nhật thông tin từ VNPay
            txn.vnp_TransactionNo = query_params.get('vnp_TransactionNo')
            txn.vnp_BankCode = query_params.get('vnp_BankCode')
            txn.vnp_CardType = query_params.get('vnp_CardType')
            txn.vnp_OrderInfo = query_params.get('vnp_OrderInfo')
            
            subscription = None
            
            if response_code == '00':
                # Thanh toán thành công
                txn.status = Transaction.Status.COMPLETED
                txn.save()
                
                # Kích hoạt Subscription
                try:
                    plan_id = SubscriptionService.get_transaction_plan_id(txn)
                    if plan_id:
                        plan = SubscriptionPlan.objects.select_for_update().get(id=plan_id)
                        subscription = SubscriptionService.activate_paid_subscription(txn.company, plan)
                        logger.info(f"Subscription {subscription.id} activated successfully via IPN/Callback. Ref: {txn_ref}")

                        # Gửi email xác nhận thanh toán thành công
                        try:
                            from apps.billing.tasks import send_payment_confirmation_email_task
                            send_payment_confirmation_email_task.delay(txn.id)
                        except Exception as e:
                            logger.error(f"Failed to queue confirmation email for txn {txn_ref}: {e}")
                    else:
                        logger.error(f"Missing PLAN_ID metadata in transaction description. Ref: {txn_ref}")
                except Exception as e:
                    logger.error(f"Failed to activate subscription for txn {txn_ref}: {str(e)}")
                
                return {
                    'success': True,
                    'message': 'Confirm success',
                    'rsp_code': '00',
                    'transaction': txn,
                    'subscription': subscription
                }
            else:
                # Thanh toán thất bại
                txn.status = Transaction.Status.FAILED
                txn.save()
                
                # Giải mã lỗi cho ReturnURL (IPN vẫn trả về Confirm success)
                error_messages = {
                    '07': 'Trừ tiền thành công nhưng giao dịch bị nghi ngờ',
                    '09': 'Thẻ/Tài khoản chưa đăng ký dịch vụ Internet Banking',
                    '10': 'Xác thực thông tin thẻ/tài khoản không đúng quá 3 lần',
                    '11': 'Đã hết hạn chờ thanh toán',
                    '12': 'Thẻ/Tài khoản bị khóa',
                    '13': 'Sai mật khẩu OTP',
                    '24': 'Khách hàng hủy giao dịch',
                    '51': 'Tài khoản không đủ số dư',
                    '65': 'Vượt quá hạn mức giao dịch trong ngày',
                    '75': 'Ngân hàng thanh toán đang bảo trì',
                    '79': 'Sai mật khẩu thanh toán quá số lần quy định',
                    '99': 'Lỗi không xác định'
                }
                
                error_msg = error_messages.get(response_code, f'Mã lỗi: {response_code}')
                logger.warning(f"Payment failed at VNPay for txn {txn_ref}: {error_msg}")
                
                return {
                    'success': False,
                    'message': error_msg,
                    'rsp_code': '00', # VNPay vẫn coi là IPN nhận thành công
                    'transaction': txn,
                    'subscription': None
                }

    @staticmethod
    def build_frontend_result_url(result):
        """
        Build frontend redirect URL after processing return callback.
        """
        base_url = getattr(settings, 'VNP_FRONTEND_RETURN_URL', '').strip() or f"{settings.FRONTEND_URL}/employer/payment-result"

        txn = result.get('transaction')
        query = {
            'status': 'success' if result.get('success') else 'failed',
            'message': result.get('message', ''),
        }

        if txn:
            query['txnId'] = str(txn.id)
            query['txnRef'] = txn.reference_code

        query_str = urllib.parse.urlencode(query)
        separator = '&' if '?' in base_url else '?'
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
        
        try:
            txn = Transaction.objects.get(reference_code=txn_ref)
        except Transaction.DoesNotExist:
            return {'success': False, 'message': 'Transaction not found'}

        vnp_RequestId = datetime.now().strftime('%H%M%S') # Example request ID
        vnp_Version = '2.1.0'
        vnp_Command = 'querydr'
        vnp_TmnCode = settings.VNP_TMN_CODE
        vnp_TxnRef = txn_ref
        vnp_OrderInfo = f"Query transaction {txn_ref}"
        vnp_TransactionDate = txn.created_at.strftime('%Y%m%d%H%M%S')
        vnp_CreateDate = datetime.now().strftime('%Y%m%d%H%M%S')
        vnp_IpAddr = '127.0.0.1' # Thường là IP của server
        
        # Tạo chuỗi Hash cho QueryDR: 
        # format: RequestId|Version|Command|TmnCode|TxnRef|TransactionDate|CreateDate|IpAddr|OrderInfo
        hash_data = f"{vnp_RequestId}|{vnp_Version}|{vnp_Command}|{vnp_TmnCode}|{vnp_TxnRef}|{vnp_TransactionDate}|{vnp_CreateDate}|{vnp_IpAddr}|{vnp_OrderInfo}"
        
        vnp_HashSecret = settings.VNP_HASH_SECRET
        vnp_SecureHash = hmac.new(
            vnp_HashSecret.encode('utf-8'), 
            hash_data.encode('utf-8'), 
            hashlib.sha512
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
            "vnp_SecureHash": vnp_SecureHash
        }
        
        # VNPay Query API URL (Sandbox)
        # Thực tế nên lấy từ settings
        query_url = "https://sandbox.vnpayment.vn/merchant_webapi/api/transaction"
        
        try:
            response = requests.post(query_url, json=data, timeout=10)
            return response.json()
        except Exception as e:
            logger.error(f"Error calling VNPay QueryDR API: {e}")
            return {'success': False, 'message': str(e)}