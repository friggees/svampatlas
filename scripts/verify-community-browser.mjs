import {chromium, expect as baseExpect} from '@playwright/test';
import {createClient} from '@supabase/supabase-js';
import {randomUUID} from 'node:crypto';
import {mkdir} from 'node:fs/promises';
import sharp from 'sharp';
import assert from 'node:assert/strict';

const base=process.env.TEST_BASE_URL||'http://127.0.0.1:3001';
const admin=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.SUPABASE_SECRET_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
const ok=result=>{assert.equal(result.error,null,JSON.stringify(result.error));return result.data;};
const users=[],errors=[];
let browser;
const expect=baseExpect.configure({timeout:15000});
const suffix=randomUUID().replaceAll('-','').slice(0,10);
const body=`Syntetiskt communitytest ${suffix}`;
const placeName=`Testgläntan ${suffix}`;
const image=await sharp({create:{width:800,height:600,channels:3,background:'#5e7c43'}}).jpeg().withExif({IFD0:{Artist:'Synthetic test'},IFD3:{GPSLatitudeRef:'N',GPSLatitude:'59/1 12/1 0/1',GPSLongitudeRef:'E',GPSLongitude:'17/1 50/1 0/1'}}).toBuffer();
assert.ok((await sharp(image).metadata()).exif,'Input has EXIF to strip');
const upload={name:'forest.jpg',mimeType:'image/jpeg',buffer:image};
const confirm=async page=>{await page.getByRole('button',{name:'Bekräfta',exact:true}).click();};

try{
  await mkdir('artifacts',{recursive:true});
  browser=await chromium.launch({headless:true});
  for(let i=0;i<3;i++){
    const email=`svampatlas-browser-${randomUUID()}@example.com`,password=`Test-${randomUUID()}!`;
    const {user}=ok(await admin.auth.admin.createUser({email,password,email_confirm:true}));
    users.push({id:user.id,email,password,username:`skog_${suffix}_${i}`});
  }
  const pages=[];
  for(const [i,user] of users.entries()){
    const context=await browser.newContext({viewport:{width:1440,height:1000}});
    const page=await context.newPage();page.on('pageerror',error=>errors.push(error.message));
    pages.push(page);
    await page.goto(`${base}/konto`);
    await page.getByLabel('E-postadress',{exact:true}).fill(user.email);
    await page.getByLabel('Lösenord',{exact:true}).fill(user.password);
    await page.getByRole('button',{name:'Logga in',exact:true}).click();
    await page.waitForURL(`${base}/utforska`);
    await page.goto(`${base}/profil`);
    await page.getByLabel('Visningsnamn',{exact:true}).fill(`Skogsvän ${i}`);
    await page.getByLabel('Användarnamn',{exact:true}).fill(user.username);
    await page.getByLabel('Några ord om dig').fill('Tillfällig profil för verifiering.');
    if(i===0)await page.getByLabel('Profilbild, valfritt').setInputFiles(upload);
    await page.getByRole('button',{name:'Spara profil',exact:true}).click();
    await expect(page.getByRole('status')).toContainText('Din profil är sparad');
  }
  console.log('PASS: login, profile creation and processed avatar upload.');
  const [owner,friend,outsider]=pages;
  const anonContext=await browser.newContext({viewport:{width:1440,height:1000}}),anon=await anonContext.newPage();
  anon.on('pageerror',error=>errors.push(error.message));
  const avatar=await anon.request.get(`${base}/api/community/media/${users[0].id}?kind=avatar`);
  assert.equal(avatar.status(),200);assert.equal((await sharp(await avatar.body()).metadata()).exif,undefined);
  const area=ok(await admin.from('saved_areas').insert({user_id:users[0].id,name:placeName,species_id:'kantarell',latitude:59.198,longitude:17.834,notes:'Endast syntetisk testplats.'}).select().single());
  await owner.goto(`${base}/vanner`);
  await owner.getByLabel('Sök efter användarnamn').fill(users[1].username);
  await owner.getByRole('button',{name:'Sök',exact:true}).click();
  await owner.getByRole('button',{name:'Lägg till vän',exact:true}).click();
  await expect(owner.getByRole('heading',{name:'Skickade förfrågningar'})).toBeVisible();
  await friend.goto(`${base}/vanner`);
  await friend.getByRole('button',{name:'Acceptera',exact:true}).click();
  await expect(friend.getByRole('button',{name:'Ta bort vän',exact:true})).toBeVisible();
  await owner.goto(`${base}/sparat`);
  const saved=owner.locator('.saved-card').filter({has:owner.getByRole('heading',{name:placeName,exact:true})});
  await saved.locator('summary').click();
  await saved.getByLabel('Vem får se platsen?').selectOption('friends');
  await saved.getByLabel(`Skogsvän 1 @${users[1].username}`).check();
  await saved.getByRole('button',{name:'Spara delning',exact:true}).click();
  await expect(saved.locator('summary')).toHaveText('Delning: Valda vänner');
  await friend.goto(`${base}/platser?filter=friends`);
  await expect(friend.getByRole('heading',{name:placeName,exact:true})).toBeVisible();
  await expect(friend.locator('.place-marker')).toHaveCount(1);
  await friend.getByRole('button',{name:'Visa på kartan',exact:true}).click();
  await expect(friend.locator('.shared-place-card')).toHaveClass(/selected/);
  await outsider.goto(`${base}/platser?filter=friends`);
  await expect(outsider.getByRole('heading',{name:placeName,exact:true})).toHaveCount(0);
  await anon.goto(`${base}/platser`);
  await expect(anon.getByRole('heading',{name:placeName,exact:true})).toHaveCount(0);
  console.log('PASS: friend request/acceptance, selected friend sees place and map; other users do not.');

  await owner.goto(`${base}/sparat`);
  await saved.locator('summary').click();
  await saved.getByLabel('Vem får se platsen?').selectOption('public');
  await saved.getByRole('button',{name:'Spara delning',exact:true}).click();
  assert.equal(ok(await admin.from('saved_areas').select('visibility').eq('id',area.id).single()).visibility,'friends','Public visibility requires confirmation');
  await saved.getByRole('checkbox').check();
  await saved.getByRole('button',{name:'Spara delning',exact:true}).click();
  await expect(saved.locator('summary')).toHaveText('Delning: Publik');
  await anon.reload();await expect(anon.getByRole('heading',{name:placeName,exact:true})).toBeVisible();

  await owner.goto(`${base}/community`);
  const composer=owner.locator('.composer-card');
  await composer.getByLabel('Vad hittade du i skogen?').fill(body);
  await composer.getByLabel('Koppla en publik plats, valfritt').selectOption(area.id);
  await composer.getByLabel('Lägg till bilder').setInputFiles([upload,{...upload,name:'second.jpg'}]);
  // Fail the second upload once: the first slot and text must survive retry.
  let uploads=0;
  await owner.route('**/api/community/media',async route=>{
    if(route.request().method()==='POST'&&++uploads===2)return route.fulfill({status:503,contentType:'application/json',body:JSON.stringify({error:'Tillfälligt testfel.'})});
    return route.continue();
  });
  await composer.getByRole('button',{name:'Publicera inlägg',exact:true}).click();
  await expect(composer.getByRole('status')).toContainText('Texten är sparad som utkast');
  const draft=ok(await admin.from('community_posts').select('id,status,community_images(id)').eq('author_id',users[0].id).eq('body',body).single());
  assert.equal(draft.status,'draft');assert.equal(draft.community_images.length,1);
  assert.equal((await anon.request.get(`${base}/api/community/media/${draft.community_images[0].id}`)).status(),404);
  await composer.getByRole('button',{name:'Publicera inlägg',exact:true}).click();
  await expect(composer.getByRole('status')).toContainText('Ditt inlägg är publicerat');
  await owner.unroute('**/api/community/media');
  const post=ok(await admin.from('community_posts').select('id,community_images(id,path)').eq('id',draft.id).single());
  assert.equal(post.community_images.length,2,'Retry does not duplicate uploaded files');
  await anon.goto(`${base}/community`);
  const anonPost=anon.locator('.post-card').filter({hasText:body});
  await expect(anonPost).toBeVisible();await expect(anonPost.locator('.post-images img')).toHaveCount(2);
  for(const img of await anonPost.locator('img').all()){
    await img.scrollIntoViewIfNeeded();
    await expect.poll(()=>img.evaluate(element=>element.complete&&element.naturalWidth>0)).toBe(true);
  }
  const response=await anon.request.get(`${base}/api/community/media/${post.community_images[0].id}`);
  assert.equal(response.status(),200);assert.match(response.headers()['cache-control'],/no-store/);
  const meta=await sharp(await response.body()).metadata();assert.equal(meta.exif,undefined);assert.equal(meta.format,'jpeg');
  assert.equal((await outsider.request.post(`${base}/api/community/media`,{headers:{origin:base},multipart:{kind:'post',postId:post.id,slot:'2',file:upload}})).status(),403);
  const oversized={...upload,buffer:Buffer.alloc(3*1024*1024+1)};
  assert.equal((await owner.request.post(`${base}/api/community/media`,{headers:{origin:base},multipart:{kind:'avatar',file:oversized}})).status(),400);
  assert.equal((await owner.request.post(`${base}/api/community/media`,{headers:{origin:base},multipart:{kind:'avatar',file:{...upload,buffer:Buffer.from('not a jpeg')}}})).status(),400);
  assert.equal((await owner.request.post(`${base}/api/community/media`,{headers:{origin:'https://example.com'},multipart:{kind:'avatar',file:upload}})).status(),403);
  console.log('PASS: public consent, private drafts, two-photo post, retry without duplicates, EXIF removal and upload authorization/validation.');

  const ownerPost=owner.locator('.post-card').filter({hasText:body});
  await ownerPost.getByRole('button',{name:'Redigera',exact:true}).click();
  await ownerPost.getByLabel('Din berättelse').fill(`${body} – uppdaterat`);
  await ownerPost.getByRole('button',{name:'Spara och publicera',exact:true}).click();
  await expect(ownerPost.locator('.post-body')).toHaveText(`${body} – uppdaterat`);
  for(const img of await ownerPost.locator('img').all()){
    await img.scrollIntoViewIfNeeded();
    await expect.poll(()=>img.evaluate(element=>element.complete&&element.naturalWidth>0)).toBe(true);
  }
  await owner.screenshot({path:'artifacts/community-desktop.png',fullPage:true});
  await composer.getByLabel('Vad hittade du i skogen?').fill(`Radera test ${suffix}`);
  await composer.getByRole('button',{name:'Publicera inlägg',exact:true}).click();
  const removable=owner.locator('.post-card').filter({hasText:`Radera test ${suffix}`});
  await removable.getByRole('button',{name:'Ta bort',exact:true}).click();await confirm(owner);
  await expect(removable).toHaveCount(0);
  await owner.goto(`${base}/profil/${users[0].username}`);
  await expect(owner.getByRole('heading',{name:'Skogsvän 0',exact:true})).toBeVisible();
  await owner.goto(`${base}/sparat`);await saved.locator('summary').click();await saved.getByLabel('Vem får se platsen?').selectOption('private');
  await saved.getByRole('button',{name:'Spara delning',exact:true}).click();await expect(saved.locator('summary')).toHaveText('Delning: Privat');
  await anon.reload();await expect(anonPost.locator('.post-place')).toHaveCount(0);
  await anon.goto(`${base}/platser?focus=${area.id}`);await expect(anon.getByRole('heading',{name:placeName,exact:true})).toHaveCount(0);

  for(const width of [390,320]){
    await owner.setViewportSize({width,height:844});
    for(const path of ['/community','/profil','/vanner','/sparat','/platser?filter=mine']){
      await owner.goto(`${base}${path}`);
      if(path==='/community'){
        for(const img of await owner.locator('.post-card img').all()){
          await img.scrollIntoViewIfNeeded();
          await expect.poll(()=>img.evaluate(element=>element.complete&&element.naturalWidth>0)).toBe(true);
        }
      }
      if(path.includes('/platser')){
        await expect(owner.locator('.shared-map')).toHaveAttribute('data-ready','true');
        await expect(owner.locator('.place-marker')).toHaveCount(1);
      }
      await owner.evaluate(()=>window.scrollTo(0,0));
      assert.equal(await owner.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,`Overflow: ${path} at ${width}`);
      if(width===390&&path==='/community')await owner.screenshot({path:'artifacts/community-mobile.png',fullPage:true});
      if(width===390&&path.includes('/platser'))await owner.screenshot({path:'artifacts/community-places-mobile.png',fullPage:true});
    }
  }
  console.log('PASS: edit, public profile, revoked place cannot leak through posts, mobile 390/320px.');
  await friend.goto(`${base}/community`);
  const friendPost=friend.locator('.post-card').filter({hasText:body});
  await friendPost.getByRole('button',{name:'Rapportera',exact:true}).click();
  await friendPost.getByLabel('Varför vill du rapportera inlägget?').fill(`Syntetisk rapport ${suffix}`);
  await friendPost.getByRole('button',{name:'Skicka rapport',exact:true}).click();
  await expect(friendPost.getByRole('status')).toContainText('Rapporten har skickats');
  await friendPost.getByRole('button',{name:'Blockera',exact:true}).click();await confirm(friend);
  await expect(friendPost).toHaveCount(0);
  assert.equal((await friend.request.get(`${base}/api/community/media/${post.community_images[0].id}`)).status(),404);
  assert.equal((await outsider.goto(`${base}/moderering`)).status(),404);
  ok(await admin.auth.admin.updateUserById(users[2].id,{app_metadata:{moderator:true}}));
  await outsider.goto(`${base}/konto`);await outsider.getByRole('button',{name:'Logga ut'}).click();
  await outsider.goto(`${base}/konto`);await outsider.getByLabel('E-postadress',{exact:true}).fill(users[2].email);await outsider.getByLabel('Lösenord',{exact:true}).fill(users[2].password);await outsider.getByRole('button',{name:'Logga in',exact:true}).click();await outsider.waitForURL(`${base}/utforska`);
  await outsider.goto(`${base}/moderering`);
  const report=outsider.locator('.moderation-list>section').filter({hasText:`Syntetisk rapport ${suffix}`});
  await report.getByRole('button',{name:'Dölj inlägg',exact:true}).click();await confirm(outsider);
  await expect(report).toHaveCount(0);
  await anon.goto(`${base}/community`);await expect(anonPost).toHaveCount(0);
  assert.equal((await anon.request.get(`${base}/api/community/media/${post.community_images[0].id}`)).status(),404);
  assert.deepEqual(errors,[]);
  console.log('PASS: report, block, media access revoked, moderator-only route and hiding. No browser errors.');
}finally{
  await browser?.close();
  const cleanupErrors=[];
  for(const user of users){
    try{
      const files=ok(await admin.storage.from('community').list(user.id));
      if(files.length)ok(await admin.storage.from('community').remove(files.map(file=>`${user.id}/${file.name}`)));
      ok(await admin.auth.admin.deleteUser(user.id));
    }catch(error){cleanupErrors.push(error);}
  }
  if(cleanupErrors.length)throw new AggregateError(cleanupErrors,'Synthetic account cleanup failed');
  console.log('Synthetic accounts and media removed.');
}
