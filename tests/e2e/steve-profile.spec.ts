import { expect, test } from '@playwright/test';

const profileURL = process.env.STEVE_PROFILE_URL ?? 'http://127.0.0.1:3000/profile';
const componentURL = process.env.STEVE_PREVIEW_URL ?? 'http://127.0.0.1:4317';

for (const viewport of [{ width: 390, height: 844 }, { width: 1280, height: 800 }]) {
  for (const colorScheme of ['light', 'dark'] as const) {
    test(`Next.js profile ${viewport.width}px / ${colorScheme}: editing, validation and honest reset`, async ({ browser }) => {
      const context = await browser.newContext({ viewport, colorScheme });
      const page = await context.newPage();
      const errors: string[] = [];
      const writes: string[] = [];
      page.on('pageerror', error => errors.push(error.message));
      page.on('console', message => { if (message.type() === 'error' && !message.location().url.endsWith('/favicon.ico')) errors.push(message.text()); });
      page.on('request', request => { if (request.url().includes('/api/profile')) writes.push(request.url()); });
      await page.goto(profileURL);
      const toggle = page.getByRole('button', { name: 'Dark theme', exact: true });
      await expect(toggle).toBeEnabled();
      await expect(page.locator('html')).toHaveAttribute('data-theme', colorScheme);
      await expect(page.getByRole('heading', { name: 'Start with your story.' })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Save profile', exact: true })).toBeDisabled();
      await expect(page.getByRole('complementary', { name: 'Preview limitations' })).toContainText('reset on reload');
      await page.keyboard.press('Tab');
      await expect(page.getByRole('link', { name: 'Skip to profile' })).toBeFocused();
      const name = page.getByRole('textbox', { name: 'Display name', exact: true });
      await name.fill('   ');
      await page.getByRole('button', { name: 'Check profile' }).click();
      await expect(name).toHaveAttribute('aria-invalid', 'true');
      await expect(name).toBeFocused();
      await name.fill('Maya Chen');
      await page.getByRole('button', { name: 'Remove entry 1', exact: true }).click();
      await expect(page.getByText('No experience added yet.')).toBeVisible();
      await page.getByRole('button', { name: '+ Add skill', exact: true }).click();
      const skill = page.getByRole('textbox', { name: 'What you did — entry 1', exact: true });
      await expect(skill).toBeFocused();
      await page.getByRole('button', { name: 'Check profile' }).click();
      await expect(skill).toHaveAttribute('aria-invalid', 'true');
      await expect(skill).toBeFocused();
      await skill.fill('Python and data analysis');
      await page.getByRole('button', { name: '+ Add project', exact: true }).click();
      const project = page.getByRole('textbox', { name: 'What you did — entry 2', exact: true });
      await expect(project).toBeFocused();
      await project.fill('Built a solar tracker in a team of three.');
      await page.getByRole('textbox', { name: 'Organization — entry 2', exact: true }).fill('Fictional class project');
      await page.getByRole('textbox', { name: 'Dates — entry 2', exact: true }).fill('Fall 2026');
      await page.getByRole('combobox', { name: 'Entry type', exact: true }).nth(1).selectOption('experience');
      await page.getByRole('button', { name: 'Check profile' }).click();
      await expect(page.getByRole('status')).toHaveText('Profile checks passed. Nothing was saved; saving is not connected yet.');
      await page.getByRole('button', { name: 'Check profile' }).click();
      await expect(page.getByRole('status')).toHaveCount(1);
      await page.getByRole('button', { name: 'Remove entry 2', exact: true }).click();
      // Removal deliberately moves focus on the next animation frame; wait for it
      // before testing a separate keyboard action on the theme toggle.
      await expect(page.getByRole('button', { name: '+ Add skill', exact: true })).toBeFocused();
      await expect(skill).toHaveValue('Python and data analysis');
      await toggle.focus();
      await expect(toggle).toBeFocused();
      await toggle.press('Space');
      const opposite = colorScheme === 'light' ? 'dark' : 'light';
      await expect(page.locator('html')).toHaveAttribute('data-theme', opposite);
      await expect(skill).toHaveValue('Python and data analysis');
      await page.reload();
      await expect(page.locator('html')).toHaveAttribute('data-theme', opposite);
      await expect(page.getByRole('textbox', { name: 'What you did — entry 1', exact: true })).toHaveValue('Built a typed application tracker');
      await toggle.click();
      await expect(page.locator('html')).toHaveAttribute('data-theme', colorScheme);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      expect(await page.evaluate(() => Object.keys(localStorage))).toEqual(['careerforge-theme']);
      expect(writes).toEqual([]);
      expect(errors).toEqual([]);
      await page.screenshot({ path: `${process.env.STEVE_SCREENSHOTS ?? 'test-results'}/steve-profile-${viewport.width}-${colorScheme}.png`, fullPage: true });
      await context.close();
    });
  }
}

for (const scenario of ['success', 'error', 'conflict']) {
  test(`simulated callback ${scenario}: loading, retry and version handoff (no persistence)`, async ({ page }) => {
    test.skip(process.env.STEVE_COMPONENT_TESTS !== '1', 'Simulated callback requires the separate component harness.');
    await page.goto(`${componentURL}/profile-form?scenario=${scenario}`);
    const name = page.getByRole('textbox', { name: 'Display name', exact: true });
    await name.fill('Fictional edited name');
    const save = page.getByRole('button', { name: 'Save profile', exact: true });
    await save.dblclick();
    await expect(page.getByRole('button', { name: 'Saving…', exact: true })).toBeDisabled();
    await expect(name).toBeDisabled();
    await expect(page.getByTestId('save-call-count')).toHaveText('1');
    await expect(page.getByTestId('expected-version')).toHaveText('2026-11-13T12:00:00.000Z');
    if (scenario === 'success') {
      await expect(page.getByRole('status')).toHaveText('Profile saved.');
      await save.click();
      await expect(page.getByTestId('expected-version')).toHaveText('2026-11-14T07:00:00.000Z');
      await expect(page.getByRole('status')).toHaveText('Profile saved.');
    } else {
      await expect(page.getByRole('alert')).toContainText(scenario === 'conflict' ? 'changed elsewhere' : 'Could not save');
      await expect(name).toHaveValue('Fictional edited name');
      await save.click();
      await expect(page.getByTestId('save-call-count')).toHaveText('2');
      await expect(page.getByRole('alert')).toBeVisible();
    }
  });
}
