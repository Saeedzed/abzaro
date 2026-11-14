import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Compass, Home, SearchX } from "lucide-react";
import { Container } from "@/components/layout/Container";
import { SearchBox } from "@/components/search/SearchBox";
import { ToolGrid } from "@/components/tools/ToolGrid";
import { CategoryArt } from "@/components/categories/CategoryArt";
import { tools } from "@/data/tools";
import { categories } from "@/data/categories";
import { toPersianDigits } from "@/lib/persian";

export const metadata: Metadata = {
  title: "صفحه یافت نشد",
  description: "صفحه‌ای که دنبال آن بودید پیدا نشد؛ از این‌جا سریع به ابزارها برسید.",
};

/** A handful of well-known tools to offer as a way out of a dead end. */
const SUGGESTED_SLUGS = [
  "word-counter",
  "image-compressor",
  "image-to-pdf",
  "loan-calculator",
  "qr-code-generator",
  "json-formatter",
];

export default function NotFoundPage() {
  const suggested = SUGGESTED_SLUGS.map((slug) =>
    tools.find((tool) => tool.slug === slug),
  ).filter((tool): tool is (typeof tools)[number] => Boolean(tool));

  return (
    <>
      <section className="relative overflow-hidden border-b border-ink-200/70 bg-gradient-to-b from-brand-50/80 via-white to-white">
        <Container className="py-16 text-center sm:py-20">
          <p
            aria-hidden="true"
            className="select-none text-6xl font-extrabold tracking-tight text-brand-200 sm:text-7xl"
          >
            {toPersianDigits(404)}
          </p>

          <span className="mx-auto mt-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-600 text-white shadow-card">
            <SearchX className="h-7 w-7" aria-hidden="true" />
          </span>

          <h1 className="mt-5 text-2xl font-extrabold text-ink-900 sm:text-3xl">
            این صفحه پیدا نشد
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-ink-600 sm:text-base">
            ممکن است نشانی را اشتباه وارد کرده باشید یا ابزار جابه‌جا شده باشد.
            نام ابزار را جستجو کنید یا از میان {toPersianDigits(tools.length)}{" "}
            ابزار سایت یکی را انتخاب کنید.
          </p>

          <SearchBox
            size="large"
            placeholder="جستجوی ابزار…"
            className="mx-auto mt-8 max-w-xl text-start"
          />

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow-card transition hover:bg-brand-700"
            >
              <Home className="h-4 w-4" aria-hidden="true" />
              بازگشت به صفحه اصلی
            </Link>
            <Link
              href="/categories"
              className="inline-flex items-center gap-2 rounded-xl border border-ink-200 bg-white px-5 py-2.5 text-sm font-semibold text-ink-700 shadow-card transition hover:border-brand-300 hover:text-brand-700"
            >
              <Compass className="h-4 w-4" aria-hidden="true" />
              همهٔ دسته‌بندی‌ها
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </Container>
      </section>

      <Container className="py-14">
        <h2 className="text-lg font-extrabold text-ink-900 sm:text-xl">
          چند ابزار پرکاربرد
        </h2>
        <ToolGrid tools={suggested} className="mt-6" />

        <div className="mt-12">
          <h2 className="text-lg font-extrabold text-ink-900 sm:text-xl">
            یا از دسته‌بندی‌ها شروع کنید
          </h2>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {categories.map((category) => (
              <Link
                key={category.slug}
                href={`/categories/${category.slug}`}
                className="group flex items-center gap-3 rounded-2xl border border-ink-200 bg-white p-3 shadow-card transition hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-card-hover"
              >
                <span className="w-14 shrink-0 text-brand-600">
                  <CategoryArt slug={category.slug} className="h-8 w-full" />
                </span>
                <span className="text-xs font-bold text-ink-800 group-hover:text-brand-700">
                  {category.title}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </Container>
    </>
  );
}
