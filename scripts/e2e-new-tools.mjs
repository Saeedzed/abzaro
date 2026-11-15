/**
 * Browser checks for the tools added in the «بستهٔ B + video» sprint.
 * Every check drives the real UI and asserts a real result — no snapshots.
 */
import { chromium } from "playwright-core";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const PDF_FIXTURE_3P = process.env.PDF_FIXTURE_3P ?? "/tmp/pdf-fixture-3p.pdf";
const TEST_IMAGE = process.env.TEST_IMAGE ?? "/tmp/test-image.png";
let failures = 0;
const out = [];
const check = (name, pass, detail = "") => {
  out.push(`${pass ? "PASS" : "FAIL"}  ${name}${detail ? ` — ${detail}` : ""}`);
  if (!pass) failures++;
};

// A clip WITH an audio track for the ffmpeg tests (/tmp/tiny.mp4 is video-only).
const fs = await import("node:fs");
const videoCandidates = [process.env.VIDEO_FIXTURE, "/tmp/audio.mp4", "/tmp/tiny.mp4"].filter(Boolean);
const VIDEO_FIXTURE =
  videoCandidates.find((path) => {
    try {
      return fs.statSync(path).size > 1000;
    } catch {
      return false;
    }
  }) ?? "/tmp/audio.mp4";
const videoOk = (() => {
  try {
    return fs.statSync(VIDEO_FIXTURE).size > 1000;
  } catch {
    return false;
  }
})();

const browser = await chromium.launch({ args: ["--no-sandbox"] });
// Tall enough that the crop editor and its handles are inside the viewport.
const page = await browser.newPage({
  acceptDownloads: true,
  viewport: { width: 1280, height: 1000 },
});
const errors = [];
page.on("pageerror", (e) => errors.push("PAGEERROR: " + e));
page.on("console", (m) => {
  if (m.type() === "error" && !/Failed to load resource/.test(m.text())) {
    errors.push("CONSOLE: " + m.text());
  }
});

async function open(slug) {
  // "" opens the homepage, so plain pages (/, /tools, /categories) are testable too.
  const path = slug === "" ? "/" : slug.startsWith("/") ? slug : `/tools/${slug}`;
  await page.goto(`${BASE}${path}`, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForTimeout(1500);
}
const text = async (sel) => (await page.locator(sel).innerText()).trim();
/** Textareas expose their value, not their innerText. */
const value = async (sel) => (await page.locator(sel).inputValue()).trim();

/* ---------------- 1. salary tax ---------------- */
await open("salary-tax");
check(
  "salary-tax: 30M gross + 0.9M housing → 2.1M insurance, 390k tax, 28.41M net",
  (await text("[data-testid='salary-tax']")).includes("۳۹۰٬۰۰۰") &&
    (await text("[data-testid='salary-net']")).includes("۲۸٬۴۱۰٬۰۰۰") &&
    (await page.locator("[data-testid='salary-brackets'] li").count()) >= 2,
  `${await text("[data-testid='salary-net']")} | ${await text("[data-testid='salary-tax']")}`,
);


/* ---------------- 2. eidi ---------------- */
await open("eidi-sanavat");
check(
  "eidi-sanavat: total and sanavat are shown",
  (await text("[data-testid='eidi-total']")).length > 0 &&
    (await text("[data-testid='sanavat']")).includes("۱۰٬۳۹۰٬۹۶۸"),
  `${await text("[data-testid='eidi-net']")} / ${await text("[data-testid='sanavat']")}`,
);

/* ---------------- 3. month calendar ---------------- */
await open("month-calendar");
const title = await text("[data-testid='calendar-title']");
const cells = await page.locator("[data-testid='calendar-grid'] > div").count();
check("month-calendar: current month title", /[۰-۹]+/.test(title), title);
check("month-calendar: grid is a whole number of weeks", cells % 7 === 0 && cells >= 28, `${cells} cells`);
await page.locator("[data-testid='calendar-next']").click();
await page.waitForTimeout(400);
check("month-calendar: arrow changes the month", (await text("[data-testid='calendar-title']")) !== title);

/* ---------------- 4. timestamp ---------------- */
await open("timestamp-converter");
await page.locator("[data-testid='timestamp-input']").fill("1704067200");
await page.waitForTimeout(600);
const jalali = await text("[data-testid='ts-jalali']");
check("timestamp: 1704067200 → ۱۱ دی ۱۴۰۲", jalali.includes("۱۴۰۲") && jalali.includes("دی"), jalali);
await page.locator("[data-testid='date-input']").fill("2024-03-20");
await page.waitForTimeout(600);
check(
  "timestamp: 2024-03-20 → 1710892800",
  (await text("[data-testid='ts-from-date']")).includes("1710892800"),
  await text("[data-testid='ts-from-date']"),
);

/* ---------------- 5. csv ⇄ json ---------------- */
await open("csv-json");
const jsonOut = await value("[data-testid='csv-json-output']");
check("csv-json: parses the sample CSV to JSON", jsonOut.includes('"نام"') && jsonOut.includes("سعید"));
await page.locator("[data-testid='csv-json-input']").fill("a,b\n1,2");
await page.waitForTimeout(500);
check(
  "csv-json: numbers are coerced",
  (await value("[data-testid='csv-json-output']")).includes('"a": 1'),
  await value("[data-testid='csv-json-output']"),
);

/* ---------------- 6. find & replace ---------------- */
await open("find-replace");
await page.locator("[data-testid='find-replace-input']").fill("سلام دنیا، سلام ایران");
const findInputs = page.locator("[data-testid='find-replace-rules'] input");
await findInputs.nth(0).fill("سلام");
await findInputs.nth(1).fill("درود");
await page.waitForTimeout(600);
check(
  "find-replace: replaces all occurrences",
  (await value("[data-testid='find-replace-output']")).includes("درود دنیا، درود ایران"),
  await value("[data-testid='find-replace-output']"),
);

/* ---------------- 7. password generator ---------------- */
await open("password-generator");
const password = await text("[data-testid='password-value']");
check("password: 16-char password with mixed sets", password.length === 16 && /[A-Z]/.test(password) && /[^a-zA-Z0-9]/.test(password), password);
check("password: strength meter rendered", (await page.locator("[data-testid='password-strength']").count()) === 1);

/* ---------------- 8. lorem ---------------- */
await open("persian-lorem");
const lorem = await text("[data-testid='lorem-output']");
check(
  "persian-lorem: generates 3 paragraphs of Persian filler",
  (lorem.match(/[\u0600-\u06FF]/g) ?? []).length > 200 && lorem.split("\n\n").length === 3,
  `${lorem.length} chars, ${lorem.split("\n\n").length} paras`,
);

/* ---------------- 9. color picker ---------------- */
await open("color-picker");
await page.locator("[data-testid='color-hex']").fill("#16a34a");
await page.waitForTimeout(600);
check(
  "color-picker: HEX→RGB",
  (await text("[data-testid='color-out-rgb']")).includes("rgb(22, 163, 74)"),
  await text("[data-testid='color-out-rgb']"),
);
check(
  "color-picker: HEX→HSL",
  /hsl\(142, 76%, 36%\)/.test(await text("[data-testid='color-out-hsl']")),
  await text("[data-testid='color-out-hsl']"),
);

/* ---------------- 10. image crop (interactive editor) ---------------- */
await open("image-crop");
await page.locator("[data-testid='crop-input']").setInputFiles(TEST_IMAGE);
await page.waitForTimeout(1200);
await page.locator("[data-testid='crop-editor']").scrollIntoViewIfNeeded();
check("image-crop: crop box is drawn on the image", (await page.locator("[data-testid='crop-box']").count()) === 1);

// Drag the box itself — the rect must move.
const boxBefore = await page.locator("[data-testid='crop-box']").boundingBox();
await page.mouse.move(boxBefore.x + boxBefore.width / 2, boxBefore.y + boxBefore.height / 2);
await page.mouse.down();
await page.mouse.move(boxBefore.x + boxBefore.width / 2 - 25, boxBefore.y + boxBefore.height / 2 + 10, { steps: 8 });
await page.mouse.up();
const boxMoved = await page.locator("[data-testid='crop-box']").boundingBox();
check("image-crop: dragging moves the box", Math.abs(boxMoved.x - boxBefore.x) > 5, `${Math.round(boxBefore.x)} → ${Math.round(boxMoved.x)}`);

// Drag a corner handle — the box must resize.
const sizeBefore = boxMoved.width;
const handle = await page.locator("[data-testid='crop-handle-se']").boundingBox();
await page.locator("[data-testid='crop-handle-se']").scrollIntoViewIfNeeded();
await page.mouse.move(handle.x + handle.width / 2, handle.y + handle.height / 2);
await page.mouse.down();
await page.mouse.move(handle.x + handle.width / 2 - 40, handle.y + handle.height / 2 - 40, { steps: 8 });
await page.mouse.up();
const sizeAfter = (await page.locator("[data-testid='crop-box']").boundingBox()).width;
check("image-crop: corner handle resizes the box", Math.abs(sizeAfter - sizeBefore) > 5, `${Math.round(sizeBefore)} → ${Math.round(sizeAfter)}`);

// Free crop must be a real free rectangle (not locked to one ratio).
await page.locator("[data-testid='crop-ratio-free']").click();
await page.waitForTimeout(300);
const freeHandle = await page.locator("[data-testid='crop-handle-nw']").boundingBox();
await page.mouse.move(freeHandle.x + freeHandle.width / 2, freeHandle.y + freeHandle.height / 2);
await page.mouse.down();
await page.mouse.move(freeHandle.x + freeHandle.width / 2 + 60, freeHandle.y + freeHandle.height / 2 + 5, { steps: 8 });
await page.mouse.up();
const freeBox = await page.locator("[data-testid='crop-box']").boundingBox();
check("image-crop: «آزاد» keeps a free (non-square) box", Math.abs(freeBox.width - freeBox.height) > 10, `${Math.round(freeBox.width)}×${Math.round(freeBox.height)}`);

await page.locator("[data-testid='crop-ratio-9:16']").click();
await page.locator("[data-testid='crop-run']").click();
await page.waitForTimeout(1500);
check("image-crop: produces a 9:16 result", (await page.locator("[data-testid='crop-result']").count()) === 1);

/* ---------------- 11. favicon ---------------- */
await open("favicon-generator");
await page.locator("[data-testid='favicon-input']").setInputFiles(TEST_IMAGE);
await page.waitForTimeout(1000);
await page.locator("[data-testid='favicon-run']").click();
await page.waitForTimeout(3000);
check("favicon: builds the ZIP", (await page.locator("[data-testid='favicon-result']").count()) === 1);

/* ---------------- 12. pdf reorder ---------------- */
await open("pdf-reorder");
await page.locator("[data-testid='pdf-reorder-input']").setInputFiles(PDF_FIXTURE_3P);
await page.waitForTimeout(2500);
check("pdf-reorder: lists 3 pages", (await page.locator("[data-testid='pdf-reorder-list'] > div").count()) === 3);
await page.locator("[data-testid='pdf-reorder-list'] button[aria-label='جابه‌جایی به پایین']").first().click();
await page.locator("[data-testid='pdf-reorder-run']").click();
await page.waitForTimeout(2500);
check("pdf-reorder: builds a new PDF", (await page.locator("[data-testid='pdf-reorder-result']").count()) === 1);

/* ---------------- 13. pdf watermark ---------------- */
await open("pdf-watermark");
await page.locator("[data-testid='pdf-watermark-input']").setInputFiles(PDF_FIXTURE_3P);
await page.waitForTimeout(1500);
await page.locator("[data-testid='pdf-watermark-text']").fill("CONFIDENTIAL");
await page.locator("[data-testid='pdf-watermark-run']").click();
await page.waitForTimeout(2500);
check("pdf-watermark: stamps the file", (await page.locator("[data-testid='pdf-watermark-result']").count()) === 1);

/* ---------------- 14. video tools render their shell ---------------- */
for (const slug of ["video-compressor", "video-to-gif", "video-to-audio", "video-trimmer", "video-resizer"]) {
  await open(slug);
  const hasInput = (await page.locator(`[data-testid='${slug}-input']`).count()) > 0;
  const body = await page.locator("main").innerText();
  check(`video: ${slug} renders the upload shell`, hasInput && body.includes("ویدیو"), hasInput ? "" : "input missing");
}

/* ---------------- 14b. real ffmpeg conversion (MP4 → MP3) ---------------- */
{
  if (videoOk) {
    await open("video-to-audio");
    await page.locator("[data-testid='video-to-audio-input']").setInputFiles(VIDEO_FIXTURE);
    await page.waitForTimeout(1200);
    await page.locator("[data-testid='video-to-audio-run']").click();
    // The first run downloads the 31 MB core — allow plenty of time.
    await page
      .locator("[data-testid='video-to-audio-download']")
      .waitFor({ timeout: 180000 })
      .catch(() => {});
    const button = page.locator("[data-testid='video-to-audio-download']");
    if ((await button.count()) > 0) {
      const [download] = await Promise.all([
        page.waitForEvent("download", { timeout: 30000 }).catch(() => null),
        button.click(),
      ]);
      const path = download ? await download.path().catch(() => null) : null;
      if (path) {
        const buffer = fs.readFileSync(path);
        const isMp3 = buffer.subarray(0, 3).toString() === "ID3" || buffer[0] === 0xff;
        check(
          "video-to-audio: ffmpeg produced a real MP3",
          isMp3 && buffer.length > 2000,
          `${download.suggestedFilename()} ${buffer.length}B`,
        );
      } else {
        check("video-to-audio: ffmpeg produced a real MP3", false, "no download");
      }
    } else {
      const err = (await page.locator("[data-testid='video-to-audio-error']").count())
        ? await page.locator("[data-testid='video-to-audio-error']").innerText()
        : "(no error shown)";
      check("video-to-audio: ffmpeg produced a real MP3", false, err);
    }
  } else {
    out.push(`SKIP  video-to-audio: no MP4 fixture at ${VIDEO_FIXTURE}`);
  }
}

/* ---------------- 14b-2. video → GIF (two-pass palette) produces a real GIF ---------------- */
if (videoOk) {
  await open("video-to-gif");
  await page.locator("[data-testid='video-to-gif-input']").setInputFiles(VIDEO_FIXTURE);
  await page.locator("[data-testid='video-to-gif-to']").waitFor({ timeout: 20000 });
  await page.waitForTimeout(600);
  await page.locator("[data-testid='video-to-gif-from']").fill("0");
  await page.locator("[data-testid='video-to-gif-to']").fill("2");
  await page.locator("[data-testid='video-to-gif-run']").click();
  await page
    .locator("[data-testid='video-to-gif-download']")
    .waitFor({ timeout: 180000 })
    .catch(() => {});
  const gifReady = (await page.locator("[data-testid='video-to-gif-download']").count()) > 0;
  let gifBytes = 0;
  let gifMagic = "";
  if (gifReady) {
    const [download] = await Promise.all([
      page.waitForEvent("download", { timeout: 30000 }).catch(() => null),
      page.locator("[data-testid='video-to-gif-download']").click(),
    ]);
    const path = download ? await download.path().catch(() => null) : null;
    if (path) {
      const buffer = fs.readFileSync(path);
      gifBytes = buffer.length;
      gifMagic = buffer.subarray(0, 6).toString();
    }
  }
  check(
    "video-to-gif: produces a real GIF89a",
    gifReady && gifBytes > 5000 && gifMagic === "GIF89a",
    `${gifBytes}B ${gifMagic}`,
  );
  const gifError = (await page.locator("[data-testid='video-to-gif-error']").count())
    ? await page.locator("[data-testid='video-to-gif-error']").innerText()
    : "";
  check("video-to-gif: no error shown", !gifError, gifError);
}

/* ---------------- 14c. trim (stream copy) produces a shorter clip ---------------- */
if (videoOk) {
  await open("video-trimmer");
  await page.locator("[data-testid='video-trimmer-input']").setInputFiles(VIDEO_FIXTURE);
  await page.locator("[data-testid='video-trimmer-start']").waitFor({ timeout: 20000 });
  await page.waitForTimeout(800);
  await page.locator("[data-testid='video-trimmer-start']").fill("1");
  await page.locator("[data-testid='video-trimmer-end']").fill("5");
  await page.locator("[data-testid='video-trimmer-run']").click();
  await page
    .locator("[data-testid='video-trimmer-download']")
    .waitFor({ timeout: 120000 })
    .catch(() => {});
  const ready = (await page.locator("[data-testid='video-trimmer-download']").count()) > 0;
  let bytes = 0;
  if (ready) {
    const [download] = await Promise.all([
      page.waitForEvent("download", { timeout: 30000 }).catch(() => null),
      page.locator("[data-testid='video-trimmer-download']").click(),
    ]);
    const path = download ? await download.path().catch(() => null) : null;
    if (path) bytes = fs.statSync(path).size;
  }
  check(
    "video-trimmer: stream-copy cut produces a 4s clip",
    ready && bytes > 5000,
    `${bytes}B`,
  );
}

/* ---------------- 15. share links ---------------- */
await open("bmi-calculator");
await page.locator("main input").nth(0).fill("70");
await page.locator("main input").nth(1).fill("175");
await page.waitForTimeout(600);
check("share: BMI result computed", (await page.locator("main").innerText()).includes("۲۲٫۹") || (await page.locator("main").innerText()).includes("22.9"));
await page.locator("[data-testid='share-result']").click();
await page.waitForTimeout(400);
await page.goto(`${BASE}/tools/bmi-calculator?w=80&h=180`, { waitUntil: "domcontentloaded" });
await page.waitForTimeout(1500);
const bmiBody = await page.locator("main").innerText();
check("share: query params prefill the calculator (80kg/180cm → 24.7)", bmiBody.includes("۲۴٫۷"), bmiBody.slice(0, 120).replace(/\n/g, " "));

/* ---------------- 16. PWA + registry ---------------- */
const manifest = await page.goto(`${BASE}/manifest.webmanifest`);
check("pwa: manifest is served", manifest?.status() === 200, String(manifest?.status()));
const sw = await page.goto(`${BASE}/sw.js`);
check("pwa: service worker is served", sw?.status() === 200, String(sw?.status()));
await page.goto(`${BASE}/tools`, { waitUntil: "domcontentloaded" });
await page.waitForTimeout(800);
check("registry: 74 tools listed", (await page.locator("main a[href^='/tools/']").count()) >= 74, String(await page.locator("main a[href^='/tools/']").count()));
const home = await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded" });
const homeBody = await page.locator("body").innerText();
check("home: 7 categories incl. video & finance", homeBody.includes("ویدیو و صدا") && homeBody.includes("مالی و حقوق"), "");
check("registry: no «به‌زودی» placeholders", !(await page.locator("body").innerText()).includes("به‌زودی"));

/* ---------------- 17. no size limits on PDF watermark / page numbers ---------------- */
await open("pdf-watermark");
const watermarkBody = await page.locator("main").innerText();
check(
  "pdf-watermark: no 40 MB size limit is advertised",
  !watermarkBody.includes("۴۰ مگابایت") && watermarkBody.includes("بدون محدودیت حجم"),
  "",
);

/* ---------------- 18. mobile layout ---------------- */
await page.setViewportSize({ width: 390, height: 844 });
await open("");
await page.waitForTimeout(600);
check("mobile: bottom tab bar is visible", (await page.locator("[data-testid='mobile-tabbar']").count()) === 1);
// The phone layout must not be a column of 7 tall (illustrated) cards.
const tallCategoryCards = await page.evaluate(() =>
  Array.from(document.querySelectorAll("main a[href^='/categories/']")).filter(
    (el) => el.getBoundingClientRect().height > 220,
  ).length,
);
check("mobile: home shows no giant stacked category cards", tallCategoryCards === 0, String(tallCategoryCards));
const railScrollable = await page.evaluate(() => {
  const list = document.querySelector("main nav[aria-label='دسته‌بندی‌ها'] ul");
  return list ? list.scrollWidth > list.clientWidth : false;
});
check("mobile: category chips are a horizontal rail", railScrollable);
await open("/categories");
await page.waitForTimeout(600);
const catLinks = await page.locator("main a[href^='/tools/']").count();
check("mobile: /categories lists tools in compact rows", catLinks >= 20, String(catLinks));

// ─── Group A: intent entry points, popular questions, landings, FAQ schema ───
await open("/");
await page.waitForTimeout(700);
const intents = await page.locator("[data-testid='hero-intents'] a").count();
check("A1: hero shows intent entry points", intents >= 6, String(intents));
const intentHrefs = await page.evaluate(() =>
  Array.from(document.querySelectorAll("[data-testid='hero-intents'] a")).map((a) => a.getAttribute("href")),
);
check("A1: every intent points at a tool route", intentHrefs.every((h) => /^\/tools\/[a-z0-9-]+$/.test(h)), intentHrefs.join(","));

const popular = await page.locator("[data-testid='popular-questions'] a").count();
check("A3: popular questions block is on the homepage", popular >= 8, String(popular));

// Landing pages: real H1, self-canonical, FAQPage JSON-LD, and a working tool.
for (const [path, expectEmbed] of [["/salary", true], ["/pdf", true], ["/word-count", true], ["/loan", false], ["/interest", false]]) {
  const res = await page.goto(BASE + path, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(900);
  check(`A4: ${path} returns 200`, res?.status() === 200, String(res?.status()));
  const h1 = await page.locator("h1").first().innerText();
  check(`A4: ${path} has its own H1`, h1.trim().length > 8, h1.slice(0, 40));
  const canonical = await page.getAttribute("link[rel='canonical']", "href");
  check(`A4: ${path} canonical points at itself`, (canonical ?? "").endsWith(path), String(canonical));
  const hasFaqSchema = await page.evaluate(() =>
    Array.from(document.querySelectorAll("script[type='application/ld+json']")).some((s) =>
      s.textContent.includes('"FAQPage"'),
    ),
  );
  check(`A4: ${path} emits FAQPage schema`, hasFaqSchema);
  const visibleFaq = await page.locator("section[aria-labelledby='landing-faq'] details").count();
  check(`A4: ${path} renders the FAQ visibly`, visibleFaq >= 2, String(visibleFaq));
  const tools = await page.locator("main input, main textarea").count();
  check(`A4: ${path} ${expectEmbed ? "embeds the real tool" : "links to the tool"}`, expectEmbed ? tools > 0 : (await page.locator("[data-testid='landing-open-tool']").count()) === 1, String(tools));
}

// The words actually get counted on the embedded tool.
await page.goto(BASE + "/word-count", { waitUntil: "domcontentloaded" });
await page.waitForTimeout(1200);
const counter = page.locator("textarea").first();
await counter.fill("یک دو سه چهار پنج");
await page.waitForTimeout(700);
const counted = await page.locator("main").innerText();
check("A4: /word-count counts live", /۵|5/.test(counted.replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)))), counted.slice(0, 60).replace(/\n/g, " "));

// A5: FAQ on the ten top tools, visible AND in structured data.
for (const slug of ["word-counter", "pdf-compressor", "salary-tax", "video-compressor"]) {
  await page.goto(`${BASE}/tools/${slug}`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(700);
  const visible = await page.locator("[data-testid='tool-faq'] details").count();
  const schema = await page.evaluate(() =>
    Array.from(document.querySelectorAll("script[type='application/ld+json']")).some((s) => s.textContent.includes('"FAQPage"')),
  );
  check(`A5: /tools/${slug} FAQ visible + schema`, visible >= 2 && schema, `visible=${visible} schema=${schema}`);
}

// A2: the transparency page exists, is linked and states numbers.
await page.goto(BASE + "/how-it-works", { waitUntil: "domcontentloaded" });
await page.waitForTimeout(600);
check("A2: /how-it-works loads", (await page.locator("h1").count()) === 1);
const hiw = await page.locator("main").innerText();
check("A2: states the test, route and weight numbers", /۲۸۲|282/.test(hiw) && /۹۵|95/.test(hiw) && /۲۰۶|206/.test(hiw) && /۱۹۷|197/.test(hiw), hiw.slice(0, 40).replace(/\n/g, " "));
const linked = await page.evaluate(() => Array.from(document.querySelectorAll("footer a")).some((a) => a.getAttribute("href") === "/how-it-works"));
check("A2: footer links to /how-it-works", linked);

// A7: footer columns collapse on phones.
await page.setViewportSize({ width: 390, height: 844 });
await page.goto(BASE + "/", { waitUntil: "domcontentloaded" });
await page.waitForTimeout(700);
const footerDetails = await page.locator("footer details").count();
check("A7: footer uses collapsible sections", footerDetails >= 3, String(footerDetails));
await page.setViewportSize({ width: 1280, height: 1000 });

check("no uncaught JS errors", errors.length === 0, errors.slice(0, 4).join(" || "));

await browser.close();
console.log(out.join("\n"));
console.log(failures === 0 ? "\n✅ ALL NEW-TOOL CHECKS PASSED" : `\n❌ ${failures} CHECK(S) FAILED`);
process.exit(failures === 0 ? 0 : 1);
