// Needs /tmp/long-trim-test.mp4 (125 seconds, with audio) and ffprobe.
import { chromium } from 'playwright-core';
import { execFileSync } from 'node:child_process';
import assert from 'node:assert/strict';
const base=process.env.BASE_URL||'http://127.0.0.1:4175';
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
try {
 for(const precise of [false,true]) {
  const page=await browser.newPage({viewport:{width:412,height:915},acceptDownloads:true,serviceWorkers:'block'});
  page.setDefaultTimeout(120000);
  await page.route('https://static.cloudflareinsights.com/**',r=>r.abort());
  await page.goto(base+'/tools/video-trimmer/',{waitUntil:'networkidle'});
  await page.locator('input[type=file]').setInputFiles('/tmp/long-trim-test.mp4');
  await page.getByTestId('video-trimmer-start').fill('25');
  await page.getByTestId('video-trimmer-end').fill('103');
  if(precise) await page.getByTestId('video-trimmer-precise').check();
  await page.evaluate(() => {
   window.__states=[];
   new MutationObserver(() => {
     const box=document.querySelector('[data-testid="video-trimmer-progress"]');
     if(box) window.__states.push(box.textContent);
   }).observe(document.body,{childList:true,subtree:true,characterData:true});
  });
  await page.getByTestId('video-trimmer-run').click();
  await page.getByTestId('video-trimmer-result').waitFor();
  const states=await page.evaluate(()=>window.__states);
  assert.ok(states.some(s=>s.includes('درصد دقیق این عملیات قابل محاسبه نیست')));
  assert.ok(states.every(s=>!/[٪%]/.test(s)));
  const promise=page.waitForEvent('download'); await page.getByTestId('video-trimmer-download').click();
  const path=`/tmp/trim-${precise}.mp4`; await (await promise).saveAs(path);
  const duration=Number(execFileSync('ffprobe',['-v','error','-show_entries','format=duration','-of','default=nk=1:nw=1',path],{encoding:'utf8'}));
  assert.ok(duration>76 && duration<81,`unexpected duration: ${duration}`);
  console.log(`PASS ${precise?'precise':'fast'} duration ${duration}; no misleading percentage`);
  await page.close();
 }
} finally { await browser.close(); }
