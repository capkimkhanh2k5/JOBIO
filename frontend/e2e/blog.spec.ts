import { test, expect } from '@playwright/test';
import {
  apiUrl,
  authedRequest,
  loginByApi,
  loginRequest,
  tinyPng,
  watchPageErrors,
} from './helpers';

test('public blog shows published content, filters by category/tag, and opens detail', async ({ page }) => {
  const watcher = watchPageErrors(page);
  const publishedHeading = page.getByRole('heading', { name: 'E2E CV Blog Published Post' }).first();

  await page.goto('/blog');
  await expect(publishedHeading).toBeVisible();
  await expect(page.getByText('E2E CV Blog Draft Post')).toHaveCount(0);

  await page.getByRole('button', { name: /E2E CV Blog Career/ }).click();
  await expect(page).toHaveURL(/category_id=/);
  await expect(publishedHeading).toBeVisible();

  await page.getByRole('button', { name: /#E2E Hiring/ }).click();
  await expect(page).toHaveURL(/tag_id=/);
  await expect(publishedHeading).toBeVisible();

  await publishedHeading.click();
  await expect(page).toHaveURL(/\/blog\/e2e-cv-blog-published-post/);
  await expect(page.getByRole('heading', { name: 'E2E CV Blog Published Post' })).toBeVisible();
  await expect(page.getByText(/lượt xem/)).toBeVisible();
  watcher.assertClean();
});

test('company can create, edit, attach thumbnail, and delete its own post', async ({ page }) => {
  const watcher = watchPageErrors(page);
  const title = `E2E Company Playwright Post ${Date.now()}`;
  const updatedSummary = `Updated summary ${Date.now()}`;
  const login = await loginByApi(page, 'company');

  await page.goto('/company/blog/create');
  await page.getByPlaceholder(/Bí quyết/).fill(title);
  await page.getByPlaceholder(/Một vài dòng/).fill('Company E2E summary');
  await page.getByPlaceholder(/Bắt đầu chia sẻ/).fill('Company E2E blog content.');
  await page.getByText('Chọn chuyên mục').click();
  await page.getByRole('option', { name: 'E2E CV Blog Career' }).click();
  await page.getByRole('button', { name: /Công khai/ }).click();
  await page.locator('#thumbnail').setInputFiles({
    name: 'e2e-thumbnail.png',
    mimeType: 'image/png',
    buffer: tinyPng,
  });
  await expect(page.getByText('Upload thành công.', { exact: true })).toBeVisible({ timeout: 60_000 });
  await page.getByRole('button', { name: /Đăng bài viết/ }).click();

  await expect(page).toHaveURL(/\/company\/blog$/);
  await expect(page.getByText(title)).toBeVisible();

  const postsResponse = await authedRequest(
    page.request,
    login.access_token,
    'get',
    `/api/blog/posts/my-posts/?search=${encodeURIComponent(title)}`,
  );
  expect(postsResponse.ok()).toBeTruthy();
  const post = (await postsResponse.json()).results[0];
  expect(post.slug).toBeTruthy();

  await page.goto(`/company/blog/edit/${post.slug}`);
  await page.getByPlaceholder(/Một vài dòng/).fill(updatedSummary);
  await page.getByRole('button', { name: /Lưu thay đổi/ }).click();
  await expect(page).toHaveURL(/\/company\/blog$/);
  await expect(page.getByText(updatedSummary)).toBeVisible();

  const card = page.getByText(title).locator('xpath=ancestor::div[contains(@class, "group")][1]');
  await card.locator('button').last().click();
  await page.getByRole('menuitem', { name: /Xóa bài viết/ }).click();
  await page.getByRole('button', { name: /^Xóa bài viết$/ }).click();
  await expect(page.getByText('Đã xóa bài viết thành công')).toBeVisible();
  await expect(page.getByText(title)).toHaveCount(0);
  watcher.assertClean();
});

test('admin manages blog taxonomy and archives a post from moderation', async ({ page }) => {
  const watcher = watchPageErrors(page);
  const login = await loginRequest(page.request, 'admin');
  const title = `E2E Admin Ban Post ${Date.now()}`;

  const categories = await page.request.get(`${apiUrl}/api/blog/categories/`);
  expect(categories.ok()).toBeTruthy();
  const category = (await categories.json()).results.find((item: { name: string }) => item.name === 'E2E CV Blog Career');
  expect(category?.id).toBeGreaterThan(0);

  const createPost = await authedRequest(page.request, login.access_token, 'post', '/api/blog/posts/', {
    title,
    summary: 'Admin ban E2E summary',
    content: '<p>Admin ban E2E content.</p>',
    category_id: category.id,
    status: 'published',
  });
  expect(createPost.ok()).toBeTruthy();

  await loginByApi(page, 'admin');
  await page.goto('/admin/blog');
  await page.getByPlaceholder(/Tìm kiếm bài viết/).fill(title);
  const postRow = page.getByRole('row', { name: new RegExp(title) });
  await expect(postRow).toBeVisible();

  await postRow.getByRole('button', { name: 'Cảnh báo và lưu trữ' }).click();
  await page.getByPlaceholder(/Nhập lý do/).fill('E2E moderation check');
  await page.getByRole('button', { name: 'Xác nhận' }).click();
  await expect(page.getByText('Đã cảnh báo và lưu trữ bài viết')).toBeVisible();

  await page.getByRole('button', { name: /Danh mục/ }).click();
  await page.getByRole('button', { name: /Thêm danh mục/ }).click();
  await page.getByPlaceholder(/Tuyển dụng/).fill(`E2E Admin Category ${Date.now()}`);
  await page.getByRole('button', { name: /^Tạo danh mục$/ }).click();
  await expect(page.getByText('Đã tạo danh mục mới')).toBeVisible();

  await page.getByRole('button', { name: /Tags/ }).click();
  await page.getByRole('button', { name: /Thêm Tag/ }).click();
  await page.getByPlaceholder(/remote-work/).fill(`E2E Admin Tag ${Date.now()}`);
  await page.getByRole('button', { name: /^Tạo Tag$/ }).click();
  await expect(page.getByText('Đã thêm tag mới')).toBeVisible();

  await page.goto('/blog');
  await expect(page.getByText(title)).toHaveCount(0);
  watcher.assertClean();
});
