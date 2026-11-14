import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, SearchX } from "lucide-react";
import { Container } from "@/components/layout/Container";
import { SearchBox } from "@/components/search/SearchBox";

export const metadata: Metadata = {
  title: "صفحه یافت نشد",
  description: "صفحه‌ای که دنبال آن بودید پیدا نشد.",
};

export default function NotFoundPage() {
  return (
    <Container className="py-16 sm:py-24">
      <div className="mx-auto max-w-xl text-center">
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
          <SearchX className="h-8 w-8" aria-hidden="true" />
        </span>
        <h1 className="mt-6 text-3xl font-extrabold text-ink-900 sm:text-4xl">
          صفحه یافت نشد
        </h1>
        <p className="mt-3 text-sm leading-7 text-ink-600 sm:text-base">
          صفحه‌ای که دنبال آن بودید وجود ندارد یا جابه‌جا شده است. می‌توانید
          ابزار موردنظرتان را جستجو کنید یا به صفحهٔ اصلی برگردید.
        </p>

        <SearchBox
          size="large"
          placeholder="جستجوی ابزار…"
          className="mx-auto mt-8 max-w-md text-start"
        />

        <Link
          href="/"
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700"
        >
          بازگشت به صفحه اصلی
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>
    </Container>
  );
}
