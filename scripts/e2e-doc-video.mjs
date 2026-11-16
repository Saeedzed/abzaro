import { chromium } from 'playwright-core';
import { mkdir, stat } from 'node:fs/promises';
import assert from 'node:assert/strict';
const BASE = process.env.BASE_URL || 'http://127.0.0.1:4175';
const OUT = process.env.TEST_OUTPUT || '/home/user/document-samples';
const VIDEO = process.env.VIDEO_FIXTURE || '/home/user/abzaro-benchmark/input.mp4';
await mkdir(OUT,{recursive:true});
const b=await chromium.launch({headless:true,args:['--no-sandbox']});
const p=await b.newPage({viewport:{width:390,height:844},acceptDownloads:true});
await p.route('https://static.cloudflareinsights.com/**',route=>route.abort());
const samples={
 invoice:{seller:'فروشگاه نمونه ابزارو',sellerInfo:'تهران، خیابان نمونه، تلفن ۰۲۱۱۲۳۴۵۶۷۸',buyer:'شرکت آفتاب',buyerInfo:'تهران، میدان بهار',number:'۱۴۰۵-۰۰۱',discount:'150000',tax:'10',notes:'پرداخت تا پایان هفته انجام شود. با سپاس از اعتماد شما.'},
 resume:{name:'نگار محمدی',role:'کارشناس طراحی محصول',phone:'۰۹۱۲۱۲۳۴۵۶۷',email:'negar@example.com',city:'تهران',summary:'طراح محصول با پنج سال تجربه در طراحی تجربه کاربری و توسعه محصولات دیجیتال.',experience:'۱۴۰۲ تا امروز — طراح محصول، شرکت نمونه\n۱۳۹۹ تا ۱۴۰۲ — طراح تجربه کاربری، مجموعه آفتاب',education:'کارشناسی طراحی صنعتی، دانشگاه تهران',skills:'تحقیق کاربر، طراحی رابط، فیگما و کار تیمی'},
 lease:{landlord:'رضا رضایی',tenant:'مریم احمدی',property:'تهران، خیابان نمونه، پلاک ۱۲، واحد ۴',area:'85',rooms:'2',rent:'12000000',deposit:'350000000',months:'12',extra:'طرفین پس از بازدید ملک، شرایط را بررسی می‌کنند.'},
 experience:{company:'شرکت فناوری نمونه',companyInfo:'تهران، خیابان بهار، شناسه ۱۰۱۰۱۰۱',name:'مریم احمدی',nationalId:'۰۰۱۱۲۳۴۵۶۷',role:'کارشناس امور مالی',department:'مالی',purpose:'بانک نمونه',signer:'مدیر منابع انسانی'}
};
async function download(name){const [dl]=await Promise.all([p.waitForEvent('download',{timeout:60000}),p.getByTestId('doc-build').click()]);await dl.saveAs(`${OUT}/${name}.pdf`);assert((await stat(`${OUT}/${name}.pdf`)).size>10000);}
for(const [kind,fields] of Object.entries(samples)){
 await p.goto(`${BASE}/tools/doc-${kind}/`,{waitUntil:'networkidle'});
 for(const [key,value] of Object.entries(fields)) await p.getByTestId(`doc-${key}`).fill(value);
 if(kind==='invoice'){
  await p.getByTestId('doc-item-name-0').fill('خدمات طراحی و پیاده‌سازی وب‌سایت'); await p.getByTestId('doc-item-qty-0').fill('2'); await p.getByTestId('doc-item-price-0').fill('2500000');
  await p.getByTestId('doc-add-item').click();await p.getByTestId('doc-item-name-1').fill('پشتیبانی ماهانه');await p.getByTestId('doc-item-price-1').fill('600000');
 }
 await download(kind); console.log('PASS PDF',kind);
}
// Long rows test pagination and wrapping, including unbroken strings.
await p.goto(`${BASE}/tools/doc-invoice/`,{waitUntil:'networkidle'});await p.getByTestId('doc-seller').fill('فروشنده');await p.getByTestId('doc-buyer').fill('خریدار');
for(let i=0;i<32;i++){if(i) await p.getByTestId('doc-add-item').click();await p.getByTestId(`doc-item-name-${i}`).fill(`ردیف شماره ${i+1}: محصول یا خدمت دارای توضیح بلند برای آزمون شکستن متن ABCDEFGHIJKLMNOPQRSTUVWXYZABCDEFGHIJKLMNOPQRSTUVWXYZ`);await p.getByTestId(`doc-item-price-${i}`).fill('123456');}
await download('invoice-long');console.log('PASS PDF invoice long');
// Exercise both modes against real FFmpeg, and wait for a numeric estimate.
for (const mode of ['superfast', 'veryfast']) {
 await p.goto(`${BASE}/tools/video-compressor/`,{waitUntil:'networkidle'});
 await p.locator('input[type=file]').setInputFiles(VIDEO);
 await p.getByTestId(`video-speed-${mode}`).click();
 assert.equal(await p.getByTestId(`video-speed-${mode}`).getAttribute('aria-pressed'),'true');
 await p.getByTestId('video-compressor-run').click();
 await p.getByTestId('video-compressor-progress').waitFor({state:'visible'});
 console.log('ETA initial:',await p.getByTestId('video-compressor-eta').innerText());
 if (mode === 'superfast') {
   await p.waitForFunction(() => document.querySelector('[data-testid="video-compressor-eta"]')?.textContent?.includes('زمان تقریبی باقی‌مانده:'),null,{timeout:30000});
   console.log('ETA observed:',await p.getByTestId('video-compressor-eta').innerText());
 }
 await p.getByTestId('video-compressor-result').waitFor({state:'visible',timeout:180000});
 console.log(`PASS ${mode} video:`,(await p.getByTestId('video-compressor-result').innerText()).replace(/\n/g,' '));
}
await b.close();
