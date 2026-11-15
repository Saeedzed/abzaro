"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";

import {
  getServerSessionSnapshot,
  getSessionSnapshot,
  signOut as signOutLocal,
  subscribeSession,
} from "@/lib/local-auth";

/**
 * Session state, shared across every component on the page.
 *
 * `useSyncExternalStore` keeps the header chip, the dashboard and the homepage
 * strip in sync: signing in anywhere updates all of them without a reload. The
 * server snapshot is always "signed out", so the prerendered HTML is identical
 * for every visitor — and `ready` only flips after mount, which is what stops
 * the header from swapping its markup during hydration.
 */
export function useSession() {
  const session = useSyncExternalStore(
    subscribeSession,
    getSessionSnapshot,
    getServerSessionSnapshot,
  );
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(true);
  }, []);

  const signOut = useCallback(() => {
    signOutLocal();
  }, []);

  return { session, ready, signOut };
}
