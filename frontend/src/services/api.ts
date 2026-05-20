import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { useUserStore } from '@/store/userStore';

// Axios Instance
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30_000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

const STORAGE_KEY = 'jobio-user-storage';

function getPersistedTokens(): { accessToken: string | null; refreshToken: string | null } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { accessToken: null, refreshToken: null };
    const parsed = JSON.parse(raw);
    return {
      accessToken: parsed?.state?.accessToken ?? null,
      refreshToken: parsed?.state?.refreshToken ?? null,
    };
  } catch {
    return { accessToken: null, refreshToken: null };
  }
}

function setPersistedTokens(accessToken: string, refreshToken: string) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    parsed.state.accessToken = accessToken;
    parsed.state.refreshToken = refreshToken;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
  } catch {
    // silent – the store will re-hydrate on next page load
  }
}

function clearPersistedAuth() {
  useUserStore.getState().clearAuth();

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    parsed.state = {
      ...parsed.state,
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
  } catch {
    localStorage.removeItem(STORAGE_KEY);
  }
}

function redirectToAuthIfNeeded() {
  if (!window.location.pathname.startsWith('/auth')) {
    window.location.href = '/auth';
  }
}

function clearAuthAndRedirectToLogin() {
  clearPersistedAuth();
  redirectToAuthIfNeeded();
}

// Request Interceptor
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const { accessToken } = getPersistedTokens();
  if (accessToken && config.headers) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

// Response Interceptor (auto-refresh on 401)
let isRefreshing = false;
let failedQueue: { resolve: (token: string) => void; reject: (err: unknown) => void }[] = [];

function processQueue(error: unknown, token: string | null = null) {
  failedQueue.forEach(({ resolve, reject }) => {
    if (token) resolve(token);
    else reject(error);
  });
  failedQueue = [];
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Only attempt refresh for 401 errors that haven't already been retried
    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    // Don't attempt to refresh if the failing request was itself the refresh call
    if (originalRequest.url?.includes('/api/token/refresh')) {
      clearAuthAndRedirectToLogin();
      return Promise.reject(error);
    }

    if (isRefreshing) {
      // Queue this request until the current refresh finishes
      return new Promise<string>((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then((newToken) => {
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
        }
        return api(originalRequest);
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const { refreshToken } = getPersistedTokens();
      if (!refreshToken) {
        processQueue(error, null);
        clearAuthAndRedirectToLogin();
        return Promise.reject(error);
      }

      const { data } = await axios.post<{ access: string; refresh?: string }>(
        `${API_BASE_URL}/api/token/refresh/`,
        { refresh: refreshToken },
      );

      const newAccess = data.access;
      const newRefresh = data.refresh ?? refreshToken;

      setPersistedTokens(newAccess, newRefresh);
      processQueue(null, newAccess);

      if (originalRequest.headers) {
        originalRequest.headers.Authorization = `Bearer ${newAccess}`;
      }
      return api(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError, null);
      clearAuthAndRedirectToLogin();
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);

// Export the configured Axios instance for use in the app
export default api;
