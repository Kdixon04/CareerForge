import { expect, test } from '@playwright/test';

const EXAMPLE_JOB_ID = '22222222-2222-4222-8222-222222222222';
const FACT_ID = '33333333-3333-4333-8333-333333333333';
const FACT_ID_2 = '66666666-6666-4666-8666-666666666666';

for (const viewport of [{ width: 390, height: 844 }, { width: 1280, height: 800 }]) {
  for (const colorScheme of ['light', 'dark'] as const) {
    test(`match review ${viewport.width}px / ${colorScheme}: bullets, gaps, edits, honest labels`, async ({ browser }) => {
      const context = await browser.newContext({ viewport, colorScheme });
      const page = await context.newPage();
      const errors: string[] = [];
      page.on('pageerror', error => errors.push(error.message));
      page.on('console', message => {
        if (message.type() === 'error' && !message.location().url.endsWith('/favicon.ico')) errors.push(message.text());
      });

      await page.goto(`/match/${EXAMPLE_JOB_ID}`);
      await expect(page.locator('html')).toHaveAttribute('data-theme', colorScheme);

      await expect(page.getByRole('heading', { name: 'Junior Web Developer' })).toBeVisible();
      await expect(page.getByText(/North Star Labs/)).toBeVisible();
      await expect(page.getByText('Not saved — review before using')).toBeVisible();
      await expect(page.getByText('AI suggestions not connected yet')).toBeVisible();

      const evidence = page.getByRole('region', { name: 'Suggested bullets and evidence' });
      await expect(evidence).toContainText(FACT_ID);
      await expect(evidence).toContainText(FACT_ID_2);

      const gaps = page.getByRole('region', { name: 'Requirement gaps' });
      await expect(gaps).toBeVisible();
      await expect(gaps).toContainText('Gap');
      await expect(gaps).toContainText('Production deployment experience');

      const bodyText = await page.locator('body').innerText();
      expect(bodyText).not.toMatch(/ATS/i);
      expect(bodyText).not.toMatch(/match\s*\d+\s*%/i);
      expect(bodyText).not.toContain('verified open');
      expect(bodyText).not.toContain('deadline confirmed');

      const bullet = page.getByRole('textbox', { name: 'Suggested bullet 2' });
      await expect(bullet).toBeVisible();
      await bullet.fill('Edited bullet text for fixture review.');
      await expect(bullet).toHaveValue('Edited bullet text for fixture review.');

      await expect(page.getByRole('link', { name: /Back to job detail/ })).toBeVisible();

      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
      expect(errors).toEqual([]);

      await context.close();
    });
  }
}