"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { getToolBySlug, getToolsByCategory } from "@/data/tools";
import { cn } from "@/lib/utils";

/**
 * Horizontal «هم‌خانواده» tabs at the top of a tool page (C2).
 *
 * The competitor does this well: once you are in «مالی و حقوق» you can jump
 * between salary, loan, eidi and interest without going back to the category
 * page. On phones the strip scrolls horizontally instead of stacking, so it
 * costs one row, not four.
 *
 * Only shown when the tool belongs to a family with at least three siblings —
 * a strip of two tabs is just a link.
 */
export function SiblingTabs({ slug }: { slug: string }) {
  const activeRef = useRef<HTMLAnchorElement | null>(null);

  /**
   * On phones the strip is ~2.4 screens wide, so the active tab can start
   * outside the viewport — the user lands on «حقوق» and sees «تخفیف». Scroll the
   * current tab to the middle of the strip once, without animation.
   */
  useEffect(() => {
    const element = activeRef.current;
    if (!element) return;
    const strip = element.closest("nav");
    if (!strip) return;
    const target = element.offsetLeft - strip.clientWidth / 2 + element.clientWidth / 2;
    strip.scrollTo({ left: Math.max(0, target), behavior: "instant" as ScrollBehavior });
  }, [slug]);

  const tool = getToolBySlug(slug);
  if (!tool) return null;
  const siblings = getToolsByCategory(tool.category).filter((item) => item.status === "live");
  if (siblings.length < 3) return null;
  const currentIndex = siblings.findIndex((item) => item.slug === slug);

  return (
    <nav
      aria-label="ابزارهای هم‌خانواده"
      data-testid="sibling-tabs"
      className="sticky top-14 z-20 -mx-3 mt-3 overflow-x-auto border-y border-ink-200/70 bg-white/95 px-3 py-2 backdrop-blur sm:static sm:mx-0 sm:rounded-2xl sm:border sm:px-2"
    >
      <ul className="flex min-w-max items-center gap-1.5">
        {siblings.map((item) => (
          <li key={item.id}>
            <Link
              ref={item.slug === slug ? activeRef : undefined}
              href={`/tools/${item.slug}`}
              aria-current={item.slug === slug ? "page" : undefined}
              className={cn(
                "flex min-h-10 items-center whitespace-nowrap rounded-xl px-3 text-xs font-semibold transition",
                item.slug === slug
                  ? "bg-brand-600 text-white shadow-card"
                  : "text-ink-600 hover:bg-ink-100 hover:text-brand-700",
              )}
            >
              {item.title}
            </Link>
          </li>
        ))}
      </ul>
      <span className="sr-only">{currentIndex + 1}</span>
    </nav>
  );
}
