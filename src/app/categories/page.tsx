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
    "همهٔ ابزارهای ابزارو در پنج دسته‌بندی: متن و ویرایش، اعداد و محاسبات، تصاویر، ویرایش فایل و PDF، و برنامه‌نویسی و وب.",
  alternates: { canonical: "/categories" },
  openGraph: {
    type: "website",
    locale: siteConfig.locale,
    url: `${siteConfig.url}/categories`,
    siteName: siteConfig.name,
    title: `دسته‌بندی ابزارها | ${siteConfig.name}`,
    description: "ابزارهای ابزارو را بر اساس نوع کار مرور کنید.",
  },
};

/** Directory of every category — linked from the main navigation. */
export default function CategoriesPage() {
  return (
    <Container className="py-8 sm:py-12">
      <Breadcrumbs
        items={[{ label: "خانه", href: "/" }, { label: "دسته‌بندی" }]}
      />

      <header className="mt-6">
        <h1 className="text-2xl font-extrabold text-ink-900 sm:text-3xl">
          دسته‌بندی ابزارها
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-7 text-ink-600 sm:text-base">
          {toPersianDigits(tools.length)} ابزار رایگان در{" "}
          {toPersianDigits(categories.length)} دسته‌بندی؛ ابزارهای هر دسته را یک‌جا
          ببینید و مستقیم شروع کنید.
        </p>
      </header>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
        {categories.map((category) => (
          <CategoryCard key={category.slug} category={category} />
        ))}
      </div>
    </Container>
  );
}
