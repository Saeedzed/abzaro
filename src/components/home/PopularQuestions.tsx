import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Container } from "@/components/layout/Container";
import { popularQuestions, questionHref } from "@/data/popular-questions";

/**
 * Real questions people type into Google, answered by one click.
 *
 * This is deliberately *not* a FAQ accordion: each row is a searchable sentence
 * paired with the tool that resolves it, which is how the query actually gets
 * satisfied. The wording mirrors Persian search phrasing (…چقدر است؟، چطور…).
 */
/** "People usually ask" block — SEO-friendly internal links under the tool list. */
export function PopularQuestions({ className }: { className?: string }) {
  return (
    <section
      className={className}
      aria-labelledby="popular-questions-heading"
      data-testid="popular-questions"
    >
      <Container>
        <div className="rounded-2xl border border-ink-200 bg-white p-4 shadow-card sm:p-6">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2
              id="popular-questions-heading"
              className="text-base font-extrabold text-ink-900 sm:text-lg"
            >
              سؤال‌هایی که زیاد پرسیده می‌شود
            </h2>
            <Link
              href="/tools"
              className="flex min-h-8 items-center gap-1 rounded-lg px-1.5 text-xs font-semibold text-brand-600 transition hover:text-brand-700"
            >
              همهٔ ابزارها
              <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </div>

          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {popularQuestions.map((item) => (
              <li key={item.question}>
                <Link
                  href={questionHref(item)}
                  className="flex min-h-12 items-center gap-2 rounded-xl border border-ink-100 bg-ink-50/50 px-3 py-2.5 transition hover:border-brand-200 hover:bg-brand-50/60"
                >
                  <span className="text-brand-500" aria-hidden="true">
                    ؟
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[13px] font-semibold leading-5 text-ink-800">
                      {item.question}
                    </span>
                    {item.hint && (
                      <span className="mt-0.5 hidden text-[11px] text-ink-500 sm:block">
                        {item.hint}
                      </span>
                    )}
                  </span>
                  <ArrowLeft
                    className="h-3.5 w-3.5 shrink-0 text-brand-500"
                    aria-hidden="true"
                  />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </Container>
    </section>
  );
}
