import {chromium,expect} from '@playwright/test';
import {mkdir} from 'node:fs/promises';
import assert from 'node:assert/strict';
const browser=await chromium.launch({headless:true});
const base=process.env.TEST_BASE_URL||'http://127.0.0.1:3001';
try {
  const page=await browser.newPage({viewport:{width:1440,height:1100}});
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  let weatherRequests=0;page.on('request',r=>{if(r.url().endsWith('/api/weather'))weatherRequests++;});
  await page.goto(base);
  await page.getByRole('button',{name:'Utforska området',exact:true}).click();
  await expect(page.locator('.habitat-ranking button').first()).toBeVisible({timeout:60000});
  await expect(page.locator('.weather-score strong')).toHaveText(/^\d{1,3}$/,{timeout:30000});
  const canvas=page.locator('.map-canvas canvas');await canvas.evaluate(e=>e.dataset.testIdentity='persistent');
  await expect(page.locator('.map-canvas')).toHaveAttribute('data-habitat-ready','true',{timeout:60000});
  await page.locator('.habitat-ranking button').first().click();
  await expect(page.locator('.habitat-detail')).toContainText('Vald yta');
  const selected=await page.locator('.habitat-ranking button').first().getAttribute('data-cell-id');
  await expect(page.locator('.habitat-detail')).toContainText(`Vald yta ${selected}`);
  await expect(page.getByLabel('Latitud',{exact:true})).not.toHaveValue('');
  // Clicking the representative land pixel should resolve to the same analysis cell.
  const marker=page.locator('.maplibregl-marker');
  await expect(marker).toBeVisible();
  await canvas.scrollIntoViewIfNeeded();
  // At the pilot overview one screen pixel spans tens of metres; zoom at the
  // marker before testing an exact 10 m land pixel instead of clicking a rounded pin.
  const overviewMarker=await marker.boundingBox();
  await page.mouse.move(overviewMarker.x+overviewMarker.width/2,overviewMarker.y+overviewMarker.height/2+14);
  await page.mouse.wheel(0,-900);
  await page.waitForTimeout(1200);
  await expect(page.locator('.map-canvas')).toHaveAttribute('data-habitat-ready','true',{timeout:60000});
  const markerBounds=await marker.boundingBox(),canvasBounds=await canvas.boundingBox();
  const px=markerBounds.x+markerBounds.width/2-canvasBounds.x;
  // MapLibre's default marker uses center anchoring with offset [0,-14].
  const py=markerBounds.y+markerBounds.height/2+14-canvasBounds.y;
  await canvas.click({position:{x:px,y:py},force:true});
  await expect(page.locator('.habitat-detail')).toContainText(`Vald yta ${selected}`);
  // Zoom through the real map controls; switching species must keep the same canvas and marker transform.
  const markerTransform=await marker.getAttribute('style');
  const satelliteResponse=page.waitForResponse(r=>r.url().includes('s2cloudless-2025')&&r.status()===200,{timeout:30000});
  await page.getByRole('button',{name:'Satellit',exact:true}).click();
  await satelliteResponse;
  await expect(page.locator('.map-canvas')).toHaveAttribute('data-basemap','satellite');
  await expect(marker).toHaveAttribute('style',markerTransform);
  await expect(page.locator('.maplibregl-ctrl-attrib')).toContainText('EOxCloudless');
  await page.getByLabel('Visa habitatytor',{exact:true}).uncheck();
  await expect(page.getByLabel('Visa habitatytor',{exact:true})).not.toBeChecked();
  await page.locator('.map-container').screenshot({path:'artifacts/satellite.png'});
  await page.getByLabel('Visa habitatytor',{exact:true}).check();
  await page.getByRole('button',{name:'Karta',exact:true}).click();
  const names=['Trattkantarell','Svart trumpetsvamp','Stensopp','Blek taggsvamp','Rödgul trumpetsvamp','Smörsopp','Fårticka','Röd flugsvamp','Toppslätskivling','Kantarell'];
  for(const name of names){
    await page.getByRole('combobox',{name:'Välj svamp'}).click();
    await page.getByRole('option',{name,exact:true}).click();
    await expect(page.locator('#habitat-heading')).toHaveText(`Kartytor för ${name.toLocaleLowerCase('sv-SE')}`);
    await expect(canvas).toHaveAttribute('data-test-identity','persistent');
    await expect(marker).toHaveAttribute('style',markerTransform);
    await expect(page.locator('.map-canvas')).toHaveAttribute('data-habitat-ready','true',{timeout:60000});
  }
  assert.equal(weatherRequests,1,'Species changes must reuse weather');
  await mkdir('artifacts',{recursive:true});
  await page.screenshot({path:'artifacts/habitat-desktop.png',fullPage:true});
  await page.setViewportSize({width:390,height:844});
  await page.getByRole('button',{name:'Satellit',exact:true}).click();
  await page.screenshot({path:'artifacts/habitat-mobile.png',fullPage:true});
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'Mobile overflow');
  await expect.poll(()=>page.locator('.map-canvas').evaluate(e=>e.clientHeight)).toBeGreaterThan(300);
  await page.route('**/api/weather',route=>route.fulfill({status:503,contentType:'application/json',body:'{}'}));
  await page.getByRole('button',{name:'Uppdatera väder',exact:true}).click();
  await expect(page.getByRole('alert').filter({hasText:'Väderanalysen kunde inte hämtas'})).toBeVisible();
  await expect(page.locator('.habitat-ranking button')).toHaveCount(0);
  await expect(page.locator('.weather-score')).toHaveCount(0);
  await expect(page.locator('.habitat-detail')).not.toContainText('/100');
  await page.unroute('**/api/weather');
  await page.getByRole('button',{name:'Försök igen',exact:true}).click();
  await expect(page.locator('.habitat-ranking button').first()).toBeVisible({timeout:30000});
  // Stale response must clear the same consumers even if transport succeeds.
  const live=await(await page.request.get(`${base}/api/weather`)).json();
  await page.route('**/api/weather',route=>route.fulfill({contentType:'application/json',body:JSON.stringify({...live,endDate:'2000-01-01'})}));
  await page.getByRole('button',{name:'Uppdatera väder',exact:true}).click();
  await expect(page.getByRole('alert').filter({hasText:'Ett nytt dygn'})).toBeVisible();
  await expect(page.locator('.habitat-ranking button')).toHaveCount(0);
  await page.unroute('**/api/weather');
  // Habitat delivery failure has its own retry without manufacturing data.
  await page.route('**/data/botkyrka-habitat.json',route=>route.fulfill({status:503,body:''}));
  await page.reload();await page.getByRole('button',{name:'Utforska området',exact:true}).click();
  await expect(page.getByText('Markunderlaget kunde inte laddas.',{exact:true})).toBeVisible();
  await page.unroute('**/data/botkyrka-habitat.json');
  await page.getByRole('button',{name:'Hämta markunderlag igen',exact:true}).click();
  await expect(page.locator('#habitat-heading')).toBeVisible({timeout:60000});
  await page.goto(`${base}/om#habitat`);await expect(page.getByRole('heading',{name:'Experimentell habitatmodell',exact:true})).toBeVisible();
  assert.deepEqual(errors,[]);
  console.log('PASS: live habitat + weather, all 10 species, area list/map click, stable canvas/zoom, one shared weather request, mobile, weather outage/stale/retry, habitat error/retry, methods, no page errors.');
}finally{await browser.close();}
