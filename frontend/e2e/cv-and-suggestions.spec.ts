import { test, expect } from '@playwright/test';
import {
  apiUrl,
  authedRequest,
  loginByApi,
  loginRequest,
  samplePdfPath,
  watchPageErrors,
} from './helpers';

test('candidate can create a template CV and render a nonblank preview', async ({ page }) => {
  const watcher = watchPageErrors(page);
  await loginByApi(page, 'candidate');

  await page.goto('/candidate/cv');
  await expect(page.getByRole('heading', { name: 'Quản lý CV' })).toBeVisible();
  await page.getByRole('button', { name: /Tạo CV mới/ }).click();
  await page.getByPlaceholder(/Frontend Developer/).fill(`E2E Template CV ${Date.now()}`);
  await page.getByText('Modern Classic').click();
  await page.getByRole('main').getByRole('button', { name: 'Tạo CV', exact: true }).click();

  await expect(page.getByText('CV mới đã được tạo!')).toBeVisible();
  const frameBody = page.frameLocator('iframe[title="CV Preview"]').locator('body');
  await expect(frameBody).not.toBeEmpty();
  watcher.assertClean();
});

test('candidate can upload a PDF CV and open the PDF preview', async ({ page }) => {
  const watcher = watchPageErrors(page);
  await loginByApi(page, 'candidate');

  await page.goto('/candidate/cv');
  const uploadComplete = page.waitForResponse(response =>
    response.url().includes('/cvs/upload/complete/'),
  );
  await page.locator('input[type="file"][accept=".pdf"]').setInputFiles(samplePdfPath);
  const uploadCompleteResponse = await uploadComplete;
  expect(uploadCompleteResponse.status()).toBe(201);

  await expect(page.getByRole('heading', { name: 'e2e_cv_blog_sample' })).toBeVisible({ timeout: 90_000 });
  await expect(page.locator('iframe[title="CV PDF Preview"]')).toBeVisible();
  watcher.assertClean();
});

test('suggested jobs auto-select a CV and quick apply uses that CV', async ({ page }) => {
  const watcher = watchPageErrors(page);
  const login = await loginRequest(page.request, 'candidate');
  const candidateId = login.user.candidate_id ?? login.user.recruiter_id;
  expect(candidateId).toBeGreaterThan(0);

  const templates = await page.request.get(`${apiUrl}/api/cv-templates/?page_size=20`);
  expect(templates.ok()).toBeTruthy();
  const template = (await templates.json()).results.find((item: { name: string }) => item.name === 'Modern Classic');
  expect(template?.id).toBeGreaterThan(0);

  const cvResponse = await authedRequest(
    page.request,
    login.access_token,
    'post',
    `/api/candidates/${candidateId}/cvs/`,
    {
      cv_name: `E2E Suggested CV ${Date.now()}`,
      template_id: template.id,
      cv_data: {
        personal: { years_of_experience: 4 },
        skills: [{ name: 'E2E Python' }],
      },
      is_public: true,
    },
  );
  expect(cvResponse.ok()).toBeTruthy();

  await loginByApi(page, 'candidate');
  const suggestionsPromise = page.waitForResponse(response =>
    response.url().includes('/api/jobs/recommendations/') && response.url().includes('cv_id='),
  );
  await page.goto('/candidate/suggested-jobs');
  await suggestionsPromise;

  const jobCard = page
    .getByRole('heading', { name: 'E2E Python Developer' })
    .locator('xpath=ancestor::div[contains(@class, "rounded-3xl")][1]');
  await expect(jobCard).toBeVisible();
  await expect(jobCard.getByText(/Match \d+%/)).toBeVisible();
  await expect(jobCard.getByText(/kỹ năng phù hợp/)).toBeVisible();
  await jobCard.getByRole('button', { name: /Ứng tuyển/ }).click();
  await expect(page.getByText(/Đã nộp đơn ứng tuyển thành công|đã ứng tuyển/i)).toBeVisible();
  watcher.assertClean();
});
