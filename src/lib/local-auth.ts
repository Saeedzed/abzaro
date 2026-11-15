"use client";

/**
 * Local accounts.
 *
 * The site is a static export: there is no server and no database, so a real
 * account cannot live anywhere but the user's own browser. This module is
 * honest about that — it is a *local profile*, and the UI says so.
 *
 * Passwords are never stored. Each profile stores a random salt plus a
 * PBKDF2-SHA256 hash (150k iterations, via WebCrypto), so a copy of
 * localStorage does not hand anyone the password. That is the same scheme a
 * server would use; the only difference is where the data lives.
 */

const ACCOUNTS_KEY = "abzaro-accounts";
const SESSION_KEY = "abzaro-session";
const RECENT_PREFIX = "abzaro-recent-tools:";
const SAVED_PREFIX = "abzaro-saved-tools:";
const LEGACY_RECENT_KEY = "abzaro-recent-tools";

const PBKDF2_ITERATIONS = 150_000;

export interface Profile {
  /** Normalised identifier — email or phone, lower-cased. */
  id: string;
  /** What the person typed as their name. */
  name: string;
  /** Hex salt + hex hash. Never the password itself. */
  salt: string;
  hash: string;
  createdAt: string;
}

/** What the UI is allowed to see — no salt, no hash. */
export interface Session {
  id: string;
  name: string;
  createdAt: string;
}

export type AuthError =
  | "invalid-name"
  | "invalid-id"
  | "weak-password"
  | "password-mismatch"
  | "already-exists"
  | "not-found"
  | "wrong-password"
  | "unsupported";

const toHex = (buffer: ArrayBuffer): string =>
  [...new Uint8Array(buffer)].map((byte) => byte.toString(16).padStart(2, "0")).join("");

const randomSalt = (): string => {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return [...bytes].map((byte) => byte.toString(16).padStart(2, "0")).join("");
};

/** WebCrypto is available on every current browser, but not on plain http. */
export function cryptoAvailable(): boolean {
  return typeof crypto !== "undefined" && Boolean(crypto.subtle);
}

async function hashPassword(password: string, salt: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const bits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: encoder.encode(salt),
      iterations: PBKDF2_ITERATIONS,
      hash: "SHA-256",
    },
    key,
    256,
  );
  return toHex(bits);
}

function readAccounts(): Profile[] {
  try {
    const raw = localStorage.getItem(ACCOUNTS_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Profile[]) : [];
  } catch {
    return [];
  }
}

function writeAccounts(accounts: Profile[]): void {
  try {
    localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
  } catch {
    /* quota / private mode */
  }
}

/** Turn whatever the person typed into a stable identifier. */
export function normaliseIdentifier(input: string): string {
  const value = input.trim().toLowerCase();
  const persian = value.replace(/[۰-۹]/g, (digit) =>
    String(digit.charCodeAt(0) - 0x06f0),
  );
  // Phone numbers: keep the last 10 digits so ۰۹۱۲…, +98912… and 912… are one id.
  const digits = persian.replace(/[^0-9]/g, "");
  if (!persian.includes("@") && digits.length >= 10) {
    return `0${digits.slice(-10)}`;
  }
  return persian;
}

export function validateIdentifier(id: string): boolean {
  if (id.includes("@")) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(id);
  }
  return /^0\d{10}$/.test(id);
}

export async function signUp(input: {
  name: string;
  identifier: string;
  password: string;
  confirm: string;
}): Promise<{ ok: true; session: Session } | { ok: false; error: AuthError }> {
  if (!cryptoAvailable()) return { ok: false, error: "unsupported" };
  const name = input.name.trim();
  if (name.length < 2) return { ok: false, error: "invalid-name" };

  const id = normaliseIdentifier(input.identifier);
  if (!validateIdentifier(id)) return { ok: false, error: "invalid-id" };
  if (input.password.length < 8) return { ok: false, error: "weak-password" };
  if (input.password !== input.confirm) return { ok: false, error: "password-mismatch" };

  const accounts = readAccounts();
  if (accounts.some((account) => account.id === id)) {
    return { ok: false, error: "already-exists" };
  }

  const salt = randomSalt();
  const hash = await hashPassword(input.password, salt);
  const profile: Profile = {
    id,
    name,
    salt,
    hash,
    createdAt: new Date().toISOString(),
  };
  writeAccounts([...accounts, profile]);

  const session: Session = { id, name, createdAt: profile.createdAt };
  writeSession(session);
  migrateLegacyRecent(id);
  return { ok: true, session };
}

export async function signIn(input: {
  identifier: string;
  password: string;
}): Promise<{ ok: true; session: Session } | { ok: false; error: AuthError }> {
  if (!cryptoAvailable()) return { ok: false, error: "unsupported" };
  const id = normaliseIdentifier(input.identifier);
  const account = readAccounts().find((item) => item.id === id);
  if (!account) return { ok: false, error: "not-found" };

  const hash = await hashPassword(input.password, account.salt);
  if (hash !== account.hash) return { ok: false, error: "wrong-password" };

  const session: Session = { id: account.id, name: account.name, createdAt: account.createdAt };
  writeSession(session);
  return { ok: true, session };
}

export function signOut(): void {
  try {
    localStorage.removeItem(SESSION_KEY);
  } catch {
    /* ignore */
  }
  notifySession();
}

export function readSession(): Session | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    const session = parsed as Session;
    return session.id && session.name ? session : null;
  } catch {
    return null;
  }
}

function writeSession(session: Session): void {
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } catch {
    /* ignore */
  }
  notifySession();
}

/* ───────────────────────── shared session store ─────────────────────────
 * Every `useSession` in the page must see a sign-in immediately. Storage
 * events only fire across tabs, and a route change does not remount the
 * header, so the modules keep one cached snapshot and fan out to listeners.
 */

const listeners = new Set<() => void>();
let snapshotRaw: string | null | undefined;
let snapshotSession: Session | null = null;

function notifySession(): void {
  snapshotRaw = undefined;
  listeners.forEach((listener) => listener());
}

/** Subscribe to session changes (used by useSyncExternalStore). */
export function subscribeSession(listener: () => void): () => void {
  listeners.add(listener);
  const onStorage = (event: StorageEvent) => {
    if (event.key === SESSION_KEY || event.key === null) notifySession();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

/**
 * Stable snapshot for useSyncExternalStore: the same object is returned until
 * the stored value actually changes, otherwise React would re-render forever.
 */
export function getSessionSnapshot(): Session | null {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(SESSION_KEY);
  } catch {
    raw = null;
  }
  if (raw === snapshotRaw) return snapshotSession;
  snapshotRaw = raw;
  snapshotSession = readSession();
  return snapshotSession;
}

/** Server snapshot — no storage on the server, so always signed out. */
export function getServerSessionSnapshot(): Session | null {
  return null;
}

/** Per-profile storage keys, so two people on one device never share history. */
export function recentKeyFor(profileId: string): string {
  return `${RECENT_PREFIX}${profileId}`;
}

export function savedKeyFor(profileId: string): string {
  return `${SAVED_PREFIX}${profileId}`;
}

/**
 * A visitor who used tools before signing up should keep that history on their
 * new profile. The pre-login list is anonymous, so it is copied once.
 */
function migrateLegacyRecent(profileId: string): void {
  try {
    const legacy = localStorage.getItem(LEGACY_RECENT_KEY);
    if (!legacy) return;
    const target = recentKeyFor(profileId);
    if (!localStorage.getItem(target)) localStorage.setItem(target, legacy);
  } catch {
    /* ignore */
  }
}

/** Delete the profile and everything under it. Used by «حذف حساب». */
export function deleteAccount(profileId: string): void {
  writeAccounts(readAccounts().filter((account) => account.id !== profileId));
  try {
    localStorage.removeItem(recentKeyFor(profileId));
    localStorage.removeItem(savedKeyFor(profileId));
    localStorage.removeItem(SESSION_KEY);
  } catch {
    /* ignore */
  }
}

/** True when this browser already has at least one profile (for the CTA copy). */
export function hasLocalAccounts(): boolean {
  return readAccounts().length > 0;
}

export const AUTH_ERRORS: Record<AuthError, string> = {
  "invalid-name": "نام باید دست‌کم ۲ حرف باشد.",
  "invalid-id": "ایمیل یا شمارهٔ موبایل معتبر نیست. مثال: name@example.com یا ۰۹۱۲۳۴۵۶۷۸۹",
  "weak-password": "رمز عبور باید دست‌کم ۸ کاراکتر باشد.",
  "password-mismatch": "رمز و تکرار آن یکسان نیستند.",
  "already-exists": "با این ایمیل/شماره قبلاً پروفایل ساخته شده. وارد شوید.",
  "not-found": "پروفایلی با این ایمیل/شماره در این مرورگر پیدا نشد.",
  "wrong-password": "رمز عبور درست نیست.",
  unsupported: "مرورگر شما از رمزنگاری WebCrypto پشتیبانی نمی‌کند؛ این صفحه روی https یا localhost کار می‌کند.",
};
