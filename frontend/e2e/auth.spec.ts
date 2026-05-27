import { test, expect } from '@playwright/test';
import { e2ePassword, e2eUsers, expectStoredCandidateId, watchPageErrors } from './helpers';

test('candidate login persists a usable candidate profile id', async ({ page }) => {
  const watcher = watchPageErrors(page);

  await page.goto('/auth');
  await page.getByLabel('Email').fill(e2eUsers.candidate);
  await page.getByLabel('Mật khẩu').fill(e2ePassword);
  await page.getByRole('button', { name: /^Đăng nhập$/ }).click();

  const candidateId = await expectStoredCandidateId(page);
  expect(candidateId).toBeGreaterThan(0);
  watcher.assertClean();
});
