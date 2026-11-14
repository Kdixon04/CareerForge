import { expect, test } from '@playwright/test';

for (const viewport of [{ width: 390, height: 844 }, { width: 1280, height: 800 }]) {
  for (const colorScheme of ['light', 'dark'] as const) {
    test(`fictional calendar ${viewport.width}/${colorScheme} labels its dates and exports`, async ({ browser }) => {
      const context = await browser.newContext({ viewport, colorScheme });
      const page = await context.newPage();
      await page.goto('/calendar');
      await expect(page.getByRole('complementary', { name: 'Calendar preview limitations' })).toContainText('November 13, 2026');
      await expect(page.getByRole('complementary', { name: 'Calendar preview limitations' })).toContainText('Google Calendar');
      await expect(page.getByRole('heading', { name: 'Fictional events' })).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      const background = await page.locator('.calendar-grid').evaluate(element => getComputedStyle(element).backgroundColor);
      expect(background).toBe(colorScheme === 'dark' ? 'rgb(39, 46, 43)' : 'rgb(255, 255, 255)');
      for (let index = 0; index < 3; index++) await page.getByRole('button', { name: 'Previous month' }).click();
      await expect(page.getByRole('region', { name: 'August 2026 calendar' }).locator('.calendar-day')).toHaveCount(42);
      await page.getByRole('button', { name: /Frontend Engineering Intern/ }).first().click();
      await expect(page.getByRole('region', { name: 'Event details' })).toContainText('fictional');
      await context.close();
    });
  }
}
