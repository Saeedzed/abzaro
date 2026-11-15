import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Check, Info, Minus } from "lucide-react";
import { Container } from "@/components/layout/Container";
import { Breadcrumbs } from "@/components/seo/Breadcrumbs";
import { tools } from "@/data/tools";
import { categories } from "@/data/categories";
import { siteConfig } from "@/config/site";
import { toPersianDigits } from "@/lib/persian";

/**
 * «ابزارو در برابر بقیه» — a comparison page that only makes claims we can
 * back up.
 *
 * Two rules, both deliberate:
 *  1. Our own numbers are measured (see /how-it-works, which shows the method).
 *  2. The competitor column contains only things they publish themselves or
 *     that are visible on their site. Where we have not measured something,
 *     the cell is «نامشخص» — not a guess dressed up as a number.
 */

export const metadata: Metadata = {
  title: "مقایسهٔ ابزارو با سایت‌های مشابه",
  description:
    "مقایسهٔ شفاف ابزارو با ابزارهای مشابه فارسی: پردازش محلی، حجم صفحه، تعداد ابزار و آنچه انجام نمی‌دهیم — با روش اندازه‌گیری قابل بازتولید.",
  alternates: { canonical: "/compare" },
};

interface Row {
  label: string;
  ours: string;
  theirs: string;
  /** true = a clear win, false = we are behind, "same" = a tie. */
  verdict: "win" | "behind" | "same" | "unknown";
  detail: string;
}

const ROWS: Row[] = [
  {
    label: "پردازش فایل در مرورگر",
    ours: "همهٔ ابزارها، بدون استثنا",
    theirs: "بخشی از ابزارها؛ برای برخی، آپلود لازم است",
    verdict: "win",
    detail:
      "هر ابزار ابزارو با کتابخانه‌های سمت کلاینت اجرا می‌شود. فهرست کامل موتورها در صفحهٔ «چطور کار می‌کند؟» آمده و کدش قابل بررسی است.",
  },
  {
    label: "حجم جاوااسکریپت صفحهٔ اصلی",
    ours: "~۲۰۶ کیلوبایت (gzip)",
    theirs: "نامشخص — اندازه‌گیری نشده",
    verdict: "unknown",
    detail:
      "عدد خودمان با DevTools روی بیلد پروداکشن اندازه‌گیری شده و روشش قابل بازتولید است. عدد رقیب را منتشر نمی‌کنیم چون خودمان اندازه‌گیری‌اش نکرده‌ایم.",
  },
  {
    label: "تعداد ابزار",
    ours: `${toPersianDigits(tools.length)} ابزار فعال`,
    theirs: "بیشتر — چند صد ابزار",
    verdict: "behind",
    detail:
      "این را صریح می‌گوییم: رقیب ابزار بیشتری دارد. راهبرد ما «همه‌چیز» نیست؛ ابزارهایی است که کاملاً محلی و بدون آپلود کار می‌کنند.",
  },
  {
    label: "ثبت‌نام برای استفاده",
    ours: "هیچ‌کدام از ابزارها",
    theirs: "برای ابزارهای پایه نه، برای بخشی از امکانات بله",
    verdict: "win",
    detail: "در ابزارو هیچ حساب کاربری، ایمیل یا شماره‌ای برای کار با ابزار لازم نیست.",
  },
  {
    label: "واترمارک روی خروجی",
    ours: "ندارد",
    theirs: "ندارد",
    verdict: "same",
    detail: "هیچ‌کدام واترمارک نمی‌زنیم؛ این را به‌عنوان برتری حساب نمی‌کنیم.",
  },
  {
    label: "سقف حجم فایل",
    ours: "بدون سقف مصنوعی؛ محدود به حافظهٔ دستگاه",
    theirs: "بسته به ابزار",
    verdict: "unknown",
    detail:
      "ابزارو فایل را آپلود نمی‌کند، پس سقفش همان RAM دستگاه است — ابزار ویدیو را تا ۲ گیگابایت تست کرده‌ایم. عدد رقیب را بدون اندازه‌گیری نقل نمی‌کنیم.",
  },
  {
    label: "شفافیت دربارهٔ کتابخانه‌ها",
    ours: "صفحهٔ اختصاصی با جدول موتورها و عدد تست‌ها",
    theirs: "ندارد",
    verdict: "win",
    detail: "صفحهٔ /how-it-works می‌گوید هر ابزار با کدام کتابخانه اجرا می‌شود و «چه چیزی به سرور نمی‌رود».",
  },
  {
    label: "نظرات کاربران",
    ours: "هیچ (نظر تأییدنشده منتشر نمی‌کنیم)",
    theirs: "بخش نظرات دارد",
    verdict: "unknown",
    detail:
      "نظر بدون امکان بررسی، سیگنالی است که نمی‌توانیم تضمینش کنیم؛ ترجیح می‌دهیم نداشته باشیم تا اینکه ساختگی باشد.",
  },
  {
    label: "Word ⇄ PDF",
    ours: "عمداً نداریم",
    theirs: "دارد",
    verdict: "behind",
    detail:
      "تبدیل Word به PDF بدون موتور سنگین در مرورگر ممکن نیست. اگر روزی اضافه کنیم، صریح می‌گوییم کدام بخش سمت سرور اجرا می‌شود.",
  },
  {
    label: "دادهٔ سال ۱۴۰۵ در محاسبهٔ حقوق",
    ours: "هر دو سال، با برچسب «در حال بازبینی» برای ۱۴۰۵",
    theirs: "فقط ۱۴۰۵",
    verdict: "win",
    detail:
      "ابزارو ۱۴۰۴ و ۱۴۰۵ را کنار هم دارد و هر سال تست واحد جداگانه دارد؛ تا وقتی یک عدد ۱۴۰۵ تأیید نشده، برچسب بازبینی روی آن می‌ماند.",
  },
];

const VERDICT_STYLE = {
  win: { icon: Check, className: "text-emerald-600", label: "به‌نفع ما" },
  behind: { icon: Minus, className: "text-rose-500", label: "عقب‌تریم" },
  same: { icon: Minus, className: "text-ink-400", label: "برابر" },
  unknown: { icon: Info, className: "text-ink-400", label: "نامشخص" },
} as const;

export default function ComparePage() {
  const wins = ROWS.filter((row) => row.verdict === "win").length;
  const behind = ROWS.filter((row) => row.verdict === "behind").length;

  return (
    <Container className="py-6 sm:py-12">
      <Breadcrumbs items={[{ label: "خانه", href: "/" }, { label: "مقایسه با سایت‌های مشابه" }]} />

      <header className="mt-4 max-w-3xl sm:mt-6">
        <h1 className="text-xl font-extrabold leading-snug text-ink-900 sm:text-3xl">
          ابزارو در برابر سایت‌های مشابه
        </h1>
        <p className="mt-2 text-xs leading-7 text-ink-600 sm:text-base sm:leading-8">
          این جدول جای تبلیغ نیست، جای سنجش است. ستون خودمان عدد اندازه‌گیری‌شده است؛
          ستون رقیب فقط چیزهایی را می‌گوید که یا خودشان منتشر کرده‌اند یا روی سایتشان
          دیده می‌شود. هرجا چیزی را اندازه‌گیری نکرده‌ایم، «نامشخص» نوشته‌ایم.
        </p>
      </header>

      <div className="mt-4 flex flex-wrap gap-2 text-[11px]">
        <span className="rounded-full bg-emerald-50 px-3 py-1.5 font-bold text-emerald-700">
          {toPersianDigits(wins)} مورد به‌نفع ما
        </span>
        <span className="rounded-full bg-rose-50 px-3 py-1.5 font-bold text-rose-700">
          {toPersianDigits(behind)} مورد عقب‌تریم
        </span>
        <span className="rounded-full bg-ink-100 px-3 py-1.5 font-bold text-ink-600">
          بقیه نامشخص یا برابر
        </span>
      </div>

      <div className="mt-5 overflow-hidden rounded-2xl border border-ink-200 bg-white shadow-card">
        <table className="w-full">
          <thead className="bg-ink-50 text-[11px] text-ink-500">
            <tr>
              <th className="px-3 py-2.5 text-start font-bold">موضوع</th>
              <th className="px-3 py-2.5 text-start font-bold">ابزارو</th>
              <th className="hidden px-3 py-2.5 text-start font-bold sm:table-cell">سایت‌های مشابه</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-100">
            {ROWS.map((row) => {
              const style = VERDICT_STYLE[row.verdict];
              const Icon = style.icon;
              return (
                <tr key={row.label} className="align-top">
                  <td className="px-3 py-3 text-[12px] font-bold text-ink-800">
                    <span className="flex items-start gap-1.5">
                      <Icon className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${style.className}`} aria-hidden="true" />
                      {row.label}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-[12px] leading-6 text-ink-700">{row.ours}</td>
                  <td className="hidden px-3 py-3 text-[12px] leading-6 text-ink-500 sm:table-cell">
                    {row.theirs}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Details as a list so the reasoning is readable on phones too. */}
      <section className="mt-6" aria-labelledby="compare-details">
        <h2 id="compare-details" className="text-base font-extrabold text-ink-900 sm:text-lg">
          چرا این‌ها را می‌گوییم
        </h2>
        <div className="mt-3 space-y-2">
          {ROWS.map((row) => (
            <details key={row.label} className="group rounded-xl border border-ink-200 bg-white px-3 py-2.5 shadow-card">
              <summary className="flex min-h-9 cursor-pointer list-none items-center justify-between gap-2 text-[13px] font-bold text-ink-800">
                {row.label}
                <span className="text-brand-500 transition group-open:rotate-45" aria-hidden="true">
                  +
                </span>
              </summary>
              <p className="mt-2 text-xs leading-7 text-ink-600">{row.detail}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="mt-6 rounded-2xl border border-ink-200 bg-ink-50/60 p-4" aria-labelledby="compare-note">
        <h2 id="compare-note" className="text-sm font-extrabold text-ink-900">
          روش اندازه‌گیری
        </h2>
        <ul className="mt-2 space-y-1.5 text-[11px] leading-6 text-ink-600">
          <li>· حجم JS: Chrome DevTools → Network → بارگذاری سخت صفحه → جمع ستون JS (gzip).</li>
          <li>· تعداد ابزار: از رجیستری خود سایت شمرده می‌شود ({toPersianDigits(tools.length)} ابزار در {toPersianDigits(categories.length)} دسته).</li>
          <li>
            · ادعاهای «محلی بودن»: با باز کردن Network هنگام کار با هر ابزار قابل بررسی است — هیچ درخواستی
            برای آپلود فایل ارسال نمی‌شود.
          </li>
        </ul>
        <Link
          href="/how-it-works"
          className="mt-3 inline-flex min-h-10 items-center gap-2 rounded-xl bg-brand-600 px-4 text-xs font-bold text-white transition hover:bg-brand-700"
        >
          جزئیات فنی و اعداد
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
        </Link>
      </section>

      <p className="mt-6 text-center text-[11px] leading-5 text-ink-400">
        این صفحه بخشی از {siteConfig.name} است و در صورت تغییر اعداد به‌روزرسانی می‌شود.
      </p>
    </Container>
  );
}
