import { chromium } from 'playwright-core';
import { stat } from 'node:fs/promises';
import assert from 'node:assert/strict';
const base=process.env.BASE_URL||'http://127.0.0.1:4175';
const fixture=process.env.VIDEO_FIXTURE||'/home/user/abzaro-benchmark/input.mp4';
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
for(const [percentage,legacy] of [[25,false],[50,true],[80,false]]){
 const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,acceptDownloads:true});
 if(legacy) await context.addInitScript(()=>{Object.defineProperty(window,'DecompressionStream',{value:undefined,configurable:true});});
 const page=await context.newPage();await page.route('https://static.cloudflareinsights.com/**',r=>r.abort());
 await page.goto(`${base}/tools/video-compressor/`,{waitUntil:'networkidle'});
 await page.locator('input[type=file]').setInputFiles(fixture);
 const slider=page.getByTestId('video-target-slider');await slider.fill(String(percentage));assert.equal(await slider.inputValue(),String(percentage));
 const target=await page.getByTestId('video-target-size').innerText(); const t=Date.now();
 await page.getByTestId('video-compressor-run').click();
 await Promise.race([
   page.getByTestId('video-compressor-result').waitFor({state:'visible',timeout:180000}),
   page.getByTestId('video-compressor-error').waitFor({state:'visible',timeout:180000}).then(async()=>{throw Error(await page.getByTestId('video-compressor-error').innerText());})
 ]);
 const [download]=await Promise.all([page.waitForEvent('download'),page.getByTestId('video-compressor-download').click()]);
 const output=await stat(await download.path());assert(output.size>1000);
 console.log(JSON.stringify({percentage,legacyGzipFallback:legacy,target,outputBytes:output.size,seconds:(Date.now()-t)/1000}));
 await context.close();
}
await browser.close();
