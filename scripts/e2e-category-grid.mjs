import { chromium } from 'playwright-core';
import assert from 'node:assert/strict';
const base=process.env.BASE_URL || 'http://127.0.0.1:4175';
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
for(const width of [320,360,375,390,430,768,1024,1440]) {
 const p=await browser.newPage({viewport:{width,height:850}});
 await p.route('https://static.cloudflareinsights.com/**',r=>r.abort());
 for(const path of ['/','/categories/']) {
  await p.goto(base+path,{waitUntil:'networkidle'});const grid=p.getByTestId('category-grid');await grid.waitFor();const cards=grid.locator('a[href^="/categories/"]');assert.equal(await cards.count(),8);
  const positions=await cards.evaluateAll(e=>e.map(a=>({top:Math.round(a.getBoundingClientRect().top),width:Math.round(a.getBoundingClientRect().width),href:a.getAttribute('href')})));
  const expected=4;assert.equal(positions.filter(x=>x.top===positions[0].top).length,expected);
  assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true);
  assert.equal(new Set(positions.map(x=>x.top)).size,2);
  const dimensions=await cards.evaluateAll(es=>es.map(e=>({width:e.getBoundingClientRect().width,height:e.getBoundingClientRect().height,overflow:e.scrollWidth>e.clientWidth+1 || e.scrollHeight>e.clientHeight+1})));
  assert.ok(dimensions.every(x=>x.width>=44 && x.height>=44 && !x.overflow), JSON.stringify(dimensions));
  for(const item of positions){const response=await p.request.get(base+item.href+'/');assert.equal(response.status(),200,item.href);}
  if(path==='/categories/'&&[320,1440].includes(width)) await p.screenshot({path:`/home/user/category-preview-${width}.png`,fullPage:true});
  console.log(`PASS ${width} ${path}: 8 categories, ${expected} columns`);
 }
 await p.close();
}
await browser.close();
