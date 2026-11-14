import { expect, test } from '@playwright/test';

const appURL = process.env.STEVE_APP_URL ?? 'http://127.0.0.1:3000';
const backgrounds = { light: 'rgb(250, 246, 239)', dark: 'rgb(28, 33, 31)' };

for (const viewport of [{ width: 390, height: 844 }, { width: 1280, height: 800 }]) {
  for (const colorScheme of ['light', 'dark'] as const) {
    test(`landing ${viewport.width}px / ${colorScheme}: shared colors, contrast, focus and system preference`, async ({ browser }) => {
      const context = await browser.newContext({ viewport, colorScheme });
      const page = await context.newPage();
      await page.goto(appURL);
      await expect(page.locator('body')).toHaveCSS('background-color', backgrounds[colorScheme]);
      await expect(page.getByRole('heading', { name: 'Turn what you’ve learned into what’s next.' })).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      // Measure rendered text against the actual surface, not just token definitions.
      for (const pair of [['body', 'body'], ['.lede', 'body'], ['.eyebrow', 'body'], ['.verified', '.hero-card'], ['.hero-card p', '.hero-card'], ['.button', '.button']]) {
        const ratio = await page.evaluate(([foreground, surface]) => {
          const luminance = (color: string) => {
            const values = color.match(/[\d.]+/g)!.slice(0, 3).map(Number).map(n => {
              const s = n / 255; return s <= .04045 ? s / 12.92 : ((s + .055) / 1.055) ** 2.4;
            });
            return values[0] * .2126 + values[1] * .7152 + values[2] * .0722;
          };
          const a = luminance(getComputedStyle(document.querySelector(foreground)!).color);
          const b = luminance(getComputedStyle(document.querySelector(surface)!).backgroundColor);
          return (Math.max(a, b) + .05) / (Math.min(a, b) + .05);
        }, pair);
        expect(ratio, `${pair.join(' on ')} contrast`).toBeGreaterThanOrEqual(4.5);
      }
      await page.keyboard.press('Tab');
      await expect(page.getByRole('link', { name: 'Career Forge home' })).toBeFocused();
      await page.keyboard.press('Tab');
      const action = page.getByRole('link', { name: 'Explore the foundation' });
      await expect(action).toBeFocused();
      await expect(action).toHaveCSS('outline-style', 'solid');
      expect(await action.evaluate(el => el.getBoundingClientRect().height)).toBeGreaterThanOrEqual(44);
      await page.keyboard.press('Enter');
      await expect(page).toHaveURL(/#preview$/);
      await page.screenshot({ path: `${process.env.STEVE_SCREENSHOTS ?? 'test-results'}/steve-shell-${viewport.width}-${colorScheme}.png`, fullPage: true, scale: 'css' });
      const opposite = colorScheme === 'light' ? 'dark' : 'light';
      await page.emulateMedia({ colorScheme: opposite });
      await expect(page.locator('body')).toHaveCSS('background-color', backgrounds[opposite]);
      await page.emulateMedia({ colorScheme });
      await expect(page.locator('body')).toHaveCSS('background-color', backgrounds[colorScheme]);
      await context.close();
    });
  }
}

test('landing follows dark system preference without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ colorScheme: 'dark', javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto(appURL);
  await expect(page.locator('body')).toHaveCSS('background-color', backgrounds.dark);
  await expect(page.getByRole('link', { name: 'Explore the foundation' })).toBeVisible();
  await context.close();
});
