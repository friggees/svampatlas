import {chromium,expect} from '@playwright/test';
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';

const base=process.env.TEST_BASE_URL||'http://127.0.0.1:3001';
const browser=await chromium.launch({headless:true});
try {
  const page=await browser.newPage({viewport:{width:1440,height:1000}});
  const errors=[],failedImages=[],uniquePhotos=new Set();
  page.on('pageerror',e=>errors.push(e.message));
  page.on('response',r=>{if(r.request().resourceType()==='image'&&!r.ok())failedImages.push(`${r.status()} ${r.url()}`);});
  await page.goto(`${base}/arter`);
  await expect(page.getByRole('heading',{name:'Svampguiden',exact:true})).toBeVisible();
  const cards=page.locator('.guide-card');
  await expect(cards).toHaveCount(10);
  for(const card of await cards.all()) {
    await expect(card.locator('.species-traits li')).toHaveCount(3);
    const buttons=card.locator('.photo-thumbnails button');
    await expect(buttons).toHaveCount(3);
    for(let i=0;i<3;i++) {
      await buttons.nth(i).click();
      await expect(buttons.nth(i)).toHaveAttribute('aria-pressed','true');
      await expect(card.locator('.photo-count')).toContainText(`${i+1} / 3`);
      const image=card.locator('.species-photo img');
      await expect(image).toHaveAttribute('alt',/.{20}/);
      await expect.poll(()=>image.evaluate(img=>img.complete&&img.naturalWidth>0),{timeout:30000}).toBe(true);
      uniquePhotos.add(await card.locator('.species-photo').getAttribute('href'));
      await expect(card.locator('.photo-credit a').first()).toHaveAttribute('href',/^https:\/\/commons.wikimedia.org\/wiki\/File/);
      await expect(card.locator('.photo-credit a').last()).toHaveAttribute('href',/^https:\/\/creativecommons.org\//);
    }
    await buttons.first().click();
  }
  assert.equal(uniquePhotos.size,30);
  await page.evaluate(()=>window.scrollTo(0,0));
  await mkdir('artifacts',{recursive:true});
  await page.screenshot({path:'artifacts/guide-desktop.png'});
  await page.setViewportSize({width:390,height:844});
  await page.goto(`${base}/arter#kantarell`);
  const first=cards.first();
  await first.locator('.photo-thumbnails button').nth(1).focus();
  await page.keyboard.press('Enter');
  await expect(first.locator('.photo-count')).toContainText('2 / 3');
  await expect.poll(()=>first.locator('.species-photo img').evaluate(img=>img.complete&&img.naturalWidth>0)).toBe(true);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'Mobile overflow');
  await first.screenshot({path:'artifacts/guide-mobile-card.png'});
  await page.getByRole('navigation',{name:'Hoppa till en svamp'}).getByRole('link',{name:'Fårticka',exact:true}).click();
  await expect(page).toHaveURL(/#farticka$/);
  await expect(page.locator('#farticka h2')).toBeInViewport();
  assert.deepEqual(errors,[]);assert.deepEqual(failedImages,[]);
  console.log('PASS: all 30 distinct photos load, ten galleries and trait lists, image switching, photographer/license links, mobile layout, keyboard selection and species navigation; no page errors.');
}finally{await browser.close();}
