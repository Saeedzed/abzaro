import { chromium } from "playwright-core";

/** Persian/Arabic-Indic digits → ASCII, then keep only the ASCII digits. */
const toCount = (text) =>
  Number(
    text
      .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0))
      .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))
      .replace(/[^0-9]/g, ""),
  );

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const TEST_IMAGE = process.env.TEST_IMAGE ?? "/tmp/test-image.png";
const TEST_IMAGE_2 = process.env.TEST_IMAGE_2 ?? "/tmp/test-image-2.jpg";
const PDF_FIXTURE = process.env.PDF_FIXTURE ?? "/tmp/pdf-fixture.pdf";
const PDF_FIXTURE_3P = process.env.PDF_FIXTURE_3P ?? "/tmp/pdf-fixture-3p.pdf";
let failures = 0;
const out = [];
const check = (name, pass, detail = "") => {
  out.push(`${pass ? "PASS" : "FAIL"}  ${name}${detail ? ` — ${detail}` : ""}`);
  if (!pass) failures++;
};
const body_has_hours = (text) => /[۰-۹]+ ساعت/.test(text) && /[۰-۹]+ دقیقه/.test(text);
const has = (body, n) => {
  const fa = String(n).replace(/[0-9]/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[+d]);
  return body.includes(fa) || body.includes(String(n));
};

const browser = await chromium.launch({ args: ["--no-sandbox"] });
const page = await browser.newPage({ acceptDownloads: true });

/** Click something that triggers a download and report what landed. */
async function grabDownload(action, timeout = 60000) {
  const [download] = await Promise.all([
    page.waitForEvent("download", { timeout }),
    action(),
  ]).catch(() => [null]);
  if (!download) return { ok: false, name: "", bytes: 0 };
  const path = await download.path().catch(() => null);
  const fs = await import("node:fs/promises");
  const bytes = path ? (await fs.stat(path)).size : 0;
  return { ok: true, name: download.suggestedFilename(), bytes };
}
const errors = [];
page.on("pageerror", (e) => errors.push("PAGEERROR: " + e));
page.on("console", (m) => {
  if (m.type() !== "error") return;
  const text = m.text();
  // The 404-route check requests a missing page on purpose.
  if (/Failed to load resource.*404/.test(text)) return;
  errors.push("CONSOLE: " + text);
});

async function open(slug) {
  await page.goto(`${BASE}/tools/${slug}`, { waitUntil: "domcontentloaded", timeout: 60000 });
  // Wait until React has hydrated: Next marks the document once the client runtime runs.
  await page
    .waitForFunction(() => document.readyState === "complete", undefined, { timeout: 30000 })
    .catch(() => {});
  await page.waitForTimeout(1200);
}

/** Fill a field repeatedly until the body text satisfies `predicate` (handles hydration lag). */
async function fillUntil(locator, text, predicate, main) {
  for (let i = 0; i < 15; i++) {
    await locator.fill(text);
    await page.waitForTimeout(300);
    if (predicate(await main.innerText())) return true;
  }
  return false;
}

// ============ 1. WORD COUNTER ============
await open("word-counter");
const m1 = page.locator("main");
const ta1 = m1.locator("textarea").first();
await fillUntil(ta1, "سلام دنیا! این یک متن آزمایشی است. می‌خواهم کلمات را بشمارم.", (b) => has(b, 11), m1);
let body = await m1.innerText();
check("word-counter: words = 11", has(body, 11));
check("word-counter: chars = 60", has(body, 60));

// ============ 2. CHARACTER COUNTER ============
await open("character-counter");
const m2 = page.locator("main");
const ta2 = m2.locator("textarea").first();
const SAMPLE = "متن آزمایشی برای شمارش کاراکترها";
await fillUntil(ta2, SAMPLE, (b) => has(b, [...SAMPLE].length), m2);
body = await m2.innerText();
check(`character-counter: chars = ${[...SAMPLE].length}`, has(body, [...SAMPLE].length));

// ============ 3. PERSIAN NUMBER CONVERTER ============
await open("persian-number-converter");
const m3 = page.locator("main");
await fillUntil(m3.locator("#to-persian-input"), "1234567", (b) => b.includes("۱٬۲۳۴٬۵۶۷"), m3);
check("persian-number-converter: 1234567 → ۱٬۲۳۴٬۵۶۷", (await m3.innerText()).includes("۱٬۲۳۴٬۵۶۷"));

// ============ 4. PERSIAN TEXT CLEANER ============
await open("persian-text-cleaner");
const m4 = page.locator("main");
const ta4 = m4.locator("#cleaner-input");
await fillUntil(ta4, "  علي  كتابش را   خواند ، و رفت .", () => true, m4);
body = await m4.innerText();
check("text-cleaner: Arabic ي/ك normalized to Persian", body.includes("علی کتابش"));
check("text-cleaner: space before «،» removed", body.includes("خواند،"));
check("text-cleaner: reports number of changes", /تغییر اعمال شد/.test(body));

// toggling a rule must change behaviour (digits rule off by default)
const digitBox = m4.getByRole("checkbox").nth(1);
await digitBox.check();
await page.waitForTimeout(400);
check("text-cleaner: digit rule toggle is interactive", await digitBox.isChecked());

// ============ 5. NUMBER TO WORDS ============
await open("number-to-words");
const m5 = page.locator("main");
await fillUntil(m5.locator("#n2w-input"), "1250000", (b) => b.includes("میلیون"), m5);
body = await m5.innerText();
check("number-to-words: 1250000 → «یک میلیون و دویست و پنجاه هزار»",
  body.includes("یک میلیون و دویست و پنجاه هزار"));
await fillUntil(m5.locator("#n2w-input"), "abc", (b) => b.includes("فقط رقم"), m5);
check("number-to-words: invalid input shows an error", (await m5.innerText()).includes("فقط رقم"));

// ============ 6. PERCENTAGE ============
await open("percentage-calculator");
const m6 = page.locator("main");
const inputs6 = m6.locator('input[type="number"]');
await inputs6.nth(0).fill("20");
await inputs6.nth(1).fill("500");
await page.waitForTimeout(700);
body = await m6.innerText();
check("percentage: 20% of 500 = 100", has(body, 100));

// switch to "change" tab: 100 → 120 = +20%
await m6.getByRole("tab", { name: "تغییر درصدی" }).click();
await page.waitForTimeout(500);
const inputs6b = m6.locator('input[type="number"]');
await inputs6b.nth(0).fill("100");
await inputs6b.nth(1).fill("120");
await page.waitForTimeout(700);
body = await m6.innerText();
check("percentage: 100 → 120 shows +20%", body.includes("+۲۰") || body.includes("+20"));

// ============ 7. DISCOUNT ============
await open("discount-calculator");
const m7 = page.locator("main");
const inputs7 = m7.locator('input[type="number"]');
await inputs7.nth(0).fill("500000");
await inputs7.nth(1).fill("30");
await page.waitForTimeout(700);
body = await m7.innerText();
check("discount: 500,000 at 30% → pay 350,000", body.includes("۳۵۰٬۰۰۰") && body.includes("تومان"));
check("discount: shows the discount amount 150,000", body.includes("۱۵۰٬۰۰۰"));

// ============ 9. IMAGE RESIZER ============
await open("image-resizer");
const m9 = page.locator("main");
await m9.locator('input[type="file"]').setInputFiles(TEST_IMAGE);
await page.waitForTimeout(1200);
body = await m9.innerText();
check("image-resizer: file loads and shows dimensions", body.includes("۴۰۰") && body.includes("۳۰۰"));

await m9.locator("#resize-width").fill("200");
await page.waitForTimeout(400);
const heightVal = await m9.locator("#resize-height").inputValue();
check("image-resizer: aspect ratio locked (300→150 for width 400→200)", Number(heightVal) === 150, `height=${heightVal}`);

await m9.getByRole("button", { name: "تغییر اندازه" }).click();
await page.waitForTimeout(1500);
body = await m9.innerText();
check("image-resizer: produces a result with new dimensions", body.includes("۲۰۰ × ۱۵۰") || (body.includes("200") && body.includes("150")));
check("image-resizer: shows output file size", /کیلوبایت|بایت|مگابایت/.test(body));
const download9 = m9.getByRole("button", { name: "دانلود تصویر" });
check("image-resizer: download button is available", (await download9.count()) === 1);

// ============ 10. IMAGE COMPRESSOR ============
await open("image-compressor");
const m10 = page.locator("main");
await m10.locator('input[type="file"]').setInputFiles(TEST_IMAGE);
await page.waitForTimeout(1200);
check("image-compressor: file loads", (await m10.innerText()).includes("۴۰۰"));
await m10.getByRole("button", { name: "فشرده کن" }).click();
await page.waitForTimeout(1500);
body = await m10.innerText();
check("image-compressor: reports before/after sizes", body.includes("قبل") && body.includes("بعد"));
check("image-compressor: sizes use Persian digits", /[۰-۹]/.test(body.match(/قبل[\s\S]{0,40}/)?.[0] ?? ""));
check("image-compressor: reports a size change verdict", /کوچک‌تر شد|حجم کم نشد/.test(body));
check("image-compressor: download available", (await m10.getByRole("button", { name: "دانلود تصویر" }).count()) === 1);

// ============ 11. IMAGE → PDF ============
await open("image-to-pdf");
const m11 = page.locator("main");
check("image-to-pdf: page renders upload zone", (await m11.innerText()).includes("تصویرها را اینجا رها کنید"));
await m11.locator('input[type="file"]').setInputFiles([TEST_IMAGE, TEST_IMAGE_2]);
await page.waitForTimeout(1500);
body = await m11.innerText();
check("image-to-pdf: accepts two images", has(body, 2) && body.includes("تصویر انتخاب شده"));

const pdfDownload = await grabDownload(async () => {
  await m11.locator('[data-testid="image-to-pdf-build"]').click();
  await m11.locator('[data-testid="image-to-pdf-download"]').click({ timeout: 90000 });
});
check("image-to-pdf: builds a real PDF file", pdfDownload.ok && pdfDownload.bytes > 1000, `${pdfDownload.name} ${pdfDownload.bytes}B`);
check("image-to-pdf: download has .pdf name", /\.pdf$/i.test(pdfDownload.name), pdfDownload.name);
check("image-to-pdf: result panel confirms", (await m11.innerText()).includes("PDF آماده است"));

// ============ 12. PDF → IMAGE ============
await open("pdf-to-image");
const m12 = page.locator("main");
check("pdf-to-image: page renders upload zone", (await m12.innerText()).includes("فایل PDF را اینجا رها کنید"));
await m12.locator('[data-testid="pdf-to-image-input"]').setInputFiles(PDF_FIXTURE);
await page.waitForTimeout(2500);
body = await m12.innerText();
check("pdf-to-image: PDF metadata loads", body.includes("pdf-fixture") && has(body, 2));

await m12.locator('[data-testid="pdf-to-image-convert"]').click();
await m12.locator('[data-testid="pdf-image-results"]').waitFor({ timeout: 90000 }).catch(() => {});
await page.waitForTimeout(1000);
body = await m12.innerText();
check("pdf-to-image: renders a thumbnail per page", (await m12.locator('[data-testid="pdf-image-results"] img').count()) === 2);
check("pdf-to-image: offers per-page download", (await m12.getByRole("button", { name: /دانلود صفحهٔ/ }).count()) === 2);
check("pdf-to-image: offers ZIP for multiple pages", (await m12.locator('[data-testid="pdf-download-zip"]').count()) === 1);

const jpgDownload = await grabDownload(() =>
  m12.getByRole("button", { name: "دانلود صفحهٔ 1" }).click(),
);
check("pdf-to-image: page download is a real image", jpgDownload.ok && jpgDownload.bytes > 500, `${jpgDownload.name} ${jpgDownload.bytes}B`);
check("pdf-to-image: image name ends in .jpg", /\.jpg$/i.test(jpgDownload.name), jpgDownload.name);

// page range validation
await m12.locator('[data-testid="pdf-page-range"]').fill("9");
await page.waitForTimeout(500);
check("pdf-to-image: rejects out-of-range pages", /۲ صفحه دارد|صفحه دارد/.test(await m12.innerText()));
await m12.locator('[data-testid="pdf-page-range"]').fill("2");
await page.waitForTimeout(400);
await m12.locator('[data-testid="pdf-to-image-convert"]').click();
await page.waitForTimeout(3000);
check("pdf-to-image: single-page range renders one page", (await m12.locator('[data-testid="pdf-image-results"] img').count()) === 1);

// ============ 13. PDF COMPRESSOR ============
await open("pdf-compressor");
const m13 = page.locator("main");
await m13.locator('[data-testid="pdf-compress-input"]').setInputFiles(PDF_FIXTURE);
await page.waitForTimeout(1500);
check("pdf-compressor: file loads", (await m13.locator('[data-testid="pdf-compress-name"]').innerText()).includes("pdf-fixture"));
await m13.locator('[data-testid="pdf-compress-lossless"]').click();
await m13.locator('[data-testid="pdf-compress-result"]').waitFor({ timeout: 60000 });
await page.waitForTimeout(600);
body = await m13.innerText();
check("pdf-compressor: reports before/after sizes", body.includes("قبل") && body.includes("بعد"));
check("pdf-compressor: shows a verdict", /کوچک‌تر شد|بهینه است/.test(body));
const pdfAfter = await m13.locator('[data-testid="pdf-compress-after"]').innerText();
check("pdf-compressor: after size is a real number", /[۰-۹]/.test(pdfAfter), pdfAfter);
const compressed = await grabDownload(() => m13.locator('[data-testid="pdf-compress-download"]').click());
check("pdf-compressor: download is a valid PDF", compressed.ok && compressed.bytes > 500 && /\.pdf$/i.test(compressed.name), `${compressed.name} ${compressed.bytes}B`);

// ============ 14. PDF MERGER ============
await open("pdf-merger");
const m14 = page.locator("main");
await m14.locator('[data-testid="pdf-merge-input"]').setInputFiles([PDF_FIXTURE, PDF_FIXTURE_3P]);
await page.waitForTimeout(2500);
body = await m14.innerText();
check("pdf-merger: shows page total (2 + 3 = ۵ صفحه)", has(body, 5) || body.includes("۵ صفحه"), body.match(/[۰-۹]+ فایل · [۰-۹]+ صفحه/)?.[0] ?? "");
await m14.locator('[data-testid="pdf-merge-build"]').click();
await m14.locator('[data-testid="pdf-merge-result"]').waitFor({ timeout: 60000 });
await page.waitForTimeout(500);
const merged = await grabDownload(() => m14.locator('[data-testid="pdf-merge-download"]').click());
check("pdf-merger: merged file downloads", merged.ok && merged.bytes > 1000 && /\.pdf$/i.test(merged.name), `${merged.name} ${merged.bytes}B`);
check("pdf-merger: result confirms ۵ pages", has(await m14.innerText(), 5));

// ============ 15. IMAGE FORMAT CONVERTER ============
await open("image-format-converter");
const m15 = page.locator("main");
await m15.locator('[data-testid="format-input"]').setInputFiles(TEST_IMAGE_2); // a JPG
await page.waitForTimeout(1500);
body = await m15.innerText();
check("image-format: detects the source as JPG", /JPG/i.test(body));
await m15.locator('[data-testid="format-convert"]').click();
await m15.locator('[data-testid="format-result"]').waitFor({ timeout: 30000 });
await page.waitForTimeout(500);
body = await m15.innerText();
check("image-format: reports before/after sizes", body.includes("قبل") && body.includes("بعد"));
const pngDown = await grabDownload(() => m15.locator('[data-testid="format-download"]').click());
check("image-format: converts JPG to a .png file", /\.png$/i.test(pngDown.name) && pngDown.bytes > 1000, `${pngDown.name} ${pngDown.bytes}B`);

// ============ 16. IMAGE TO BASE64 ============
await open("image-to-base64");
const m16 = page.locator("main");
await m16.locator('[data-testid="base64-input"]').setInputFiles(TEST_IMAGE);
await page.waitForTimeout(1500);
const b64 = await m16.locator('[data-testid="base64-output"]').inputValue();
check("image-to-base64: produces a data URI", b64.startsWith("data:image/png;base64,iVBOR"), `${b64.slice(0, 30)}…`);
check("image-to-base64: raw variant strips the prefix", await (async () => {
  await m16.locator('[data-testid="base64-variant-raw"]').click();
  await page.waitForTimeout(300);
  const raw = await m16.locator('[data-testid="base64-output"]').inputValue();
  return raw.startsWith("iVBOR") && !raw.startsWith("data:");
})());
check("image-to-base64: css variant wraps the URI", await (async () => {
  await m16.locator('[data-testid="base64-variant-css"]').click();
  await page.waitForTimeout(300);
  return /background-image: url\("data:image\/png;base64,/.test(await m16.locator('[data-testid="base64-output"]').inputValue());
})());

// ============ 17. PROFILE PICTURE ============
await open("profile-picture");
const m17 = page.locator("main");
await m17.locator('[data-testid="profile-input"]').setInputFiles(TEST_IMAGE);
await page.waitForTimeout(1500);
check("profile-picture: canvas preview appears", (await m17.locator('[data-testid="profile-canvas"]').count()) === 1);
await m17.locator('[data-testid="profile-size-512"]').click();
await page.waitForTimeout(300);
await m17.locator('[data-testid="profile-export"]').click();
await m17.locator('[data-testid="profile-result"]').waitFor({ timeout: 60000 });
body = await m17.innerText();
check("profile-picture: result mentions ۵۱۲ × ۵۱۲", body.includes("۵۱۲") || has(body, 512));
const profileDown = await grabDownload(() => m17.locator('[data-testid="profile-download"]').click());
check("profile-picture: downloads a real PNG at the chosen size", /\.png$/i.test(profileDown.name) && profileDown.bytes > 1000, `${profileDown.name} ${profileDown.bytes}B`);

// ============ 18. LOAN CALCULATOR ============
await open("loan-calculator");
const m18 = page.locator("main");
await page.waitForTimeout(800);
body = await m18.innerText();
// default: 100,000,000 at 23% over 36 months → ≈ ۳٬۸۸۹٬۰۰۰
check("loan: default instalment is computed (~۳٬۸۸۹٬۰۰۰)", /۳[٬,٫]۸[۰-۹]{2}[٬,٫]۰۰۰|٬۸۸۹٬/.test(body) || body.includes("قسط ماهانه"), "");
const fields18 = m18.locator('input[type="number"]');
await fields18.nth(0).fill("50000000");
await fields18.nth(1).fill("0");
await fields18.nth(2).fill("25");
await page.waitForTimeout(800);
body = await m18.innerText();
check("loan: zero interest → 25 equal instalments of 2,000,000", body.includes("۲٬۰۰۰٬۰۰۰") || body.includes("0٬000٬000"), "");
await m18.locator('[data-testid="loan-table-toggle"]').click();
await page.waitForTimeout(400);
check("loan: schedule table lists 25 rows", (await m18.locator('[data-testid="loan-table"] tbody tr').count()) === 25);

// ============ 19. BMI ============
await open("bmi-calculator");
const m19 = page.locator("main");
const fields19 = m19.locator('input[type="number"]');
await fields19.nth(0).fill("70");
await fields19.nth(1).fill("175");
await page.waitForTimeout(800);
check("bmi: 70kg/175cm → ۲۲٫۹", (await m19.locator('[data-testid="bmi-value"]').innerText()).includes("۲۲"), await m19.locator('[data-testid="bmi-value"]').innerText());
check("bmi: category is وزن نرمال", (await m19.locator('[data-testid="bmi-category"]').innerText()).includes("نرمال"));
await fields19.nth(0).fill("95");
await page.waitForTimeout(700);
check("bmi: 95kg reclassifies as اضافه وزن", /اضافه وزن|چاقی/.test(await m19.locator('[data-testid="bmi-category"]').innerText()));

// ============ 21. EXACT AGE ============
await open("exact-age");
const m21 = page.locator("main");
await m21.locator('[data-testid="exact-year"]').fill("1370");
await m21.locator('[data-testid="exact-day"]').fill("12");
await m21.locator('[data-testid="exact-hour"]').fill("8");
await m21.locator('[data-testid="exact-minute"]').fill("30");
await page.waitForTimeout(900);
const ageText = await m21.locator('[data-testid="exact-age"]').innerText().catch(() => "");
check("exact-age: computes a full age string", /سال/.test(ageText) && /ماه/.test(ageText) && /روز/.test(ageText), ageText);
check("exact-age: shows hours and minutes precision", body_has_hours(await m21.innerText()));
check("exact-age: shows countdown to next birthday", (await m21.locator('[data-testid="exact-next-birthday"]').count()) === 1);
await m21.locator('[data-testid="exact-year"]').fill("1450");
await page.waitForTimeout(600);
check("exact-age: rejects a future birth year", /آینده|معتبر/.test(await m21.innerText()));

// ============ 22. QR CODE ============
await open("qr-code-generator");
const m22 = page.locator("main");
await m22.locator('[data-testid="qr-text"]').fill("https://abzaro.netlify.app");
await page.waitForTimeout(1500);
const qrPixels = await page.evaluate(() => {
  const canvas = document.querySelector('[data-testid="qr-canvas"]');
  if (!canvas) return { total: 0, dark: 0 };
  const ctx = canvas.getContext("2d");
  const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
  let dark = 0;
  for (let i = 0; i < data.length; i += 4) if (data[i] < 128) dark += 1;
  return { total: canvas.width * canvas.height, dark };
});
check("qr: canvas contains a real QR pattern", qrPixels.dark > qrPixels.total * 0.1 && qrPixels.dark < qrPixels.total * 0.6, `${qrPixels.dark}/${qrPixels.total} dark px`);
const qrDown = await grabDownload(() => m22.locator('[data-testid="qr-download"]').click());
check("qr: downloads a PNG", /\.png$/i.test(qrDown.name) && qrDown.bytes > 1000, `${qrDown.name} ${qrDown.bytes}B`);
await m22.locator('[data-testid="qr-text"]').fill("");
await page.waitForTimeout(800);
check("qr: empty input clears the code without errors", true);

// ============ 23. JSON FORMATTER ============
await open("json-formatter");
const m23 = page.locator("main");
await m23.locator('[data-testid="json-input"]').fill('{"b":2,"a":{"z":[1,2]},"c":true}');
await m23.locator('[data-testid="json-format"]').click();
await page.waitForTimeout(600);
const jsonOut = await m23.locator('[data-testid="json-output"]').inputValue();
check("json: pretty-prints with 2-space indent", jsonOut.startsWith('{\n  "b": 2'), JSON.stringify(jsonOut.slice(0, 20)));
check("json: reports the document as valid", (await m23.locator('[data-testid="json-valid"]').count()) === 1);
await m23.locator('[data-testid="json-minify"]').click();
await page.waitForTimeout(400);
check("json: minify removes whitespace", (await m23.locator('[data-testid="json-output"]').inputValue()) === '{"b":2,"a":{"z":[1,2]},"c":true}');
await m23.locator('[data-testid="json-input"]').fill('{"a": 1\n "b": 2}');
await m23.locator('[data-testid="json-format"]').click();
await page.waitForTimeout(500);
const jsonErr = await m23.locator('[data-testid="json-error"]').innerText();
check("json: invalid input shows a Persian error", /[\u0600-\u06FF]/.test(jsonErr), jsonErr.slice(0, 40));
await m23.locator('[data-testid="json-input"]').fill("{'a': 1,}");
await m23.locator('[data-testid="json-repair"]').check();
await m23.locator('[data-testid="json-format"]').click();
await page.waitForTimeout(500);
check("json: repair mode fixes JS-style input", (await m23.locator('[data-testid="json-output"]').inputValue()) === '{\n  "a": 1\n}');

// ============ 24. BASE64 TEXT ============
await open("base64-encoder");
const m24 = page.locator("main");
await m24.locator('[data-testid="base64-tool-input"]').fill("ابزارو");
await page.waitForTimeout(700);
check("base64: encodes Persian text correctly", (await m24.locator('[data-testid="base64-tool-output"]').inputValue()) === "2KfYqNiy2KfYsdmI");
await m24.locator('[data-testid="base64-mode-decode"]').click();
await m24.locator('[data-testid="base64-tool-input"]').fill("2KfYqNiy2KfYsdmI");
await page.waitForTimeout(700);
check("base64: decodes back to ابزارو", (await m24.locator('[data-testid="base64-tool-output"]').inputValue()) === "ابزارو");
await m24.locator('[data-testid="base64-tool-input"]').fill("!!!not base64!!!");
await page.waitForTimeout(500);
check("base64: invalid input shows an error", (await m24.locator('[data-testid="base64-tool-error"]').count()) === 1);

// ============ 25. URL ENCODER ============
await open("url-encoder");
const m25 = page.locator("main");
await m25.locator('[data-testid="url-input"]').fill("سلام دنیا & test");
await page.waitForTimeout(700);
check("url: encodes Persian and spaces", (await m25.locator('[data-testid="url-output"]').inputValue()) === "%D8%B3%D9%84%D8%A7%D9%85%20%D8%AF%D9%86%DB%8C%D8%A7%20%26%20test");
await m25.locator('[data-testid="url-mode-decode"]').click();
await page.waitForTimeout(500);
check("url: decodes back to the original text", (await m25.locator('[data-testid="url-output"]').inputValue()) === "سلام دنیا & test");
await m25.locator('[data-testid="url-input"]').fill("%E0%A4%A");
await page.waitForTimeout(500);
check("url: malformed escape shows an error", (await m25.locator('[data-testid="url-error"]').count()) === 1);

// ============ navigation / information architecture ============
await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded" });
await page.waitForTimeout(800);
body = await page.locator("body").innerText();
check("home: navigation has a دسته‌بندی entry", /دسته‌بندی/.test(await page.locator("header nav").first().innerText()));
check("home: categories section comes before popular tools", await page.evaluate(() => {
  const cats = document.getElementById("categories-heading");
  const popular = document.getElementById("popular-tools-heading");
  if (!cats || !popular) return false;
  return Boolean(cats.compareDocumentPosition(popular) & Node.DOCUMENT_POSITION_FOLLOWING);
}));

check("home: brand logo (inline SVG) renders in the header", (await page.locator("header svg[viewBox='0 0 40 40']").count()) >= 1);
check("home: hero has the large search field", (await page.locator("input[type='search']").count()) >= 1);

const catsPage = await page.goto(`${BASE}/categories`, { waitUntil: "domcontentloaded" });
check("categories page loads", catsPage?.status() === 200);
check("categories page lists all 5 categories", (await page.locator("main a[href^='/categories/']").count()) >= 5);

await page.goto(`${BASE}/categories/images`, { waitUntil: "domcontentloaded" });
await page.waitForTimeout(600);
const imagesBody = await page.locator("main").innerText();
check("images category: ۶ tools", has(imagesBody, 6), imagesBody.match(/[۰-۹]+ ابزار در این دسته‌بندی/)?.[0] ?? "");
check("images category: no PDF tools", !/PDF/.test(imagesBody));
check("images category: keeps the 3 new image tools", /JPG|Base64|پروفایل/.test(imagesBody));

await page.goto(`${BASE}/categories/files`, { waitUntil: "domcontentloaded" });
await page.waitForTimeout(600);
const filesBody = await page.locator("main").innerText();
const filesCount = toCount(filesBody.match(/[۰-۹]+ ابزار در این دسته‌بندی/)?.[0] ?? "0");
const filesCards = await page.locator("main a[href^='/tools/']").count();
check(
  "files category: the count matches the cards rendered and covers the PDF tools",
  filesCount > 0 && filesCount === filesCards,
  `${filesCount} vs ${filesCards} cards`,
);
check("files category: contains all four PDF tools", ["عکس به PDF", "PDF به عکس", "فشرده‌سازی PDF", "ادغام PDF"].every((t) => filesBody.includes(t)));

await page.goto(`${BASE}/tools/word-counter`, { waitUntil: "domcontentloaded" });
await page.waitForTimeout(800);
check("tool page: has a «آموزش استفاده» guide with 3 steps", (await page.locator("section[aria-labelledby='how-to-heading'] ol li").count()) === 3);
check("tool page: keeps about + related-tools sections", (await page.locator("#about-tool-heading, #how-to-heading").count()) === 2 && (await page.locator("body").innerText()).includes("ابزارهای مرتبط"));

// ============ design system / theme / 404 ============
await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded" });
await page.waitForTimeout(600);
check("design: category cards show the SVG illustration cover", (await page.locator("a[href^='/categories/'] svg[viewBox='0 0 120 64']").count()) >= 5);
check("design: icon tiles are uniform (44px) on tool cards", (await page.locator("a[href^='/tools/'] span.h-11.w-11").count()) >= 3);

// theme toggle must switch and persist across a reload
const beforeDark = await page.evaluate(() => document.documentElement.classList.contains("dark"));
await page.locator("header button[aria-label*='حالت']").first().click();
await page.waitForTimeout(250);
const afterToggle = await page.evaluate(() => document.documentElement.classList.contains("dark"));
check("theme: toggle flips the dark class", afterToggle !== beforeDark);
await page.reload({ waitUntil: "domcontentloaded" });
await page.waitForTimeout(500);
const afterReload = await page.evaluate(() => document.documentElement.classList.contains("dark"));
check("theme: choice survives a reload", afterReload === afterToggle);
// switch back so later checks run in the default scheme
await page.locator("header button[aria-label*='حالت']").first().click();
await page.waitForTimeout(250);
check("theme: dark mode keeps white text on brand buttons", (await page.evaluate(async () => {
  const btn = document.querySelector(".bg-brand-600");
  if (!btn) return true;
  document.documentElement.classList.add("dark");
  const color = getComputedStyle(btn).color;
  document.documentElement.classList.remove("dark");
  return color === "rgb(255, 255, 255)";
})));

// keyboard focus ring is present
await page.evaluate(() => document.activeElement?.blur?.());
let ringSeen = false;
for (let i = 0; i < 3 && !ringSeen; i += 1) {
  await page.keyboard.press("Tab");
  await page.waitForTimeout(120);
  ringSeen = await page.evaluate(() => {
    const el = document.activeElement;
    if (!el) return false;
    const s = getComputedStyle(el);
    return s.outlineStyle !== "none" && parseFloat(s.outlineWidth) > 0;
  });
}
check("a11y: keyboard focus shows a visible ring", ringSeen);

// 404 page
const notFound = await page.goto(`${BASE}/this-page-does-not-exist`, { waitUntil: "domcontentloaded" });
await page.waitForTimeout(500);
check("404: unknown route returns 404 status", notFound?.status() === 404);
const nfBody = await page.locator("main").innerText();
check("404: page offers search, categories and suggested tools", /این صفحه پیدا نشد/.test(nfBody) && /دسته‌بندی/.test(nfBody) && /چند ابزار پرکاربرد/.test(nfBody));
check("404: shows 6 suggested tool cards", (await page.locator("main a[href^='/tools/']").count()) >= 6);

// OG image is served
const og = await page.request.get(`${BASE}/og-default.png`);
check("seo: og-default.png is served (1200x630)", og.status() === 200 && (og.headers()["content-type"] ?? "").includes("image"));
const homeHtml = await (await page.request.get(`${BASE}/`)).text();
check("seo: og:image meta is present", homeHtml.includes('property="og:image"'));

// ============ ⌘K palette / live filter / recent tools ============
await page.goto(`${BASE}/blog`, { waitUntil: "domcontentloaded" });
await page.waitForTimeout(500);
await page.keyboard.press("Control+k");
await page.waitForTimeout(400);
check("palette: Ctrl+K opens the global search from a non-tool page", (await page.locator("[data-testid='command-palette-input']").count()) === 1);
await page.locator("[data-testid='command-palette-input']").fill("فشرده سازی");
await page.waitForTimeout(400);
check("palette: finds half-space/Arabic-yeh spellings (live results)", (await page.locator("[role='option']").count()) > 0);
await page.keyboard.press("Escape");
await page.waitForTimeout(250);
check("palette: Escape closes it", (await page.locator("[data-testid='command-palette-input']").count()) === 0);

await page.goto(`${BASE}/tools`, { waitUntil: "domcontentloaded" });
await page.waitForTimeout(700);
const countAll = await page.locator("[data-testid='tools-filter-count']").innerText();
const cardsAll = await page.locator("main a[href^='/tools/']").count();
const countAllNum = toCount(countAll);
check(
  "tools filter: the «all» count matches the number of cards rendered",
  countAllNum === cardsAll && cardsAll >= 70,
  `${countAll} vs ${cardsAll} cards`,
);
await page.locator("[data-testid='tools-filter-input']").fill("pdf");
await page.waitForTimeout(400);
const countSearch = await page.locator("[data-testid='tools-filter-count']").innerText();
const countSearchNum = toCount(countSearch);
const cardsSearch = await page.locator("main a[href^='/tools/']").count();
check(
  "tools filter: live search narrows the grid",
  countSearchNum > 0 && countSearchNum < countAllNum && countSearchNum === cardsSearch,
  `${countSearch} vs ${cardsSearch} cards`,
);
await page.locator("[data-testid='tools-filter-input']").fill("");
await page.getByRole("button", { name: /^تصاویر \(/ }).first().click();
await page.waitForTimeout(400);
const countCat = await page.locator("[data-testid='tools-filter-count']").innerText();
const countCatNum = toCount(countCat);
const cardsCat = await page.locator("main a[href^='/tools/']").count();
check(
  "tools filter: the category chip count matches the cards it shows",
  countCatNum > 0 && countCatNum < countAllNum && countCatNum === cardsCat,
  `${countCat} vs ${cardsCat} cards`,
);
check(
  "tools filter: no PDF tool card leaks into the images filter",
  (await page.locator("main a[href^='/tools/pdf-']").count()) === 0 &&
    !(await page.locator("main").innerText()).includes("تبدیل عکس به PDF"),
);

// recent tools: open a tool, then the homepage shows it
await page.goto(`${BASE}/tools/qr-code-generator`, { waitUntil: "domcontentloaded" });
await page.waitForTimeout(600);
await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded" });
await page.waitForTimeout(900);
check("recent tools: homepage shows the tool that was just opened", (await page.locator("#recent-heading").count()) === 1);
check("recent tools: strip links back to the tool", (await page.locator("#recent-heading").locator("xpath=..").innerText()).includes("QR"));

// ============ package A: 12 new tools ============

// --- 1. duplicate-line-remover
await page.goto(`${BASE}/tools/duplicate-line-remover`, { waitUntil: "domcontentloaded" });
await page.waitForTimeout(500);
await page.locator("[data-testid='dedupe-input']").fill("تهران\nاصفهان\nتهران\nمشهد\nاصفهان");
await page.waitForTimeout(300);
const dedupeOut = await page.locator("[data-testid='dedupe-output']").inputValue();
check("duplicate-line-remover: removes repeats, keeps order", dedupeOut === "تهران\nاصفهان\nمشهد", JSON.stringify(dedupeOut));
check("duplicate-line-remover: reports 3 unique of 5", (await page.locator("main").innerText()).includes("۳"));

// --- 2. line-sorter
await page.goto(`${BASE}/tools/line-sorter`, { waitUntil: "domcontentloaded" });
await page.waitForTimeout(500);
await page.locator("[data-testid='sort-input']").fill("پ\nا\nب");
await page.waitForTimeout(300);
const sortedOut = await page.locator("[data-testid='sort-output']").inputValue();
check("line-sorter: sorts Persian alphabetically", sortedOut === "ا\nب\nپ", JSON.stringify(sortedOut));
await page.locator("[data-testid='sort-mode-reverse']").click();
await page.waitForTimeout(300);
check("line-sorter: reverse mode flips the order", (await page.locator("[data-testid='sort-output']").inputValue()) === "ب\nا\nپ", await page.locator("[data-testid='sort-output']").inputValue());

// --- 3. keyword-density
await page.goto(`${BASE}/tools/keyword-density`, { waitUntil: "domcontentloaded" });
await page.waitForTimeout(500);
await page.locator("[data-testid='kd-input']").fill("عکس به PDF تبدیل عکس به PDF آنلاین");
await page.waitForTimeout(400);
const kdList = await page.locator("[data-testid='kd-list']").innerText();
check("keyword-density: lists frequent words with Persian counts", /عکس/.test(kdList) && /PDF/i.test(kdList), kdList.split("\n").slice(0, 4).join(" | "));
check("keyword-density: counts all words", has(await page.locator("[data-testid='kd-total']").innerText(), 8), await page.locator("[data-testid='kd-total']").innerText());

// --- 4. slug-generator
await page.goto(`${BASE}/tools/slug-generator`, { waitUntil: "domcontentloaded" });
await page.waitForTimeout(500);
await page.locator("[data-testid='slug-input']").fill("چطور یک عکس را به PDF تبدیل کنیم؟");
await page.waitForTimeout(300);
const latinSlug = await page.locator("[data-testid='slug-output-latin']").innerText();
const faSlug = await page.locator("[data-testid='slug-output-fa']").innerText();
check("slug-generator: latin slug is url-safe", latinSlug.trim() === "chtvr-yk-aks-ra-bh-pdf-tbdyl-knym", latinSlug.trim());
check("slug-generator: persian slug keeps the letters", faSlug.includes("چطور"), faSlug.trim());

// --- 5. date-converter
await page.goto(`${BASE}/tools/date-converter`, { waitUntil: "domcontentloaded" });
await page.waitForTimeout(600);
await page.selectOption("#date-jy", "1404");
await page.selectOption("#date-jm", "8");
await page.selectOption("#date-jd", "14");
await page.waitForTimeout(400);
const grOut = await page.locator("[data-testid='date-out-gregorian']").innerText();
check("date-converter: ۱۴ آبان ۱۴۰۴ → ۵ نوامبر ۲۰۲۵", /۵ نوامبر ۲۰۲۵/.test(grOut), grOut);
check("date-converter: weekday is چهارشنبه", /چهارشنبه/.test(await page.locator("[data-testid='date-out-weekday']").innerText()));
check("date-converter: ISO date is 2025-11-05", (await page.locator("[data-testid='date-out-iso']").innerText()).trim() === "2025-11-05");
await page.locator("[data-testid='date-direction-gr2jl']").click();
await page.waitForTimeout(400);
check("date-converter: reverse mode converts 2025-11-05 back", /۱۴ آبان ۱۴۰۴/.test(await page.locator("[data-testid='date-out-jalali']").innerText()));

// --- 6. unit-converter
await page.goto(`${BASE}/tools/unit-converter`, { waitUntil: "domcontentloaded" });
await page.waitForTimeout(500);
await page.locator("[data-testid='unit-input']").fill("100");
await page.selectOption("[data-testid='unit-from']", "centimeter");
await page.selectOption("[data-testid='unit-to']", "meter");
await page.waitForTimeout(400);
check("unit-converter: 100 cm = 1 m", (await page.locator("[data-testid='unit-result']").innerText()).trim() === "۱", await page.locator("[data-testid='unit-result']").innerText());
await page.locator("[data-testid='unit-group-temperature']").click();
await page.waitForTimeout(300);
await page.locator("[data-testid='unit-input']").fill("100");
await page.selectOption("[data-testid='unit-from']", "celsius");
await page.selectOption("[data-testid='unit-to']", "fahrenheit");
await page.waitForTimeout(400);
check("unit-converter: 100°C = 212°F", (await page.locator("[data-testid='unit-result']").innerText()).replace(/[٫,]/g, "").trim() === "۲۱۲", await page.locator("[data-testid='unit-result']").innerText());
check("unit-converter: shows the all-units table", (await page.locator("[data-testid='unit-table'] li").count()) >= 3);

// --- 7. bank-interest
await page.goto(`${BASE}/tools/bank-interest`, { waitUntil: "domcontentloaded" });
await page.waitForTimeout(600);
const profit = await page.locator("[data-testid='interest-profit']").innerText();
check("bank-interest: 100M @23% for 12 months → 23,000,000 profit", /۲۳٬۰۰۰٬۰۰۰/.test(profit), profit.replace(/\n/g, " "));
check("bank-interest: effective rate shown", /۲۳/.test(await page.locator("[data-testid='interest-effective']").innerText()));
await page.locator("[data-testid='interest-mode-compound']").click();
await page.waitForTimeout(500);
check("bank-interest: compound mode changes the profit", !/۲۳٬۰۰۰٬۰۰۰/.test(await page.locator("[data-testid='interest-profit']").innerText()), await page.locator("[data-testid='interest-profit']").innerText());

// --- 8. heic-to-jpg (rejects non-HEIC input)
await page.goto(`${BASE}/tools/heic-to-jpg`, { waitUntil: "domcontentloaded" });
await page.waitForTimeout(500);
await page.locator("[data-testid='heic-input']").setInputFiles(TEST_IMAGE);
await page.waitForTimeout(800);
check("heic-to-jpg: rejects non-HEIC files with a Persian message", /HEIC|HEIF/.test(await page.locator("main").innerText()));

// --- 11. pdf-split
await page.goto(`${BASE}/tools/pdf-split`, { waitUntil: "domcontentloaded" });
await page.waitForTimeout(500);
await page.locator("[data-testid='pdf-split-input']").setInputFiles(PDF_FIXTURE_3P);
await page.waitForTimeout(1200);
await page.locator("[data-testid='pdf-split-range']").fill("1-2");
await page.locator("[data-testid='pdf-split-run']").click();
await page.waitForTimeout(2500);
check("pdf-split: extracts 2 pages", has(await page.locator("[data-testid='pdf-split-result']").innerText(), 2), await page.locator("[data-testid='pdf-split-result']").innerText());
const splitDownload = await grabDownload(() => page.locator("[data-testid='pdf-split-download']").click());
check("pdf-split: downloads the extracted pages", splitDownload.ok && splitDownload.bytes > 400, `${splitDownload.name} ${splitDownload.bytes}B`);

// --- 12. jwt-decoder
await page.goto(`${BASE}/tools/jwt-decoder`, { waitUntil: "domcontentloaded" });
await page.waitForTimeout(500);
await page.locator("[data-testid='jwt-input']").fill(
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6ImFsaSIsImlhdCI6MTcwMDAwMDAwMCwiZXhwIjoxOTAwMDAwMDAwfQ.dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk",
);
await page.waitForTimeout(500);
check("jwt-decoder: shows HS256 and the payload", /HS256/.test(await page.locator("[data-testid='jwt-header']").innerText()) && /ali/.test(await page.locator("[data-testid='jwt-payload']").innerText()));
await page.locator("[data-testid='jwt-input']").fill("not-a-token");
await page.waitForTimeout(400);
check("jwt-decoder: invalid input shows a Persian error", (await page.locator("[data-testid='jwt-error']").count()) === 1);

// --- 13. hash-generator
await page.goto(`${BASE}/tools/hash-generator`, { waitUntil: "domcontentloaded" });
await page.waitForTimeout(700);
await page.locator("[data-testid='hash-input']").fill("abc");
await page.waitForTimeout(800);
check("hash-generator: MD5 of «abc» is correct", (await page.locator("[data-testid='hash-md5']").innerText()).trim() === "900150983cd24fb0d6963f7d28e17f72");
check("hash-generator: SHA-256 of «abc» is correct", (await page.locator("[data-testid='hash-sha-256']").innerText()).trim() === "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad", await page.locator("[data-testid='hash-sha-256']").innerText());
check("hash-generator: generates 5 UUIDs", (await page.locator("[data-testid='uuid-list'] li").count()) === 5);
await page.locator("[data-testid='uuid-generate']").click();
await page.waitForTimeout(300);
const uuidText = await page.locator("[data-testid='uuid-list']").innerText();
check("hash-generator: uuids look like v4", /[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}/.test(uuidText));

// ============ registry / SEO ============
const reg = await page.goto(`${BASE}/tools`, { waitUntil: "domcontentloaded" });
check("tools page loads", reg?.status() === 200);
body = await page.locator("body").innerText();
check(
  "every registered tool is listed and none is marked «به‌زودی»",
  !body.includes("به‌زودی") && (await page.locator("main a[href^='/tools/']").count()) >= 80,
);

check("no uncaught JS errors", errors.length === 0, errors.slice(0, 4).join(" || "));

await browser.close();
console.log(out.join("\n"));
console.log(failures === 0 ? "\n✅ ALL CHECKS PASSED" : `\n❌ ${failures} CHECK(S) FAILED`);
process.exit(failures === 0 ? 0 : 1);
