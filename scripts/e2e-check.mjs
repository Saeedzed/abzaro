import { chromium } from "playwright-core";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
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

/** Wait until React has hydrated: the clear button becomes enabled after we type. */
async function typeWhenReady(locator, text, main) {
  for (let attempt = 0; attempt < 20; attempt++) {
    await locator.fill(text);
    await page.waitForTimeout(400);
    const btn = main.getByRole("button", { name: /پاک کردن/ });
    if ((await btn.count()) === 0) return true;
    if (await btn.first().isEnabled()) return true;
  }
  return false;
}

// ============ 1. WORD COUNTER ============
await page.goto(`${BASE}/tools/word-counter`, { waitUntil: "domcontentloaded", timeout: 60000 });
const main1 = page.locator("main");
const ta = main1.locator("textarea").first();
const hydrated = await typeWhenReady(ta, "سلام دنیا! این یک متن آزمایشی است. می‌خواهم کلمات را بشمارم.", main1);
check("word-counter: page hydrates (JS loaded)", hydrated);
await page.waitForTimeout(800);
let body = await main1.innerText();
check("word-counter: words = 11 (ZWNJ = one word)", has(body, 11));
check("word-counter: chars w/ space = 60", has(body, 60));
check("word-counter: chars w/o space = 50", has(body, 50));
check("word-counter: sentences = 3", has(body, 3));
check("word-counter: reading + speaking time", body.includes("زمان مطالعه") && body.includes("زمان گفتار"));
const clearBtn = main1.getByRole("button", { name: /پاک کردن/ });
if (await clearBtn.isEnabled()) {
  await clearBtn.click();
  await page.waitForTimeout(400);
  check("word-counter: clear button works", (await ta.inputValue()) === "");
} else {
  check("word-counter: clear button works", false, "button stayed disabled");
}

// ============ 2. CHARACTER COUNTER ============
await page.goto(`${BASE}/tools/character-counter`, { waitUntil: "domcontentloaded", timeout: 60000 });
const main2 = page.locator("main");
const ta2 = main2.locator("textarea").first();
const SAMPLE = "متن آزمایشی برای شمارش کاراکترها";
await typeWhenReady(ta2, SAMPLE, main2);
await page.waitForTimeout(800);
body = await main2.innerText();
check(`character-counter: total chars = ${[...SAMPLE].length}`, has(body, [...SAMPLE].length));
check("character-counter: no-space count", body.includes("بدون فاصله"));
check("character-counter: UTF-8 size", body.includes("بایت") || body.includes("کیلوبایت"));

// ============ 3. PERSIAN NUMBER CONVERTER ============
await page.goto(`${BASE}/tools/persian-number-converter`, { waitUntil: "domcontentloaded", timeout: 60000 });
const main3 = page.locator("main");
const enInput = main3.locator("#to-persian-input");
const faInput = main3.locator("#to-english-input");
check("converter: both panels present", (await enInput.count()) === 1 && (await faInput.count()) === 1);

for (let i = 0; i < 15; i++) {
  await enInput.fill("1234567");
  await page.waitForTimeout(300);
  if ((await main3.innerText()).includes("۱٬۲۳۴٬۵۶۷") || (await main3.innerText()).includes("۱۲۳۴۵۶۷")) break;
}
body = await main3.innerText();
check("converter: EN 1234567 -> ۱٬۲۳۴٬۵۶۷", body.includes("۱٬۲۳۴٬۵۶۷") || body.includes("۱۲۳۴۵۶۷"));

for (let i = 0; i < 15; i++) {
  await faInput.fill("۹۸۷۶۵۰");
  await page.waitForTimeout(300);
  if ((await main3.innerText()).includes("987")) break;
}
body = await main3.innerText();
check("converter: FA ۹۸۷۶۵۰ -> 987650", body.includes("987650") || body.includes("987,650"));

// ============ 4. SEARCH ============
await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded", timeout: 60000 });
const box = page.locator("header input").first();
for (let i = 0; i < 15; i++) {
  await box.fill("درصد");
  await page.waitForTimeout(300);
  if ((await page.locator("body").innerText()).includes("محاسبه درصد")) break;
}
body = await page.locator("body").innerText();
check("search: 'درصد' surfaces percentage tool", body.includes("محاسبه درصد"));

check("no uncaught JS errors", errors.length === 0, errors.slice(0, 3).join(" || "));

await browser.close();
console.log(out.join("\n"));
console.log(failures === 0 ? "\n✅ ALL CHECKS PASSED" : `\n❌ ${failures} CHECK(S) FAILED`);
process.exit(failures === 0 ? 0 : 1);
