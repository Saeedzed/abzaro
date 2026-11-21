import { chromium } from 'playwright-core';
import { writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
for (const width of [320,390,1440]) {
 const p=await browser.newPage({viewport:{width,height:850},acceptDownloads:true});
 await p.goto('http://127.0.0.1:4175/tools/doc-resume/',{waitUntil:'networkidle'});
 await p.getByTestId('doc-name').fill('نام آزمون');
 await p.getByTestId('doc-skills').fill('طراحی | ۴\nپژوهش');
 await p.getByTestId('doc-software').fill('فتوشاپ | ۵');
 await p.getByTestId('doc-languages').fill('انگلیسی — پیشرفته');
 await p.getByTestId('doc-photo').setInputFiles('/home/user/uploads/Screenshot (167).png');
 await p.waitForFunction(()=>{const c=document.querySelector('[data-testid=photo-preview]');return c && c.getContext('2d').getImageData(160,160,1,1).data[3]>0});
 const before=await p.getByTestId('photo-preview').evaluate(c=>c.toDataURL());
 await p.getByTestId('photo-zoom').fill('2'); await p.getByTestId('photo-x').fill('80'); await p.getByTestId('photo-y').fill('25');
 await p.waitForFunction(old=>document.querySelector('[data-testid=photo-preview]').toDataURL()!==old,before);
 await p.waitForTimeout(400);
 const after=await p.getByTestId('photo-preview').evaluate(c=>c.toDataURL()); assert.notEqual(before,after);
 const [dl]=await Promise.all([p.waitForEvent('download'),p.getByTestId('doc-build').click()]);
 await dl.saveAs(`/home/user/document-layouts/crop-${width}.pdf`);
 await writeFile(`/home/user/document-layouts/preview-${width}.png`,Buffer.from(after.split(',')[1],'base64'));
 assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth <= innerWidth),true);
 console.log('PASS photo controls, preview and download',width); await p.close();
}
await browser.close();
