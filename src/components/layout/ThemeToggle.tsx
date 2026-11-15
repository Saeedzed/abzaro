"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

type Theme = "light" | "dark";
const STORAGE_KEY = "abzaro-theme";

function apply(theme: Theme) {
  const root = document.documentElement;
  root.classList.toggle("dark", theme === "dark");
  root.style.colorScheme = theme;
}

/** Light/dark switch. Remembers the choice; falls back to the OS preference. */
export function ThemeToggle({ className = "" }: { className?: string }) {
  // Rendered `null`-safe: the real value is read on mount to match the inline
  // script in <head>, so server and client HTML stay identical.
  const [theme, setTheme] = useState<Theme | null>(null);

  useEffect(() => {
    setTheme(
      document.documentElement.classList.contains("dark") ? "dark" : "light",
    );
  }, []);

  function toggle() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    apply(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* storage can be blocked — the toggle still works for this visit */
    }
  }

  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark ? "روشن‌کردن حالت روز" : "تاریک‌کردن حالت شب"}
      title={isDark ? "حالت روز" : "حالت شب"}
      aria-pressed={isDark}
      className={`flex h-11 w-11 items-center justify-center rounded-lg text-ink-600 transition hover:bg-ink-100 hover:text-ink-900 ${className}`}
    >
      {theme === null ? (
        <span className="h-4.5 w-4.5" aria-hidden="true" />
      ) : isDark ? (
        <Sun className="h-4.5 w-4.5" aria-hidden="true" />
      ) : (
        <Moon className="h-4.5 w-4.5" aria-hidden="true" />
      )}
    </button>
  );
}
