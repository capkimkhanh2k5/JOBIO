import api from './api';
import type {
  User,
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  ChangePasswordRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  TwoFactorStatus,
  SocialAuthRequest,
} from '@/types/api';

// ─── Auth ────────────────────────────────────────────────────────────────────

export const authService = {
  login(data: LoginRequest) {
    return api.post<LoginResponse>('/api/users/auth/login/', data);
  },

  register(data: RegisterRequest) {
    return api.post<LoginResponse>('/api/users/auth/register/', data);
  },

  sendRegistrationOtp(data: { email: string }) {
    return api.post('/api/users/auth/send-registration-otp/', data);
  },

  verifyRegistrationOtp(data: { email: string; otp: string }) {
    return api.post('/api/users/auth/verify-registration-otp/', data);
  },

  logout() {
    // Lấy refresh token từ localStorage để backend thực hiện blacklist
    const raw = localStorage.getItem('jobio-user-storage');
    let refresh_token = null;
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        refresh_token = parsed?.state?.refreshToken;
      } catch (e) {
        console.error('Error parsing storage for logout:', e);
      }
    }
    return api.post('/api/users/auth/logout/', { refresh_token });
  },

  refreshToken(refresh: string) {
    return api.post<{ access: string; refresh?: string }>('/api/token/refresh/', { refresh });
  },

  // ─── Profile ─────────────────────────────────────────────────────────────

  getMe() {
    return api.get<User>('/api/users/auth/me/');
  },

  updateProfile(userId: number, data: Partial<User>) {
    return api.put<User>(`/api/users/${userId}/`, data);
  },

  uploadAvatar(file: File) {
    const formData = new FormData();
    formData.append('avatar', file);
    return api.post<User>('/api/users/me/avatar/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  // ─── Password ────────────────────────────────────────────────────────────

  changePassword(data: ChangePasswordRequest) {
    return api.post('/api/users/auth/change-password/', data);
  },

  forgotPassword(data: ForgotPasswordRequest) {
    return api.post('/api/users/auth/forgot-password/', data);
  },

  resetPassword(data: ResetPasswordRequest) {
    return api.post('/api/users/auth/reset-password/', data);
  },

  // ─── Email Verification ──────────────────────────────────────────────────

  verifyEmail(token: string) {
    return api.post('/api/users/auth/verify-email/', { email_verification_token: token });
  },

  resendVerification(email: string) {
    return api.post('/api/users/auth/resend-verification/', { email });
  },

  checkEmail(email: string) {
    return api.post<{ exists: boolean }>('/api/users/auth/check-email/', { email });
  },

  // ─── 2FA ─────────────────────────────────────────────────────────────────

  get2FAStatus() {
    return api.get<TwoFactorStatus>('/api/users/auth/2fa/status/');
  },

  enable2FA() {
    return api.post<TwoFactorStatus>('/api/users/auth/2fa/enable/');
  },

  verify2FA(code: string) {
    return api.post('/api/users/auth/verify-2fa/', { code });
  },

  disable2FA(code: string) {
    return api.post('/api/users/auth/2fa/disable/', { code });
  },

  // ─── Social Auth ─────────────────────────────────────────────────────────

  socialAuth(data: SocialAuthRequest) {
    return api.post<LoginResponse>(`/api/users/auth/social/${data.provider}/`, data);
  },
};
