import { chromium } from "playwright-core";
const U = process.env.BASE_URL ?? "http://localhost:8888";
const b = await chromium.launch({ args: ["--no-sandbox"] });
const p = await b.newPage();
await p.goto(`${U}/tools/word-counter`, { waitUntil: "domcontentloaded" });
await p.waitForTimeout(2500);
const ta = p.locator("main textarea").first();
await ta.fill("سلام دنیا! این یک متن آزمایشی است. می‌خواهم کلمات را بشمارم.");
for (const wait of [500, 1500, 3000]) {
  await p.waitForTimeout(wait);
  const t = await p.locator("main").innerText();
  const nums = t.split("\n").filter(l => /^[۰-۹0-9,٬]+$/.test(l.trim())).slice(0, 8).join(" ");
  console.log(`after +${wait}ms -> [${nums}]`);
}
await b.close();
