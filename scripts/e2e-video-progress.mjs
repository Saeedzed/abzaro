import {chromium} from 'playwright-core';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
const base=process.env.BASE_URL||'http://127.0.0.1:4175';
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
try {
 for(const slug of ['video-resizer','video-compressor','video-converter','video-to-audio']) {
  const ctx=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'block'});
  await ctx.addInitScript(()=>{
   window.FFmpegWASM={FFmpeg:class {loaded=true; listeners={};on(e,fn){this.listeners[e]=fn} off(){} async load(){return true} async createDir(){return true} async mount(){return true} async deleteFile(){return true} async unmount(){return true} terminate(){}
    async exec(){this.listeners.progress?.({progress:10,time:200000});this.listeners.log?.({message:'frame=1 time=00:00:00.10'});return new Promise(resolve=>window.__endExec=()=>resolve(0));}
    async readFile(){return new Promise(resolve=>window.__endRead=()=>resolve(new Uint8Array([1,2,3])))}
   }};
  });
  const p=await ctx.newPage(); await p.route('https://static.cloudflareinsights.com/**',r=>r.abort());
  await p.goto(`${base}/tools/${slug}/`,{waitUntil:'networkidle'});await p.locator('input[type=file]').setInputFiles('/tmp/audio.mp4');
  await p.getByTestId(`${slug}-run`).click();
  const bar=p.getByRole('progressbar',{name:'پیشرفت پردازش'});
  await p.waitForFunction(s=>document.querySelector(`[data-testid="${s}-progress"] [role=progressbar]`)?.getAttribute('aria-valuenow')==='5',slug);
  assert.equal(await bar.getAttribute('aria-valuenow'),'5');
  await p.evaluate(()=>window.__endExec());
  await p.getByText('در حال آماده‌سازی فایل خروجی…',{exact:true}).waitFor();
  assert.equal(await bar.getAttribute('aria-valuenow'),null);
  await p.evaluate(()=>window.__endRead()); await p.getByTestId(`${slug}-result`).waitFor();
  console.log('PASS ignored bogus FFmpeg percent and correct finalizing',slug);await ctx.close();
 }
 const ctx=await browser.newContext({viewport:{width:390,height:844},acceptDownloads:true,serviceWorkers:'block'});
 const p=await ctx.newPage(); await p.route('https://static.cloudflareinsights.com/**',r=>r.abort());
 await p.goto(`${base}/tools/video-resizer/`,{waitUntil:'networkidle'});
 await p.locator('input[type=file]').setInputFiles('/home/user/abzaro-benchmark/input.mp4');
 await p.getByTestId('video-res-720').click(); await p.getByRole('button',{name:'۹:۱۶ (استوری)'}).click();
 await p.evaluate(()=>{window.__numbers=[];new MutationObserver(()=>{const e=document.querySelector('[data-testid="video-resizer-progress"] [role=progressbar]');const n=e?.getAttribute('aria-valuenow');if(n!==null&&n!==undefined)window.__numbers.push(Number(n));}).observe(document.body,{subtree:true,childList:true,attributes:true,characterData:true});});
 await p.getByTestId('video-resizer-run').click();await p.getByTestId('video-resizer-result').waitFor({timeout:120000});
 const numbers=await p.evaluate(()=>window.__numbers); assert.ok(numbers.length>1,JSON.stringify(numbers));assert.ok(numbers[0] < 25,JSON.stringify(numbers));assert.ok(numbers.every(n=>n<=99));
 const download=p.waitForEvent('download');await p.getByTestId('video-resizer-download').click();await(await download).saveAs('/tmp/resize-progress-test.mp4');
 const video=JSON.parse(execFileSync('ffprobe',['-v','error','-select_streams','v:0','-show_entries','stream=width,height','-of','json','/tmp/resize-progress-test.mp4'],{encoding:'utf8'})).streams[0];
 assert.equal(video.height,720);assert.ok(Math.abs(video.width/video.height-9/16)<0.01);
 console.log('PASS real resize progressive percentages and 9:16 video',JSON.stringify(video),'first',numbers[0]);await ctx.close();
} finally {await browser.close()}
