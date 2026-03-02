"""
Passkey (WebAuthn/FIDO2) Service Layer
======================================
Xử lý đăng ký và xác thực Passkey cho user.

Sử dụng thư viện python-fido2 v2.x cho WebAuthn protocol.
Challenge được lưu tạm trong Django cache (Redis) với TTL 5 phút.

Flow đăng ký (Registration):
    1. Client gọi generate_registration_options(user) → nhận PublicKeyCredentialCreationOptions
    2. Client dùng navigator.credentials.create() với options
    3. Client gửi kết quả về verify_registration() → lưu credential vào DB

Flow xác thực (Authentication):
    1. Client gọi generate_authentication_options() → nhận PublicKeyCredentialRequestOptions  
    2. Client dùng navigator.credentials.get() với options
    3. Client gửi kết quả về verify_authentication() → nhận JWT tokens
"""

import base64
import secrets
from typing import Optional

from django.conf import settings
from django.core.cache import cache
from django.utils import timezone

from fido2.server import Fido2Server
from fido2.webauthn import (
    PublicKeyCredentialRpEntity,
    PublicKeyCredentialUserEntity,
    PublicKeyCredentialDescriptor,
    PublicKeyCredentialType,
    UserVerificationRequirement,
    ResidentKeyRequirement,
    AttestedCredentialData,
)
from fido2 import cbor

from ..models import CustomUser, UserPasskey
from ..selectors.users import get_user_by_email
from .auth import AuthenticationError, generate_tokens


# ============================================================
# Configuration helpers
# ============================================================

CHALLENGE_TTL = 300  # 5 phút


def _get_rp() -> PublicKeyCredentialRpEntity:
    """Lấy Relying Party entity từ settings."""
    return PublicKeyCredentialRpEntity(
        id=getattr(settings, 'WEBAUTHN_RP_ID', 'localhost'),
        name=getattr(settings, 'WEBAUTHN_RP_NAME', 'JobPortal'),
    )


def _get_server() -> Fido2Server:
    """Tạo Fido2Server instance."""
    rp = _get_rp()
    return Fido2Server(rp)


def _cache_key(identifier: str, flow: str) -> str:
    """Tạo cache key cho challenge."""
    return f"passkey:challenge:{flow}:{identifier}"


def _bytes_to_base64url(data: bytes) -> str:
    """Encode bytes sang base64url (không padding)."""
    return base64.urlsafe_b64encode(data).rstrip(b'=').decode('ascii')


def _base64url_to_bytes(data: str) -> bytes:
    """Decode base64url string sang bytes."""
    padding = 4 - len(data) % 4
    if padding != 4:
        data += '=' * padding
    return base64.urlsafe_b64decode(data)


def _get_user_credentials(user: CustomUser) -> list:
    """Lấy danh sách credential descriptors của user (để exclude khi đăng ký)."""
    passkeys = UserPasskey.objects.filter(user=user, is_active=True)
    return [
        PublicKeyCredentialDescriptor(
            type=PublicKeyCredentialType.PUBLIC_KEY,
            id=bytes(pk.credential_id),
            transports=pk.transports if pk.transports else None,
        )
        for pk in passkeys
    ]


def _get_attested_credentials(user: CustomUser) -> list:
    """
    Lấy danh sách AttestedCredentialData từ DB.
    Cần cho authenticate_complete().
    """
    passkeys = UserPasskey.objects.filter(user=user, is_active=True)
    credentials = []
    for pk in passkeys:
        public_key = cbor.decode(bytes(pk.public_key))
        aaguid = bytes.fromhex(pk.aaguid.replace('-', '')) if pk.aaguid else b'\x00' * 16
        cred = AttestedCredentialData.create(
            aaguid=aaguid,
            credential_id=bytes(pk.credential_id),
            public_key=public_key,
        )
        credentials.append(cred)
    return credentials


def _get_all_attested_credentials_by_cred_id(cred_id_bytes: bytes):
    """
    Tìm passkey trong DB bằng credential_id và trả về (passkey, attested_credentials).
    """
    try:
        passkey = UserPasskey.objects.select_related('user').get(
            credential_id=cred_id_bytes,
            is_active=True,
        )
    except UserPasskey.DoesNotExist:
        return None, []
    
    # Rebuild all credentials for this user (server needs full list)
    attested = _get_attested_credentials(passkey.user)
    return passkey, attested


def _serialize_enum(val):
    """Convert enum values to string for JSON serialization."""
    return val.value if hasattr(val, 'value') else val


# ============================================================
# Registration Flow
# ============================================================

def generate_registration_options(user: CustomUser) -> dict:
    """
    Bước 1: Tạo PublicKeyCredentialCreationOptions cho client.
    
    Args:
        user: User đang đăng nhập muốn đăng ký passkey
    
    Returns:
        dict chứa publicKey options (JSON-ready) để gửi cho client.
        Client sẽ dùng options này với navigator.credentials.create().
    
    Raises:
        AuthenticationError nếu user không hợp lệ
    """
    if user.status != 'active':
        raise AuthenticationError("Tài khoản không hoạt động.")

    server = _get_server()
    
    user_entity = PublicKeyCredentialUserEntity(
        id=str(user.id).encode('utf-8'),
        name=user.email,
        display_name=user.full_name or user.email,
    )
    
    existing_credentials = _get_user_credentials(user)
    
    # fido2 v2: register_begin returns (CredentialCreationOptions, state)
    creation_options, state = server.register_begin(
        user=user_entity,
        credentials=existing_credentials,
        user_verification=UserVerificationRequirement.PREFERRED,
        resident_key_requirement=ResidentKeyRequirement.PREFERRED,
    )
    
    # Lưu state vào cache
    cache_key = _cache_key(str(user.id), 'register')
    cache.set(cache_key, state, CHALLENGE_TTL)
    
    # Convert to JSON-friendly dict
    # fido2 v2: dict(creation_options) → {'publicKey': {...}} 
    # Challenge và user.id đã được base64url encode sẵn
    options_dict = dict(creation_options)
    pk = options_dict['publicKey']
    
    # Ensure all enums are converted to strings
    result = {
        'rp': pk['rp'],
        'user': pk['user'],
        'challenge': pk['challenge'],  # Already base64url string
        'pubKeyCredParams': [
            {'type': _serialize_enum(p['type']), 'alg': p['alg']}
            for p in pk.get('pubKeyCredParams', [])
        ],
        'timeout': pk.get('timeout', 60000),
        'attestation': _serialize_enum(pk.get('attestation', 'none')),
    }
    
    # Authenticator selection
    if pk.get('authenticatorSelection'):
        auth_sel = pk['authenticatorSelection']
        result['authenticatorSelection'] = {
            k: _serialize_enum(v) for k, v in auth_sel.items() if v is not None
        }
    
    # Exclude credentials
    if pk.get('excludeCredentials'):
        result['excludeCredentials'] = [
            {
                'type': _serialize_enum(c['type']),
                'id': c['id'] if isinstance(c['id'], str) else _bytes_to_base64url(c['id']),
                **(({'transports': c['transports']}) if c.get('transports') else {}),
            }
            for c in pk['excludeCredentials']
        ]
    
    return result


def verify_registration(
    user: CustomUser,
    credential_id: str,
    client_data_json: str,
    attestation_object: str,
    device_name: str = 'Passkey',
    transports: list = None,
) -> dict:
    """
    Bước 2: Xác minh registration response từ client và lưu credential.
    
    Client gửi kết quả từ navigator.credentials.create().response:
    - credential_id: credential.rawId (base64url)
    - client_data_json: credential.response.clientDataJSON (base64url)
    - attestation_object: credential.response.attestationObject (base64url)
    
    Returns:
        dict chứa thông tin passkey vừa tạo
    
    Raises:
        AuthenticationError nếu verification thất bại
    """
    # Lấy challenge state từ cache
    cache_key = _cache_key(str(user.id), 'register')
    state = cache.get(cache_key)
    
    if not state:
        raise AuthenticationError("Challenge đã hết hạn hoặc không tồn tại. Vui lòng thử lại.")
    
    server = _get_server()
    
    try:
        # fido2 v2: register_complete accepts state + response as Mapping
        # Build the response dict matching WebAuthn RegistrationResponse format
        response_dict = {
            'id': credential_id,
            'rawId': credential_id,
            'response': {
                'clientDataJSON': client_data_json,
                'attestationObject': attestation_object,
            },
            'type': 'public-key',
            'clientExtensionResults': {},
        }
        
        # register_complete returns AuthenticatorData
        auth_data = server.register_complete(
            state=state,
            response=response_dict,
        )
        
        # Lấy credential data từ AuthenticatorData
        credential_data = auth_data.credential_data
        
        if not credential_data:
            raise AuthenticationError("Không tìm thấy credential data trong response.")
        
        # Kiểm tra credential_id đã tồn tại chưa
        if UserPasskey.objects.filter(credential_id=credential_data.credential_id).exists():
            raise AuthenticationError("Passkey này đã được đăng ký.")
        
        # Serialize public key (COSE format) để lưu DB
        public_key_bytes = cbor.encode(credential_data.public_key)
        
        # Lấy AAGUID
        aaguid_hex = credential_data.aaguid.hex() if credential_data.aaguid else ''
        # Format as UUID string if 16 bytes
        if len(aaguid_hex) == 32:
            aaguid_str = f"{aaguid_hex[:8]}-{aaguid_hex[8:12]}-{aaguid_hex[12:16]}-{aaguid_hex[16:20]}-{aaguid_hex[20:]}"
        else:
            aaguid_str = aaguid_hex
        
        # Tạo UserPasskey record
        passkey = UserPasskey.objects.create(
            user=user,
            credential_id=credential_data.credential_id,
            public_key=public_key_bytes,
            sign_count=auth_data.counter,
            device_name=device_name,
            aaguid=aaguid_str,
            transports=transports or [],
            is_active=True,
        )
        
        # Xóa challenge khỏi cache
        cache.delete(cache_key)
        
        return {
            'id': passkey.id,
            'device_name': passkey.device_name,
            'created_at': passkey.created_at.isoformat() if passkey.created_at else None,
            'credential_id': _bytes_to_base64url(bytes(passkey.credential_id)),
        }
        
    except AuthenticationError:
        raise
    except Exception as e:
        raise AuthenticationError(f"Xác minh passkey thất bại: {str(e)}")


# ============================================================
# Authentication Flow
# ============================================================

def generate_authentication_options(email: Optional[str] = None) -> dict:
    """
    Bước 1: Tạo PublicKeyCredentialRequestOptions cho client.
    
    Args:
        email: Email của user (optional). Nếu cung cấp, chỉ cho phép
               passkey của user đó. Nếu không cung cấp, sử dụng 
               discoverable credentials (conditional UI).
    
    Returns:
        dict chứa publicKey options (JSON-ready) + session_id.
        Client sẽ dùng options này với navigator.credentials.get().
    """
    server = _get_server()
    session_id = secrets.token_urlsafe(32)
    
    credentials = []
    user_id = None
    
    if email:
        user = get_user_by_email(email=email)
        if user:
            user_id = user.id
            credentials = _get_user_credentials(user)
            if not credentials:
                raise AuthenticationError("Tài khoản này chưa đăng ký Passkey nào.")
    
    # fido2 v2: authenticate_begin returns (CredentialRequestOptions, state)
    request_options, state = server.authenticate_begin(
        credentials=credentials if credentials else None,
        user_verification=UserVerificationRequirement.PREFERRED,
    )
    
    # Lưu state + context vào cache
    cache_data = {
        'state': state,
        'user_id': user_id,
        'session_id': session_id,
    }
    cache_key = _cache_key(session_id, 'authenticate')
    cache.set(cache_key, cache_data, CHALLENGE_TTL)
    
    # Convert to JSON-friendly dict
    # fido2 v2: dict(request_options) → {'publicKey': {...}}
    options_dict = dict(request_options)
    pk = options_dict['publicKey']
    
    result = {
        'challenge': pk['challenge'],  # Already base64url string
        'timeout': pk.get('timeout', 60000),
        'rpId': pk.get('rpId', ''),
        'userVerification': pk.get('userVerification', 'preferred'),
        'session_id': session_id,
    }
    
    # Allow credentials
    if pk.get('allowCredentials'):
        result['allowCredentials'] = [
            {
                'type': _serialize_enum(c['type']),
                'id': c['id'] if isinstance(c['id'], str) else _bytes_to_base64url(c['id']),
                **(({'transports': c['transports']}) if c.get('transports') else {}),
            }
            for c in pk['allowCredentials']
        ]
    
    return result


def verify_authentication(
    session_id: str,
    credential_id: str,
    client_data_json: str,
    authenticator_data: str,
    signature: str,
    user_handle: Optional[str] = None,
) -> dict:
    """
    Bước 2: Xác minh authentication response và trả về JWT tokens.
    
    Client gửi kết quả từ navigator.credentials.get().response:
    - credential_id: credential.rawId (base64url)
    - client_data_json: credential.response.clientDataJSON (base64url)
    - authenticator_data: credential.response.authenticatorData (base64url)
    - signature: credential.response.signature (base64url)
    - user_handle: credential.response.userHandle (base64url, optional)
    
    Returns:
        dict với JWT tokens (access_token, refresh_token, user)
    
    Raises:
        AuthenticationError nếu verification thất bại
    """
    # Lấy challenge từ cache
    cache_key = _cache_key(session_id, 'authenticate')
    cache_data = cache.get(cache_key)
    
    if not cache_data:
        raise AuthenticationError("Challenge đã hết hạn hoặc không tồn tại. Vui lòng thử lại.")
    
    state = cache_data['state']
    
    try:
        cred_id_bytes = _base64url_to_bytes(credential_id)
        
        # Tìm passkey trong DB và rebuild credentials
        passkey, attested_credentials = _get_all_attested_credentials_by_cred_id(cred_id_bytes)
        
        if not passkey:
            raise AuthenticationError("Passkey không tồn tại hoặc đã bị vô hiệu hóa.")
        
        user = passkey.user
        
        # Kiểm tra user status
        if user.status != 'active':
            raise AuthenticationError("Tài khoản đã bị vô hiệu hóa.")
        
        server = _get_server()
        
        # fido2 v2: authenticate_complete accepts state + credentials + response as Mapping
        response_dict = {
            'id': credential_id,
            'rawId': credential_id,
            'response': {
                'clientDataJSON': client_data_json,
                'authenticatorData': authenticator_data,
                'signature': signature,
            },
            'type': 'public-key',
            'clientExtensionResults': {},
        }
        
        # Thêm userHandle nếu có (discoverable credentials)
        if user_handle:
            response_dict['response']['userHandle'] = user_handle
        
        # authenticate_complete verifies signature
        server.authenticate_complete(
            state=state,
            credentials=attested_credentials,
            response=response_dict,
        )
        
        # Cập nhật sign count và last_used
        passkey.sign_count += 1
        passkey.last_used_at = timezone.now()
        passkey.save(update_fields=['sign_count', 'last_used_at'])
        
        # Cập nhật last_login cho user
        user.last_login = timezone.now()
        user.save(update_fields=['last_login'])
        
        # Xóa challenge khỏi cache
        cache.delete(cache_key)
        
        # Generate JWT tokens (tái sử dụng từ auth.py)
        return generate_tokens(user)
        
    except AuthenticationError:
        raise
    except Exception as e:
        raise AuthenticationError(f"Xác thực passkey thất bại: {str(e)}")


# ============================================================
# Management Functions
# ============================================================

def list_user_passkeys(user: CustomUser) -> list:
    """
    Lấy danh sách passkey của user.
    
    Returns:
        list of dict chứa thông tin passkey (không bao gồm public_key / secret data)
    """
    passkeys = UserPasskey.objects.filter(user=user).order_by('-created_at')
    return [
        {
            'id': pk.id,
            'device_name': pk.device_name,
            'credential_id': _bytes_to_base64url(bytes(pk.credential_id)),
            'transports': pk.transports,
            'is_active': pk.is_active,
            'created_at': pk.created_at.isoformat() if pk.created_at else None,
            'last_used_at': pk.last_used_at.isoformat() if pk.last_used_at else None,
        }
        for pk in passkeys
    ]


def delete_user_passkey(user: CustomUser, passkey_id: int) -> bool:
    """
    Xóa một passkey của user.
    
    Returns:
        True nếu xóa thành công
    
    Raises:
        AuthenticationError nếu passkey không tồn tại hoặc không thuộc user
    """
    try:
        passkey = UserPasskey.objects.get(id=passkey_id, user=user)
    except UserPasskey.DoesNotExist:
        raise AuthenticationError("Passkey không tồn tại hoặc không thuộc về bạn.")
    
    passkey.delete()
    return True


def update_passkey_name(user: CustomUser, passkey_id: int, device_name: str) -> dict:
    """
    Cập nhật tên thiết bị của passkey.
    
    Returns:
        dict chứa thông tin passkey đã cập nhật
    """
    try:
        passkey = UserPasskey.objects.get(id=passkey_id, user=user)
    except UserPasskey.DoesNotExist:
        raise AuthenticationError("Passkey không tồn tại hoặc không thuộc về bạn.")
    
    passkey.device_name = device_name
    passkey.save(update_fields=['device_name'])
    
    return {
        'id': passkey.id,
        'device_name': passkey.device_name,
        'credential_id': _bytes_to_base64url(bytes(passkey.credential_id)),
        'is_active': passkey.is_active,
        'created_at': passkey.created_at.isoformat() if passkey.created_at else None,
        'last_used_at': passkey.last_used_at.isoformat() if passkey.last_used_at else None,
    }
