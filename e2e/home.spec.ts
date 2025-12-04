import { test, expect } from '@playwright/test';

test.describe('Home Page', () => {
  test('displays the Argos title', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Argos' })).toBeVisible();
  });

  test('displays login button', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('button', { name: 'Login' })).toBeVisible();
  });
});
