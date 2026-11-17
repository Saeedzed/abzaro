// Needs /tmp/audio.mp4 and /tmp/tiny.mp4 (node scripts/make-fixtures.mjs) plus ffprobe.
import { chromium } from 'playwright-core';
import { execFileSync } from 'node:child_process';
import assert from 'node:assert/strict';
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const base=process.env.BASE_URL||'http://127.0.0.1:4175';
try {
 const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,acceptDownloads:true,serviceWorkers:'block'});
 const p=await context.newPage(); p.setDefaultTimeout(120000);
 await p.route('https://static.cloudflareinsights.com/**',r=>r.abort());
 await p.goto(base+'/tools/video-converter/',{waitUntil:'networkidle'});
 await p.locator('input[type=file]').setInputFiles('/tmp/audio.mp4');
 for(const format of ['mp4','mov','mkv','webm']) {
  await p.getByTestId('video-converter-format').selectOption(format);
  await p.getByTestId('video-converter-run').click();
  await Promise.race([
   p.getByTestId('video-converter-result').waitFor({state:'visible'}),
   p.getByTestId('video-converter-error').waitFor({state:'visible'}).then(async()=>{throw Error(await p.getByTestId('video-converter-error').innerText())})
  ]);
  const promise=p.waitForEvent('download'); await p.getByTestId('video-converter-download').click();
  const path=`/tmp/converter-test.${format}`; await (await promise).saveAs(path);
  const streams=JSON.parse(execFileSync('ffprobe',['-v','error','-show_entries','stream=codec_name,codec_type','-of','json',path],{encoding:'utf8'})).streams;
  assert.equal(streams.find(x=>x.codec_type==='video')?.codec_name,format==='webm'?'vp8':'h264');
  assert.equal(streams.find(x=>x.codec_type==='audio')?.codec_name,format==='webm'?'opus':'aac');
  console.log('PASS output',format,JSON.stringify(streams));
 }
 await p.locator('input[type=file]').setInputFiles('/tmp/tiny.mp4');
 await p.getByTestId('video-converter-format').selectOption('mp4'); await p.getByTestId('video-converter-run').click();
 await p.getByTestId('video-converter-result').waitFor();
 const promise=p.waitForEvent('download');await p.getByTestId('video-converter-download').click();let path='/tmp/converter-no-audio.mp4';await (await promise).saveAs(path);
 const streams=JSON.parse(execFileSync('ffprobe',['-v','error','-show_entries','stream=codec_type','-of','json',path],{encoding:'utf8'})).streams;
 assert.equal(streams.filter(s=>s.codec_type==='video').length,1);assert.equal(streams.filter(s=>s.codec_type==='audio').length,0);
 console.log('PASS no audio'); await context.close();
} finally {await browser.close()}
