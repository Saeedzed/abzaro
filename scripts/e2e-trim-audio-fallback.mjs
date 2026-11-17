// Generate /tmp/pcm-long.mp4 (125s H.264 + pcm_s16be), /tmp/audio.mp4 and /tmp/vp8-source.webm; requires ffprobe.
import {chromium} from 'playwright-core';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
const base=process.env.BASE_URL||'http://127.0.0.1:4175';
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const probe=(args)=>JSON.parse(execFileSync('ffprobe',['-v','error',...args,'-of','json'],{encoding:'utf8'}));
try{
 const p=await browser.newPage({viewport:{width:390,height:844},acceptDownloads:true,serviceWorkers:'block'});p.setDefaultTimeout(120000);
 await p.route('https://static.cloudflareinsights.com/**',r=>r.abort());
 await p.goto(base+'/tools/video-trimmer/',{waitUntil:'networkidle'});
 await p.locator('input[type=file]').setInputFiles('/tmp/pcm-long.mp4');
 await p.getByTestId('video-trimmer-start').fill('20'); await p.getByTestId('video-trimmer-end').fill('65');
 await p.getByTestId('video-trimmer-run').click();
 await Promise.race([p.getByTestId('video-trimmer-result').waitFor(),p.getByTestId('video-trimmer-error').waitFor().then(async()=>{throw Error(await p.getByTestId('video-trimmer-error').innerText())})]);
 assert.match(await p.getByTestId('video-trimmer-result').innerText(),/صدا به AAC تبدیل شد/);
 let pending=p.waitForEvent('download');await p.getByTestId('video-trimmer-download').click();await(await pending).saveAs('/tmp/pcm-trimmed-test.mp4');
 const result=probe(['-show_entries','stream=codec_name,codec_type:format=duration','/tmp/pcm-trimmed-test.mp4']);
 assert.equal(result.streams.find(s=>s.codec_type==='video').codec_name,'h264');
 assert.equal(result.streams.find(s=>s.codec_type==='audio').codec_name,'aac');
 assert.ok(Number(result.format.duration)>=44&&Number(result.format.duration)<=47,JSON.stringify(result.format));
 const hashIn=probe(['-select_streams','v:0','-show_packets','-show_entries','packet=data_hash','-show_data_hash','sha256','/tmp/pcm-long.mp4']);
 const hashOut=probe(['-select_streams','v:0','-show_packets','-show_entries','packet=data_hash','-show_data_hash','sha256','/tmp/pcm-trimmed-test.mp4']);
 assert.ok(hashOut.packets.length && hashIn.packets.some(packet=>packet.data_hash===hashOut.packets[0].data_hash),'video packet must be copied');
 console.log('PASS PCM fallback: audio AAC, video bitstream copied, duration',result.format.duration);
 await p.locator('input[type=file]').setInputFiles('/tmp/audio.mp4');await p.getByTestId('video-trimmer-start').fill('0');await p.getByTestId('video-trimmer-end').fill('1');
 await p.getByTestId('video-trimmer-run').click();await p.getByTestId('video-trimmer-result').waitFor();
 assert.doesNotMatch(await p.getByTestId('video-trimmer-result').innerText(),/صدا به AAC تبدیل شد/);
 console.log('PASS AAC copied and same worker reusable');
 await p.locator('input[type=file]').setInputFiles('/tmp/vp8-source.webm');await p.getByTestId('video-trimmer-start').fill('0');await p.getByTestId('video-trimmer-end').fill('2');await p.getByTestId('video-trimmer-run').click();
 await p.getByTestId('video-trimmer-error').waitFor();assert.equal(await p.getByTestId('video-trimmer-result').count(),0);
 console.log('PASS incompatible video not incorrectly retried as audio');
} finally {await browser.close()}
