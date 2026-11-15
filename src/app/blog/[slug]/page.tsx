import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, CalendarDays, Clock } from "lucide-react";
import { Container } from "@/components/layout/Container";
import { Breadcrumbs } from "@/components/seo/Breadcrumbs";
import { getPostBySlug, posts } from "@/data/posts";
import { tools } from "@/data/tools";
import { toPersianDigits } from "@/lib/persian";
import { siteConfig } from "@/config/site";

export function generateStaticParams() {
  return posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) {
    return { title: "مقاله یافت نشد" };
  }
  return {
    title: post.title,
    description: post.excerpt,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      type: "article",
      locale: siteConfig.locale,
      url: `${siteConfig.url}/blog/${post.slug}`,
      siteName: siteConfig.name,
      title: `${post.title} | ${siteConfig.name}`,
      description: post.excerpt,
      publishedTime: post.date,
    },
  };
}

function formatPostDate(isoDate: string): string {
  return new Intl.DateTimeFormat("fa-IR", { dateStyle: "long" }).format(
    new Date(`${isoDate}T12:00:00`),
  );
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) notFound();

  const linkedTool = post.tool ? tools.find((tool) => tool.slug === post.tool) : undefined;
  const relatedTools = (post.related ?? [])
    .map((relatedSlug) => tools.find((tool) => tool.slug === relatedSlug))
    .filter((tool): tool is (typeof tools)[number] => Boolean(tool));

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.excerpt,
    inLanguage: "fa",
    datePublished: post.date,
    author: { "@type": "Organization", name: siteConfig.name },
    publisher: { "@type": "Organization", name: siteConfig.name },
    url: `${siteConfig.url}/blog/${post.slug}`,
  };

  return (
    <Container className="py-8 sm:py-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <Breadcrumbs
        items={[
          { label: "خانه", href: "/" },
          { label: "وبلاگ", href: "/blog" },
          { label: post.title },
        ]}
      />

      <article className="mx-auto mt-8 max-w-3xl">
        <h1 className="text-2xl font-extrabold leading-snug text-ink-900 sm:text-3xl sm:leading-snug">
          {post.title}
        </h1>
        <div className="mt-4 flex flex-wrap items-center gap-4 border-b border-ink-200 pb-6 text-sm text-ink-500">
          <span className="flex items-center gap-1.5">
            <CalendarDays className="h-4 w-4" aria-hidden="true" />
            {formatPostDate(post.date)}
          </span>
          <span className="flex items-center gap-1.5">
            <Clock className="h-4 w-4" aria-hidden="true" />
            {toPersianDigits(post.readingMinutes)} دقیقه مطالعه
          </span>
        </div>

        <div className="mt-8 space-y-5 text-sm leading-9 text-ink-700 sm:text-base">
          {post.content.map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
        </div>

        {linkedTool ? (
          <div
            data-testid="post-tool-cta"
            className="mt-10 rounded-2xl border border-brand-200 bg-brand-50 p-6"
          >
            <p className="text-sm font-bold text-ink-900">{linkedTool.title}</p>
            <p className="mt-2 text-sm leading-7 text-ink-600">{linkedTool.description}</p>
            <Link
              href={`/tools/${linkedTool.slug}`}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700"
            >
              رفتن به ابزار
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        ) : null}

        {relatedTools.length > 0 ? (
          <div className="mt-4 space-y-2">
            <p className="text-xs font-bold text-ink-500">ابزارهای مرتبط</p>
            <ul className="flex flex-wrap gap-2">
              {relatedTools.map((tool) => (
                <li key={tool.slug}>
                  <Link
                    href={`/tools/${tool.slug}`}
                    className="inline-block rounded-full border border-ink-200 px-3 py-1 text-xs text-ink-700 transition hover:border-brand-300 hover:text-brand-700"
                  >
                    {tool.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <div className="mt-10 rounded-2xl border border-ink-200 bg-ink-50 p-6">
          <p className="text-sm font-bold text-ink-900">
            همین حالا ابزارها را امتحان کنید
          </p>
          <p className="mt-2 text-sm leading-7 text-ink-600">
            همهٔ ابزارهای ابزارو رایگان هستند و بدون ثبت‌نام کار می‌کنند.
          </p>
          <Link
            href="/tools"
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700"
          >
            مشاهده ابزارها
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </article>
    </Container>
  );
}
