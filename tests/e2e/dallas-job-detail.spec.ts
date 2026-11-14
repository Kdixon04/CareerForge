import { expect, test } from '@playwright/test';

// Fixture-backed job detail at /jobs/[id]. Verifies the example job is reachable
// from /jobs, shows honest unverified/fixture labels and a source URL, and that
// an unknown id shows a clear empty state — with no claim of persistence or AI.
// Phone + desktop, both themes.

const EXAMPLE_JOB_ID = '22222222-2222-4222-8222-222222222222';
const UNKNOWN_JOB_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

for (const viewport of [{ width: 390, height: 844 }, { width: 1280, height: 800 }]) {
  for (const colorScheme of ['light', 'dark'] as const) {
    test(`job detail ${viewport.width}px / ${colorScheme}: example, missing, and labels`, async ({ browser }) => {
      const context = await browser.newContext({ viewport, colorScheme });
      const page = await context.newPage();
      const errors: string[] = [];
      page.on('pageerror', error => errors.push(error.message));
      page.on('console', message => {
        if (message.type() === 'error' && !message.location().url.endsWith('/favicon.ico')) errors.push(message.text());
      });

      await page.goto('/jobs');
      await expect(page.locator('html')).toHaveAttribute('data-theme', colorScheme);

      // Listing links into the fixture detail page.
      await page.getByRole('link', { name: 'Open example job detail' }).first().click();
      await page.waitForURL(`**/jobs/${EXAMPLE_JOB_ID}`);
      await expect(page.locator('html')).toHaveAttribute('data-theme', colorScheme);

      await expect(page.getByRole('heading', { name: 'Junior Web Developer' })).toBeVisible();
      await expect(page.getByText('Fixture preview — not loaded from the database.')).toBeVisible();
      await expect(page.getByText('● Unverified')).toBeVisible();
      await expect(page.getByText('Example opportunity')).toBeVisible();
      await expect(page.getByRole('article', { name: 'Job posting' })).toContainText('Build accessible web interfaces.');
      await expect(page.getByRole('link', { name: 'https://example.com/jobs/job-001' })).toBeVisible();
      await expect(page.getByRole('link', { name: 'Review match', exact: true })).toBeVisible();
      await expect(page.getByRole('link', { name: 'Prep for this role', exact: true })).toBeVisible();

      // Unknown id shows an honest empty state, not invented content.
      await page.goto(`/jobs/${UNKNOWN_JOB_ID}`);
      await expect(page.getByRole('heading', { name: 'Job not available' })).toBeVisible();
      await expect(page.getByText('No fixture posting matches this id.')).toBeVisible();
      await expect(page.getByRole('heading', { name: 'Junior Web Developer' })).toHaveCount(0);
      await expect(page.getByRole('link', { name: 'Back to paste a job', exact: true })).toBeVisible();

      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
      expect(errors).toEqual([]);

      await context.close();
    });
  }
}
