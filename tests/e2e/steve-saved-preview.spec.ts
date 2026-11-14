import { expect, test } from '@playwright/test';
for(const viewport of [{width:390,height:844},{width:1280,height:800}]) for(const colorScheme of ['light','dark'] as const) {
  test(`saved fixture ${viewport.width}/${colorScheme}: tracking, reset, empty and honest reload`,async({browser},testInfo)=>{
    const context=await browser.newContext({viewport,colorScheme}); const page=await context.newPage();
    const errors:string[]=[]; const apiRequests:string[]=[];
    page.on('pageerror',error=>errors.push(error.message));
    page.on('request',request=>{if(new URL(request.url()).pathname.startsWith('/api/')) apiRequests.push(request.url());});
    await page.goto('/saved');
    await expect(page.locator('html')).toHaveAttribute('data-theme',colorScheme);
    await expect(page.getByRole('complementary',{name:'Saved preview limitations'})).toContainText('nothing is saved');
    await expect(page.getByRole('complementary',{name:'Saved preview limitations'})).toContainText('reset on reload');
    await page.keyboard.press('Tab'); await expect(page.getByRole('link',{name:'Skip to content',exact:true})).toBeFocused();
    const open=page.getByRole('region',{name:'Fictional Solar Internship',exact:true});
    const paused=page.getByRole('region',{name:'Fictional Design Assistant',exact:true});
    const hidden=page.getByRole('region',{name:'Unavailable fictional listing',exact:true});
    await expect(open).toContainText('Deadline not provided');
    await expect(paused).toContainText('Inactive listing');
    await expect(paused).toContainText('Listing deadline (unverified): 2026-12-01');
    await expect(hidden).toContainText('without exposing listing content'); await expect(hidden.getByRole('link')).toHaveCount(0);
    await open.getByRole('combobox',{name:'Application status',exact:true}).selectOption('applied');
    await open.getByLabel('Personal reminder date',{exact:true}).fill('2026-12-02');
    const notes=open.getByRole('textbox',{name:'Application notes',exact:true});
    await notes.fill('<img src=x onerror=alert(1)> Fictional follow-up');
    const check=open.getByRole('button',{name:'Check preview changes',exact:true});
    await check.click(); await expect(open.getByRole('status')).toHaveText('Preview updated on this page only. Nothing was saved.');
    await check.click(); await expect(open.getByRole('status')).toHaveCount(1);
    await expect(open.getByRole('combobox',{name:'Application status',exact:true})).toHaveValue('applied');
    await expect(open.getByLabel('Personal reminder date',{exact:true})).toHaveValue('2026-12-02');
    await expect(page.locator('img[src="x"]')).toHaveCount(0); await expect(open).toContainText('Deadline not provided');
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    for(const selector of ['.cf-badge','.cf-button','.cf-input','.cf-profile-card a']) {
      const ratios=await page.locator(selector).evaluateAll(elements=>elements.map(element=>{
        const luminance=(value:string)=>{const c=value.match(/[\d.]+/g)!.slice(0,3).map(Number).map(v=>{const n=v/255;return n<=.04045?n/12.92:((n+.055)/1.055)**2.4;});return c[0]*.2126+c[1]*.7152+c[2]*.0722;};
        const style=getComputedStyle(element); const a=luminance(style.color),b=luminance(element.tagName==='A' ? getComputedStyle(element.closest('section')!).backgroundColor : style.backgroundColor);return(Math.max(a,b)+.05)/(Math.min(a,b)+.05);
      }));
      for(const ratio of ratios) expect(ratio,`${selector} text contrast`).toBeGreaterThanOrEqual(4.5);
    }
    await page.screenshot({path:testInfo.outputPath(`saved-${viewport.width}-${colorScheme}.png`),fullPage:true,scale:'css'});
    await page.getByRole('link',{name:'Career Forge home',exact:true}).scrollIntoViewIfNeeded();
    await page.screenshot({path:testInfo.outputPath(`saved-viewport-${viewport.width}-${colorScheme}.png`),scale:'css'});
    await page.reload();
    await expect(open.getByRole('combobox',{name:'Application status',exact:true})).toHaveValue('saved');
    await expect(open.getByLabel('Personal reminder date',{exact:true})).toHaveValue('');
    await expect(notes).toHaveValue('Fictional example: review the posting before applying.');
    await notes.fill(''); await open.getByRole('button',{name:'Check preview changes',exact:true}).click();
    await expect(open.getByRole('status')).toContainText('Nothing was saved.');
    while(await page.getByRole('button',{name:'Remove from preview',exact:true}).count()) await page.getByRole('button',{name:'Remove from preview',exact:true}).first().click();
    await expect(page.getByRole('button',{name:'Reset fictional examples',exact:true})).toBeFocused();
    await expect(page.getByRole('heading',{name:'No applications in this preview.'})).toBeVisible();
    const reset=page.getByRole('button',{name:'Reset fictional examples',exact:true}); await reset.click(); await reset.click();
    await expect(page.getByRole('button',{name:'Remove from preview',exact:true})).toHaveCount(3);
    const toggle=page.locator('.cf-root > header').getByRole('button',{name:'Dark theme',exact:true}); await toggle.focus(); await toggle.press('Space');
    const opposite=colorScheme==='light'?'dark':'light'; await expect(page.locator('html')).toHaveAttribute('data-theme',opposite);
    await page.getByRole('navigation',{name:'Main navigation'}).getByRole('link',{name:'Profile',exact:true}).click();
    await expect(page.getByRole('heading',{name:'Start with your story.'})).toBeVisible(); await expect(page.locator('html')).toHaveAttribute('data-theme',opposite);
    expect(await page.evaluate(()=>Object.keys(localStorage))).toEqual(['careerforge-theme']);
    expect(apiRequests).toEqual([]); expect(errors).toEqual([]); await context.close();
  });
}
