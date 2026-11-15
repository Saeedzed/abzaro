import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Container } from "@/components/layout/Container";
import { Breadcrumbs } from "@/components/seo/Breadcrumbs";
import { CategoryCard } from "@/components/categories/CategoryCard";
import { CategoryRail } from "@/components/categories/CategoryRail";
import { categories } from "@/data/categories";
import { getToolsByCategory, tools } from "@/data/tools";
import { toPersianDigits } from "@/lib/persian";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: "دسته‌بندی ابزارها",
  description:
    "همهٔ ابزارهای ابزارو در هفت دسته‌بندی: متن و ویرایش، اعداد و محاسبات، مالی و حقوق، تصاویر، PDF و سند، برنامه‌نویسی و وب، و ویدیو و صدا.",
  alternates: { canonical: "/categories" },
  openGraph: {
    type: "website",
    locale: siteConfig.locale,
    url: `${siteConfig.url}/categories`,
    siteName: siteConfig.name,
    title: `دسته‌بندی ابزارها | ${siteConfig.name}`,
    description: "ابزارهای ابزارو را بر اساس نوع کار مرور کنید.",
    images: [
      {
        url: "/og-default.png",
        width: 1200,
        height: 630,
        alt: `${siteConfig.name} — ${siteConfig.tagline}`,
      },
    ],
  },
};

/**
 * Directory of every category. Desktop shows the illustrated cards; phones get
 * a jump-chip rail plus one compact block per category, so the list is
 * scannable instead of a single tall stack of big cards.
 */
export default function CategoriesPage() {
  const total = tools.length;

  return (
    <Container className="py-6 sm:py-12">
      <Breadcrumbs
        items={[{ label: "خانه", href: "/" }, { label: "دسته‌بندی" }]}
      />

      <header className="mt-4 sm:mt-6">
        <h1 className="text-xl font-extrabold text-ink-900 sm:text-3xl">
          دسته‌بندی ابزارها
        </h1>
        <p className="mt-2 max-w-2xl text-xs leading-6 text-ink-600 sm:text-base sm:leading-7">
          {toPersianDigits(total)} ابزار رایگان در {toPersianDigits(categories.length)}{" "}
          دسته‌بندی؛ ابزارهای هر دسته را یک‌جا ببینید و مستقیم شروع کنید.
        </p>
      </header>

      {/* Phones: jump chips + one compact block per category */}
      <div className="sm:hidden">
        <CategoryRail className="mt-5" />

        <div className="mt-4 space-y-6">
          {categories.map((category) => {
            const list = getToolsByCategory(category.slug);
            const Icon = category.icon;
            return (
              <section
                key={category.slug}
                id={`cat-${category.slug}`}
                className="scroll-mt-20"
                aria-labelledby={`cat-${category.slug}-title`}
              >
                <div className="flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                    <Icon className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <h2
                    id={`cat-${category.slug}-title`}
                    className="flex-1 text-sm font-bold text-ink-900"
                  >
                    {category.title}
                    <span className="ms-1.5 text-[11px] font-medium text-ink-400">
                      {toPersianDigits(list.length)} ابزار
                    </span>
                  </h2>
                  <Link
                    href={`/categories/${category.slug}`}
                    className="flex items-center gap-1 text-[11px] font-semibold text-brand-600"
                  >
                    همه
                    <ArrowLeft className="h-3 w-3" aria-hidden="true" />
                  </Link>
                </div>
                <ul className="mt-2 divide-y divide-ink-100 overflow-hidden rounded-xl border border-ink-200 bg-white">
                  {list.slice(0, 5).map((tool) => (
                    <li key={tool.id}>
                      <Link
                        href={`/tools/${tool.slug}`}
                        className="flex items-center gap-2 px-3 py-2.5 text-xs font-medium text-ink-700 active:bg-ink-50"
                      >
                        <tool.icon
                          className="h-3.5 w-3.5 shrink-0 text-brand-500"
                          aria-hidden="true"
                        />
                        <span className="min-w-0 truncate">{tool.title}</span>
                      </Link>
                    </li>
                  ))}
                  {list.length > 5 && (
                    <li>
                      <Link
                        href={`/categories/${category.slug}`}
                        className="block px-3 py-2 text-[11px] font-semibold text-brand-600 active:bg-ink-50"
                      >
                        {toPersianDigits(list.length - 5)} ابزار دیگر…
                      </Link>
                    </li>
                  )}
                </ul>
              </section>
            );
          })}
        </div>
      </div>

      {/* Desktop / tablet: illustrated cards */}
      <div className="mt-8 hidden grid-cols-2 gap-5 sm:grid lg:grid-cols-3">
        {categories.map((category) => (
          <CategoryCard key={category.slug} category={category} />
        ))}
      </div>
    </Container>
  );
}
