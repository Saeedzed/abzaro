"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Command,
  CornerDownLeft,
  Search,
  SearchX,
  Sparkles,
} from "lucide-react";
import { tools } from "@/data/tools";
import { categories } from "@/data/categories";
import { searchTools } from "@/lib/search";
import { IconTile } from "@/components/ui/IconTile";
import { cn } from "@/lib/utils";

/**
 * Site-wide command palette (`Ctrl/⌘ + K`): searches every tool from any page
 * and offers a few shortcuts. Keyboard-first — ↑ ↓ to move, Enter to open,
 * Esc to close. No network calls; the tool registry is already in the bundle.
 */
export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  /* Global shortcut + custom event so other components can open the palette */
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const isK = event.key.toLowerCase() === "k";
      if (isK && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setOpen((value) => !value);
      } else if (event.key === "Escape") {
        setOpen(false);
      }
    }
    function onOpenRequest() {
      setOpen(true);
    }
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("abzaro:open-search", onOpenRequest);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("abzaro:open-search", onOpenRequest);
    };
  }, []);

  /* Focus the field and lock background scrolling while open */
  useEffect(() => {
    if (!open) return;
    const timer = window.setTimeout(() => inputRef.current?.focus(), 30);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.clearTimeout(timer);
      document.body.style.overflow = previous;
    };
  }, [open]);

  const results = useMemo(() => searchTools(query, tools, 8), [query]);
  const matchedCategories = useMemo(() => {
    const q = query.trim();
    if (!q) return [];
    return categories.filter((category) => category.title.includes(q)).slice(0, 3);
  }, [query]);

  const total = results.length + matchedCategories.length;

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  function close() {
    setOpen(false);
    setQuery("");
  }

  function go(slug: string) {
    close();
    router.push(`/tools/${slug}`);
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((i) => (total === 0 ? 0 : (i + 1) % total));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((i) => (total === 0 ? 0 : (i - 1 + total) % total));
    } else if (event.key === "Enter") {
      event.preventDefault();
      if (activeIndex < results.length) {
        const tool = results[activeIndex];
        if (tool) go(tool.slug);
      } else {
        const category = matchedCategories[activeIndex - results.length];
        if (category) {
          close();
          router.push(`/categories/${category.slug}`);
        }
      }
    }
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-ink-950/40 p-4 pt-[12vh] backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="جست‌وجوی سراسری ابزارها"
      onClick={(event) => {
        if (event.target === event.currentTarget) close();
      }}
    >
      <div className="w-full max-w-xl overflow-hidden rounded-2xl border border-ink-200 bg-white shadow-card-hover">
        <div className="flex items-center gap-2.5 border-b border-ink-200 px-4 py-3">
          <Search className="h-4.5 w-4.5 shrink-0 text-ink-400" aria-hidden="true" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={onKeyDown}
            placeholder="نام ابزار را بنویس… (مثلاً فشرده‌سازی یا PDF)"
            aria-label="جست‌وجوی ابزار"
            data-testid="command-palette-input"
            className="w-full bg-transparent text-sm outline-none placeholder:text-ink-400"
          />
          <kbd className="hidden shrink-0 rounded border border-ink-200 px-1.5 py-0.5 text-[10px] font-medium text-ink-500 sm:block">
            ESC
          </kbd>
        </div>

        <div className="max-h-[52vh] overflow-y-auto p-2">
          {query.trim() === "" ? (
            <div className="p-2">
              <p className="px-2 pb-2 text-[11px] font-bold text-ink-400">
                میان‌بُرها
              </p>
              {[
                { href: "/tools", label: "همهٔ ابزارها", icon: Sparkles },
                { href: "/categories", label: "دسته‌بندی‌ها", icon: ArrowLeft },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.href}
                    type="button"
                    onClick={() => {
                      close();
                      router.push(item.href);
                    }}
                    className="flex w-full items-center gap-3 rounded-xl px-2 py-2.5 text-start transition hover:bg-ink-100"
                  >
                    <IconTile icon={Icon} size="sm" />
                    <span className="text-sm font-medium text-ink-800">
                      {item.label}
                    </span>
                  </button>
                );
              })}
              <p className="mt-2 hidden px-2 text-[11px] leading-6 text-ink-400 sm:block">
                از هر صفحه‌ای با{" "}
                <kbd className="rounded border border-ink-200 px-1 text-[10px]">
                  Ctrl
                </kbd>{" "}
                +{" "}
                <kbd className="rounded border border-ink-200 px-1 text-[10px]">
                  K
                </kbd>{" "}
                این پنجره را باز کن.
              </p>
            </div>
          ) : total === 0 ? (
            <div className="flex flex-col items-center px-4 py-10 text-center">
              <SearchX className="h-7 w-7 text-ink-400" aria-hidden="true" />
              <p className="mt-3 text-sm font-bold text-ink-900">
                ابزاری با این نام پیدا نشد
              </p>
              <p className="mt-1 text-xs leading-6 text-ink-500">
                املای دیگری را امتحان کن یا از صفحهٔ همهٔ ابزارها استفاده کن.
              </p>
            </div>
          ) : (
            <ul role="listbox" aria-label="نتایج جست‌وجو">
              {results.map((tool, index) => {
                const Icon = tool.icon;
                const active = index === activeIndex;
                return (
                  <li key={tool.id} role="option" aria-selected={active}>
                    <button
                      type="button"
                      onClick={() => go(tool.slug)}
                      onMouseEnter={() => setActiveIndex(index)}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-xl px-2 py-2 text-start transition",
                        active ? "bg-brand-50" : "hover:bg-ink-100",
                      )}
                    >
                      <IconTile icon={Icon} size="sm" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-ink-900">
                          {tool.title}
                        </span>
                        <span className="block truncate text-[11px] text-ink-500">
                          {tool.description}
                        </span>
                      </span>
                      {active && (
                        <CornerDownLeft
                          className="h-4 w-4 shrink-0 text-ink-400"
                          aria-hidden="true"
                        />
                      )}
                    </button>
                  </li>
                );
              })}

              {matchedCategories.map((category, offset) => {
                const index = results.length + offset;
                const active = index === activeIndex;
                const Icon = category.icon;
                return (
                  <li key={`cat-${category.slug}`} role="option" aria-selected={active}>
                    <button
                      type="button"
                      onClick={() => {
                        close();
                        router.push(`/categories/${category.slug}`);
                      }}
                      onMouseEnter={() => setActiveIndex(index)}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-xl px-2 py-2 text-start transition",
                        active ? "bg-brand-50" : "hover:bg-ink-100",
                      )}
                    >
                      <IconTile icon={Icon} size="sm" solid />
                      <span className="text-sm font-medium text-ink-900">
                        دستهٔ {category.title}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-ink-200 px-4 py-2 text-[11px] text-ink-500">
          <span className="flex items-center gap-1.5">
            <Command className="h-3 w-3" aria-hidden="true" />
            جست‌وجوی سریع از هر صفحه
          </span>
          <span>↑ ↓ برای جابه‌جایی · Enter برای باز کردن</span>
        </div>
      </div>
    </div>
  );
}
