import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Container } from "@/components/layout/Container";
import { ToolGrid } from "@/components/tools/ToolGrid";
import { categories } from "@/data/categories";
import { getToolsByCategory, tools } from "@/data/tools";
import { toPersianDigits } from "@/lib/persian";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: "همه ابزارهای آنلاین رایگان",
  description: `مجموعه کامل ابزارهای رایگان ${siteConfig.name} برای شمارش کلمات، تبدیل اعداد فارسی، محاسبات و ویرایش تصاویر؛ بدون ثبت‌نام و با پردازش در مرورگر.`,
  alternates: { canonical: "/tools" },
};

export default function ToolsPage() {
  return (
    <Container className="py-10 sm:py-14">
      <div className="max-w-2xl">
        <h1 className="text-3xl font-extrabold text-ink-900 sm:text-4xl">
          همه ابزارها
        </h1>
        <p className="mt-3 text-sm leading-7 text-ink-600 sm:text-base">
          {toPersianDigits(tools.length)} ابزار رایگان در {toPersianDigits(categories.length)} دسته‌بندی؛
          بدون نیاز به ثبت‌نام و با پردازش کامل در مرورگر شما.
        </p>
      </div>

      {categories.map((category) => {
        const categoryTools = getToolsByCategory(category.slug);
        if (categoryTools.length === 0) return null;
        return (
          <section key={category.slug} className="mt-12" aria-labelledby={`category-${category.slug}`}>
            <div className="flex flex-wrap items-end justify-between gap-3">
              <h2
                id={`category-${category.slug}`}
                className="text-xl font-extrabold text-ink-900 sm:text-2xl"
              >
                {category.title}
              </h2>
              <Link
                href={`/categories/${category.slug}`}
                className="flex items-center gap-1.5 text-sm font-semibold text-brand-600 transition hover:text-brand-700"
              >
                مشاهده دسته‌بندی
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
            <ToolGrid tools={categoryTools} className="mt-6" />
          </section>
        );
      })}
    </Container>
  );
}
