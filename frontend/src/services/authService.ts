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
    return api.post<LoginResponse>('/api/users/login/', data);
  },

  register(data: RegisterRequest) {
    return api.post<LoginResponse>('/api/users/register/', data);
  },

  logout() {
    return api.post('/api/users/logout/');
  },

  refreshToken(refresh: string) {
    return api.post<{ access: string; refresh?: string }>('/api/token/refresh/', { refresh });
  },

  // ─── Profile ─────────────────────────────────────────────────────────────

  getMe() {
    return api.get<User>('/api/users/profile/');
  },

  updateProfile(data: Partial<User>) {
    return api.patch<User>('/api/users/profile/', data);
  },

  uploadAvatar(file: File) {
    const formData = new FormData();
    formData.append('avatar', file);
    return api.patch<User>('/api/users/profile/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  // ─── Password ────────────────────────────────────────────────────────────

  changePassword(data: ChangePasswordRequest) {
    return api.post('/api/users/change-password/', data);
  },

  forgotPassword(data: ForgotPasswordRequest) {
    return api.post('/api/users/forgot-password/', data);
  },

  resetPassword(data: ResetPasswordRequest) {
    return api.post('/api/users/reset-password/', data);
  },

  // ─── Email Verification ──────────────────────────────────────────────────

  verifyEmail(token: string) {
    return api.post('/api/users/verify-email/', { token });
  },

  resendVerification() {
    return api.post('/api/users/resend-verification/');
  },

  // ─── 2FA ─────────────────────────────────────────────────────────────────

  get2FAStatus() {
    return api.get<TwoFactorStatus>('/api/users/2fa/status/');
  },

  enable2FA() {
    return api.post<TwoFactorStatus>('/api/users/2fa/enable/');
  },

  verify2FA(code: string) {
    return api.post('/api/users/2fa/verify/', { code });
  },

  disable2FA(code: string) {
    return api.post('/api/users/2fa/disable/', { code });
  },

  // ─── Social Auth ─────────────────────────────────────────────────────────

  socialAuth(data: SocialAuthRequest) {
    return api.post<LoginResponse>('/api/users/social-auth/', data);
  },
};
