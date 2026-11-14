import { test,expect,type Page } from '@playwright/test';
const profile=(page:Page)=>page.getByRole('region',{name:'Profile adapter integration',exact:true});
const applications=(page:Page)=>page.getByRole('region',{name:'Application adapter integration',exact:true});
for(const width of [390,1280])for(const colorScheme of ['light','dark'] as const){
  test(`TEST DOUBLE reload ${width}/${colorScheme}: profile + applications, no production persistence`,async({browser},info)=>{
    const context=await browser.newContext({viewport:{width,height:844},colorScheme});const page=await context.newPage();const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
    await page.goto('/');await expect(page.getByRole('heading',{name:'Test doubles only',exact:true})).toBeVisible();
    const editor=profile(page),name=editor.getByRole('textbox',{name:'Display name',exact:true});await expect(name).toBeVisible();
    await name.fill(`Fictional ${width} ${colorScheme}`);while(await editor.getByRole('button',{name:/Remove entry/}).count())await editor.getByRole('button',{name:/Remove entry/}).first().click();
    await editor.getByRole('button',{name:'+ Add skill',exact:true}).click();await editor.getByRole('textbox',{name:'What you did — entry 1',exact:true}).fill('Fictional Python evidence');
    await expect(page.getByRole('combobox',{name:'Fictional user',exact:true})).toBeDisabled();
    await page.getByRole('combobox',{name:'Test-double behavior',exact:true}).selectOption('slow-save');await editor.getByRole('button',{name:'Save to test double',exact:true}).click();
    await expect(editor.getByRole('button',{name:'Saving…',exact:true})).toBeDisabled();await expect(name).toBeDisabled();
    await expect(editor.getByText('Test double updated. Retained in lab server memory only.',{exact:true})).toBeVisible();
    await page.getByRole('combobox',{name:'Test-double behavior',exact:true}).selectOption('normal');await page.reload();
    await expect(name).toHaveValue(`Fictional ${width} ${colorScheme}`);await expect(editor.getByRole('textbox',{name:'What you did — entry 1',exact:true})).toHaveValue('Fictional Python evidence');
    await page.getByRole('button',{name:'Add fictional application to test double',exact:true}).click();
    const card=applications(page).getByRole('region',{name:'Fictional role',exact:true});await expect(card).toBeVisible();
    await card.getByRole('combobox',{name:'Application status',exact:true}).selectOption('applied');await card.getByLabel('Personal reminder date',{exact:true}).fill('2026-12-01');await card.getByRole('textbox',{name:'Application notes',exact:true}).fill('Fictional follow-up');
    await card.getByRole('button',{name:'Update test double',exact:true}).click();await expect(card.getByText('Test double updated; lab memory only.',{exact:true})).toBeVisible();await page.reload();
    await expect(card.getByRole('combobox',{name:'Application status',exact:true})).toHaveValue('applied');await expect(card.getByLabel('Personal reminder date',{exact:true})).toHaveValue('2026-12-01');await expect(card.getByRole('textbox',{name:'Application notes',exact:true})).toHaveValue('Fictional follow-up');
    await expect(card.getByText('Deadline not provided',{exact:true})).toBeVisible();await card.getByRole('button',{name:'Remove from test double',exact:true}).click();await expect(applications(page).getByText('No applications returned by this adapter.',{exact:true})).toBeVisible();
    await name.fill('Discard this unsaved change');await editor.getByRole('button',{name:'Discard unsaved profile changes',exact:true}).click();await expect(name).toHaveValue(`Fictional ${width} ${colorScheme}`);
    await page.getByRole('button',{name:'Dark theme',exact:true}).press('Space');expect(await page.evaluate(()=>Object.keys(localStorage))).toEqual(['careerforge-theme']);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    await page.getByRole('heading',{name:'Test doubles only',exact:true}).scrollIntoViewIfNeeded();await page.screenshot({path:info.outputPath(`test-double-${width}-${colorScheme}.png`),scale:'css'});expect(errors).toEqual([]);await context.close();
  });
}
test('TEST DOUBLE load/retry/corrupt data, validation/auth/permission/network/conflict preserve drafts',async({page})=>{
  await page.goto('/');const editor=profile(page),name=editor.getByRole('textbox',{name:'Display name',exact:true}),fault=page.getByRole('combobox',{name:'Test-double behavior',exact:true});await expect(name).toBeVisible();
  for(const mode of ['load-error','load-auth','load-forbidden','corrupt-load']){await fault.selectOption(mode);await editor.getByRole('button',{name:'Reload profile',exact:true}).click();await expect(editor.getByRole('alert')).toBeVisible();await expect(name).toHaveCount(0);await fault.selectOption('normal');await editor.getByRole('button',{name:'Retry profile load',exact:true}).click();await expect(name).toBeVisible();}
  const before=await name.inputValue();await name.fill('');await editor.getByRole('button',{name:'Save to test double',exact:true}).click();await expect(name).toHaveAttribute('aria-invalid','true');await expect(name).toBeFocused();await name.fill('Keep unsaved lab draft');
  for(const [mode,text] of [['save-network','Connection failed'],['save-validation','adapter rejected'],['save-auth','session expired'],['save-forbidden','account cannot save'],['save-conflict','profile changed elsewhere']]){await fault.selectOption(mode);await editor.getByRole('button',{name:'Save to test double',exact:true}).click();await expect(editor.getByRole('alert')).toContainText(text);await expect(editor.getByRole('alert')).toBeFocused();await expect(name).toHaveValue('Keep unsaved lab draft');const stored=await(await page.request.get('/lab/profile',{headers:{'x-lab-user':'a'}})).json();expect(stored.data.displayName).toBe(before);}
  await fault.selectOption('normal');await editor.getByRole('button',{name:'Save to test double',exact:true}).click();await expect(editor.getByText('Test double updated. Retained in lab server memory only.',{exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Add fictional application to test double',exact:true}).click();const card=applications(page).getByRole('region',{name:'Fictional role',exact:true});await card.getByRole('textbox',{name:'Application notes',exact:true}).fill('Retain application draft');await fault.selectOption('save-forbidden');await card.getByRole('button',{name:'Update test double',exact:true}).click();await expect(card.getByRole('alert')).toContainText('cannot perform');await expect(card.getByRole('textbox',{name:'Application notes',exact:true})).toHaveValue('Retain application draft');await card.getByRole('button',{name:'Reset application edits',exact:true}).click();await fault.selectOption('normal');await card.getByRole('button',{name:'Remove from test double',exact:true}).click();
});
test('TEST DOUBLE HTTP isolation: A cannot modify B and B cannot read/modify A records',async({request})=>{
  const origin='http://127.0.0.1:4318',headersA={'x-lab-user':'a',Origin:origin},headersB={'x-lab-user':'b',Origin:origin};
  const a=(await(await request.get('/lab/profile',{headers:headersA})).json()).data,b=(await(await request.get('/lab/profile',{headers:headersB})).json()).data;expect(a.userId).not.toBe(b.userId);
  const writeB={displayName:'Forged',field:null,facts:a.facts,expectedUpdatedAt:b.updatedAt};expect((await request.put('/lab/profile',{headers:headersB,data:writeB})).status()).toBe(400);expect((await(await request.get('/lab/profile',{headers:headersB})).json()).data).toEqual(b);expect((await(await request.get('/lab/profile',{headers:headersA})).json()).data).toEqual(a);
  const app=(await(await request.post('/lab/applications',{headers:headersA,data:{jobId:'55555555-5555-4555-8555-555555555555'}})).json()).data;expect((await(await request.get('/lab/applications',{headers:headersB})).json()).data).toEqual([]);
  expect((await request.patch(`/lab/applications/${app.id}`,{headers:headersB,data:{notes:'Foreign',expectedUpdatedAt:app.updatedAt}})).status()).toBe(404);expect((await request.delete(`/lab/applications/${app.id}`,{headers:headersB})).status()).toBe(200);expect((await(await request.get('/lab/applications',{headers:headersA})).json()).data).toEqual([app]);
  expect((await request.post('/lab/applications',{headers:headersB,data:{jobId:'55555555-5555-4555-8555-555555555555'}})).status()).toBe(404);expect((await request.get('/lab/profile')).status()).toBe(401);expect((await request.get('/lab/profile',{headers:{'x-lab-user':'employer'}})).status()).toBe(403);expect((await request.put('/lab/profile',{headers:{...headersA,Origin:'https://evil.test'},data:{}})).status()).toBe(403);await request.delete(`/lab/applications/${app.id}`,{headers:headersA});
});

test('TEST DOUBLE reverse HTTP isolation: A cannot alter B profile facts or B application',async({request})=>{
  const origin='http://127.0.0.1:4318',aHeaders={'x-lab-user':'a',Origin:origin},bHeaders={'x-lab-user':'b',Origin:origin};
  const a=(await(await request.get('/lab/profile',{headers:aHeaders})).json()).data,b=(await(await request.get('/lab/profile',{headers:bHeaders})).json()).data;
  const bFact={id:crypto.randomUUID(),kind:'project',text:'Fictional B-only evidence',org:null,dates:null};
  const savedB=(await(await request.put('/lab/profile',{headers:bHeaders,data:{displayName:'Fictional B',field:null,facts:[bFact],expectedUpdatedAt:b.updatedAt}})).json()).data;
  expect((await request.put('/lab/profile',{headers:aHeaders,data:{displayName:'Forbidden A overwrite',field:null,facts:[bFact],expectedUpdatedAt:a.updatedAt}})).status()).toBe(400);
  expect((await(await request.get('/lab/profile',{headers:aHeaders})).json()).data).toEqual(a);expect((await(await request.get('/lab/profile',{headers:bHeaders})).json()).data).toEqual(savedB);
  const bApp=(await(await request.post('/lab/applications',{headers:bHeaders,data:{jobId:'66666666-6666-4666-8666-666666666666'}})).json()).data;
  expect((await request.patch(`/lab/applications/${bApp.id}`,{headers:aHeaders,data:{notes:'Foreign A write',expectedUpdatedAt:bApp.updatedAt}})).status()).toBe(404);await request.delete(`/lab/applications/${bApp.id}`,{headers:aHeaders});
  expect((await(await request.get('/lab/applications',{headers:bHeaders})).json()).data).toEqual([bApp]);expect((await(await request.get('/lab/applications',{headers:aHeaders})).json()).data).toEqual([]);await request.delete(`/lab/applications/${bApp.id}`,{headers:bHeaders});
});

test('TEST DOUBLE unsaved profile edits trigger the native leave warning and can be reset safely',async({page})=>{
  await page.goto('/');const editor=profile(page),name=editor.getByRole('textbox',{name:'Display name',exact:true});await expect(name).toBeVisible();await name.click();await name.fill('Unsaved leave protection');
  await expect(page.getByRole('combobox',{name:'Fictional user',exact:true})).toBeDisabled();const dialogPromise=page.waitForEvent('dialog');await page.close({runBeforeUnload:true});const dialog=await dialogPromise;expect(dialog.type()).toBe('beforeunload');await dialog.dismiss();expect(page.isClosed()).toBe(false);await expect(name).toHaveValue('Unsaved leave protection');await editor.getByRole('button',{name:'Discard unsaved profile changes',exact:true}).click();await expect(editor.getByText('Unsaved profile changes in this page.',{exact:true})).toHaveCount(0);
});

test('TEST DOUBLE application load errors receive focus and retry returns the empty state', async ({page}) => {
  await page.goto('/');
  const region = applications(page);
  await expect(region.getByRole('button', {name:'Reload applications', exact:true})).toBeEnabled();
  const fault = page.getByRole('combobox', {name:'Test-double behavior', exact:true});
  await fault.selectOption('load-auth');
  await region.getByRole('button', {name:'Reload applications', exact:true}).click();
  await expect(region.getByRole('alert')).toBeFocused();
  await expect(region.getByRole('alert')).toContainText('Sign in again');
  await fault.selectOption('normal');
  await region.getByRole('button', {name:'Retry application load', exact:true}).click();
  await expect(region.getByRole('status')).toHaveText('No applications returned by this adapter.');
});
