import { _electron as electron } from 'playwright-core';
import { stat, readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
const app=await electron.launch({executablePath:'desktop/node_modules/electron/dist/electron',args:['--no-sandbox','desktop/main.cjs'],env:{...process.env, ELECTRON_DISABLE_SECURITY_WARNINGS:'true'}});
try {
 const page=await app.firstWindow();
 await page.waitForLoadState('domcontentloaded');
 await app.evaluate(({dialog}) => { dialog.showSaveDialog = async () => ({canceled:false, filePath:'/home/user/desktop-test/from-app.pdf'}); });
 await page.goto('abzaro://app/tools/word-to-pdf/');
 await page.waitForFunction(()=>Boolean(window.abzaroDesktop));
 await page.getByText('فقط DOCX بدون رمز؛ حداکثر ۲۰ مگابایت').waitFor();
 await page.locator('input[type=file]').setInputFiles('public/samples/sample.docx');
 await page.getByTestId('desktop-word-result').waitFor();
 assert.equal(await page.getByTestId('word-to-pdf-result').count(),0);
 await page.getByTestId('desktop-word-convert').click();
 await page.getByText('فایل PDF با موفقیت ذخیره شد.').waitFor({timeout:60000});
 assert((await stat('/home/user/desktop-test/from-app.pdf')).size>10000);
 assert.match(execFileSync('pdfinfo',['/home/user/desktop-test/from-app.pdf'],{encoding:'utf8'}),/Pages:\s+1/);
 assert.match((await readFile('/home/user/desktop-test/from-app.pdf')).subarray(0,5).toString(),/%PDF-/);
 console.log('PASS Electron local offline Word to PDF on Linux');
} finally {await app.close();}
