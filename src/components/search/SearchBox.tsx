"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CornerDownLeft, Search, SearchX } from "lucide-react";
import { tools } from "@/data/tools";
import { getCategory } from "@/data/categories";
import { cn } from "@/lib/utils";

interface SearchBoxProps {
  size?: "default" | "large";
  placeholder?: string;
  className?: string;
  autoFocus?: boolean;
}

/**
 * Live tool search. Filters the tool registry by title, description and
 * keywords as the user types. Fully client-side — no network requests.
 */
export function SearchBox({
  size = "default",
  placeholder = "جستجوی ابزار…",
  className,
  autoFocus = false,
}: SearchBoxProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const results = useMemo(() => {
    const q = query.trim();
    if (!q) return [];
    return tools
      .filter((tool) =>
        [tool.title, tool.description, tool.seoTitle, ...tool.keywords]
          .join(" ")
          .includes(q),
      )
      .slice(0, 6);
  }, [query]);

  useEffect(() => {
    setActiveIndex(0);
  }, [results]);

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setOpen(true);
      setActiveIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (event.key === "Enter") {
      event.preventDefault();
      const target = results[activeIndex];
      if (target) {
        router.push(`/tools/${target.slug}`);
        setOpen(false);
      }
    } else if (event.key === "Escape") {
      setOpen(false);
      inputRef.current?.blur();
    }
  }

  const showDropdown = open && query.trim().length > 0;
  const isLarge = size === "large";

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <form
        role="search"
        onSubmit={(event) => event.preventDefault()}
        className={cn(
          "flex items-center gap-2 rounded-xl border border-ink-200 bg-white shadow-card transition focus-within:border-brand-400 focus-within:ring-4 focus-within:ring-brand-100",
          isLarge ? "px-4 py-3.5" : "px-3 py-2",
        )}
      >
        <Search
          className={cn(
            "shrink-0 text-ink-400",
            isLarge ? "h-5 w-5" : "h-4 w-4",
          )}
          aria-hidden="true"
        />
        <input
          ref={inputRef}
          type="search"
          value={query}
          autoFocus={autoFocus}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          aria-label="جستجوی ابزار"
          aria-expanded={showDropdown}
          aria-controls="search-results"
          role="combobox"
          aria-activedescendant={
            results[activeIndex] ? `search-result-${results[activeIndex].slug}` : undefined
          }
          className={cn(
            "w-full bg-transparent outline-none placeholder:text-ink-400",
            isLarge ? "text-base sm:text-lg" : "text-sm",
          )}
        />
        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              inputRef.current?.focus();
            }}
            className="shrink-0 rounded-md px-1.5 py-0.5 text-xs text-ink-400 transition hover:bg-ink-100 hover:text-ink-600"
            aria-label="پاک کردن جستجو"
          >
            ✕
          </button>
        )}
      </form>

      {showDropdown && (
        <div
          id="search-results"
          role="listbox"
          className="absolute inset-x-0 top-full z-50 mt-2 overflow-hidden rounded-xl border border-ink-200 bg-white shadow-card-hover"
        >
          {results.length > 0 ? (
            <ul className="max-h-80 overflow-y-auto py-1.5">
              {results.map((tool, index) => {
                const Icon = tool.icon;
                const category = getCategory(tool.category);
                const isActive = index === activeIndex;
                return (
                  <li key={tool.id} role="option" aria-selected={isActive}>
                    <Link
                      id={`search-result-${tool.slug}`}
                      href={`/tools/${tool.slug}`}
                      onMouseEnter={() => setActiveIndex(index)}
                      onClick={() => setOpen(false)}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 transition",
                        isActive ? "bg-brand-50" : "bg-white",
                      )}
                    >
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                        <Icon className="h-4.5 w-4.5" aria-hidden="true" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-2">
                          <span className="truncate text-sm font-medium text-ink-900">
                            {tool.title}
                          </span>
                          {tool.status === "soon" && (
                            <span className="shrink-0 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700 ring-1 ring-amber-200">
                              به‌زودی
                            </span>
                          )}
                        </span>
                        {category && (
                          <span className="block truncate text-xs text-ink-500">
                            {category.title}
                          </span>
                        )}
                      </span>
                      {isActive && (
                        <CornerDownLeft
                          className="h-4 w-4 shrink-0 text-ink-400"
                          aria-hidden="true"
                        />
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="flex items-center gap-3 px-4 py-5 text-sm text-ink-500">
              <SearchX className="h-5 w-5 shrink-0 text-ink-400" aria-hidden="true" />
              <span>
                ابزاری برای «{query.trim()}» پیدا نشد. عبارت دیگری را امتحان کنید.
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
