import { chromium } from 'playwright-core';
import assert from 'node:assert/strict';
const browser = await chromium.launch({headless:true});
const page = await browser.newPage();
page.on('dialog', dialog => dialog.accept());
const base = process.env.BASE_URL || 'http://127.0.0.1:4175';
async function go(slug) { await page.goto(`${base}/tools/${slug}/`); }
try {
  await go('word-counter'); await page.getByTestId('text-sample').click(); assert.match(await page.locator('textarea').first().inputValue(), /ابزارو/);
  await go('doc-invoice'); await page.getByTestId('doc-sample').click(); assert.equal(await page.getByTestId('doc-seller').inputValue(), 'فروشگاه نمونه');
  await go('labour-insurance'); await page.getByTestId('labour-sample').click(); assert.equal(await page.getByTestId('labour-salary').inputValue(), '20000000');
  await go('pdf-merger'); await page.getByTestId('pdf-merge-input-sample').click(); await page.getByText('sample-2.pdf').first().waitFor({timeout:15000});
  await go('video-compressor'); await page.getByTestId('video-compressor-input-sample').click(); await page.getByTestId('video-target-slider').waitFor({timeout:15000});
  console.log('Sample interactions passed');
} finally { await browser.close(); }
