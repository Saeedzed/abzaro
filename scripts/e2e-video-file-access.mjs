import {chromium} from 'playwright-core';
import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const base=process.env.BASE_URL||'http://127.0.0.1:4175';
try {
 const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,serviceWorkers:'block'});
 await context.addInitScript(()=>{
  const slice=File.prototype.slice;
  File.prototype.slice=function(...args){const b=slice.apply(this,args); if(this.name==='unreadable.mp4') b.arrayBuffer=async()=>{throw new DOMException('unreadable','NotReadableError')};return b;};
  const click=HTMLInputElement.prototype.click;
  HTMLInputElement.prototype.click=function(){if(this.type==='file'){window.__lastPickerAccept=this.getAttribute('accept');return;} return click.call(this)};
 });
 const page=await context.newPage();await page.route('https://static.cloudflareinsights.com/**',r=>r.abort());
 await page.goto(base+'/tools/video-compressor/',{waitUntil:'networkidle'});
 await page.getByTestId('video-compressor-input-button').click();
 assert.equal(await page.evaluate(()=>window.__lastPickerAccept),null);
 assert.equal(await page.getByTestId('video-compressor-input-files-button').count(),0);
 await page.locator('input[type=file]').setInputFiles({name:'not-video.txt',mimeType:'text/plain',buffer:Buffer.from('not video')});
 await page.getByTestId('video-compressor-error').waitFor();
 assert.match(await page.getByTestId('video-compressor-error').innerText(),/فقط فایل‌های ویدیویی/);
 await page.locator('input[type=file]').setInputFiles({name:'unreadable.mp4',mimeType:'video/mp4',buffer:readFileSync('/tmp/audio.mp4')});
 const error=page.getByTestId('video-compressor-error');await error.waitFor();assert.match(await error.innerText(),/انتخاب ویدیو از دستگاه/);
 assert.equal(await page.getByTestId('video-compressor-run').count(),0);
 await page.locator('input[type=file]').setInputFiles('/tmp/audio.mp4');
 await page.getByTestId('video-target-slider').waitFor();
 assert.equal(await error.count(),0);
 await page.getByTestId('video-compressor-run').click();
 await page.getByTestId('video-compressor-result').waitFor({timeout:90000});
 console.log('PASS picker alternative, unreadable preflight, retry, real compression');await context.close();
 const late=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,serviceWorkers:'block'});
 await late.addInitScript(()=>{ window.FFmpegWASM={FFmpeg:class {loaded=true;on(){} off(){} async load(){return true} async createDir(){return true} async mount(){return true} async exec(){throw "NotReadableError: The requested file could not be read"} async deleteFile(){return true} async unmount(){return true} terminate(){}}}; });
 const p=await late.newPage();await p.route('https://static.cloudflareinsights.com/**',r=>r.abort());
 await p.goto(base+'/tools/video-compressor/',{waitUntil:'networkidle'});await p.locator('input[type=file]').setInputFiles('/tmp/audio.mp4');await p.getByTestId('video-compressor-run').click();
 await p.getByTestId('video-compressor-error').waitFor();assert.match(await p.getByTestId('video-compressor-error').innerText(),/انتخاب ویدیو از دستگاه/);
 console.log('PASS simulated late worker NotReadableError');await late.close();
} finally {await browser.close()}
