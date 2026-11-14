import { expect, test } from '@playwright/test';

test('landing page is usable at the configured viewport', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle('Career Forge');
  await expect(page.getByRole('heading', { name: /Turn what you’ve learned/ })).toBeVisible();
  await expect(page.getByRole('link', { name: /Explore the foundation/ })).toBeVisible();
  await expect(page.locator('body')).toHaveCSS('overflow-x', 'visible');
});
