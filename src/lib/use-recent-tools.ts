"use client";

import { useCallback, useEffect, useState } from "react";

/** Recent tools + recently copied, all in localStorage (no cookies, no server). */
const RECENT_KEY = "abzaro-recent-tools";
const MAX_RECENT = 6;

/** Read the stored slugs, newest first. Safe when storage is unavailable. */
export function readRecentSlugs(): string[] {
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === "string")
      : [];
  } catch {
    return [];
  }
}

/**
 * Record that a tool was opened. De-duplicates and keeps the list short so the
 * homepage strip never turns into a second tool directory.
 */
export function rememberTool(slug: string): void {
  try {
    const next = [slug, ...readRecentSlugs().filter((item) => item !== slug)].slice(
      0,
      MAX_RECENT,
    );
    localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  } catch {
    /* private mode / quota — recent tools are a nicety, never a hard failure */
  }
}

export function clearRecentTools(): void {
  try {
    localStorage.removeItem(RECENT_KEY);
  } catch {
    /* ignore */
  }
}

/**
 * Client hook returning the recent slugs. Starts empty on the server so the
 * prerendered HTML stays static, then hydrates from storage on mount.
 */
export function useRecentTools() {
  const [slugs, setSlugs] = useState<string[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setSlugs(readRecentSlugs());
    setReady(true);
  }, []);

  const clear = useCallback(() => {
    clearRecentTools();
    setSlugs([]);
  }, []);

  return { slugs, ready, clear };
}
