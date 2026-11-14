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
      <Container className="py-14 sm:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="text-3xl font-extrabold leading-snug text-ink-900 sm:text-4xl lg:text-5xl lg:leading-snug">
            هر ابزاری که نیاز داری، همین‌جاست!
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-base leading-8 text-ink-600 sm:text-lg sm:leading-9">
            {siteConfig.description}
          </p>

          <SearchBox
            size="large"
            placeholder="ابزار موردنظرت را جستجو کن…"
            className="mx-auto mt-9 max-w-2xl text-start"
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

        <div className="mx-auto mt-12 grid max-w-3xl grid-cols-1 gap-4 sm:grid-cols-3">
          {FEATURES.map((feature) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.title}
                className="flex items-center gap-3 rounded-2xl border border-ink-200/80 bg-white/80 px-4 py-3.5"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <span>
                  <span className="block text-sm font-bold text-ink-900">
                    {feature.title}
                  </span>
                  <span className="block text-xs text-ink-500">
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
