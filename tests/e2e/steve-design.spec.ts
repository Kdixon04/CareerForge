import { expect, test } from '@playwright/test';

// Component fixture only. This suite makes no database/auth/persistence claims.
const baseURL = process.env.STEVE_PREVIEW_URL ?? 'http://127.0.0.1:4317';

for (const viewport of [{ width: 390, height: 844 }, { width: 1280, height: 800 }]) {
  for (const colorScheme of ['light', 'dark'] as const) {
    test(`${viewport.width}px / ${colorScheme}: inputs, keyboard, theme, navigation and reload`, async ({ browser }) => {
      const context = await browser.newContext({ viewport, colorScheme });
      const page = await context.newPage();
      const errors: string[] = [];
      page.on('pageerror', error => errors.push(error.message));
      page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
      await page.goto(baseURL);
      const toggle = page.getByRole('button', { name: 'Dark theme', exact: true });
      await expect(toggle).toBeEnabled();
      await expect(page.locator('html')).toHaveAttribute('data-theme', colorScheme);
      await expect(page.getByRole('heading', { name: 'Forge your next chapter.' })).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      // Skip link then the toggle: use actual keyboard events, not programmatic focus.
      await page.keyboard.press('Tab');
      await expect(page.getByRole('link', { name: 'Skip to content' })).toBeFocused();
      await page.keyboard.press('Tab');
      await expect(toggle).toBeFocused();
      expect(await toggle.evaluate(el => getComputedStyle(el).outlineStyle)).toBe('solid');
      await page.keyboard.press('Space');
      const opposite = colorScheme === 'dark' ? 'light' : 'dark';
      await expect(page.locator('html')).toHaveAttribute('data-theme', opposite);
      await page.reload();
      await expect(page.locator('html')).toHaveAttribute('data-theme', opposite);
      await page.getByRole('link', { name: 'Saved', exact: true }).click();
      await expect(page.locator('html')).toHaveAttribute('data-theme', opposite);
      await expect(page.getByRole('link', { name: 'Saved', exact: true })).toHaveAttribute('aria-current', 'page');
      await expect(page.getByText('No applications in this preview.')).toBeVisible();
      await page.getByRole('link', { name: 'Profile', exact: true }).click();
      await page.getByRole('button', { name: 'Try form validation' }).click();
      const input = page.getByRole('textbox', { name: 'Career field' });
      await expect(input).toHaveAttribute('aria-invalid', 'true');
      await expect(input).toBeFocused();
      await expect(page.getByRole('alert')).toHaveText('Enter a career field to try this example.');
      await input.fill('   ');
      await input.press('Enter');
      await expect(input).toHaveAttribute('aria-invalid', 'true');
      await input.fill('Environmental science');
      await input.press('Enter');
      await expect(page.getByRole('status')).toHaveText('Example accepted. Nothing was saved or sent.');
      await input.press('Enter');
      await expect(page.getByRole('status')).toHaveCount(1);
      await expect(page.getByRole('button', { name: 'Unavailable example' })).toBeDisabled();
      expect(await page.evaluate(() => Object.keys(localStorage))).toEqual(['careerforge-theme']);
      // Return to the requested screenshot theme after testing the opposite one.
      await toggle.click();
      await expect(page.locator('html')).toHaveAttribute('data-theme', colorScheme);
      await page.getByRole('img', { name: 'Career Forge: a hammer striking an anvil above a leather satchel' }).evaluate(async (image: HTMLImageElement) => { await image.decode(); });
      await page.screenshot({ path: `${process.env.STEVE_SCREENSHOTS ?? 'test-results'}/steve-${viewport.width}-${colorScheme}.png`, fullPage: true });
      expect(errors).toEqual([]);
      await context.close();
    });
  }
}

test('blocked storage and changing system preference remain usable', async ({ browser }) => {
  const context = await browser.newContext({ colorScheme: 'dark' });
  await context.addInitScript(() => {
    Storage.prototype.getItem = () => { throw new Error('Blocked'); };
    Storage.prototype.setItem = () => { throw new Error('Blocked'); };
  });
  const page = await context.newPage();
  await page.goto(baseURL);
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.emulateMedia({ colorScheme: 'light' });
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await page.getByRole('button', { name: 'Dark theme', exact: true }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.emulateMedia({ colorScheme: 'light' });
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await context.close();
});

test('server-rendered form and system theme work before hydration', async ({ browser }) => {
  const context = await browser.newContext({ colorScheme: 'dark' });
  const page = await context.newPage();
  await page.route('**/preview.js', route => route.abort());
  await page.goto(baseURL);
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await expect(page.getByRole('textbox', { name: 'Career field' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Dark theme', exact: true })).toBeDisabled();
  await context.close();
});
