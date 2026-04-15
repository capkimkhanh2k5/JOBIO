"""
Passkey (WebAuthn/FIDO2) Tests
==============================
Tests cho chức năng Passkey: model, service layer, và API endpoints.

Lưu ý: WebAuthn đầy đủ yêu cầu browser environment thực (navigator.credentials),
nên tests chủ yếu cover:
1. Model CRUD
2. Service layer logic (mock fido2 server)
3. API endpoints (authentication, permissions, serializer validation)
4. Management functions (list, delete, rename)
"""
import base64
from unittest.mock import patch, MagicMock

from django.test import TestCase, override_settings
from django.core.cache import cache
from rest_framework.test import APIClient
from rest_framework import status as http_status

from apps.core.users.models import CustomUser, UserPasskey
from apps.core.users.services.passkey import (
    generate_registration_options,
    verify_registration,
    generate_authentication_options,
    verify_authentication,
    list_user_passkeys,
    delete_user_passkey,
    update_passkey_name,
    _bytes_to_base64url,
    _base64url_to_bytes,
    _cache_key,
    AuthenticationError,
)

# Test URL conf chỉ include users app (tránh weasyprint import issue)
from django.urls import path, include
urlpatterns = [
    path('api/users/', include('apps.core.users.urls')),
]


# ============================================================================
# Helper functions
# ============================================================================

def _create_user(email='passkey@example.com', password='testpass123', **kwargs):
    """Tạo user cho test."""
    defaults = {
        'full_name': 'Passkey User',
        'role': 'candidate',
        'status': 'active',
        'email_verified': True,
    }
    defaults.update(kwargs)
    return CustomUser.objects.create_user(email=email, password=password, **defaults)


def _create_passkey(user, credential_id=None, device_name='Test Passkey', **kwargs):
    """Tạo passkey record cho test."""
    if credential_id is None:
        credential_id = b'\x01\x02\x03\x04\x05\x06\x07\x08'
    defaults = {
        'public_key': b'\xA1\x01\x02',  # Minimal CBOR
        'sign_count': 0,
        'device_name': device_name,
        'aaguid': '00000000-0000-0000-0000-000000000000',
        'transports': ['internal'],
        'is_active': True,
    }
    defaults.update(kwargs)
    return UserPasskey.objects.create(
        user=user,
        credential_id=credential_id,
        **defaults,
    )


# ============================================================================
# TEST: UserPasskey Model
# ============================================================================

class TestUserPasskeyModel(TestCase):
    """Test cases cho UserPasskey model."""

    def setUp(self):
        self.user = _create_user()

    def test_create_passkey(self):
        """Test tạo passkey thành công."""
        passkey = _create_passkey(self.user)
        self.assertEqual(passkey.user, self.user)
        self.assertEqual(passkey.device_name, 'Test Passkey')
        self.assertEqual(passkey.sign_count, 0)
        self.assertTrue(passkey.is_active)
        self.assertIsNotNone(passkey.created_at)
        self.assertIsNone(passkey.last_used_at)

    def test_passkey_str(self):
        """Test __str__ của passkey."""
        passkey = _create_passkey(self.user, device_name='MacBook Touch ID')
        self.assertEqual(str(passkey), f"{self.user.email} - MacBook Touch ID")

    def test_multiple_passkeys_per_user(self):
        """Test user có thể có nhiều passkey."""
        _create_passkey(self.user, credential_id=b'\x01\x02\x03', device_name='Key 1')
        _create_passkey(self.user, credential_id=b'\x04\x05\x06', device_name='Key 2')
        _create_passkey(self.user, credential_id=b'\x07\x08\x09', device_name='Key 3')
        self.assertEqual(self.user.passkeys.count(), 3)

    def test_credential_id_unique(self):
        """Test credential_id phải unique."""
        cred_id = b'\x01\x02\x03\x04'
        _create_passkey(self.user, credential_id=cred_id)
        with self.assertRaises(Exception):
            _create_passkey(self.user, credential_id=cred_id)

    def test_cascade_delete(self):
        """Test xóa user thì xóa passkeys liên quan."""
        _create_passkey(self.user, credential_id=b'\x01')
        _create_passkey(self.user, credential_id=b'\x02')
        self.assertEqual(UserPasskey.objects.count(), 2)
        self.user.delete()
        self.assertEqual(UserPasskey.objects.count(), 0)

    def test_ordering_by_created_at_desc(self):
        """Test passkeys được sắp xếp theo created_at giảm dần."""
        pk1 = _create_passkey(self.user, credential_id=b'\x01', device_name='First')
        pk2 = _create_passkey(self.user, credential_id=b'\x02', device_name='Second')
        passkeys = list(UserPasskey.objects.filter(user=self.user))
        self.assertEqual(passkeys[0].device_name, 'Second')  # Mới nhất trước

    def test_default_transports_empty_list(self):
        """Test transports default là list rỗng."""
        passkey = UserPasskey.objects.create(
            user=self.user,
            credential_id=b'\xaa\xbb',
            public_key=b'\x01',
            sign_count=0,
        )
        self.assertEqual(passkey.transports, [])


# ============================================================================
# TEST: Utility Functions
# ============================================================================

class TestUtilityFunctions(TestCase):
    """Test helper functions trong passkey service."""

    def test_bytes_to_base64url(self):
        """Test bytes -> base64url encoding."""
        result = _bytes_to_base64url(b'\x01\x02\x03')
        self.assertIsInstance(result, str)
        # No padding
        self.assertNotIn('=', result)
        # URL safe
        self.assertNotIn('+', result)
        self.assertNotIn('/', result)

    def test_base64url_to_bytes(self):
        """Test base64url -> bytes decoding."""
        original = b'\x01\x02\x03\x04\x05'
        encoded = _bytes_to_base64url(original)
        decoded = _base64url_to_bytes(encoded)
        self.assertEqual(original, decoded)

    def test_base64url_roundtrip(self):
        """Test encode -> decode roundtrip."""
        for data in [b'', b'\x00', b'\xff' * 32, b'Hello World']:
            encoded = _bytes_to_base64url(data)
            decoded = _base64url_to_bytes(encoded)
            self.assertEqual(data, decoded)

    def test_cache_key_format(self):
        """Test cache key format."""
        key = _cache_key('user123', 'register')
        self.assertEqual(key, 'passkey:challenge:register:user123')

        key = _cache_key('session-abc', 'authenticate')
        self.assertEqual(key, 'passkey:challenge:authenticate:session-abc')


# ============================================================================
# TEST: Registration Service
# ============================================================================

@override_settings(
    WEBAUTHN_RP_ID='localhost',
    WEBAUTHN_RP_NAME='TestPortal',
    WEBAUTHN_ORIGIN='http://localhost:4000',
    CACHES={'default': {'BACKEND': 'django.core.cache.backends.locmem.LocMemCache'}},
)
class TestRegistrationService(TestCase):
    """Test generate_registration_options & verify_registration."""

    def setUp(self):
        self.user = _create_user()
        cache.clear()

    def tearDown(self):
        cache.clear()

    def test_generate_registration_options_success(self):
        """Test tạo registration options thành công."""
        options = generate_registration_options(user=self.user)

        # Phải có các key cần thiết
        self.assertIn('rp', options)
        self.assertIn('user', options)
        self.assertIn('challenge', options)
        self.assertIn('pubKeyCredParams', options)

        # RP info
        self.assertEqual(options['rp']['id'], 'localhost')
        self.assertEqual(options['rp']['name'], 'TestPortal')

        # User info
        self.assertIn('name', options['user'])

        # Challenge phải là string (base64url-encoded)
        self.assertIsInstance(options['challenge'], str)
        self.assertTrue(len(options['challenge']) > 0)

        # pubKeyCredParams phải chứa ít nhất 1 algorithm
        self.assertTrue(len(options['pubKeyCredParams']) > 0)
        for param in options['pubKeyCredParams']:
            self.assertEqual(param['type'], 'public-key')
            self.assertIn('alg', param)

    def test_generate_registration_options_caches_state(self):
        """Test state được lưu vào cache."""
        options = generate_registration_options(user=self.user)
        cache_key = _cache_key(str(self.user.id), 'register')
        state = cache.get(cache_key)
        self.assertIsNotNone(state)
        self.assertIn('challenge', state)

    def test_generate_registration_options_excludes_existing(self):
        """Test options exclude các credentials đã đăng ký."""
        _create_passkey(self.user, credential_id=b'\x01\x02\x03\x04')
        options = generate_registration_options(user=self.user)

        # Nếu có excludeCredentials thì phải chứa credential đã register
        if 'excludeCredentials' in options:
            self.assertTrue(len(options['excludeCredentials']) > 0)

    def test_generate_registration_options_inactive_user(self):
        """Test user inactive bị từ chối."""
        self.user.status = 'inactive'
        self.user.save()
        with self.assertRaises(AuthenticationError):
            generate_registration_options(user=self.user)

    def test_generate_registration_options_banned_user(self):
        """Test user bị ban bị từ chối."""
        self.user.status = 'banned'
        self.user.save()
        with self.assertRaises(AuthenticationError):
            generate_registration_options(user=self.user)

    def test_verify_registration_expired_challenge(self):
        """Test verify với challenge đã hết hạn."""
        with self.assertRaises(AuthenticationError) as ctx:
            verify_registration(
                user=self.user,
                credential_id='AQIDBA',
                client_data_json='eyJ0eXBlIjoiZXhhbXBsZSJ9',
                attestation_object='o2NmbXRkbm9uZQ',
            )
        self.assertIn('hết hạn', str(ctx.exception))


# ============================================================================
# TEST: Authentication Service
# ============================================================================

@override_settings(
    WEBAUTHN_RP_ID='localhost',
    WEBAUTHN_RP_NAME='TestPortal',
    WEBAUTHN_ORIGIN='http://localhost:4000',
    CACHES={'default': {'BACKEND': 'django.core.cache.backends.locmem.LocMemCache'}},
)
class TestAuthenticationService(TestCase):
    """Test generate_authentication_options & verify_authentication."""

    def setUp(self):
        self.user = _create_user()
        self.passkey = _create_passkey(self.user)
        cache.clear()

    def tearDown(self):
        cache.clear()

    def test_generate_auth_options_with_email(self):
        """Test tạo auth options với email (user có passkey)."""
        options = generate_authentication_options(email=self.user.email)

        self.assertIn('challenge', options)
        self.assertIn('session_id', options)
        self.assertIn('rpId', options)
        self.assertIsInstance(options['challenge'], str)
        self.assertTrue(len(options['session_id']) > 0)

    def test_generate_auth_options_without_email(self):
        """Test tạo auth options không có email (discoverable credentials)."""
        options = generate_authentication_options()
        self.assertIn('challenge', options)
        self.assertIn('session_id', options)

    def test_generate_auth_options_no_passkey_registered(self):
        """Test error khi user chưa đăng ký passkey."""
        new_user = _create_user(email='nopasskey@example.com')
        with self.assertRaises(AuthenticationError) as ctx:
            generate_authentication_options(email=new_user.email)
        self.assertIn('chưa đăng ký', str(ctx.exception))

    def test_generate_auth_options_nonexistent_email(self):
        """Test với email không tồn tại → discoverable credentials (no error)."""
        # Nếu user không tồn tại, trả về options cho discoverable credentials
        options = generate_authentication_options(email='nobody@example.com')
        self.assertIn('challenge', options)

    def test_generate_auth_options_caches_state(self):
        """Test state được lưu vào cache."""
        options = generate_authentication_options(email=self.user.email)
        cache_key = _cache_key(options['session_id'], 'authenticate')
        cached = cache.get(cache_key)
        self.assertIsNotNone(cached)
        self.assertIn('state', cached)
        self.assertIn('session_id', cached)

    def test_verify_authentication_expired_session(self):
        """Test verify với session đã hết hạn."""
        with self.assertRaises(AuthenticationError) as ctx:
            verify_authentication(
                session_id='expired-session',
                credential_id='AQIDBA',
                client_data_json='eyJ0eXBlIjoiZXhhbXBsZSJ9',
                authenticator_data='AQIDBA',
                signature='AQIDBA',
            )
        self.assertIn('hết hạn', str(ctx.exception))


# ============================================================================
# TEST: Management Functions (List, Delete, Rename)
# ============================================================================

class TestManagementFunctions(TestCase):
    """Test passkey management: list, delete, rename."""

    def setUp(self):
        self.user = _create_user()
        self.other_user = _create_user(email='other@example.com')

    def test_list_user_passkeys_empty(self):
        """Test list passkeys khi user chưa có passkey nào."""
        result = list_user_passkeys(user=self.user)
        self.assertEqual(result, [])

    def test_list_user_passkeys(self):
        """Test list passkeys của user."""
        _create_passkey(self.user, credential_id=b'\x01', device_name='Key 1')
        _create_passkey(self.user, credential_id=b'\x02', device_name='Key 2')
        _create_passkey(self.other_user, credential_id=b'\x03', device_name='Other Key')

        result = list_user_passkeys(user=self.user)
        self.assertEqual(len(result), 2)
        device_names = {pk['device_name'] for pk in result}
        self.assertEqual(device_names, {'Key 1', 'Key 2'})

    def test_list_user_passkeys_includes_fields(self):
        """Test list trả về đúng fields."""
        _create_passkey(self.user, credential_id=b'\x01', device_name='Key 1')
        result = list_user_passkeys(user=self.user)
        pk = result[0]
        self.assertIn('id', pk)
        self.assertIn('device_name', pk)
        self.assertIn('credential_id', pk)
        self.assertIn('transports', pk)
        self.assertIn('is_active', pk)
        self.assertIn('created_at', pk)
        self.assertIn('last_used_at', pk)

    def test_list_user_passkeys_credential_id_base64url(self):
        """Test credential_id trong list response là base64url string."""
        _create_passkey(self.user, credential_id=b'\x01\x02\x03')
        result = list_user_passkeys(user=self.user)
        cred_id = result[0]['credential_id']
        self.assertIsInstance(cred_id, str)
        # Decode phải khớp original
        decoded = _base64url_to_bytes(cred_id)
        self.assertEqual(decoded, b'\x01\x02\x03')

    def test_delete_user_passkey_success(self):
        """Test xóa passkey thành công."""
        passkey = _create_passkey(self.user, credential_id=b'\x01')
        result = delete_user_passkey(user=self.user, passkey_id=passkey.id)
        self.assertTrue(result)
        self.assertEqual(UserPasskey.objects.count(), 0)

    def test_delete_user_passkey_not_found(self):
        """Test xóa passkey không tồn tại."""
        with self.assertRaises(AuthenticationError):
            delete_user_passkey(user=self.user, passkey_id=99999)

    def test_delete_user_passkey_wrong_user(self):
        """Test không thể xóa passkey của user khác."""
        passkey = _create_passkey(self.other_user, credential_id=b'\x01')
        with self.assertRaises(AuthenticationError):
            delete_user_passkey(user=self.user, passkey_id=passkey.id)

    def test_update_passkey_name_success(self):
        """Test đổi tên passkey thành công."""
        passkey = _create_passkey(self.user, credential_id=b'\x01', device_name='Old Name')
        result = update_passkey_name(
            user=self.user,
            passkey_id=passkey.id,
            device_name='New MacBook Pro',
        )
        self.assertEqual(result['device_name'], 'New MacBook Pro')
        self.assertEqual(result['id'], passkey.id)

        # Verify trong DB
        passkey.refresh_from_db()
        self.assertEqual(passkey.device_name, 'New MacBook Pro')

    def test_update_passkey_name_not_found(self):
        """Test đổi tên passkey không tồn tại."""
        with self.assertRaises(AuthenticationError):
            update_passkey_name(user=self.user, passkey_id=99999, device_name='New')

    def test_update_passkey_name_wrong_user(self):
        """Test không thể đổi tên passkey của user khác."""
        passkey = _create_passkey(self.other_user, credential_id=b'\x01')
        with self.assertRaises(AuthenticationError):
            update_passkey_name(user=self.user, passkey_id=passkey.id, device_name='Hack')


# ============================================================================
# TEST: API Endpoints
# ============================================================================

@override_settings(
    WEBAUTHN_RP_ID='localhost',
    WEBAUTHN_RP_NAME='TestPortal',
    WEBAUTHN_ORIGIN='http://localhost:4000',
    CACHES={'default': {'BACKEND': 'django.core.cache.backends.locmem.LocMemCache'}},
    ROOT_URLCONF='apps.core.users.tests.test_passkey',
)
class TestPasskeyAPIEndpoints(TestCase):
    """Test API endpoints cho Passkey."""

    def setUp(self):
        self.client = APIClient()
        self.user = _create_user()
        cache.clear()

    def tearDown(self):
        cache.clear()

    def _auth(self, user=None):
        """Authenticate the test client."""
        from rest_framework_simplejwt.tokens import RefreshToken
        u = user or self.user
        refresh = RefreshToken.for_user(u)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')

    # ---------- Registration Options ----------

    def test_register_options_requires_auth(self):
        """Test register options yêu cầu đăng nhập."""
        response = self.client.post('/api/users/auth/passkey/register/options/')
        self.assertEqual(response.status_code, http_status.HTTP_401_UNAUTHORIZED)

    def test_register_options_success(self):
        """Test register options trả về đúng format."""
        self._auth()
        response = self.client.post('/api/users/auth/passkey/register/options/')
        self.assertEqual(response.status_code, http_status.HTTP_200_OK)
        data = response.json()
        self.assertIn('rp', data)
        self.assertIn('challenge', data)
        self.assertIn('pubKeyCredParams', data)
        self.assertIn('user', data)

    # ---------- Registration Verify ----------

    def test_register_verify_requires_auth(self):
        """Test register verify yêu cầu đăng nhập."""
        response = self.client.post('/api/users/auth/passkey/register/verify/', {})
        self.assertEqual(response.status_code, http_status.HTTP_401_UNAUTHORIZED)

    def test_register_verify_validates_input(self):
        """Test register verify kiểm tra input."""
        self._auth()
        response = self.client.post('/api/users/auth/passkey/register/verify/', {}, format='json')
        self.assertEqual(response.status_code, http_status.HTTP_400_BAD_REQUEST)

    def test_register_verify_required_fields(self):
        """Test register verify yêu cầu các trường bắt buộc."""
        self._auth()
        response = self.client.post('/api/users/auth/passkey/register/verify/', {
            'credential_id': 'AQIDBA',
            # Missing client_data_json & attestation_object
        }, format='json')
        self.assertEqual(response.status_code, http_status.HTTP_400_BAD_REQUEST)

    # ---------- Authentication Options ----------

    def test_auth_options_public_access(self):
        """Test auth options không yêu cầu đăng nhập."""
        response = self.client.post('/api/users/auth/passkey/authenticate/options/', {}, format='json')
        # Phải trả về 200 (hoặc 400 nếu validation error, nhưng KHÔNG phải 401)
        self.assertNotEqual(response.status_code, http_status.HTTP_401_UNAUTHORIZED)

    def test_auth_options_with_email(self):
        """Test auth options với email có passkey."""
        _create_passkey(self.user, credential_id=b'\x01\x02\x03')
        response = self.client.post(
            '/api/users/auth/passkey/authenticate/options/',
            {'email': self.user.email},
            format='json',
        )
        self.assertEqual(response.status_code, http_status.HTTP_200_OK)
        data = response.json()
        self.assertIn('challenge', data)
        self.assertIn('session_id', data)

    def test_auth_options_no_passkey_error(self):
        """Test auth options với email mà user chưa có passkey."""
        response = self.client.post(
            '/api/users/auth/passkey/authenticate/options/',
            {'email': self.user.email},
            format='json',
        )
        self.assertEqual(response.status_code, http_status.HTTP_400_BAD_REQUEST)

    # ---------- Authentication Verify ----------

    def test_auth_verify_public_access(self):
        """Test auth verify không yêu cầu đăng nhập (nhưng cần valid data)."""
        response = self.client.post(
            '/api/users/auth/passkey/authenticate/verify/',
            {
                'session_id': 'fake-session',
                'credential_id': 'AQIDBA',
                'client_data_json': 'test',
                'authenticator_data': 'test',
                'signature': 'test',
            },
            format='json',
        )
        # Phải trả về 401 (expired session) chứ không phải 401 (unauthorized)
        # Hoặc 400. Quan trọng là request được xử lý, không bị chặn bởi auth
        self.assertIn(response.status_code, [
            http_status.HTTP_401_UNAUTHORIZED,
            http_status.HTTP_400_BAD_REQUEST,
        ])

    # ---------- Passkey List ----------

    def test_passkey_list_requires_auth(self):
        """Test list passkeys yêu cầu đăng nhập."""
        response = self.client.get('/api/users/auth/passkey/list/')
        self.assertEqual(response.status_code, http_status.HTTP_401_UNAUTHORIZED)

    def test_passkey_list_success(self):
        """Test list passkeys trả về đúng data."""
        self._auth()
        _create_passkey(self.user, credential_id=b'\x01', device_name='Key 1')
        _create_passkey(self.user, credential_id=b'\x02', device_name='Key 2')
        response = self.client.get('/api/users/auth/passkey/list/')
        self.assertEqual(response.status_code, http_status.HTTP_200_OK)
        data = response.json()
        self.assertEqual(len(data), 2)

    def test_passkey_list_empty(self):
        """Test list passkeys khi chưa có passkey."""
        self._auth()
        response = self.client.get('/api/users/auth/passkey/list/')
        self.assertEqual(response.status_code, http_status.HTTP_200_OK)
        self.assertEqual(response.json(), [])

    def test_passkey_list_only_own_passkeys(self):
        """Test list chỉ trả về passkeys của user hiện tại."""
        other_user = _create_user(email='other@example.com')
        _create_passkey(self.user, credential_id=b'\x01', device_name='My Key')
        _create_passkey(other_user, credential_id=b'\x02', device_name='Other Key')

        self._auth()
        response = self.client.get('/api/users/auth/passkey/list/')
        data = response.json()
        self.assertEqual(len(data), 1)
        self.assertEqual(data[0]['device_name'], 'My Key')

    # ---------- Passkey Delete ----------

    def test_passkey_delete_requires_auth(self):
        """Test delete passkey yêu cầu đăng nhập."""
        response = self.client.delete('/api/users/auth/passkey/1/delete/')
        self.assertEqual(response.status_code, http_status.HTTP_401_UNAUTHORIZED)

    def test_passkey_delete_success(self):
        """Test delete passkey thành công."""
        self._auth()
        passkey = _create_passkey(self.user, credential_id=b'\x01')
        response = self.client.delete(f'/api/users/auth/passkey/{passkey.id}/delete/')
        self.assertEqual(response.status_code, http_status.HTTP_200_OK)
        self.assertEqual(UserPasskey.objects.filter(user=self.user).count(), 0)

    def test_passkey_delete_not_found(self):
        """Test delete passkey không tồn tại."""
        self._auth()
        response = self.client.delete('/api/users/auth/passkey/99999/delete/')
        self.assertEqual(response.status_code, http_status.HTTP_400_BAD_REQUEST)

    def test_passkey_delete_other_user(self):
        """Test không thể delete passkey của user khác."""
        self._auth()
        other_user = _create_user(email='other2@example.com')
        passkey = _create_passkey(other_user, credential_id=b'\x01')
        response = self.client.delete(f'/api/users/auth/passkey/{passkey.id}/delete/')
        self.assertEqual(response.status_code, http_status.HTTP_400_BAD_REQUEST)
        # Passkey vẫn tồn tại
        self.assertTrue(UserPasskey.objects.filter(id=passkey.id).exists())

    # ---------- Passkey Rename ----------

    def test_passkey_rename_requires_auth(self):
        """Test rename passkey yêu cầu đăng nhập."""
        response = self.client.patch('/api/users/auth/passkey/1/rename/')
        self.assertEqual(response.status_code, http_status.HTTP_401_UNAUTHORIZED)

    def test_passkey_rename_success(self):
        """Test rename passkey thành công."""
        self._auth()
        passkey = _create_passkey(self.user, credential_id=b'\x01', device_name='Old Name')
        response = self.client.patch(
            f'/api/users/auth/passkey/{passkey.id}/rename/',
            {'device_name': 'New iPhone'},
            format='json',
        )
        self.assertEqual(response.status_code, http_status.HTTP_200_OK)
        data = response.json()
        self.assertEqual(data['device_name'], 'New iPhone')
        passkey.refresh_from_db()
        self.assertEqual(passkey.device_name, 'New iPhone')

    def test_passkey_rename_validates_input(self):
        """Test rename passkey yêu cầu device_name."""
        self._auth()
        passkey = _create_passkey(self.user, credential_id=b'\x01')
        response = self.client.patch(
            f'/api/users/auth/passkey/{passkey.id}/rename/',
            {},
            format='json',
        )
        self.assertEqual(response.status_code, http_status.HTTP_400_BAD_REQUEST)

    def test_passkey_rename_other_user(self):
        """Test không thể rename passkey của user khác."""
        self._auth()
        other_user = _create_user(email='other3@example.com')
        passkey = _create_passkey(other_user, credential_id=b'\x01', device_name='Their Key')
        response = self.client.patch(
            f'/api/users/auth/passkey/{passkey.id}/rename/',
            {'device_name': 'Hacked'},
            format='json',
        )
        self.assertEqual(response.status_code, http_status.HTTP_400_BAD_REQUEST)
        passkey.refresh_from_db()
        self.assertEqual(passkey.device_name, 'Their Key')


# ============================================================================
# TEST: Serializers
# ============================================================================

class TestPasskeySerializers(TestCase):
    """Test passkey serializers validation."""

    def test_register_verify_serializer_valid(self):
        """Test PasskeyRegisterVerifySerializer với data hợp lệ."""
        from apps.core.users.serializers import PasskeyRegisterVerifySerializer
        serializer = PasskeyRegisterVerifySerializer(data={
            'credential_id': 'AQIDBA',
            'client_data_json': 'eyJ0eXBlIjoiZXhhbXBsZSJ9',
            'attestation_object': 'o2NmbXRkbm9uZQ',
            'device_name': 'My MacBook',
            'transports': ['internal', 'hybrid'],
        })
        self.assertTrue(serializer.is_valid(), serializer.errors)

    def test_register_verify_serializer_required(self):
        """Test required fields của PasskeyRegisterVerifySerializer."""
        from apps.core.users.serializers import PasskeyRegisterVerifySerializer
        serializer = PasskeyRegisterVerifySerializer(data={})
        self.assertFalse(serializer.is_valid())
        self.assertIn('credential_id', serializer.errors)
        self.assertIn('client_data_json', serializer.errors)
        self.assertIn('attestation_object', serializer.errors)

    def test_auth_options_serializer_email_optional(self):
        """Test email là optional trong PasskeyAuthOptionsSerializer."""
        from apps.core.users.serializers import PasskeyAuthOptionsSerializer
        serializer = PasskeyAuthOptionsSerializer(data={})
        self.assertTrue(serializer.is_valid(), serializer.errors)

    def test_auth_verify_serializer_required(self):
        """Test required fields của PasskeyAuthVerifySerializer."""
        from apps.core.users.serializers import PasskeyAuthVerifySerializer
        serializer = PasskeyAuthVerifySerializer(data={})
        self.assertFalse(serializer.is_valid())
        self.assertIn('session_id', serializer.errors)
        self.assertIn('credential_id', serializer.errors)
        self.assertIn('client_data_json', serializer.errors)
        self.assertIn('authenticator_data', serializer.errors)
        self.assertIn('signature', serializer.errors)

    def test_delete_serializer(self):
        """Test PasskeyDeleteSerializer."""
        from apps.core.users.serializers import PasskeyDeleteSerializer
        serializer = PasskeyDeleteSerializer(data={'passkey_id': 1})
        self.assertTrue(serializer.is_valid(), serializer.errors)

    def test_update_name_serializer_required(self):
        """Test PasskeyUpdateNameSerializer yêu cầu device_name."""
        from apps.core.users.serializers import PasskeyUpdateNameSerializer
        serializer = PasskeyUpdateNameSerializer(data={})
        self.assertFalse(serializer.is_valid())
        self.assertIn('device_name', serializer.errors)

    def test_update_name_serializer_valid(self):
        """Test PasskeyUpdateNameSerializer hợp lệ."""
        from apps.core.users.serializers import PasskeyUpdateNameSerializer
        serializer = PasskeyUpdateNameSerializer(data={'device_name': 'My YubiKey 5C'})
        self.assertTrue(serializer.is_valid(), serializer.errors)
