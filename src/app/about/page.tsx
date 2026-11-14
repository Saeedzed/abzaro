import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowLeft,
  BadgeCheck,
  Lock,
  MousePointerClick,
  Smartphone,
  Zap,
} from "lucide-react";
import { Container } from "@/components/layout/Container";
import { Breadcrumbs } from "@/components/seo/Breadcrumbs";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: "درباره ابزارو",
  description: `دربارهٔ ${siteConfig.name}؛ مجموعه‌ای از ابزارهای آنلاین رایگان برای کاربران فارسی‌زبان، با پردازش در مرورگر و بدون ثبت‌نام.`,
  alternates: { canonical: "/about" },
};

const VALUES = [
  {
    icon: BadgeCheck,
    title: "رایگان برای همیشه",
    description:
      "همهٔ ابزارها بدون پرداخت و بدون محدودیت استفاده در دسترس هستند.",
  },
  {
    icon: MousePointerClick,
    title: "بدون ثبت‌نام",
    description: "نیازی به ساخت حساب یا وارد کردن اطلاعات شخصی نیست.",
  },
  {
    icon: Lock,
    title: "حریم خصوصی",
    description:
      "پردازش متن و تصاویر در مرورگر شما انجام می‌شود؛ هیچ داده‌ای به سرور ارسال نمی‌شود.",
  },
  {
    icon: Zap,
    title: "سریع و سبک",
    description: "ابزارها بدون نصب و با کمترین حجم ممکن اجرا می‌شوند.",
  },
  {
    icon: Smartphone,
    title: "سازگار با همه دستگاه‌ها",
    description: "روی موبایل، تبلت و کامپیوتر به‌خوبی کار می‌کنند.",
  },
] as const;

export default function AboutPage() {
  return (
    <Container className="py-8 sm:py-12">
      <Breadcrumbs
        items={[{ label: "خانه", href: "/" }, { label: "درباره ما" }]}
      />

      <div className="mx-auto mt-8 max-w-3xl">
        <h1 className="text-3xl font-extrabold text-ink-900 sm:text-4xl">
          درباره {siteConfig.name}
        </h1>
        <div className="mt-6 space-y-5 text-sm leading-9 text-ink-700 sm:text-base">
          <p>
            {siteConfig.name} ({siteConfig.brand}) مجموعه‌ای از ابزارهای
            آنلاین رایگان است که برای انجام سریع کارهای روزمره ساخته شده‌اند؛
            از شمارش کلمات و تبدیل اعداد فارسی تا محاسبات و ویرایش تصاویر.
          </p>
          <p>
            هدف ما ساده است: ابزاری بسازیم که هر کسی، در هر لحظه و بدون هیچ
            مانعی بتواند از آن استفاده کند. به همین دلیل همهٔ ابزارها رایگان،
            بدون ثبت‌نام و بدون نیاز به نصب هستند.
          </p>
          <p>
            ما به حریم خصوصی شما احترام می‌گذاریم. در ابزارو، متن و فایل‌های
            شما در مرورگر خودتان پردازش می‌شوند و هرگز به سرور ارسال یا ذخیره
            نمی‌شوند. برای جزئیات بیشتر، صفحهٔ «حریم خصوصی» را بخوانید.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {VALUES.map((value) => {
            const Icon = value.icon;
            return (
              <div
                key={value.title}
                className="rounded-2xl border border-ink-200 bg-white p-5 shadow-card"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <h2 className="mt-3 text-sm font-bold text-ink-900">
                  {value.title}
                </h2>
                <p className="mt-1.5 text-xs leading-6 text-ink-500">
                  {value.description}
                </p>
              </div>
            );
          })}
        </div>

        <Link
          href="/tools"
          className="mt-10 inline-flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700"
        >
          شروع استفاده از ابزارها
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>
    </Container>
  );
}
