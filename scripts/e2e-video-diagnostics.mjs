import { chromium } from 'playwright-core';
import assert from 'node:assert/strict';
const base=process.env.BASE_URL||'http://127.0.0.1:4175';
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
try {
 for (const mode of ['string-rejection','unsupported-workfs']) {
  const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,serviceWorkers:'block'});
  await context.addInitScript(mode=>{
   window.FFmpegWASM={FFmpeg:class {
    loaded=true; listeners={}; on(ev,fn){this.listeners[ev]=fn} off(){} async load(){return true}
    async createDir(){return true} async mount(){if(mode==='string-rejection')throw 'NotReadableError: mock input failure';return false}
    async deleteFile(){return true} async unmount(){return true} terminate(){}
   }};
  },mode);
  const page=await context.newPage(); await page.route('https://static.cloudflareinsights.com/**',r=>r.abort());
  await page.goto(base+'/tools/video-compressor/',{waitUntil:'networkidle'});
  await page.locator('input[type=file]').setInputFiles('/tmp/audio.mp4');
  await page.getByTestId('video-compressor-run').click();
  await page.getByTestId('video-compressor-error').waitFor();
  await page.getByText('جزئیات فنی خطا').click();
  const text=await page.getByTestId('video-compressor-technical-error').innerText();
  assert.match(text,/\[mount-input\]/);
  assert.match(text,mode==='string-rejection'?/NotReadableError: mock input failure/:/WORKERFS unavailable/);
  console.log('PASS technical diagnostic',mode,text);await context.close();
 }
 const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,serviceWorkers:'block'});
 const page=await context.newPage();await page.route('https://static.cloudflareinsights.com/**',r=>r.abort());
 await page.goto(base+'/tools/video-compressor/',{waitUntil:'networkidle'});
 await page.locator('input[type=file]').setInputFiles('/tmp/unsupported-browser.avi');
 await page.getByText('مرورگر مدت این ویدیو را تشخیص نداد',{exact:false}).waitFor();
 await page.getByTestId('video-compressor-run').click();
 await page.getByTestId('video-compressor-result').waitFor({timeout:60000});
 console.log('PASS real AVI conversion when browser metadata is unavailable (Chromium emulation)');
 await context.close();
} finally {await browser.close()}
