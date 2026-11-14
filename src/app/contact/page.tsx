import type { Metadata } from "next";
import { Mail } from "lucide-react";
import { Container } from "@/components/layout/Container";
import { Breadcrumbs } from "@/components/seo/Breadcrumbs";
import { ContactForm } from "@/components/contact/ContactForm";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: "تماس با ما",
  description: `برای پیشنهاد، انتقاد یا گزارش مشکل با تیم ${siteConfig.name} در تماس باشید.`,
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <Container className="py-8 sm:py-12">
      <Breadcrumbs
        items={[{ label: "خانه", href: "/" }, { label: "تماس با ما" }]}
      />

      <div className="mx-auto mt-8 max-w-2xl">
        <h1 className="text-3xl font-extrabold text-ink-900 sm:text-4xl">
          تماس با ما
        </h1>
        <p className="mt-3 text-sm leading-7 text-ink-600 sm:text-base">
          پیشنهاد، انتقاد یا گزارش مشکل دارید؟ از طریق فرم زیر یا ایمیل با ما
          در تماس باشید؛ معمولاً در کمتر از ۴۸ ساعت پاسخ می‌دهیم.
        </p>

        <a
          href={`mailto:${siteConfig.email}`}
          className="mt-6 flex items-center gap-3 rounded-2xl border border-ink-200 bg-white p-4 shadow-card transition hover:border-brand-200"
        >
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
            <Mail className="h-5 w-5" aria-hidden="true" />
          </span>
          <span>
            <span className="block text-xs text-ink-500">ایمیل پشتیبانی</span>
            <span dir="ltr" className="block text-left text-sm font-bold text-ink-900">
              {siteConfig.email}
            </span>
          </span>
        </a>

        <div className="mt-6">
          <ContactForm />
        </div>
      </div>
    </Container>
  );
}
