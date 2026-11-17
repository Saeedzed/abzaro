import { chromium } from 'playwright-core';
import { mkdir, stat } from 'node:fs/promises';
import assert from 'node:assert/strict';
const base=process.env.BASE_URL||'http://127.0.0.1:4175';
const out='/home/user/document-layouts'; await mkdir(out,{recursive:true});
const b=await chromium.launch({headless:true,args:['--no-sandbox']});
const p=await b.newPage({viewport:{width:390,height:844},acceptDownloads:true});
p.on('dialog',d=>d.accept());
async function build(kind,name,photo=false,long=false){
 await p.goto(`${base}/tools/doc-${kind}/`,{waitUntil:'networkidle'});
 await p.getByTestId('doc-sample').click();
 if(photo) await p.getByTestId('doc-photo').setInputFiles('/home/user/abzaro/public/samples/sample.png');
 if(long) await p.getByTestId(kind==='resume'?'doc-experience':'doc-body').fill(('متن آزمایشی بلند برای بررسی صفحه بندی و حفظ اطلاعات. نشانه پایان.\n').repeat(85));
 const [dl]=await Promise.all([p.waitForEvent('download',{timeout:60000}),p.getByTestId('doc-build').click()]);
 await dl.saveAs(`${out}/${name}.pdf`); assert((await stat(`${out}/${name}.pdf`)).size>10000); console.log('PASS',name);
}
for(const k of ['resume','letter','invoice','lease','experience']) await build(k,k,k==='resume');
await build('resume','resume-long',true,true); await build('letter','letter-long',false,true);
await b.close();
