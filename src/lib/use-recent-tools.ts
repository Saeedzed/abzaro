"use client";

import { useCallback, useEffect, useState } from "react";

import { recentKeyFor, readSession, savedKeyFor } from "@/lib/local-auth";

/**
 * Recent + saved tools, per profile.
 *
 * Signed-out visitors keep using the anonymous list (so the homepage strip
 * still works before anyone signs up). Once a profile exists, the lists live
 * under that profile's key, which is what makes «ابزارهای اخیرِ هر نفر»
 * genuinely different per person on a device with several profiles.
 */
const ANON_RECENT_KEY = "abzaro-recent-tools";
const MAX_RECENT = 6;
const MAX_SAVED = 24;

function readList(key: string): string[] {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === "string")
      : [];
  } catch {
    return [];
  }
}

function writeList(key: string, values: string[]): void {
  try {
    localStorage.setItem(key, JSON.stringify(values));
  } catch {
    /* private mode / quota — never a hard failure */
  }
}

/** Current storage key for recent tools (profile-scoped when signed in). */
function currentRecentKey(): string {
  const session = readSession();
  return session ? recentKeyFor(session.id) : ANON_RECENT_KEY;
}

export function readRecentSlugs(): string[] {
  return readList(currentRecentKey());
}

export function rememberTool(slug: string): void {
  const key = currentRecentKey();
  const next = [slug, ...readList(key).filter((item) => item !== slug)].slice(0, MAX_RECENT);
  writeList(key, next);
}

export function clearRecentTools(): void {
  try {
    localStorage.removeItem(currentRecentKey());
  } catch {
    /* ignore */
  }
}

export function readSavedSlugs(): string[] {
  const session = readSession();
  if (!session) return [];
  return readList(savedKeyFor(session.id));
}

export function toggleSavedTool(slug: string): string[] {
  const session = readSession();
  if (!session) return [];
  const key = savedKeyFor(session.id);
  const current = readList(key);
  const next = current.includes(slug)
    ? current.filter((item) => item !== slug)
    : [slug, ...current].slice(0, MAX_SAVED);
  writeList(key, next);
  return next;
}

/**
 * Client hook for the recent strip. Starts empty on the server so the
 * prerendered HTML stays static, then hydrates from storage on mount.
 * Re-reads when the profile changes (the `profileId` argument) so signing in
 * or out immediately swaps the list.
 */
export function useRecentTools(profileId?: string | null) {
  const [slugs, setSlugs] = useState<string[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setSlugs(readRecentSlugs());
    setReady(true);
  }, [profileId]);

  const clear = useCallback(() => {
    clearRecentTools();
    setSlugs([]);
  }, []);

  return { slugs, ready, clear };
}

/** Hook for the saved-tools list on /dashboard. */
export function useSavedTools(profileId?: string | null) {
  const [slugs, setSlugs] = useState<string[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setSlugs(readSavedSlugs());
    setReady(true);
  }, [profileId]);

  const toggle = useCallback((slug: string) => {
    setSlugs(toggleSavedTool(slug));
  }, []);

  return { slugs, ready, toggle };
}
