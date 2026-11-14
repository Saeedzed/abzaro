import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/layout/Container";
import { Breadcrumbs } from "@/components/seo/Breadcrumbs";
import { RelatedTools } from "@/components/tools/RelatedTools";
import { RecentToolsTracker } from "@/components/tools/RecentToolsTracker";
import { toPersianDigits } from "@/lib/persian";
import { ToolPlaceholder } from "@/components/tools/ToolPlaceholder";
import { WordCounter } from "@/components/tools/WordCounter";
import { CharacterCounter } from "@/components/tools/CharacterCounter";
import { PersianNumberConverter } from "@/components/tools/PersianNumberConverter";
import { PersianTextCleaner } from "@/components/tools/PersianTextCleaner";
import { NumberToWords } from "@/components/tools/NumberToWords";
import { PercentageCalculator } from "@/components/tools/PercentageCalculator";
import { DiscountCalculator } from "@/components/tools/DiscountCalculator";
import { AgeCalculator } from "@/components/tools/AgeCalculator";
import { ImageResizer } from "@/components/tools/ImageResizer";
import { ImageCompressor } from "@/components/tools/ImageCompressor";
import { ImageToPdf } from "@/components/tools/ImageToPdf";
import { PdfToImage } from "@/components/tools/PdfToImage";
import { PdfCompressor } from "@/components/tools/PdfCompressor";
import { PdfMerger } from "@/components/tools/PdfMerger";
import { ImageFormatConverter } from "@/components/tools/ImageFormatConverter";
import { ImageToBase64 } from "@/components/tools/ImageToBase64";
import { ProfilePicture } from "@/components/tools/ProfilePicture";
import { LoanCalculator } from "@/components/tools/LoanCalculator";
import { BmiCalculator } from "@/components/tools/BmiCalculator";
import { DateDiffCalculator } from "@/components/tools/DateDiffCalculator";
import { ExactAgeCalculator } from "@/components/tools/ExactAgeCalculator";
import { QrCodeGenerator } from "@/components/tools/QrCodeGenerator";
import { JsonFormatter } from "@/components/tools/JsonFormatter";
import { Base64Tool } from "@/components/tools/Base64Tool";
import { UrlEncoder } from "@/components/tools/UrlEncoder";
import { getCategory } from "@/data/categories";
import { categoriesOf, getToolBySlug, tools } from "@/data/tools";
import { siteConfig } from "@/config/site";

export function generateStaticParams() {
  return tools.map((tool) => ({ slug: tool.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const tool = getToolBySlug(slug);
  if (!tool) {
    return { title: "ابزار یافت نشد" };
  }
  return {
    title: tool.seoTitle,
    description: tool.seoDescription,
    keywords: tool.keywords,
    alternates: { canonical: `/tools/${tool.slug}` },
    openGraph: {
      type: "website",
      locale: siteConfig.locale,
      url: `${siteConfig.url}/tools/${tool.slug}`,
      siteName: siteConfig.name,
      title: `${tool.seoTitle} | ${siteConfig.name}`,
      description: tool.seoDescription,
    },
  };
}

/** Renders the real implementation for live tools, placeholder otherwise. */
function ToolImplementation({ slug }: { slug: string }) {
  switch (slug) {
    case "word-counter":
      return <WordCounter />;
    case "character-counter":
      return <CharacterCounter />;
    case "persian-number-converter":
      return <PersianNumberConverter />;
    case "persian-text-cleaner":
      return <PersianTextCleaner />;
    case "number-to-words":
      return <NumberToWords />;
    case "percentage-calculator":
      return <PercentageCalculator />;
    case "discount-calculator":
      return <DiscountCalculator />;
    case "age-calculator":
      return <AgeCalculator />;
    case "image-resizer":
      return <ImageResizer />;
    case "image-compressor":
      return <ImageCompressor />;
    case "image-to-pdf":
      return <ImageToPdf />;
    case "pdf-to-image":
      return <PdfToImage />;
    case "pdf-compressor":
      return <PdfCompressor />;
    case "pdf-merger":
      return <PdfMerger />;
    case "image-format-converter":
      return <ImageFormatConverter />;
    case "image-to-base64":
      return <ImageToBase64 />;
    case "profile-picture":
      return <ProfilePicture />;
    case "loan-calculator":
      return <LoanCalculator />;
    case "bmi-calculator":
      return <BmiCalculator />;
    case "date-diff":
      return <DateDiffCalculator />;
    case "exact-age":
      return <ExactAgeCalculator />;
    case "qr-code-generator":
      return <QrCodeGenerator />;
    case "json-formatter":
      return <JsonFormatter />;
    case "base64-encoder":
      return <Base64Tool />;
    case "url-encoder":
      return <UrlEncoder />;
    default: {
      const tool = getToolBySlug(slug);
      return tool ? <ToolPlaceholder tool={tool} /> : null;
    }
  }
}

export default async function ToolPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const tool = getToolBySlug(slug);
  if (!tool) notFound();

  const toolCategories = categoriesOf(tool)
    .map((slug) => getCategory(slug))
    .filter((category): category is NonNullable<typeof category> => Boolean(category));
  const Icon = tool.icon;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: tool.title,
    applicationCategory: "UtilitiesApplication",
    operatingSystem: "Web",
    inLanguage: "fa",
    offers: { "@type": "Offer", price: "0", priceCurrency: "IRR" },
    url: `${siteConfig.url}/tools/${tool.slug}`,
    description: tool.seoDescription,
  };

  return (
    <Container className="py-8 sm:py-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <RecentToolsTracker slug={tool.slug} />

      <Breadcrumbs
        items={[
          { label: "خانه", href: "/" },
          { label: "ابزارها", href: "/tools" },
          { label: tool.title },
        ]}
      />

      <header className="mt-6 flex items-start gap-4">
        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-brand-600 text-white shadow-card">
          <Icon className="h-7 w-7" aria-hidden="true" />
        </span>
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-extrabold text-ink-900 sm:text-3xl">
              {tool.title}
            </h1>
            {tool.status === "soon" && (
              <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-medium text-amber-700 ring-1 ring-amber-200">
                به‌زودی
              </span>
            )}
          </div>
          <p className="mt-2 max-w-2xl text-sm leading-7 text-ink-600 sm:text-base">
            {tool.description}
          </p>
          {toolCategories.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {toolCategories.map((category) => (
                <a
                  key={category.slug}
                  href={`/categories/${category.slug}`}
                  className="inline-block rounded-full bg-ink-100 px-3 py-1 text-xs font-medium text-ink-600 transition hover:bg-brand-50 hover:text-brand-700"
                >
                  {category.title}
                </a>
              ))}
            </div>
          )}
        </div>
      </header>

      <section
        className="mt-8 rounded-3xl border border-ink-200 bg-ink-50/60 p-4 shadow-card sm:p-6 lg:p-8"
        aria-label={`ابزار ${tool.title}`}
      >
        <ToolImplementation slug={tool.slug} />
      </section>

      <section className="mt-12" aria-labelledby="how-to-heading">
        <p className="text-xs font-bold tracking-wide text-brand-600">
          راهنما
        </p>
        <h2
          id="how-to-heading"
          className="mt-1 text-xl font-extrabold text-ink-900 sm:text-2xl"
        >
          آموزش استفاده از «{tool.title}»
        </h2>
        <ol className="mt-5 grid gap-3 sm:gap-4 lg:grid-cols-3">
          {tool.steps.map((step, index) => (
            <li
              key={step}
              className="flex gap-3 rounded-2xl border border-ink-200 bg-white p-4 shadow-card sm:p-5"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-50 text-sm font-bold text-brand-700">
                {toPersianDigits(index + 1)}
              </span>
              <p className="text-sm leading-7 text-ink-700">{step}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-12" aria-labelledby="about-tool-heading">
        <h2
          id="about-tool-heading"
          className="text-xl font-extrabold text-ink-900 sm:text-2xl"
        >
          درباره «{tool.title}»
        </h2>
        <div className="mt-4 max-w-3xl space-y-4 text-sm leading-8 text-ink-600 sm:text-base">
          <p>{tool.description}</p>
          <p>
            این ابزار به‌صورت رایگان و بدون نیاز به ثبت‌نام در دسترس است. همهٔ
            پردازش‌ها در مرورگر شما انجام می‌شود؛ بنابراین متن یا فایل شما
            هرگز به سرور ارسال نمی‌شود و حریم خصوصی‌تان حفظ می‌شود.
          </p>
          <p>
            اگر ابزار درست کار نکرد یا پیشنهادی برای بهتر شدنش داشتید، از صفحهٔ{" "}
            <Link
              href="/contact"
              className="font-semibold text-brand-600 hover:text-brand-700"
            >
              تماس با ما
            </Link>{" "}
            بنویسید؛ همهٔ ابزارها بر اساس بازخورد کاربران بهتر می‌شوند.
          </p>
        </div>
      </section>

      <div className="mt-12 border-t border-ink-200 pt-10">
        <RelatedTools currentTool={tool} />
      </div>
    </Container>
  );
}
