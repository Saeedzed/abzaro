import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { Container } from "@/components/layout/Container";
import { Breadcrumbs } from "@/components/seo/Breadcrumbs";
import { ToolSlot } from "@/components/tools/ToolSlot";
import { ToolCard } from "@/components/tools/ToolCard";
import { landings, getLanding } from "@/data/landings";
import { getToolBySlug } from "@/data/tools";
import { toPersianDigits } from "@/lib/persian";
import { siteConfig } from "@/config/site";

/**
 * Short, keyword-shaped landing URLs (/salary, /pdf, /loan, /interest, /word-count).
 *
 * Each one is a real page: value proposition, bullets, FAQ (with FAQPage JSON-LD)
 * and — for the main three — the working tool rendered inline. `canonical` points
 * at itself rather than at /tools/<slug>, so the short URL is the primary entry
 * point and the tool page stays canonical for its own longer name.
 *
 * `generateStaticParams` only emits these five paths, so every other single-segment
 * URL still 404s (there is no catch-all behaviour here).
 */

interface LandingPageProps {
  params: Promise<{ landing: string }>;
}

export function generateStaticParams() {
  return landings.map((landing) => ({ landing: landing.path }));
}

export async function generateMetadata({
  params,
}: LandingPageProps): Promise<Metadata> {
  const { landing: path } = await params;
  const landing = getLanding(path);
  if (!landing) return { title: "صفحه یافت نشد" };

  return {
    title: landing.title,
    description: landing.description,
    alternates: { canonical: `/${landing.path}` },
    openGraph: {
      type: "website",
      locale: siteConfig.locale,
      url: `${siteConfig.url}/${landing.path}`,
      siteName: siteConfig.name,
      title: `${landing.title} | ${siteConfig.name}`,
      description: landing.description,
      images: [
        {
          url: "/og-default.png",
          width: 1200,
          height: 630,
          alt: `${siteConfig.name} — ${landing.title}`,
        },
      ],
    },
  };
}

export function generateViewport() {
  return { width: "device-width", initialScale: 1 };
}

export default async function LandingPage({ params }: LandingPageProps) {
  const { landing: path } = await params;
  const landing = getLanding(path);
  if (!landing) notFound();

  const related = landing.related
    .map((slug) => getToolBySlug(slug))
    .filter((tool): tool is NonNullable<typeof tool> => Boolean(tool));

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    inLanguage: "fa",
    mainEntity: landing.faq.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };

  return (
    <Container className="py-6 sm:py-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      <Breadcrumbs
        items={[
          { label: "خانه", href: "/" },
          { label: "ابزارها", href: "/tools" },
          { label: landing.title },
        ]}
      />

      <header className="mt-4 max-w-3xl sm:mt-6">
        <h1 className="text-xl font-extrabold leading-snug text-ink-900 sm:text-3xl">
          {landing.title}
        </h1>
        <p className="mt-2 text-xs leading-7 text-ink-600 sm:text-base sm:leading-8">
          {landing.intro}
        </p>
      </header>

      <ul className="mt-4 grid gap-2 sm:grid-cols-2">
        {landing.bullets.map((bullet) => (
          <li
            key={bullet}
            className="flex items-start gap-2 rounded-xl border border-ink-200 bg-white px-3 py-2.5 text-xs leading-6 text-ink-700 shadow-card sm:text-[13px]"
          >
            <CheckCircle2
              className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600"
              aria-hidden="true"
            />
            {bullet}
          </li>
        ))}
      </ul>

      {/* The tool itself, inline — no extra click for the main intents. */}
      {landing.embed && (
        <section
          className="mt-5 rounded-2xl border border-ink-200 bg-ink-50/60 p-2.5 shadow-card sm:mt-8 sm:rounded-3xl sm:p-6 lg:p-8"
          aria-label={landing.title}
        >
          <ToolSlot slug={landing.slug} />
        </section>
      )}

      {!landing.embed && (
        <Link
          href={`/tools/${landing.slug}`}
          className="mt-5 flex min-h-12 items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 text-sm font-bold text-white shadow-card transition hover:bg-brand-700"
          data-testid="landing-open-tool"
        >
          باز کردن {landing.title}
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        </Link>
      )}

      {/* FAQ */}
      <section className="mt-8" aria-labelledby="landing-faq">
        <h2
          id="landing-faq"
          className="text-base font-extrabold text-ink-900 sm:text-lg"
        >
          سؤال‌های متداول
        </h2>
        <div className="mt-3 space-y-2">
          {landing.faq.map((item) => (
            <details
              key={item.q}
              className="group rounded-xl border border-ink-200 bg-white px-3 py-2.5 shadow-card"
            >
              <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-2 text-[13px] font-bold text-ink-800">
                {item.q}
                <span className="text-brand-500 transition group-open:rotate-45">
                  +
                </span>
              </summary>
              <p className="mt-2 text-xs leading-7 text-ink-600">{item.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* Related */}
      {related.length > 0 && (
        <section className="mt-8" aria-labelledby="landing-related">
          <h2
            id="landing-related"
            className="text-base font-extrabold text-ink-900 sm:text-lg"
          >
            ابزارهای مرتبط
          </h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((tool) => (
              <ToolCard key={tool.id} tool={tool} />
            ))}
          </div>
        </section>
      )}

      <p className="mt-8 text-center text-[11px] text-ink-400">
        این صفحه بخشی از {siteConfig.name} است — {toPersianDigits(landings.length)}{" "}
        مسیر کوتاه برای پرکاربردترین کارها.
      </p>
    </Container>
  );
}
