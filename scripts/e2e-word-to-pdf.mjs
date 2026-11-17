import {chromium} from 'playwright-core';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const base=process.env.BASE_URL||'http://127.0.0.1:4175';
try {
 for (const width of [320, 390, 1440]) {
  const page=await browser.newPage({viewport:{width,height:850},serviceWorkers:'block'});
  await page.route('https://static.cloudflareinsights.com/**',r=>r.abort());
  page.on('dialog',dialog=>dialog.accept());
  await page.addInitScript(() => {
   const append=Element.prototype.appendChild;
   Element.prototype.appendChild=function(node) {
    const result=append.call(this,node);
    if(node instanceof HTMLIFrameElement && node.title==='پیش‌نمایش چاپ سند') {
     node.contentWindow.print=()=>{ window.__printHtml=node.contentDocument.documentElement.outerHTML; };
    }
    return result;
   };
  });
  await page.goto(base+'/tools/word-to-pdf/',{waitUntil:'networkidle'});
  await page.getByTestId('word-to-pdf-input-sample').click();
  await page.getByTestId('word-to-pdf-result').waitFor();
  const preview=page.getByTestId('word-to-pdf-preview');
  assert.match(await preview.innerText(),/نمونه گزارش کاری/);
  assert.equal(await preview.locator('table tr').count(),3);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true);
  await page.getByTestId('word-to-pdf-print').click();
  await page.waitForFunction(()=>Boolean(window.__printHtml));
  const html=await page.evaluate(()=>window.__printHtml);
  assert.match(html,/نمونه گزارش کاری/); assert.match(html,/dir="rtl"/);
  const pdfPage=await browser.newPage(); await pdfPage.setContent(html); const path=`/tmp/word-test-${width}.pdf`; await pdfPage.pdf({path,format:'A4',printBackground:true});
  const info=execFileSync('pdfinfo',[path],{encoding:'utf8'}); assert.match(info,/Pages:\s+1/);
  const text=execFileSync('pdftotext',[path,'-'],{encoding:'utf8'}); assert.ok(text.trim().length > 40);
  await pdfPage.close(); await page.getByTestId('word-to-pdf-direction').selectOption('ltr');
  assert.equal(await preview.getAttribute('dir'),'ltr');
  await page.locator('input[type=file]').setInputFiles({name:'bad.doc',mimeType:'application/msword',buffer:Buffer.from('bad')});
  await page.getByTestId('word-to-pdf-error').waitFor();
  assert.match(await page.getByTestId('word-to-pdf-error').innerText(),/DOCX/);
  console.log('PASS width',width,'preview, print HTML/PDF, direction, validation'); await page.close();
 }
} finally {await browser.close();}
