import { expect, test } from '@playwright/test';

for (const viewport of [{ width: 390, height: 844 }, { width: 1280, height: 800 }]) {
  for (const colorScheme of ['light', 'dark'] as const) {
    test(`published job filters ${viewport.width}px / ${colorScheme}: labels, count, clear, empty states`, async ({
      browser,
    }) => {
      const context = await browser.newContext({ viewport, colorScheme });
      const page = await context.newPage();

      await page.goto('/jobs');
      await expect(page.locator('html')).toHaveAttribute('data-theme', colorScheme);

      const filterList = page.getByRole('group', { name: 'Filter loaded opportunities' });

      await expect(filterList.getByText('Filters only the opportunities already loaded below')).toBeVisible();
      await expect(page.getByRole('status')).toContainText('Showing 2 of 2 published opportunities');

      const keyword = filterList.getByRole('searchbox', { name: 'Keyword (title or company)' });
      await keyword.fill('Summit');
      await expect(page.getByRole('status')).toContainText('Showing 1 of 2');
      await expect(page.getByRole('heading', { name: 'Remote Design Intern' })).toBeVisible();
      await expect(page.getByRole('heading', { name: 'Junior Web Developer' })).toHaveCount(0);

      await keyword.fill('zzzz-not-found');
      await expect(page.getByText('No jobs match these filters.')).toBeVisible();
      await expect(page.getByRole('button', { name: 'Clear filters', exact: true })).toBeEnabled();
      await page.getByRole('button', { name: 'Clear filters', exact: true }).click();
      await expect(keyword).toHaveValue('');
      await expect(page.getByRole('status')).toContainText('Showing 2 of 2');

      await filterList.getByLabel('Job type', { exact: true }).selectOption('internship');
      await expect(page.getByRole('status')).toContainText('Showing 1 of 2');

      await expect(page.getByRole('form', { name: 'Paste a job description' })).toBeVisible();
      await expect(page.getByRole('region', { name: 'Pasted job preview' })).toContainText(/unsaved preview/);

      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);

      await context.close();
    });
  }
}