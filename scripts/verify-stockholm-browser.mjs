import {chromium,expect} from '@playwright/test';
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
const base=process.env.TEST_BASE_URL||'http://127.0.0.1:3001';
const browser=await chromium.launch({headless:true});
try{
  const page=await browser.newPage({viewport:{width:1440,height:1000}});
  const errors=[],tileFailures=[];let weatherRequests=0,tiles=0;
  page.on('pageerror',error=>errors.push(error.message));
  page.on('request',r=>{if(r.url().endsWith('/api/weather'))weatherRequests++;});
  page.on('response',r=>{if(r.url().endsWith('.pbf')){tiles++;if(!r.ok())tileFailures.push(r.status());}});
  await page.goto(base);
  await expect(page.getByRole('combobox',{name:'Område'}).locator('option')).toHaveCount(27);
  const firstTile=page.waitForResponse(r=>r.url().endsWith('.pbf')&&r.ok());
  await page.getByRole('button',{name:'Utforska området',exact:true}).click();
  await firstTile;
  await expect(page.locator('.map-canvas')).toHaveAttribute('data-region','stockholm');
  await expect(page.locator('.map-canvas')).toHaveAttribute('data-habitat-ready','true',{timeout:60000});
  const canvas=page.locator('.map-canvas canvas');
  await canvas.evaluate(e=>e.dataset.testIdentity='county-persistent');
  const names=['Trattkantarell','Svart trumpetsvamp','Stensopp','Blek taggsvamp','Rödgul trumpetsvamp','Smörsopp','Fårticka','Röd flugsvamp','Toppslätskivling','Kantarell'];
  for(const name of names){
    await page.getByRole('combobox',{name:'Välj svamp'}).click();
    await page.getByRole('option',{name,exact:true}).click();
    await expect(page.locator('#county-heading')).toHaveText(`Markmiljöer för ${name.toLocaleLowerCase('sv-SE')}`);
    await expect(canvas).toHaveAttribute('data-test-identity','county-persistent');
  }
  for(const code of ['0188','0192','0127','0180']){
    await page.getByRole('combobox',{name:'Område'}).selectOption(code);
    await expect(page.locator('.map-canvas')).toHaveAttribute('data-moving','false');
    await expect(page.locator('.map-canvas')).toHaveAttribute('data-habitat-ready','true',{timeout:60000});
    await expect(canvas).toHaveAttribute('data-test-identity','county-persistent');
  }
  await page.getByRole('combobox',{name:'Område'}).selectOption('0127');
  await expect(page.locator('.map-canvas')).toHaveAttribute('data-moving','false');
  await page.locator('.maplibregl-ctrl-zoom-in').click();
  await expect(page.locator('.map-canvas')).toHaveAttribute('data-moving','false');
  await expect(page.locator('.map-canvas')).toHaveAttribute('data-habitat-ready','true',{timeout:60000});
  await canvas.scrollIntoViewIfNeeded();
  const bounds=await canvas.boundingBox();let clicked=false;
  for(const [x,y] of [[.5,.5],[.45,.6],[.55,.55],[.5,.7],[.4,.5],[.6,.6],[.45,.4],[.6,.4]]){
    await canvas.click({position:{x:bounds.width*x,y:bounds.height*y},force:true});
    if(await page.locator('.county-detail strong').count()){clicked=true;break;}
  }
  assert.ok(clicked,'County habitat must be clickable');
  const response=page.waitForResponse(r=>r.url().includes('s2cloudless-2025')&&r.ok(),{timeout:30000});
  await page.getByRole('button',{name:'Satellit',exact:true}).click();await response;
  await page.getByLabel('Visa habitatytor',{exact:true}).uncheck();
  await expect(page.getByLabel('Visa habitatytor',{exact:true})).not.toBeChecked();
  await page.getByLabel('Visa habitatytor',{exact:true}).check();
  await mkdir('artifacts',{recursive:true});
  await page.screenshot({path:'artifacts/stockholm-desktop.png',fullPage:true});
  await page.setViewportSize({width:390,height:844});
  await page.getByRole('combobox',{name:'Område'}).selectOption('0188');
  await expect(page.locator('.map-canvas')).toHaveAttribute('data-habitat-ready','true',{timeout:60000});
  await page.screenshot({path:'artifacts/stockholm-mobile.png',fullPage:true});
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'Mobile overflow');
  assert.ok(tiles>0,'County tiles must load');assert.deepEqual(tileFailures,[]);assert.equal(weatherRequests,0,'No Botkyrka weather extrapolation');
  await page.route('**/data/stockholm/**/*.pbf',route=>route.fulfill({status:503,body:''}));
  await page.reload();
  await page.getByRole('button',{name:'Utforska området',exact:true}).click();
  await expect(page.getByRole('alert').filter({hasText:'En del av markunderlaget kunde inte laddas'})).toBeVisible({timeout:30000});
  await page.unroute('**/data/stockholm/**/*.pbf');
  const recovered=page.waitForResponse(r=>r.url().endsWith('.pbf')&&r.ok());
  await page.getByRole('button',{name:'Hämta länets markunderlag igen',exact:true}).click();
  await recovered;
  await expect(page.getByRole('alert').filter({hasText:'En del av markunderlaget kunde inte laddas'})).toHaveCount(0);
  await expect(page.locator('.map-canvas')).toHaveAttribute('data-habitat-ready','true',{timeout:60000});
  await page.goto(`${base}/om#stockholm`);
  await expect(page.getByRole('heading',{name:'Habitatytor i hela Stockholms län',exact:true})).toBeVisible();
  assert.deepEqual(errors,[]);
  console.log(`PASS: county tiles (${tiles}), 26 municipalities, all ten species, persistent canvas, clickable habitat, satellite, mobile, tile error/retry, no county weather fabrication or page errors.`);
}finally{await browser.close();}
