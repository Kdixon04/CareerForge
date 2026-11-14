import { expect, test } from '@playwright/test';

// STRETCH — Internship Prep Hub preview at /jobs/[id]/prep. Verifies the four
// sections, both interview-question views, honest "sample/unverified/AI practice"
// labelling, safe escaped rendering of typed experience, and no horizontal
// overflow. Everything is fixture-only and inert (no network). Phone + desktop,
// both themes.

const EXAMPLE_JOB_ID = '22222222-2222-4222-8222-222222222222';

for (const viewport of [{ width: 390, height: 844 }, { width: 1280, height: 800 }]) {
  for (const colorScheme of ['light', 'dark'] as const) {
    test(`prep hub ${viewport.width}px / ${colorScheme}: sections, two views, honest labels`, async ({ browser }) => {
      const context = await browser.newContext({ viewport, colorScheme });
      const page = await context.newPage();
      const errors: string[] = [];
      page.on('pageerror', error => errors.push(error.message));
      page.on('console', message => {
        if (message.type() === 'error' && !message.location().url.endsWith('/favicon.ico')) errors.push(message.text());
      });

      await page.goto(`/jobs/${EXAMPLE_JOB_ID}/prep`);
      await expect(page.locator('html')).toHaveAttribute('data-theme', colorScheme);

      // Honest preview framing.
      await expect(page.getByText('Preview with fictional sample data.')).toBeVisible();

      // 1. Buzzwords, labelled AI-generated.
      await expect(page.getByRole('heading', { name: 'Buzzwords & terms' })).toBeVisible();
      await expect(page.getByText('AI-generated — may be inaccurate, verify before relying on these.')).toBeVisible();

      // 2. Questions — View A default: a suggested answer and an explicit gap.
      await expect(
        page.getByText("AI practice — not the employer's actual questions.", { exact: false }),
      ).toBeVisible();
      await expect(page.getByRole('heading', { name: 'Tell us about a web interface you built and the tools you used.' })).toBeVisible();
      await expect(page.getByText('“Built a typed application tracker”')).toBeVisible();
      await expect(page.getByText('Gap', { exact: true })).toBeVisible();

      // View B: start from an experience -> existing fact shows "Answers this best".
      await page.getByRole('tab', { name: 'Start from an experience' }).click();
      await expect(page.getByText('Questions this experience can answer')).toBeVisible();
      await expect(page.getByText('Answers this best').first()).toBeVisible();

      // Typed experience is matched locally and rendered safely (escaped, no HTML injection).
      const xss = '<img src=x onerror="window.__xss=1"> accessible interface work';
      await page.getByLabel('Or describe a new experience').fill(xss);
      await page.getByRole('button', { name: 'Find matching questions' }).click();
      await expect(page.getByText('Questions your description could answer')).toBeVisible();
      expect(await page.evaluate(() => (window as unknown as { __xss?: number }).__xss)).toBeUndefined();
      expect(await page.locator('.cf-prep-matches img').count()).toBe(0);

      // 3. Connect — fictional, no outreach; draft template opens locally.
      await expect(page.getByText('Sample contacts — fictional demo data.')).toBeVisible();
      await page.getByRole('button', { name: 'Draft a message' }).first().click();
      await expect(page.getByText('Message template (nothing is sent)').first()).toBeVisible();

      // 4. News — unverified.
      await expect(page.getByRole('heading', { name: 'Role & company news' })).toBeVisible();
      await expect(page.getByText('AI-gathered from the web — unverified. Verify before relying on any item.')).toBeVisible();

      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
      expect(errors).toEqual([]);

      await context.close();
    });
  }
}
