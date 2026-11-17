import { chromium } from 'playwright-core';
import assert from 'node:assert/strict';
const base=process.env.BASE_URL||'http://127.0.0.1:4175';
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
try {
  for (const width of [320,390,768,1024,1440]) {
    const context=await browser.newContext({viewport:{width,height:800},serviceWorkers:'block'});
    await context.addInitScript(() => localStorage.setItem('abzaro-recent-tools', JSON.stringify(['word-counter'])));
    const page=await context.newPage();
    await page.route('https://static.cloudflareinsights.com/**',r=>r.abort());
    await page.goto(base+'/',{waitUntil:'networkidle'});
    assert.equal(await page.getByText('اخیراً استفاده کردید').count(),0);
    assert.equal(await page.getByText('پرطرفدارها:',{exact:true}).count(),0);
    assert.equal(await page.getByText('بدون نصب و بدون ثبت‌نام · همهٔ پردازش‌ها در مرورگر شما انجام می‌شود').count(),0);
    assert.equal(await page.locator('main').getByRole('heading',{name:'ابزارهای پرطرفدار'}).count(),1);
    assert.equal(await page.getByTestId('hero-intents').isVisible(),true);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),true);
    await page.goto(base+'/tools/character-counter/',{waitUntil:'networkidle'});
    assert.equal(await page.evaluate(() => localStorage.getItem('abzaro-recent-tools')), '["word-counter"]');
    await context.close(); console.log('PASS',width);
  }
} finally { await browser.close(); }
