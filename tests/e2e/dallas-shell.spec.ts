import { expect, test } from '@playwright/test';

// Exercises the real Next.js app (production server from playwright.config webServer).
// Verifies: the early theme-init script applies a theme before paint, the toggle
// changes and persists the theme across a real navigation and a reload, navigation
// shows only routes that exist (no employer link without a verified role), and the
// landing surface actually re-themes. Runs at phone and desktop viewports.

for (const viewport of [{ width: 390, height: 844 }, { width: 1280, height: 800 }]) {
  test(`root shell ${viewport.width}px: theme toggle, navigation and reload persistence`, async ({ browser }) => {
    const context = await browser.newContext({ viewport, colorScheme: 'light' });
    const page = await context.newPage();
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => {
      if (message.type() === 'error' && !message.location().url.endsWith('/favicon.ico')) errors.push(message.text());
    });

    await page.goto('/');

    // The init script applies the system-default (light) theme before React hydrates.
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');

    // Navigation exposes only real routes. No employer link without a verified role,
    // and no links to not-yet-built pages.
    const nav = page.getByRole('navigation', { name: 'Main navigation' });
    await expect(nav.getByRole('link', { name: 'Home', exact: true })).toBeVisible();
    await expect(nav.getByRole('link', { name: 'Profile', exact: true })).toBeVisible();
    await expect(nav.getByRole('link', { name: 'Employer', exact: true })).toHaveCount(0);
    await expect(nav.getByRole('link', { name: 'Find jobs', exact: true })).toHaveCount(0);
    await expect(nav.getByRole('link', { name: 'Saved', exact: true })).toHaveCount(0);

    // Skip link reaches the landing main region.
    await page.keyboard.press('Tab');
    await expect(page.getByRole('link', { name: 'Skip to content', exact: true })).toBeFocused();

    // Changing the theme re-themes the actual landing surface.
    const readBackground = () =>
      page.evaluate(() => getComputedStyle(document.querySelector('.cf-root')!).backgroundColor);
    const lightBackground = await readBackground();
    const toggle = page.getByRole('button', { name: 'Dark theme', exact: true });
    await expect(toggle).toBeEnabled();
    await toggle.click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    const darkBackground = await readBackground();
    expect(darkBackground).not.toBe(lightBackground);

    // Navigate to /profile; the chosen theme survives a real navigation.
    await nav.getByRole('link', { name: 'Profile', exact: true }).click();
    await page.waitForURL(/\/profile$/);
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await expect(page.getByRole('heading', { name: 'Start with your story.' })).toBeVisible();

    // Navigate back home via the profile brand link.
    await page.getByRole('link', { name: 'Career Forge', exact: true }).click();
    await page.waitForURL(url => new URL(url).pathname === '/');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await expect(page.getByRole('navigation', { name: 'Main navigation' })).toBeVisible();

    // Reload keeps both the chosen theme and the navigation.
    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await expect(
      page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name: 'Profile', exact: true }),
    ).toBeVisible();

    // No horizontal overflow at this viewport, and only the theme preference is stored.
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    expect(await page.evaluate(() => Object.keys(localStorage))).toEqual(['careerforge-theme']);
    expect(errors).toEqual([]);

    await context.close();
  });
}
