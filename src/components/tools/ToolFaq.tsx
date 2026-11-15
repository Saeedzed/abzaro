import { getToolFaq } from "@/data/tool-faqs";

/**
 * Visible FAQ block + matching FAQPage structured data.
 *
 * The same questions are rendered in the accordion below and emitted as JSON-LD,
 * which is what Google requires — markup that only exists in a script tag is a
 * structured-data violation.
 */
export function ToolFaq({ slug, title }: { slug: string; title: string }) {
  const faq = getToolFaq(slug);
  if (faq.length === 0) return null;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    inLanguage: "fa",
    mainEntity: faq.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };

  return (
    <section
      className="mt-8 sm:mt-12"
      aria-labelledby={`faq-${slug}`}
      data-testid="tool-faq"
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <h2
        id={`faq-${slug}`}
        className="text-xl font-extrabold text-ink-900 sm:text-2xl"
      >
        سؤال‌های متداول «{title}»
      </h2>
      <div className="mt-4 max-w-3xl space-y-2">
        {faq.map((item) => (
          <details
            key={item.q}
            className="group rounded-xl border border-ink-200 bg-white px-3 py-3 shadow-card sm:px-4"
          >
            <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 text-[13px] font-bold text-ink-800 sm:text-sm">
              {item.q}
              <span
                className="text-lg text-brand-500 transition group-open:rotate-45"
                aria-hidden="true"
              >
                +
              </span>
            </summary>
            <p className="mt-2 text-xs leading-7 text-ink-600 sm:text-sm sm:leading-8">
              {item.a}
            </p>
          </details>
        ))}
      </div>
    </section>
  );
}
