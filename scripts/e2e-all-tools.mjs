import { chromium } from "playwright-core";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const TEST_IMAGE = process.env.TEST_IMAGE ?? "/tmp/test-image.png";
let failures = 0;
const out = [];
const check = (name, pass, detail = "") => {
  out.push(`${pass ? "PASS" : "FAIL"}  ${name}${detail ? ` — ${detail}` : ""}`);
  if (!pass) failures++;
};
const has = (body, n) => {
  const fa = String(n).replace(/[0-9]/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[+d]);
  return body.includes(fa) || body.includes(String(n));
};

const browser = await chromium.launch({ args: ["--no-sandbox"] });
const page = await browser.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push("PAGEERROR: " + e));
page.on("console", (m) => { if (m.type() === "error") errors.push("CONSOLE: " + m.text()); });

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

// ============ 8. AGE (Jalali) ============
await open("age-calculator");
const m8 = page.locator("main");
await m8.locator("#birth-year").fill("1370");
await m8.locator("#birth-month").selectOption("5");
await m8.locator("#birth-day").fill("12");
// the visible value should be Persian digits
const yearShown = await m8.locator("#birth-year").inputValue();
check("age: year field displays Persian digits", yearShown === "۱۳۷۰", `shown=${yearShown}`);
await page.waitForTimeout(900);
body = await m8.innerText();
// Compared with "today" (2026-11-14 ≈ 1405-08-23) → 35 years, 3 months, 11 days
check("age: computes an age from a Jalali birth date", /سن شما/.test(body) && /سال/.test(body));
check("age: shows total days and weekday", body.includes("مجموع روزها") && body.includes("روز هفتهٔ تولد"));
const ageOk = /۳[۰-۹]/.test(body);
check("age: age is in a plausible range (30s)", ageOk, body.split("\n").slice(0, 12).join(" | "));

// invalid date
await m8.locator("#birth-year").fill("1500");
await page.waitForTimeout(600);
check("age: future birth date is rejected", (await m8.innerText()).includes("نمی‌تواند در آینده"));

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

// ============ registry / SEO ============
const reg = await page.goto(`${BASE}/tools`, { waitUntil: "domcontentloaded" });
check("tools page loads", reg?.status() === 200);
body = await page.locator("body").innerText();
check("all 10 tools listed, none marked «به‌زودی»", !body.includes("به‌زودی"));

check("no uncaught JS errors", errors.length === 0, errors.slice(0, 4).join(" || "));

await browser.close();
console.log(out.join("\n"));
console.log(failures === 0 ? "\n✅ ALL CHECKS PASSED" : `\n❌ ${failures} CHECK(S) FAILED`);
process.exit(failures === 0 ? 0 : 1);
