import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Container } from "@/components/layout/Container";
import { Breadcrumbs } from "@/components/seo/Breadcrumbs";
import { ToolGrid } from "@/components/tools/ToolGrid";
import { categories, getCategory } from "@/data/categories";
import { getToolsByCategory } from "@/data/tools";
import { toPersianDigits } from "@/lib/persian";
import { siteConfig } from "@/config/site";

export function generateStaticParams() {
  return categories.map((category) => ({ slug: category.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const category = getCategory(slug);
  if (!category) {
    return { title: "دسته‌بندی یافت نشد" };
  }
  return {
    title: `ابزارهای ${category.title}`,
    description: `${category.description} ابزارهای رایگان دسته «${category.title}» در ${siteConfig.name}.`,
    alternates: { canonical: `/categories/${category.slug}` },
    openGraph: {
      type: "website",
      locale: siteConfig.locale,
      url: `${siteConfig.url}/categories/${category.slug}`,
      siteName: siteConfig.name,
      title: `ابزارهای ${category.title} | ${siteConfig.name}`,
      description: category.description,
    images: [
      {
        url: "/og-default.png",
        width: 1200,
        height: 630,
        alt: `${siteConfig.name} — ${siteConfig.tagline}`,
      },
    ],
    },
  };
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const category = getCategory(slug);
  if (!category) notFound();

  const categoryTools = getToolsByCategory(slug);
  const Icon = category.icon;

  return (
    <Container className="py-5 sm:py-12">
      <Breadcrumbs
        items={[
          { label: "خانه", href: "/" },
          { label: "ابزارها", href: "/tools" },
          { label: category.title },
        ]}
      />

      <header className="mt-3 flex items-start gap-3 sm:mt-6 sm:gap-4">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-600 text-white shadow-card sm:h-14 sm:w-14 sm:rounded-2xl">
          <Icon className="h-5 w-5 sm:h-7 sm:w-7" aria-hidden="true" />
        </span>
        <div>
          <h1 className="text-lg font-extrabold text-ink-900 sm:text-3xl">
            ابزارهای {category.title}
          </h1>
          <p className="mt-1.5 max-w-2xl text-xs leading-6 text-ink-600 sm:mt-2 sm:text-base sm:leading-7">
            {category.description}
          </p>
          <p className="mt-2 text-xs font-medium text-ink-500">
            {toPersianDigits(categoryTools.length)} ابزار در این دسته‌بندی
          </p>
        </div>
      </header>

      <div className="mt-5 sm:mt-10">
        {categoryTools.length > 0 ? (
          <ToolGrid tools={categoryTools} />
        ) : (
          <p className="rounded-2xl border border-dashed border-ink-300 bg-ink-50 px-6 py-10 text-center text-sm text-ink-600">
            هنوز ابزاری در این دسته‌بندی منتشر نشده است.
          </p>
        )}
      </div>
    </Container>
  );
}
