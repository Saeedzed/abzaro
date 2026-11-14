import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, CalendarDays, Clock } from "lucide-react";
import { Container } from "@/components/layout/Container";
import { posts } from "@/data/posts";
import { toPersianDigits } from "@/lib/persian";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: "وبلاگ ابزارو",
  description: `مقالات و راهنماهای کاربردی ${siteConfig.name} دربارهٔ کار با ابزارهای آنلاین، متن فارسی و اعداد.`,
  alternates: { canonical: "/blog" },
};

function formatPostDate(isoDate: string): string {
  // Noon UTC avoids the day shifting in local timezones.
  return new Intl.DateTimeFormat("fa-IR", { dateStyle: "long" }).format(
    new Date(`${isoDate}T12:00:00`),
  );
}

export default function BlogPage() {
  return (
    <Container className="py-10 sm:py-14">
      <div className="max-w-2xl">
        <h1 className="text-3xl font-extrabold text-ink-900 sm:text-4xl">
          وبلاگ ابزارو
        </h1>
        <p className="mt-3 text-sm leading-7 text-ink-600 sm:text-base">
          راهنماها و نکته‌های کاربردی برای کار بهتر با ابزارهای آنلاین و متن
          فارسی.
        </p>
      </div>

      <div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
        {posts.map((post) => (
          <article
            key={post.slug}
            className="group flex h-full flex-col rounded-2xl border border-ink-200 bg-white p-6 shadow-card transition duration-200 hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-card-hover"
          >
            <div className="flex items-center gap-4 text-xs text-ink-500">
              <span className="flex items-center gap-1.5">
                <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
                {formatPostDate(post.date)}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                {toPersianDigits(post.readingMinutes)} دقیقه مطالعه
              </span>
            </div>
            <h2 className="mt-4 text-lg font-bold leading-8 text-ink-900">
              <Link
                href={`/blog/${post.slug}`}
                className="transition group-hover:text-brand-700"
              >
                {post.title}
              </Link>
            </h2>
            <p className="mt-2 line-clamp-3 flex-1 text-sm leading-7 text-ink-600">
              {post.excerpt}
            </p>
            <Link
              href={`/blog/${post.slug}`}
              className="mt-5 flex items-center gap-1.5 text-sm font-semibold text-brand-600 transition hover:text-brand-700"
            >
              خواندن مقاله
              <ArrowLeft
                className="h-4 w-4 transition-transform group-hover:-translate-x-0.5"
                aria-hidden="true"
              />
            </Link>
          </article>
        ))}
      </div>
    </Container>
  );
}
