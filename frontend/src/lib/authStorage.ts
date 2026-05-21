import type { StateStorage } from 'zustand/middleware';

export const AUTH_STORAGE_KEY = 'jobio-user-storage';

type AuthPersistence = 'local' | 'session';

interface PersistedAuthState {
  state?: {
    accessToken?: string | null;
    refreshToken?: string | null;
    isAuthenticated?: boolean;
    rememberMe?: boolean;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

function getBrowserStorage(persistence: AuthPersistence): Storage | null {
  if (typeof window === 'undefined') return null;
  return persistence === 'local' ? window.localStorage : window.sessionStorage;
}

function parseAuth(value: string | null): PersistedAuthState | null {
  if (!value) return null;

  try {
    return JSON.parse(value) as PersistedAuthState;
  } catch {
    return null;
  }
}

function hasAuthData(state: PersistedAuthState['state']) {
  return Boolean(state?.isAuthenticated || state?.accessToken || state?.refreshToken);
}

export function getStoredAuthRaw(name = AUTH_STORAGE_KEY): string | null {
  const sessionValue = getBrowserStorage('session')?.getItem(name) ?? null;
  if (sessionValue) return sessionValue;

  return getBrowserStorage('local')?.getItem(name) ?? null;
}

export function clearStoredAuth(name = AUTH_STORAGE_KEY) {
  getBrowserStorage('session')?.removeItem(name);
  getBrowserStorage('local')?.removeItem(name);
}

function setStoredAuthValue(name: string, value: string) {
  const parsed = parseAuth(value);
  const state = parsed?.state;

  if (!hasAuthData(state)) {
    clearStoredAuth(name);
    return;
  }

  const persistence: AuthPersistence = state?.rememberMe ? 'local' : 'session';
  const fallback: AuthPersistence = persistence === 'local' ? 'session' : 'local';

  getBrowserStorage(persistence)?.setItem(name, value);
  getBrowserStorage(fallback)?.removeItem(name);
}

export function getStoredTokens() {
  const parsed = parseAuth(getStoredAuthRaw());

  return {
    accessToken: parsed?.state?.accessToken ?? null,
    refreshToken: parsed?.state?.refreshToken ?? null,
  };
}

export function replaceStoredTokens(accessToken: string, refreshToken: string) {
  const parsed = parseAuth(getStoredAuthRaw());
  if (!parsed?.state) return;

  parsed.state = {
    ...parsed.state,
    accessToken,
    refreshToken,
  };

  setStoredAuthValue(AUTH_STORAGE_KEY, JSON.stringify(parsed));
}

export const authStorage: StateStorage = {
  getItem: (name) => getStoredAuthRaw(name),
  setItem: setStoredAuthValue,
  removeItem: (name) => clearStoredAuth(name),
};
