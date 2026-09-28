import {chromium,expect} from '@playwright/test';
import {createClient} from '@supabase/supabase-js';
import {randomUUID} from 'node:crypto';
import {mkdir} from 'node:fs/promises';
import assert from 'node:assert/strict';

const base=process.env.TEST_BASE_URL||'http://127.0.0.1:3001';
const admin=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.SUPABASE_SECRET_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
const email=`svampatlas-auth-${randomUUID()}@example.com`,password=`Test-${randomUUID()}!`;
// Generate a real, unconfirmed signup without sending mail to an external inbox.
const {data,error}=await admin.auth.admin.generateLink({type:'signup',email,password,options:{redirectTo:'https://svampatlas.vercel.app/auth/confirm'}});
if(error)throw new Error(`Cannot generate test signup: ${error.code??error.status}`);
const testUsers=[data.user.id];
let browser;
try {
  browser=await chromium.launch({headless:true});
  const context=await browser.newContext({viewport:{width:1440,height:1000}});
  const page=await context.newPage();
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await mkdir('artifacts',{recursive:true});
  await page.goto(base);
  await expect(page.getByRole('heading',{level:1})).toContainText('Ut i skogen');
  await expect(page.locator('.hero-photo img')).toBeVisible();
  assert.ok(await page.locator('.hero-photo img').evaluate(img=>img.complete&&img.naturalWidth>0));
  await page.screenshot({path:'artifacts/landing-desktop.png',fullPage:true});
  await page.getByRole('link',{name:'Registrera dig',exact:true}).first().click();
  await expect(page.getByRole('button',{name:'Registrera dig',exact:true})).toBeVisible();
  await expect(page.locator('#password')).toHaveAttribute('autocomplete','new-password');
  await page.screenshot({path:'artifacts/signup-desktop.png',fullPage:true});
  await page.getByRole('link',{name:'Logga in',exact:true}).click();
  await page.waitForURL(`${base}/konto`);
  await expect(page.getByRole('heading',{name:'Välkommen tillbaka'})).toBeVisible();
  await page.getByLabel('E-postadress',{exact:true}).fill(email);
  await page.getByLabel('Lösenord',{exact:true}).fill(password);
  await page.getByRole('button',{name:'Logga in',exact:true}).click();
  await expect(page.locator('.form-error').first()).toContainText('Inloggningen misslyckades');
  // A fresh browser, without the signup's PKCE cookies, must be able to confirm.
  await context.clearCookies();
  const confirmation=`${base}/auth/confirm?token_hash=${encodeURIComponent(data.properties.hashed_token)}&type=email`;
  await page.goto(confirmation);
  await expect(page.getByRole('heading',{name:'Din e-postadress är bekräftad'})).toBeVisible();
  assert.equal(new URL(page.url()).searchParams.has('token_hash'),false);
  await page.reload();
  await expect(page.getByRole('button',{name:'Logga ut'})).toBeVisible();
  await page.getByRole('link',{name:'Börja utforska'}).click();
  await expect(page.getByRole('button',{name:'Spara min plats'})).toBeVisible();
  await page.goto(`${base}/konto`);
  await page.getByRole('button',{name:'Logga ut'}).click();
  await page.waitForURL(`${base}/`);
  await page.goto(confirmation);
  await expect(page.locator('.auth-card [role=alert]')).toContainText('ogiltig eller har gått ut');
  await expect(page.getByRole('button',{name:'Skicka ny bekräftelselänk'})).toBeVisible();
  await page.goto(`${base}/auth/confirm?type=recovery&token_hash=invalid&next=https://example.com`);
  await expect(page.locator('.auth-card [role=alert]')).toBeVisible();
  assert.equal(new URL(page.url()).origin,new URL(base).origin);
  await page.goto(`${base}/konto`);
  await page.getByLabel('E-postadress',{exact:true}).fill(email);
  await page.getByLabel('Lösenord',{exact:true}).fill(password);
  await page.getByRole('button',{name:'Logga in',exact:true}).click();
  await page.waitForURL(`${base}/utforska`);
  await expect(page.getByRole('button',{name:'Spara min plats'})).toBeVisible();
  await page.goto(`${base}/konto`);await page.getByRole('button',{name:'Logga ut'}).click();
  await page.waitForURL(`${base}/`);
  // Existing confirmed addresses receive a neutral signup response (no enumeration).
  await page.goto(`${base}/konto?mode=signup`);
  await page.getByLabel('E-postadress',{exact:true}).fill(email);
  await page.getByLabel('Lösenord',{exact:true}).fill(password);
  await page.getByRole('button',{name:'Registrera dig',exact:true}).click();
  await expect(page.locator('.form-status').first()).toContainText('Kontrollera din inkorg');
  await page.getByRole('link',{name:'Logga in',exact:true}).click();
  await expect(page.locator('.form-status').first()).toBeEmpty();
  // Exercise the actual Supabase-hosted standard confirmation link as well.
  // Its fragment tokens must be converted to cookies by /auth/callback.
  const standard=await admin.auth.admin.generateLink({type:'signup',email:`svampatlas-standard-${randomUUID()}@example.com`,password,options:{redirectTo:`${base}/auth/confirm`}});
  if(standard.error)throw new Error(`Cannot generate standard signup: ${standard.error.code}`);
  testUsers.push(standard.data.user.id);
  assert.equal(new URL(standard.data.properties.action_link).searchParams.get('redirect_to'),`${base}/auth/confirm`);
  await context.clearCookies();
  await page.goto(standard.data.properties.action_link);
  await expect(page.getByRole('heading',{name:'Din e-postadress är bekräftad'})).toBeVisible({timeout:15000});
  assert.equal(new URL(page.url()).hash,'');
  await page.reload();
  await expect(page.getByRole('button',{name:'Logga ut'})).toBeVisible();
  await page.getByRole('button',{name:'Logga ut'}).click();
  await page.waitForURL(`${base}/`);
  for (const width of [390,320]) {
    await page.setViewportSize({width,height:844});
    for (const route of ['/','/konto?mode=signup','/konto']) {
      await page.goto(`${base}${route}`);
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,`Overflow: ${route}, ${width}`);
      if(width===390)await page.screenshot({path:`artifacts/${route==='/'?'landing':route.includes('signup')?'signup':'login'}-mobile.png`,fullPage:true});
    }
  }
  assert.deepEqual(errors,[]);
  console.log('PASS: landing links, signup UI/submission, unconfirmed login rejected, token-hash and standard Supabase confirmation links, persistent session, logout/login, replay and invalid link recovery, no open redirect, mobile 390/320px, no browser errors. Email delivery is not exercised by this test.');
} finally {
  await browser?.close();
  for(const id of testUsers) {
    const {error:cleanup}=await admin.auth.admin.deleteUser(id);
    if(cleanup)throw new Error('Test account cleanup failed');
  }
  console.log('Synthetic auth accounts removed.');
}
