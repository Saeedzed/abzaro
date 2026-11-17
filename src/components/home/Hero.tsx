import Link from "next/link";
import { Lock, ShieldCheck, Zap } from "lucide-react";
import { Container } from "@/components/layout/Container";
import { SearchBox } from "@/components/search/SearchBox";
import { heroIntents, intentPrompt } from "@/data/intents";
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

          {/*
            Intent-first entry points. Phones get a 3-column icon grid (thumb
            targets, no long Persian sentences); from `sm` up it becomes a row
            of pill buttons that read as full sentences.
          */}
          <div className="mt-6 text-start sm:mt-8" data-testid="hero-intents">
            <p className="mb-2 text-center text-[11px] font-bold text-ink-400 sm:text-xs">
              یا بگویید چه کاری می‌خواهید انجام دهید
            </p>

            {/* Phones: compact 3×2 grid */}
            <div className="grid grid-cols-3 gap-2 sm:hidden">
              {heroIntents.map((intent) => {
                const Icon = intent.icon;
                return (
                  <Link
                    key={intent.id}
                    href={intent.href}
                    data-testid={`intent-${intent.id}`}
                    className="flex min-h-20 flex-col items-center justify-center gap-1.5 rounded-xl border border-ink-200 bg-white px-1.5 py-2 text-center shadow-card transition active:scale-[0.98]"
                  >
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                      <Icon className="h-4 w-4" aria-hidden="true" />
                    </span>
                    <span className="text-[10px] font-semibold leading-4 text-ink-700">
                      {intent.shortLabel}
                    </span>
                  </Link>
                );
              })}
            </div>

            {/* Tablet and up: sentence pills */}
            <ul className="hidden flex-wrap justify-center gap-2 sm:flex">
              {heroIntents.map((intent) => {
                const Icon = intent.icon;
                return (
                  <li key={intent.id}>
                    <Link
                      href={intent.href}
                      data-testid={`intent-${intent.id}`}
                      className="flex min-h-10 items-center gap-2 rounded-full border border-ink-200 bg-white px-3.5 text-xs font-medium text-ink-700 shadow-card transition hover:border-brand-300 hover:text-brand-700"
                    >
                      <Icon className="h-3.5 w-3.5 text-brand-500" aria-hidden="true" />
                      {intentPrompt(intent)}
                    </Link>
                  </li>
                );
              })}
            </ul>
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
