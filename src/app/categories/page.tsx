import type { Metadata } from "next";
import { Container } from "@/components/layout/Container";
import { Breadcrumbs } from "@/components/seo/Breadcrumbs";
import { CategoryCard } from "@/components/categories/CategoryCard";
import { categories } from "@/data/categories";
import { tools } from "@/data/tools";
import { toPersianDigits } from "@/lib/persian";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: "دسته‌بندی ابزارها",
  description:
    "همهٔ ابزارهای ابزارو در هشت دسته‌بندی: متن و ویرایش، اعداد و محاسبات، مالی و حقوق، تصاویر، PDF و سند، برنامه‌نویسی و وب، ویدیو و صدا، و سئو.",
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
 * Category directory uses the same illustrated cards at all screen sizes,
 * with a phone-first two-column grid and four columns on desktop.
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
          دسته‌بندی
        </p>
      </header>

      <div className="mt-5 grid grid-cols-4 gap-1.5 sm:mt-8 sm:gap-5" data-testid="category-grid">
        {categories.map((category) => (
          <CategoryCard key={category.slug} category={category} />
        ))}
      </div>
    </Container>
  );
}
