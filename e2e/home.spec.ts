import { test, expect } from '@playwright/test';

test.describe('Home Page', () => {
  test('displays the Ark title', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Ark' })).toBeVisible();
  });

  test('displays login button', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('button', { name: 'Login' })).toBeVisible();
  });
});
