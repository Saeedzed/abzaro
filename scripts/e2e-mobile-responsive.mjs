import { chromium } from 'playwright-core';
import assert from 'node:assert/strict';
const base=process.env.BASE_URL || 'http://127.0.0.1:4175';
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
for(const width of [320,360,375,390,430,768,1024,1440]){
 const page=await browser.newPage({viewport:{width,height:800}});
 await page.goto(base+'/',{waitUntil:'networkidle'});
 if(width<1024){
   const toggle=page.locator('button[aria-controls=mobile-navigation-panel]');
   await toggle.click(); assert.equal(await toggle.getAttribute('aria-expanded'),'true');
   await page.keyboard.press('Escape'); assert.equal(await toggle.getAttribute('aria-expanded'),'false');
 }
 if(width<640){
   const grid=page.getByTestId('category-grid');
   let first=grid.locator('a').first(); assert.match(await first.getAttribute('href'),/^\/categories\//);
   await first.click(); await page.waitForURL('**/categories/**');
 }
 await page.goto(base+'/tools/doc-invoice/',{waitUntil:'networkidle'});
 await page.getByTestId('doc-item-name-0').fill('کالای آزمایشی');
 await page.getByTestId('doc-item-qty-0').fill('2');
 await page.getByTestId('doc-item-price-0').fill('500');
 assert.match(await page.getByTestId('doc-totals').innerText(),/۱٬۰۰۰|۱,۰۰۰|1,000|۱۰۰۰|1000/);
 await page.getByTestId('doc-add-item').click(); assert.equal(await page.getByTestId('doc-item-name-1').count(),1);
 await page.goto(base+'/tools/find-replace/',{waitUntil:'networkidle'});
 await page.getByTestId('find-replace-input').fill('سلام دنیا');
 const rules=page.getByTestId('find-replace-rules'); await rules.locator('input').nth(0).fill('دنیا'); await rules.locator('input').nth(1).fill('دوست');
 await page.waitForTimeout(150); assert.match(await page.locator('textarea').last().inputValue(),/سلام دوست/);
 const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1);assert.equal(overflow,false);
 console.log(`PASS ${width}: navigation, menu, invoice, find/replace`); await page.close();
}
await browser.close();
