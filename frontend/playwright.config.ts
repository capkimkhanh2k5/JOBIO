import { defineConfig, devices } from '@playwright/test';

const frontendUrl = process.env.E2E_BASE_URL ?? 'http://localhost:5173';
const apiUrl = process.env.E2E_API_BASE_URL ?? 'http://127.0.0.1:8011';

export default defineConfig({
  testDir: './e2e',
  timeout: 90_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 2 : 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  globalSetup: './e2e/global-setup.ts',
  use: {
    baseURL: frontendUrl,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  webServer: [
    {
      command: 'cd ../backend && DEBUG=1 .venv/bin/python manage.py runserver 127.0.0.1:8011',
      url: `${apiUrl}/api/blog/posts/`,
      reuseExistingServer: true,
      timeout: 120_000,
      env: {
        ...process.env,
        CORS_ALLOWED_ORIGINS: 'http://localhost:5173,http://127.0.0.1:5173',
        CSRF_TRUSTED_ORIGINS: 'http://localhost:5173,http://127.0.0.1:5173',
      },
    },
    {
      command: 'npm run dev -- --host localhost --port 5173',
      url: frontendUrl,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
      env: {
        ...process.env,
        VITE_API_BASE_URL: apiUrl,
      },
    },
  ],
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
