import {chromium} from 'playwright-core';
import assert from 'node:assert/strict';
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const base=process.env.BASE_URL||'http://127.0.0.1:4175';
try {
 for(const reducedMotion of ['no-preference','reduce']) {
  const page=await browser.newPage({viewport:{width:390,height:800},reducedMotion,serviceWorkers:'block'});
  await page.route('https://static.cloudflareinsights.com/**',r=>r.abort());
  await page.goto(base+'/',{waitUntil:'networkidle'});
  await page.getByRole('button',{name:'باز کردن منو'}).click();
  const panel=page.locator('#mobile-navigation-panel');
  assert.equal(await panel.isVisible(),true);
  const animation=await panel.evaluate(el=>({name:getComputedStyle(el).animationName,duration:getComputedStyle(el).animationDuration}));
  if(reducedMotion==='no-preference') assert.equal(animation.name,'rise-in');
  else assert.ok(animation.name==='none' || parseFloat(animation.duration)<0.01,JSON.stringify(animation));
  await page.getByRole('button',{name:'بستن منو'}).click(); assert.equal(await panel.isVisible(),false);
  await page.goto(base+'/tools/word-to-pdf/',{waitUntil:'networkidle'});
  assert.equal(await page.getByText('این ابزار محتوای سند را در مرورگر بازسازی می‌کند',{exact:false}).count(),0);
  assert.equal(await page.getByText('بخشی از محتوای سند ممکن است پشتیبانی نشده باشد',{exact:false}).count(),0);
  assert.equal(await page.getByText('فونت، صفحه‌بندی و برخی اجزای سند ممکن است تغییر کنند یا منتقل نشوند.',{exact:false}).count(),1);
  await page.getByTestId('word-to-pdf-input-sample').click();
  await page.getByTestId('word-to-pdf-result').waitFor();
  assert.equal(await page.getByTestId('word-to-pdf-print').isVisible(),true);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true);
  console.log('PASS',reducedMotion,'menu, word tool, limitations, overflow'); await page.close();
 }
} finally {await browser.close();}
