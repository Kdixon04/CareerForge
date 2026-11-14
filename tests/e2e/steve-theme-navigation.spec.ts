import { expect, test } from '@playwright/test';

// Real Next.js navigation; only the theme preference persists. Profile facts
// remain an explicitly fictional preview until Keyan's adapter is available.
for (const viewport of [{ width:390,height:844 },{ width:1280,height:800 }]) {
  for (const colorScheme of ['light','dark'] as const) {
    test(`shared provider ${viewport.width}/${colorScheme}: switch on both pages and reload`,async ({ browser },testInfo) => {
      const context = await browser.newContext({viewport,colorScheme});
      const page = await context.newPage(); const failures: string[] = [];
      page.on('pageerror',error => failures.push(error.message));
      page.on('console',message => { if (message.type()==='error' && !message.location().url.endsWith('/favicon.ico')) failures.push(message.text()); });
      const opposite = colorScheme==='light' ? 'dark' : 'light';
      const toggle = () => page.getByRole('button',{name:'Dark theme',exact:true});
      const assertTheme = async (theme: string) => {
        await expect(page.locator('html')).toHaveAttribute('data-theme',theme);
        await expect(toggle()).toHaveAttribute('aria-pressed',String(theme==='dark'));
        await expect(page.locator('body')).toHaveCSS('background-color',theme==='dark' ? 'rgb(28, 33, 31)' : 'rgb(250, 246, 239)');
        expect(await page.evaluate(() => document.documentElement.scrollWidth<=innerWidth)).toBe(true);
      };
      await page.goto('/'); await assertTheme(colorScheme);
      await toggle().focus(); await toggle().press('Space'); await assertTheme(opposite);
      await page.getByRole('navigation',{name:'Main navigation'}).getByRole('link',{name:'Profile',exact:true}).click();
      await expect(page.getByRole('heading',{name:'Start with your story.'})).toBeVisible();
      await assertTheme(opposite);
      await page.reload(); await assertTheme(opposite);
      await toggle().focus(); await toggle().press('Space'); await assertTheme(colorScheme);
      await page.getByRole('link',{name:'Career Forge',exact:true}).click();
      await expect(page.getByRole('heading',{name:'Turn what you’ve learned into what’s next.'})).toBeVisible();
      await assertTheme(colorScheme); await page.reload(); await assertTheme(colorScheme);
      expect(await page.evaluate(() => Object.keys(localStorage))).toEqual(['careerforge-theme']);
      await page.screenshot({path:testInfo.outputPath(`home-${viewport.width}-${colorScheme}.png`),fullPage:true,scale:'css'});
      await page.getByRole('navigation',{name:'Main navigation'}).getByRole('link',{name:'Profile',exact:true}).click();
      await assertTheme(colorScheme);
      await expect(page.getByRole('button',{name:'Save profile',exact:true})).toBeDisabled();
      await expect(page.getByRole('complementary',{name:'Preview limitations'})).toContainText('reset on reload');
      await page.screenshot({path:testInfo.outputPath(`profile-${viewport.width}-${colorScheme}.png`),fullPage:true,scale:'css'});
      expect(failures).toEqual([]); await context.close();
    });
  }
}
