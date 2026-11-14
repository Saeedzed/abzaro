# دیپلوی روی Netlify

پروژه برای Netlify کامل آماده است. چون گفتید **هنوز تغییرات دارید**، روش‌ها را از
«بهترین برای تغییرات» به «سریع‌ترین» مرتب کرده‌ام.

فایل‌های آماده‌شده:

| فایل | کار |
| --- | --- |
| `netlify.toml` | تنظیمات بیلد، پلاگین Next.js، هدرها و کش |
| `.gitignore` | جلوگیری از commit شدن `.next`، `.env.production`، `.netlify` |
| `abzaro-static.zip` (۹۰۱ کیلوبایت) | خروجی استاتیک آمادهٔ آپلود دستی |
| `scripts/package-static.mjs` | ساخت دوبارهٔ zip بعد از هر تغییر |

---

## روش ۱ — GitHub + Netlify (توصیه‌شده برای شما)

چون تغییرات زیاد دارید، این روش را انتخاب کنید: هر `git push` خودکار دیپلوی می‌شود.

**گام ۱ — یک repo در GitHub بسازید** (خالی، بدون README)، مثلاً `abzaro`.

**گام ۲ — کد را push کنید:**

```bash
cd abzaro
git init
git add .
git commit -m "ابزارو: MVP با ۱۰ ابزار"
git branch -M main
git remote add origin https://github.com/USERNAME/abzaro.git
git push -u origin main
```

**گام ۳ — Netlify را وصل کنید:** [app.netlify.com](https://app.netlify.com) →
`Add new site` → `Import an existing project` → GitHub → repo را انتخاب کنید.

تنظیمات به‌صورت خودکار از `netlify.toml` خوانده می‌شوند:
- **Build command:** `npm run build`
- **Publish directory:** `.next`
- **Node:** ۲۰

**گام ۴ — متغیر محیطی:** در `Site configuration → Environment variables` این را اضافه کنید:

```
NEXT_PUBLIC_SITE_URL = https://YOUR-SITE.netlify.app
```

> ⚠️ **این متغیر را فراموش نکنید.** چون `Header` و `ContactForm` کامپوننت کلاینتی
> هستند و `siteConfig` را import می‌کنند، مقدارش باید **در زمان build** موجود باشد.
> اگر نباشد، canonical و sitemap روی `https://abzaro.ir` (مقدار پیش‌فرض) می‌مانند.

از این به بعد هر `git push` روی `main` خودکار منتشر می‌شود و هر Pull Request یک
**Deploy Preview** جداگانه می‌گیرد.

---

## روش ۲ — آپلود فایل zip (سریع، بدون toolchain)

فایل `abzaro-static.zip` را در [app.netlify.com/drop](https://app.netlify.com/drop)
رها کنید. همین. سایت در حدود ۱۰ ثانیه بالا می‌آید.

**بدون هیچ بیلد و بدون تنظیمات** — فقط فایل‌های ایستا در zip هستند.

بعد از هر تغییر، zip را دوباره بسازید و آپلود کنید:

```bash
npm run package:static
```

یا با دامنهٔ دلخواه:

```bash
NEXT_PUBLIC_SITE_URL="https://abzaro.ir" npm run package:static
```

> **تفاوت با روش ۱:** سایت استاتیک است. برای این پروژه تفاوتی ندارد (هیچ صفحه‌ای به
> request نیاز ندارد)، اما هدرهایی که در `netlify.toml` تعریف شده‌اند روی آپلود دستی
> اعمال **نمی‌شوند** — Netlify Drop فقط فایل‌ها را آپلود می‌کند.

---

## روش ۳ — Netlify CLI (برای وقتی توکن دارید)

```bash
npx netlify login            # یک‌بار، در مرورگر
npx netlify init             # یا: npx netlify link
npx netlify deploy --build --prod
```

`netlify build` و `netlify serve` را در همان محیط این پروژه تست کرده‌ام و کار
می‌کنند (Next.js Runtime v5.16.7).

---

## دامنهٔ اختصاصی

1. در Netlify: `Domain management → Add a domain` → `abzaro.ir`
2. در پنل DNS دامنه، رکوردها را روی Netlify تنظیم کنید (Netlify راهنمای دقیق می‌دهد)
3. متغیر `NEXT_PUBLIC_SITE_URL` را به `https://abzaro.ir` تغییر دهید و **دوباره دیپلوی کنید**

> ترتیب مهم است: اگر فقط متغیر را عوض کنید بدون بیلد دوباره، canonical و sitemap
> قدیمی می‌مانند.

---

## نتیجهٔ تست‌های انجام‌شده روی محیط Netlify

| محیط | نتیجه |
| --- | --- |
| `netlify build --offline` (Next.js Runtime v5.16.7) | ✅ بیلد کامل، serverless function ساخته شد |
| `netlify serve` (سرو مثل Netlify) | ✅ ۳۲ از ۳۲ سنجه، ۱۰ ابزار |
| خروجی استاتیک (`ABZARO_EXPORT=1`) | ✅ ۳۲ از ۳۲ سنجه |
| محتوای `abzaro-static.zip` (بازشده و سرو‌شده) | ✅ ۳۲ از ۳۲ سنجه |
| ۴۰۴ برای مسیر ناموجود | ✅ |

---

## نکته‌های فنی که به کارتان می‌آید

**دو حالت بیلد وجود دارد.** به‌صورت پیش‌فرض بیلد سروری (`.next` + serverless function)
ساخته می‌شود که Netlify از آن استفاده می‌کند. با `ABZARO_EXPORT=1` خروجی کاملاً استاتیک
(`out/`) ساخته می‌شود. در حالت استاتیک `trailingSlash: true` فعال می‌شود تا مسیرها به
صورت `path/index.html` تولید شوند و روی هر هاست ساده‌ای کار کنند.

**`robots.ts` و `sitemap.ts` هر دو `export const dynamic = "force-static"` دارند** — بدون
این، حالت `output: "export"` با خطا شکست می‌خورد.

**پلاگین Next.js را pin کرده‌ام** (`@netlify/plugin-nextjs@^5.16.7`) تا بیلد تکرارپذیر
باشد. Netlify به‌طور پیش‌فرض خودش نصبش می‌کند، ولی pin کردن یعنی نسخهٔ ناگهانی عوض نمی‌شود.

**`.env.production` را در `.gitignore` گذاشته‌ام** چون آدرس تونل موقت داخلش بود. مقدار
واقعی را در پنل Netlify تنظیم کنید، نه در فایل.
