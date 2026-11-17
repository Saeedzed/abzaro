import { chromium } from 'playwright-core';
import assert from 'node:assert/strict';
const base=process.env.BASE_URL||'http://127.0.0.1:4175';
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
for(const width of [320,390,768,1024,1440]){
 const page=await browser.newPage({viewport:{width,height:800}});
 await page.route('https://static.cloudflareinsights.com/**',r=>r.abort());
 await page.goto(base+'/',{waitUntil:'networkidle'});
 assert.equal(await page.getByRole('heading',{name:'ابزارهای تازه'}).count(),0);
 for(const title of ['دسترسی سریع','دسته‌بندی‌ها','ابزارهای پرطرفدار']){
  const footer=page.locator('footer');
  if(width<640){const detail=footer.locator('details').filter({has:page.locator('summary',{hasText:title})});await detail.locator('summary').click();assert.equal(await detail.locator('nav a').first().isVisible(),true);await detail.locator('summary').click();assert.equal(await detail.locator('nav a').first().isVisible(),false);}
  else {const nav=footer.getByRole('heading',{name:title,exact:true}).locator('..').locator('nav');assert.equal(await nav.locator('a').first().isVisible(),true);const href=await nav.locator('a').first().getAttribute('href');assert.equal((await page.request.get(base+href)).status(),200);}
 }
 console.log('PASS',width,'home and footer groups');await page.close();
}
await browser.close();
