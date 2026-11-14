import type { Metadata } from "next";
import { Container } from "@/components/layout/Container";
import { ToolsExplorer } from "@/components/tools/ToolsExplorer";
import { categories } from "@/data/categories";
import { tools } from "@/data/tools";
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
          {toPersianDigits(tools.length)} ابزار رایگان در{" "}
          {toPersianDigits(categories.length)} دسته‌بندی؛ بدون نیاز به ثبت‌نام و
          با پردازش کامل در مرورگر شما. با فیلتر دسته‌بندی یا جست‌وجوی زنده،
          ابزار موردنظرتان را در چند ثانیه پیدا کنید.
        </p>
      </div>

      <ToolsExplorer />
    </Container>
  );
}
