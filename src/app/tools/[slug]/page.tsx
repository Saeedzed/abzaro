import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/layout/Container";
import { Breadcrumbs } from "@/components/seo/Breadcrumbs";
import { DuplicateLineRemover } from "@/components/tools/DuplicateLineRemover";
import { LineSorter } from "@/components/tools/LineSorter";
import { KeywordDensity } from "@/components/tools/KeywordDensity";
import { SlugGenerator } from "@/components/tools/SlugGenerator";
import { DateConverter } from "@/components/tools/DateConverter";
import { UnitConverter } from "@/components/tools/UnitConverter";
import { BankInterestCalculator } from "@/components/tools/BankInterestCalculator";
import { JwtDecoder } from "@/components/tools/JwtDecoder";
import { HashGenerator } from "@/components/tools/HashGenerator";
import { RelatedTools } from "@/components/tools/RelatedTools";
import { RecentToolsTracker } from "@/components/tools/RecentToolsTracker";
import { toPersianDigits } from "@/lib/persian";
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
import { ImageFormatConverter } from "@/components/tools/ImageFormatConverter";
import { ImageToBase64 } from "@/components/tools/ImageToBase64";
import { ProfilePicture } from "@/components/tools/ProfilePicture";
import { LoanCalculator } from "@/components/tools/LoanCalculator";
import { BmiCalculator } from "@/components/tools/BmiCalculator";
import { DateDiffCalculator } from "@/components/tools/DateDiffCalculator";
import { ExactAgeCalculator } from "@/components/tools/ExactAgeCalculator";
import { JsonFormatter } from "@/components/tools/JsonFormatter";
import { Base64Tool } from "@/components/tools/Base64Tool";
import { UrlEncoder } from "@/components/tools/UrlEncoder";
import { SalaryTaxCalculator } from "@/components/tools/SalaryTaxCalculator";
import { EidiSanavatCalculator } from "@/components/tools/EidiSanavatCalculator";
import { ImageCropper } from "@/components/tools/ImageCropper";
import { MonthCalendar } from "@/components/tools/MonthCalendar";
import { TimestampConverter } from "@/components/tools/TimestampConverter";
import { CsvJsonConverter } from "@/components/tools/CsvJsonConverter";
import { ColorPicker } from "@/components/tools/ColorPicker";
import { FindReplace } from "@/components/tools/FindReplace";
import { PasswordGenerator } from "@/components/tools/PasswordGenerator";
import { PersianLorem } from "@/components/tools/PersianLorem";
import { ToolPlaceholder } from "@/components/tools/ToolPlaceholder";
import { HeavyTool, PdfPageToolLoader } from "@/components/tools/HeavyTools";
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
      return <HeavyTool slug="image-to-pdf" />;
    case "pdf-to-image":
      return <HeavyTool slug="pdf-to-image" />;
    case "pdf-compressor":
      return <HeavyTool slug="pdf-compressor" />;
    case "pdf-merger":
      return <HeavyTool slug="pdf-merger" />;
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
      return <HeavyTool slug="qr-code-generator" />;
    case "json-formatter":
      return <JsonFormatter />;
    case "base64-encoder":
      return <Base64Tool />;
    case "url-encoder":
      return <UrlEncoder />;

    case "duplicate-line-remover":
      return <DuplicateLineRemover />;
    case "line-sorter":
      return <LineSorter />;
    case "keyword-density":
      return <KeywordDensity />;
    case "slug-generator":
      return <SlugGenerator />;
    case "date-converter":
      return <DateConverter />;
    case "unit-converter":
      return <UnitConverter />;
    case "bank-interest":
      return <BankInterestCalculator />;
    case "heic-to-jpg":
      return <HeavyTool slug="heic-to-jpg" />;
    case "pdf-rotate":
      return <PdfPageToolLoader kind="rotate" />;
    case "pdf-delete-pages":
      return <PdfPageToolLoader kind="delete" />;
    case "pdf-split":
      return <PdfPageToolLoader kind="split" />;
    case "jwt-decoder":
      return <JwtDecoder />;
    case "hash-generator":
      return <HashGenerator />;
    case "video-compressor":
      return <HeavyTool slug="video-compressor" />;
    case "video-to-gif":
      return <HeavyTool slug="video-to-gif" />;
    case "video-to-audio":
      return <HeavyTool slug="video-to-audio" />;
    case "video-trimmer":
      return <HeavyTool slug="video-trimmer" />;
    case "video-resizer":
      return <HeavyTool slug="video-resizer" />;
    case "salary-tax":
      return <SalaryTaxCalculator />;
    case "eidi-sanavat":
      return <EidiSanavatCalculator />;
    case "image-crop":
      return <ImageCropper />;
    case "month-calendar":
      return <MonthCalendar />;
    case "timestamp-converter":
      return <TimestampConverter />;
    case "csv-json":
      return <CsvJsonConverter />;
    case "color-picker":
      return <ColorPicker />;
    case "find-replace":
      return <FindReplace />;
    case "password-generator":
      return <PasswordGenerator />;
    case "persian-lorem":
      return <PersianLorem />;
    case "pdf-reorder":
      return <HeavyTool slug="pdf-reorder" />;
    case "pdf-watermark":
      return <HeavyTool slug="pdf-watermark" />;
    case "favicon-generator":
      return <HeavyTool slug="favicon-generator" />;
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
    <Container className="py-5 sm:py-12">
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

      <header className="mt-3 flex items-start gap-3 sm:mt-6 sm:gap-4">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-600 text-white shadow-card sm:h-14 sm:w-14 sm:rounded-2xl">
          <Icon className="h-5 w-5 sm:h-7 sm:w-7" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-lg font-extrabold text-ink-900 sm:text-3xl">
              {tool.title}
            </h1>
            {tool.status === "soon" && (
              <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-medium text-amber-700 ring-1 ring-amber-200">
                به‌زودی
              </span>
            )}
          </div>
          <p className="mt-1.5 max-w-2xl text-xs leading-6 text-ink-600 sm:mt-2 sm:text-base sm:leading-7">
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
        className="mt-4 rounded-2xl border border-ink-200 bg-ink-50/60 p-2.5 shadow-card sm:mt-8 sm:rounded-3xl sm:p-6 lg:p-8"
        aria-label={`ابزار ${tool.title}`}
      >
        <ToolImplementation slug={tool.slug} />
      </section>

      <section className="mt-8 sm:mt-12" aria-labelledby="how-to-heading">
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
