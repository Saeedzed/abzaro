import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowLeft,
  BadgeCheck,
  Lock,
  MousePointerClick,
  Smartphone,
} from "lucide-react";
import { Container } from "@/components/layout/Container";
import { Hero } from "@/components/home/Hero";
import { ToolGrid } from "@/components/tools/ToolGrid";
import { CategoryCard } from "@/components/categories/CategoryCard";
import { categories } from "@/data/categories";
import { popularTools, recentTools } from "@/data/tools";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: `${siteConfig.name} | ${siteConfig.tagline}`,
  description: siteConfig.description,
  alternates: { canonical: "/" },
};

function SectionHeading({
  title,
  description,
  href,
  linkLabel,
}: {
  title: string;
  description?: string;
  href?: string;
  linkLabel?: string;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h2 className="text-2xl font-extrabold text-ink-900 sm:text-3xl">
          {title}
        </h2>
        {description && (
          <p className="mt-2 max-w-2xl text-sm leading-7 text-ink-600 sm:text-base">
            {description}
          </p>
        )}
      </div>
      {href && linkLabel && (
        <Link
          href={href}
          className="flex items-center gap-1.5 text-sm font-semibold text-brand-600 transition hover:text-brand-700"
        >
          {linkLabel}
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        </Link>
      )}
    </div>
  );
}

const ABOUT_FEATURES = [
  {
    icon: BadgeCheck,
    title: "رایگان برای همیشه",
    description: "بدون پرداخت، بدون محدودیت استفاده.",
  },
  {
    icon: MousePointerClick,
    title: "بدون ثبت‌نام",
    description: "فقط وارد شوید و استفاده کنید.",
  },
  {
    icon: Lock,
    title: "حریم خصوصی",
    description: "متن و فایل شما از دستگاهتان خارج نمی‌شود.",
  },
  {
    icon: Smartphone,
    title: "سازگار با همه دستگاه‌ها",
    description: "روی موبایل، تبلت و کامپیوتر.",
  },
] as const;

export default function HomePage() {
  return (
    <>
      <Hero />

      {/* Popular tools */}
      <section className="py-14 sm:py-16" aria-labelledby="popular-tools-heading">
        <Container>
          <SectionHeading
            title="ابزارهای پرطرفدار"
            description="پراستفاده‌ترین ابزارهای ابزارو؛ برای کارهای روزمرهٔ متن، اعداد و محاسبات."
            href="/tools"
            linkLabel="همه ابزارها"
          />
          <ToolGrid tools={popularTools} className="mt-8" />
        </Container>
      </section>

      {/* Categories */}
      <section className="bg-ink-50 py-14 sm:py-16" aria-labelledby="categories-heading">
        <Container>
          <SectionHeading
            title="دسته‌بندی ابزارها"
            description="ابزارها بر اساس نوع کار دسته‌بندی شده‌اند تا سریع‌تر به ابزار موردنظرتان برسید."
          />
          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
            {categories.map((category) => (
              <CategoryCard key={category.slug} category={category} />
            ))}
          </div>
        </Container>
      </section>

      {/* Recently added */}
      <section className="py-14 sm:py-16" aria-labelledby="recent-tools-heading">
        <Container>
          <SectionHeading
            title="ابزارهای تازه"
            description="جدیدترین ابزارهایی که به مجموعهٔ ابزارو اضافه شده‌اند."
            href="/tools"
            linkLabel="همه ابزارها"
          />
          <ToolGrid tools={recentTools.slice(0, 6)} className="mt-8" />
        </Container>
      </section>

      {/* About Abzaro */}
      <section className="border-t border-ink-200 bg-ink-50 py-14 sm:py-16" aria-labelledby="about-heading">
        <Container>
          <div className="grid items-center gap-10 lg:grid-cols-2">
            <div>
              <h2
                id="about-heading"
                className="text-2xl font-extrabold text-ink-900 sm:text-3xl"
              >
                ابزارو چیست؟
              </h2>
              <p className="mt-4 text-sm leading-8 text-ink-600 sm:text-base">
                ابزارو مجموعه‌ای از ابزارهای آنلاین رایگان است که برای انجام
                سریع کارهای روزمره ساخته شده‌اند؛ از شمارش کلمات و تبدیل اعداد
                فارسی تا محاسبات و ویرایش تصاویر. همهٔ ابزارها سبک، سریع و
                بدون نیاز به ثبت‌نام هستند.
              </p>
              <p className="mt-3 text-sm leading-8 text-ink-600 sm:text-base">
                مهم‌تر از همه، حریم خصوصی شما برای ما اهمیت دارد: پردازش متن و
                تصاویر در مرورگر شما انجام می‌شود و هیچ داده‌ای به سرور ارسال
                نمی‌شود.
              </p>
              <Link
                href="/about"
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700"
              >
                بیشتر درباره ابزارو
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {ABOUT_FEATURES.map((feature) => {
                const Icon = feature.icon;
                return (
                  <div
                    key={feature.title}
                    className="rounded-2xl border border-ink-200 bg-white p-5 shadow-card"
                  >
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <h3 className="mt-3 text-sm font-bold text-ink-900">
                      {feature.title}
                    </h3>
                    <p className="mt-1.5 text-xs leading-6 text-ink-500">
                      {feature.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
