import hashlib
import hmac
import urllib.parse
import logging
from datetime import datetime
from django.conf import settings
from django.db import transaction
from apps.billing.models import Transaction, CompanySubscription

logger = logging.getLogger(__name__)


class VNPaySecurityError(Exception):
    """Exception cho các lỗi bảo mật VNPay."""
    pass


class VNPayService:
    """
    Service for handling VNPay payment gateway integration.
    """
    
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
        vnp_params = {
            'vnp_Version': '2.1.0',
            'vnp_Command': 'pay',
            'vnp_TmnCode': settings.VNP_TMN_CODE,
            'vnp_Amount': int(amount * 100),  # Required: Amount * 100
            'vnp_CurrCode': 'VND',
            'vnp_TxnRef': str(order_id),
            'vnp_OrderInfo': order_desc,
            'vnp_OrderType': 'other', # or 'billpayment'
            # 'vnp_Locale': 'vn', # Optional, defaults to vn
            'vnp_ReturnUrl': settings.VNP_RETURN_URL,
            'vnp_IpAddr': ip_addr,
            'vnp_CreateDate': datetime.now().strftime('%Y%m%d%H%M%S'),
        }
        
        # 2. Sort Params by Key (Alphabetical)
        inputData = sorted(vnp_params.items())
        
        # 3. Create Query String & Raw Hash Data
        hasData = ''
        seq = 0
        for key, val in inputData:
            if seq == 1:
                hasData = hasData + "&" + str(key) + '=' + urllib.parse.quote_plus(str(val))
            else:
                seq = 1
                hasData = str(key) + '=' + urllib.parse.quote_plus(str(val))
        
        # 4. Generate Checksum (HMAC-SHA512)
        vnp_HashSecret = settings.VNP_HASH_SECRET
        vnp_SecureHash = hmac.new(
            vnp_HashSecret.encode('utf-8'), 
            hasData.encode('utf-8'), 
            hashlib.sha512
        ).hexdigest()
        
        # 5. Build Final URL
        payment_url = f"{settings.VNP_URL}?{hasData}&vnp_SecureHash={vnp_SecureHash}"
        
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
        
        if not vnp_SecureHash:
            logger.warning(f"VNPay callback missing signature. TxnRef: {vnp_TxnRef}")
            return False, "Missing vnp_SecureHash"
        
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
        Xử lý callback từ VNPay một cách an toàn với idempotency check.
        
        Args:
            query_params (dict): Request query parameters
            
        Returns:
            dict: {
                'success': bool,
                'message': str,
                'transaction': Transaction or None,
                'subscription': CompanySubscription or None
            }
        """
        
        # 1. Validate signature
        is_valid, error_msg = VNPayService.validate_payment_secure(query_params)
        if not is_valid:
            return {
                'success': False,
                'message': f'Security validation failed: {error_msg}',
                'transaction': None,
                'subscription': None
            }
        
        txn_ref = query_params.get('vnp_TxnRef')
        response_code = query_params.get('vnp_ResponseCode')
        
        # 2. Get Transaction with idempotency check
        try:
            txn = Transaction.objects.select_for_update().get(reference_code=txn_ref)
        except Transaction.DoesNotExist:
            logger.error(f"Transaction not found: {txn_ref}")
            return {
                'success': False,
                'message': 'Transaction not found',
                'transaction': None,
                'subscription': None
            }
        
        # 3. Idempotency: Already processed?
        if txn.status == Transaction.Status.COMPLETED:
            logger.info(f"Transaction already completed: {txn_ref}")
            return {
                'success': True,
                'message': 'Transaction already processed',
                'transaction': txn,
                'subscription': None
            }
        
        if txn.status == Transaction.Status.FAILED:
            logger.info(f"Transaction already failed: {txn_ref}")
            return {
                'success': False,
                'message': 'Transaction already marked as failed',
                'transaction': txn,
                'subscription': None
            }
        
        # 4. Process within transaction
        with transaction.atomic():
            # Update transaction fields
            txn.vnp_TransactionNo = query_params.get('vnp_TransactionNo')
            txn.vnp_BankCode = query_params.get('vnp_BankCode')
            txn.vnp_CardType = query_params.get('vnp_CardType')
            txn.vnp_OrderInfo = query_params.get('vnp_OrderInfo')
            
            subscription = None
            
            if response_code == '00':
                # Payment successful
                txn.status = Transaction.Status.COMPLETED
                txn.save()
                
                # Activate Subscription
                try:
                    # Parse: PLAN_ID:1|SUB_ID:5
                    parts = txn.description.split('|')
                    sub_id = parts[1].split(':')[1]
                    subscription = CompanySubscription.objects.select_for_update().get(id=sub_id)
                    subscription.status = CompanySubscription.Status.ACTIVE
                    subscription.save()
                    
                    logger.info(f"Subscription {sub_id} activated via transaction {txn_ref}")
                except Exception as e:
                    logger.error(f"Failed to activate subscription for txn {txn_ref}: {e}")
                
                return {
                    'success': True,
                    'message': 'Payment successful',
                    'transaction': txn,
                    'subscription': subscription
                }
            else:
                # Payment failed
                txn.status = Transaction.Status.FAILED
                txn.save()
                
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
                logger.warning(f"Payment failed for txn {txn_ref}: {error_msg}")
                
                return {
                    'success': False,
                    'message': error_msg,
                    'transaction': txn,
                    'subscription': None
                }