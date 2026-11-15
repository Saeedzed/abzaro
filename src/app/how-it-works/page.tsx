import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  Cpu,
  Database,
  FileCode2,
  Gauge,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import { Container } from "@/components/layout/Container";
import { Breadcrumbs } from "@/components/seo/Breadcrumbs";
import { toPersianDigits } from "@/lib/persian";
import { siteConfig } from "@/config/site";
import { tools } from "@/data/tools";

export const metadata: Metadata = {
  title: "ابزارها چطور کار می‌کنند؟ (شفافیت فنی)",
  description:
    "همهٔ ابزارهای ابزارو در مرورگر شما اجرا می‌شوند. این صفحه دقیقاً می‌گوید هر ابزار با کدام کتابخانه کار می‌کند، چه چیزی به سرور می‌رود (هیچ‌چیز) و سایت چقدر سنگین است — با عدد، نه شعار.",
  alternates: { canonical: "/how-it-works" },
  openGraph: {
    type: "article",
    locale: siteConfig.locale,
    url: `${siteConfig.url}/how-it-works`,
    siteName: siteConfig.name,
    title: `ابزارها چطور کار می‌کنند؟ | ${siteConfig.name}`,
    description: "شفافیت فنی: کتابخانه‌ها، محل اجرا و حجم واقعی صفحه‌ها.",
  },
};

interface Engine {
  /** Tools this row covers. */
  tools: string;
  lib: string;
  where: string;
  note: string;
}

const ENGINES: Engine[] = [
  {
    tools: "PDF (ادغام، تقسیم، چرخش، حذف صفحه، مرتب‌سازی، شماره/واترمارک، عکس→PDF)",
    lib: "pdf-lib",
    where: "مرورگر",
    note: "ساخت و ویرایش فایل PDF بدون هیچ درخواست شبکه.",
  },
  {
    tools: "PDF → عکس، پیش‌نمایش صفحات",
    lib: "pdf.js (pdfjs-dist)",
    where: "مرورگر",
    note: "رندر روی canvas؛ فایل به worker محلی می‌رود، نه به سرور.",
  },
  {
    tools: "ویدیو: فشرده‌سازی، GIF، MP3، برش، رزولوشن",
    lib: "ffmpeg.wasm 5.1.4 (هستهٔ single-threaded)",
    where: "مرورگر (WebAssembly)",
    note: "هستهٔ ۳۱ مگابایتی از دامنهٔ خودمان سرو می‌شود؛ ورودی با WORKERFS mount می‌شود تا فایل دوبار در حافظه کپی نشود.",
  },
  {
    tools: "تصاویر: تغییر اندازه، فشرده‌سازی، برش، قالب، پروفایل",
    lib: "Canvas 2D + createImageBitmap",
    where: "مرورگر",
    note: "بدون کتابخانهٔ واسط؛ خروجی از بیت‌مپ اصلی رندر می‌شود.",
  },
  {
    tools: "HEIC → JPG",
    lib: "heic2any",
    where: "مرورگر",
    note: "تنها کتابخانهٔ سنگین تصویر؛ فقط در همان صفحه و به‌صورت تنبل بارگذاری می‌شود.",
  },
  {
    tools: "favicon، ZIP خروجی",
    lib: "JSZip",
    where: "مرورگر",
    note: "بسته‌بندی آیکون‌ها در حافظهٔ مرورگر.",
  },
  {
    tools: "QR Code",
    lib: "qrcode",
    where: "مرورگر",
    note: "رسم روی canvas، بدون سرویس بیرونی.",
  },
  {
    tools: "هش، UUID، رمز عبور، JWT",
    lib: "Web Crypto API (SubtleCrypto) + crypto.getRandomValues",
    where: "مرورگر",
    note: "الگوریتم‌های بومی مرورگر؛ رمز عبور با CSPRNG تولید می‌شود.",
  },
  {
    tools: "محاسبات، تاریخ، متن، واحدها",
    lib: "کد خودمان (TypeScript خالص)",
    where: "مرورگر",
    note: "بدون وابستگی؛ کل منطق در src/lib و پوشیده با تست واحد است.",
  },
];

const NUMBERS = [
  { label: "تست واحد", value: "۲۸۲", hint: "node:test روی منطق خالص و یکپارچگی داده‌ها" },
  { label: "تست مرورگری واقعی", value: "۲۰۱", hint: "Playwright؛ همه با کد ۲۰۰" },
  { label: "مسیر بررسی‌شده", value: "۹۵", hint: "شامل پنج مسیر کوتاه و صفحهٔ مقایسه" },
  { label: "ابزار فعال", value: toPersianDigits(tools.length), hint: "بدون هیچ «به‌زودی»" },
];

/** Route and test counts are regenerated in CI check below — see scripts/check-routes.mjs. */

/**
 * Measured with a fresh Chrome profile against the production build, summing the
 * `transferSize` of every .js resource after paint. Reproduce it yourself:
 * DevTools → Network → hard reload → sum the JS column. The «قبل» column is the
 * same measurement on the previous release, kept here on purpose — a number you
 * can't compare is just a brag.
 */
const PAGE_WEIGHTS = [
  { page: "صفحهٔ اصلی", before: "~۴۳۴ کیلوبایت", now: "~۲۰۶ کیلوبایت", saved: "−۵۳٪" },
  { page: "فهرست ابزارها", before: "~۴۳۵ کیلوبایت", now: "~۲۰۶ کیلوبایت", saved: "−۵۳٪" },
  { page: "یک ابزار متنی", before: "~۲۵۰ کیلوبایت", now: "~۱۹۷ کیلوبایت", saved: "−۲۱٪" },
  { page: "ابزار ویدیو (بدون هسته)", before: "~۲۵۶ کیلوبایت", now: "~۲۰۶ کیلوبایت", saved: "−۲۰٪" },
];

export default function HowItWorksPage() {
  return (
    <Container className="py-6 sm:py-12">
      <Breadcrumbs
        items={[{ label: "خانه", href: "/" }, { label: "ابزارها چطور کار می‌کنند؟" }]}
      />

      <header className="mt-4 max-w-3xl sm:mt-6">
        <p className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1 text-[11px] font-bold text-brand-700">
          <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
          شفافیت فنی
        </p>
        <h1 className="mt-3 text-xl font-extrabold text-ink-900 sm:text-3xl">
          ابزارها چطور کار می‌کنند؟
        </h1>
        <p className="mt-2 text-xs leading-7 text-ink-600 sm:text-base sm:leading-8">
          ادعای «همه‌چیز در مرورگر شما انجام می‌شود» آسان است؛ اثباتش سخت.
          این صفحه دقیقاً می‌گوید هر ابزار با کدام کتابخانه اجرا می‌شود، چه چیزی
          از دستگاه شما خارج می‌شود، و صفحات سایت چقدر حجم دارند — با عدد.
        </p>
      </header>

      {/* The one-line answer */}
      <section
        className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 sm:mt-8 sm:p-6"
        aria-labelledby="no-upload"
      >
        <h2 id="no-upload" className="flex items-center gap-2 text-base font-extrabold text-emerald-900">
          <Database className="h-4 w-4" aria-hidden="true" />
          چه چیزی به سرور ما می‌رود؟
        </h2>
        <p className="mt-2 text-sm font-bold text-emerald-800">
          هیچ‌چیز. نه فایل، نه متن، نه تصویر، نه ویدیو.
        </p>
        <ul className="mt-3 grid gap-2 text-xs leading-6 text-emerald-900 sm:grid-cols-2 sm:text-[13px]">
          {[
            "فایل‌ها فقط در حافظهٔ مرورگر باز می‌شوند و با بستن تب پاک می‌شوند.",
            "هیچ حساب کاربری، کوکی تحلیلی یا ردیاب شخص ثالث نداریم.",
            "سایت با هیچ API بیرونی برای پردازش داده صحبت نمی‌کند.",
            "حتی وقتی آفلاین باشید، ابزارهای متنی و تصویری کار می‌کنند (PWA).",
          ].map((item) => (
            <li key={item} className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" aria-hidden="true" />
              {item}
            </li>
          ))}
        </ul>
      </section>

      {/* Engine table */}
      <section className="mt-8" aria-labelledby="engines-heading">
        <h2 id="engines-heading" className="flex items-center gap-2 text-base font-extrabold text-ink-900 sm:text-lg">
          <FileCode2 className="h-4 w-4 text-brand-600" aria-hidden="true" />
          کدام ابزار، کدام کتابخانه، کجا اجرا می‌شود
        </h2>

        {/* Mobile: stacked cards. Desktop: table. */}
        <ul className="mt-3 space-y-2 sm:hidden">
          {ENGINES.map((engine) => (
            <li key={engine.lib} className="rounded-xl border border-ink-200 bg-white p-3 shadow-card">
              <p className="text-[13px] font-bold leading-6 text-ink-900">{engine.tools}</p>
              <p className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px]">
                <code className="rounded bg-ink-100 px-1.5 py-0.5 font-mono text-[10px] text-ink-700" dir="ltr">
                  {engine.lib}
                </code>
                <span className="rounded-full bg-emerald-50 px-2 py-0.5 font-semibold text-emerald-700">
                  {engine.where}
                </span>
              </p>
              <p className="mt-1.5 text-[11px] leading-6 text-ink-500">{engine.note}</p>
            </li>
          ))}
        </ul>

        <div className="mt-3 hidden overflow-hidden rounded-2xl border border-ink-200 bg-white shadow-card sm:block">
          <table className="w-full text-start text-sm">
            <thead className="bg-ink-50 text-[11px] uppercase tracking-wide text-ink-500">
              <tr>
                <th className="px-4 py-2.5 text-start font-bold">ابزار</th>
                <th className="px-4 py-2.5 text-start font-bold">کتابخانه</th>
                <th className="px-4 py-2.5 text-start font-bold">محل اجرا</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {ENGINES.map((engine) => (
                <tr key={engine.lib} className="align-top">
                  <td className="px-4 py-3 text-[13px] leading-6 text-ink-800">
                    {engine.tools}
                    <span className="mt-1 block text-[11px] leading-5 text-ink-500">{engine.note}</span>
                  </td>
                  <td className="px-4 py-3">
                    <code className="rounded bg-ink-100 px-1.5 py-0.5 font-mono text-[11px] text-ink-700" dir="ltr">
                      {engine.lib}
                    </code>
                  </td>
                  <td className="px-4 py-3 text-[12px] font-semibold text-emerald-700">{engine.where}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Numbers */}
      <section className="mt-8" aria-labelledby="numbers-heading">
        <h2 id="numbers-heading" className="flex items-center gap-2 text-base font-extrabold text-ink-900 sm:text-lg">
          <CheckCircle2 className="h-4 w-4 text-brand-600" aria-hidden="true" />
          اعدادی که می‌توانید بازتولید کنید
        </h2>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {NUMBERS.map((item) => (
            <div key={item.label} className="rounded-xl border border-ink-200 bg-white p-3 text-center shadow-card">
              <p className="text-xl font-extrabold text-brand-700">{item.value}</p>
              <p className="mt-0.5 text-[11px] font-bold text-ink-800">{item.label}</p>
              <p className="mt-1 text-[10px] leading-4 text-ink-400">{item.hint}</p>
            </div>
          ))}
        </div>
        <p className="mt-2 text-[11px] leading-6 text-ink-500">
          تست‌ها با <code className="font-mono" dir="ltr">npm test</code> و{" "}
          <code className="font-mono" dir="ltr">node scripts/e2e-all-tools.mjs</code> اجرا
          می‌شوند؛ هر دو در مخزن پروژه هستند.
        </p>
      </section>

      {/* Weight */}
      <section className="mt-8" aria-labelledby="weight-heading">
        <h2 id="weight-heading" className="flex items-center gap-2 text-base font-extrabold text-ink-900 sm:text-lg">
          <Gauge className="h-4 w-4 text-brand-600" aria-hidden="true" />
          هر صفحه چقدر سنگین است
        </h2>
        <p className="mt-1 text-[11px] leading-6 text-ink-500">
          اندازه‌گیری‌شده روی بیلد پروداکشن، با gzip — همان چیزی که مرورگر دانلود
          می‌کند. بازتولیدش ساده است: DevTools → Network → بازگشایی سخت صفحه → جمع
          ستون JS.
        </p>
        <p className="mt-1 text-[11px] leading-6 text-ink-500">
          هر ابزار کد خودش را جدا دانلود می‌کند؛ باز کردن یک ابزار متنی، بستهٔ PDF یا
          ویدیو را به صفحه اضافه نمی‌کند.
        </p>
        <div className="mt-3 overflow-hidden rounded-2xl border border-ink-200 bg-white shadow-card">
          <table className="w-full text-sm">
            <thead className="bg-ink-50 text-[11px] text-ink-500">
              <tr>
                <th className="px-3 py-2.5 text-start font-bold">صفحه</th>
                <th className="px-3 py-2.5 text-start font-bold">قبل</th>
                <th className="px-3 py-2.5 text-start font-bold">حالا</th>
                <th className="px-3 py-2.5 text-start font-bold">تغییر</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {PAGE_WEIGHTS.map((row) => (
                <tr key={row.page}>
                  <td className="px-3 py-2.5 text-[12px] text-ink-800">{row.page}</td>
                  <td className="px-3 py-2.5 text-[12px] text-ink-400" dir="auto">{row.before}</td>
                  <td className="px-3 py-2.5 text-[12px] font-bold text-ink-800" dir="auto">{row.now}</td>
                  <td className="px-3 py-2.5 text-[12px] font-bold text-emerald-600" dir="auto">{row.saved}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-[11px] leading-6 text-ink-500">
          این کاهش از یک تغییر ساختاری می‌آید: قبلاً هر صفحه کدِ هر ۵۶ ابزار را در یک
          بستهٔ مشترک دانلود می‌کرد. حالا هر ابزار فقط کد خودش را می‌گیرد (CSS حدود
          ۲۷ کیلوبایت است و تغییر نکرده).
        </p>
        <p className="mt-2 text-[11px] leading-6 text-ink-500">
          فقط ابزار ویدیو هستهٔ ۳۱ مگابایتی ffmpeg را روی تقاضا دانلود می‌کند و همان
          یک‌بار با کش ۳۰ روزه ذخیره می‌شود. هیچ ابزار دیگری این بار را ندارد.
        </p>
      </section>

      {/* What we deliberately do NOT do */}
      <section className="mt-8" aria-labelledby="limits-heading">
        <h2 id="limits-heading" className="flex items-center gap-2 text-base font-extrabold text-ink-900 sm:text-lg">
          <XCircle className="h-4 w-4 text-rose-500" aria-hidden="true" />
          چه کارهایی را عمداً انجام نمی‌دهیم
        </h2>
        <ul className="mt-3 space-y-2 text-xs leading-6 text-ink-700 sm:text-[13px]">
          <li className="rounded-xl border border-ink-200 bg-white px-3 py-2.5 shadow-card">
            <strong className="text-ink-900">Word ⇄ PDF محلی:</strong> بدون موتور سنگین
            در مرورگر قابل انجام نیست. ترجیح می‌دهیم چنین ابزاری نداشته باشیم تا ادعای
            محلی بودنش را بکنیم و در واقع فایل شما را جایی بفرستیم.
          </li>
          <li className="rounded-xl border border-ink-200 bg-white px-3 py-2.5 shadow-card">
            <strong className="text-ink-900">«بدون محدودیت حجم» برای پردازش سنگین:</strong>{" "}
            مرورگر به حافظهٔ دستگاه محدود است. به‌جای شعار، سقف واقعی را نشان می‌دهیم و
            برای فایل‌های بزرگ هشدار حافظه و دکمهٔ «لغو پردازش» می‌دهیم.
          </li>
          <li className="rounded-xl border border-ink-200 bg-white px-3 py-2.5 shadow-card">
            <strong className="text-ink-900">واترمارک و اعتبار:</strong> خروجی هیچ ابزاری
            واترمارک ندارد و برای استفادهٔ کامل هیچ پرداختی لازم نیست.
          </li>
          <li className="rounded-xl border border-ink-200 bg-white px-3 py-2.5 shadow-card">
            <strong className="text-ink-900">نظر کاربران ساختگی:</strong> هیچ نظر یا امتیازی
            در سایت نمایش نمی‌دهیم مگر آن‌که قابل بررسی باشد.
          </li>
        </ul>
      </section>

      <div className="mt-8 flex flex-wrap items-center gap-3">
        <Link
          href="/tools"
          className="flex min-h-11 items-center gap-2 rounded-xl bg-brand-600 px-4 text-sm font-bold text-white shadow-card transition hover:bg-brand-700"
        >
          رفتن به ابزارها
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        </Link>
        <Link
          href="/privacy"
          className="flex min-h-11 items-center gap-2 rounded-xl border border-ink-200 bg-white px-4 text-sm font-semibold text-ink-700 transition hover:border-brand-300"
        >
          سیاست حریم خصوصی
        </Link>
        <span className="flex items-center gap-1.5 text-[11px] text-ink-400">
          <Cpu className="h-3.5 w-3.5" aria-hidden="true" />
          همهٔ پردازش‌ها روی {toPersianDigits(tools.length)} ابزار، در دستگاه خودتان
        </span>
      </div>
    </Container>
  );
}
