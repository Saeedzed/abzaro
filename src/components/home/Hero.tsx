import Link from "next/link";
import { Lock, ShieldCheck, Zap } from "lucide-react";
import { Container } from "@/components/layout/Container";
import { SearchBox } from "@/components/search/SearchBox";
import { popularTools } from "@/data/tools";
import { siteConfig } from "@/config/site";

const FEATURES = [
  {
    icon: Zap,
    title: "سریع و سبک",
    description: "بدون نیاز به نصب یا ثبت‌نام",
  },
  {
    icon: ShieldCheck,
    title: "کاملاً رایگان",
    description: "همه ابزارها برای همیشه رایگان",
  },
  {
    icon: Lock,
    title: "حریم خصوصی",
    description: "پردازش متن و تصویر در مرورگر شما",
  },
] as const;

/** Homepage hero: headline, search and quick links to popular tools. */
export function Hero() {
  return (
    <section className="border-b border-ink-200/60 bg-gradient-to-b from-brand-50/70 via-white to-white">
      <Container className="py-8 sm:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="text-2xl font-extrabold leading-snug text-ink-900 sm:text-4xl lg:text-5xl lg:leading-snug">
            هر ابزاری که نیاز داری، همین‌جاست!
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-ink-600 sm:mt-5 sm:text-lg sm:leading-9">
            {siteConfig.description}
          </p>

          <SearchBox
            size="large"
            placeholder="ابزار موردنظرت را جستجو کن…"
            className="mx-auto mt-5 max-w-2xl text-start sm:mt-9"
          />
          <p className="mt-3 text-xs text-ink-500">
            بدون نصب و بدون ثبت‌نام · همهٔ پردازش‌ها در مرورگر شما انجام می‌شود
          </p>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
            <span className="text-xs font-medium text-ink-500">
              پرطرفدارها:
            </span>
            {popularTools.slice(0, 4).map((tool) => (
              <Link
                key={tool.id}
                href={`/tools/${tool.slug}`}
                className="rounded-full border border-ink-200 bg-white px-3 py-1.5 text-xs font-medium text-ink-700 shadow-card transition hover:border-brand-300 hover:text-brand-700"
              >
                {tool.title}
              </Link>
            ))}
          </div>
        </div>

        <div className="mx-auto mt-6 grid max-w-3xl grid-cols-3 gap-2 sm:mt-12 sm:gap-4">
          {FEATURES.map((feature) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.title}
                className="flex flex-col items-center gap-1.5 rounded-xl border border-ink-200/80 bg-white/80 px-2 py-2.5 text-center sm:flex-row sm:gap-3 sm:rounded-2xl sm:px-4 sm:py-3.5 sm:text-start"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600 sm:h-10 sm:w-10 sm:rounded-xl">
                  <Icon className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden="true" />
                </span>
                <span>
                  <span className="block text-[11px] font-bold leading-4 text-ink-900 sm:text-sm">
                    {feature.title}
                  </span>
                  <span className="hidden text-xs text-ink-500 sm:block">
                    {feature.description}
                  </span>
                </span>
              </div>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
