import { expect, type Page, type APIRequestContext } from '@playwright/test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

export const apiUrl = process.env.E2E_API_BASE_URL ?? process.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:8011';
export const samplePdfPath = path.join(rootDir, 'backend/media/e2e_cv_blog/e2e_cv_blog_sample.pdf');
export const e2ePassword = 'JobioE2E!123';

export const e2eUsers = {
  admin: 'e2e_cv_blog_admin@jobio-e2e.dev',
  candidate: 'e2e_cv_blog_candidate@jobio-e2e.dev',
  company: 'e2e_cv_blog_company@jobio-e2e.dev',
};

type LoginData = {
  access_token: string;
  refresh_token: string;
  user: {
    id: number;
    role: string;
    candidate_id?: number;
    recruiter_id?: number;
    [key: string]: unknown;
  };
};

const loginCache = new Map<keyof typeof e2eUsers, LoginData>();

export function watchPageErrors(page: Page) {
  const errors: string[] = [];
  const ignoredResponsePatterns = [/^https:\/\/t\d+\.gstatic\.com\/faviconV2/];

  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => {
    if (message.type() === 'error' && !message.text().startsWith('Failed to load resource:')) {
      errors.push(message.text());
    }
  });
  page.on('response', response => {
    if (response.status() >= 400) {
      if (ignoredResponsePatterns.some(pattern => pattern.test(response.url()))) return;
      errors.push(`${response.status()} ${response.url()}`);
    }
  });

  return {
    assertClean() {
      expect(errors).toEqual([]);
    },
  };
}

export async function loginByApi(page: Page, role: keyof typeof e2eUsers) {
  const data = await loginRequest(page.request, role);
  await page.addInitScript(auth => {
    window.localStorage.setItem(
      'jobio-user-storage',
      JSON.stringify({
        state: {
          user: auth.user,
          accessToken: auth.access_token,
          refreshToken: auth.refresh_token,
          rememberMe: true,
          isAuthenticated: true,
        },
        version: 0,
      }),
    );
  }, data);
  return data;
}

export async function loginRequest(request: APIRequestContext, role: keyof typeof e2eUsers) {
  const cached = loginCache.get(role);
  if (cached) return cached;

  const response = await request.post(`${apiUrl}/api/users/auth/login/`, {
    data: {
      email: e2eUsers[role],
      password: e2ePassword,
      remember_me: true,
    },
  });
  if (!response.ok()) {
    throw new Error(`Login ${role} failed ${response.status()}: ${await response.text()}`);
  }
  const data = await response.json() as LoginData;
  loginCache.set(role, data);
  return data;
}

export async function authedRequest(
  request: APIRequestContext,
  token: string,
  method: 'get' | 'post' | 'patch' | 'delete',
  url: string,
  data?: unknown,
) {
  return request[method](`${apiUrl}${url}`, {
    headers: { Authorization: `Bearer ${token}` },
    data,
  });
}

export async function expectStoredCandidateId(page: Page) {
  await expect
    .poll(() =>
      page.evaluate(() => {
        const raw = localStorage.getItem('jobio-user-storage') ?? sessionStorage.getItem('jobio-user-storage');
        return raw ? JSON.parse(raw).state.user : null;
      }),
    )
    .toBeTruthy();

  const user = await page.evaluate(() => {
    const raw = localStorage.getItem('jobio-user-storage') ?? sessionStorage.getItem('jobio-user-storage');
    return raw ? JSON.parse(raw).state.user : null;
  });

  expect(user.candidate_id).toBeGreaterThan(0);
  expect(user.recruiter_id).toBe(user.candidate_id);
  return user.candidate_id as number;
}

export const tinyPng = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAFgwJ/lbP0GwAAAABJRU5ErkJggg==',
  'base64',
);
