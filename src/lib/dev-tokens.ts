/**
 * Developer helpers: JWT decoding and hashing.
 *
 * JWT decoding is read-only and never verifies a signature — the tool says so
 * in the UI, because a decoded token is not a trusted token. Hashing uses the
 * browser's Web Crypto API (SHA-1/256/384/512) and falls back to a small MD5
 * implementation, since Web Crypto deliberately does not expose MD5.
 */

/* -------------------------------------------------------------------------- */
/*  JWT                                                                       */
/* -------------------------------------------------------------------------- */

export interface JwtParts {
  header: Record<string, unknown>;
  payload: Record<string, unknown>;
  /** Raw base64url segments, for the "copy" buttons. */
  headerRaw: string;
  payloadRaw: string;
  signature: string;
  headerJson: string;
  payloadJson: string;
  /** Seconds until expiry, null when the token has no `exp`. */
  expiresInSeconds: number | null;
  expiresAt: Date | null;
  expired: boolean | null;
  /** ISO timestamp of `iat`, when present. */
  issuedAt: Date | null;
  algorithm: string | null;
  type: string | null;
}

export type JwtResult =
  | { ok: true; parts: JwtParts }
  | { ok: false; error: string };

/** base64url → UTF-8 string. */
function decodeSegment(segment: string): string {
  const base64 = segment.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

function parseJsonObject(text: string, label: string): Record<string, unknown> {
  const parsed: unknown = JSON.parse(text);
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    throw new Error(`${label} یک شیء JSON نیست.`);
  }
  return parsed as Record<string, unknown>;
}

/**
 * Decode a JWT without verifying it. `now` is injectable so tests stay
 * deterministic.
 */
export function decodeJwt(token: string, now: Date = new Date()): JwtResult {
  const trimmed = token.trim().replace(/^Bearer\s+/i, "");
  if (!trimmed) return { ok: false, error: "توکن را وارد کنید." };

  const segments = trimmed.split(".");
  if (segments.length < 2) {
    return { ok: false, error: "توکن JWT باید حداقل دو بخش داشته باشد که با نقطه جدا شده‌اند." };
  }

  const [headerSeg, payloadSeg, signatureSeg = ""] = segments;
  if (!headerSeg || !payloadSeg) {
    return { ok: false, error: "ساختار توکن کامل نیست." };
  }

  let headerText: string;
  let payloadText: string;
  let header: Record<string, unknown>;
  let payload: Record<string, unknown>;

  try {
    headerText = decodeSegment(headerSeg);
  } catch {
    return { ok: false, error: "بخش هدر با base64url معتبر کدگذاری نشده است." };
  }
  try {
    payloadText = decodeSegment(payloadSeg);
  } catch {
    return { ok: false, error: "بخش payload با base64url معتبر کدگذاری نشده است." };
  }
  try {
    header = parseJsonObject(headerText, "هدر");
  } catch {
    return { ok: false, error: "هدر توکن JSON معتبری نیست." };
  }
  try {
    payload = parseJsonObject(payloadText, "payload");
  } catch {
    return { ok: false, error: "payload توکن JSON معتبری نیست." };
  }

  const exp = typeof payload.exp === "number" ? payload.exp : null;
  const iat = typeof payload.iat === "number" ? payload.iat : null;
  const expiresAt = exp === null ? null : new Date(exp * 1000);

  return {
    ok: true,
    parts: {
      header,
      payload,
      headerRaw: headerSeg,
      payloadRaw: payloadSeg,
      signature: signatureSeg,
      headerJson: JSON.stringify(header, null, 2),
      payloadJson: JSON.stringify(payload, null, 2),
      expiresInSeconds: exp === null ? null : Math.round(exp - now.getTime() / 1000),
      expiresAt,
      expired: exp === null ? null : exp * 1000 <= now.getTime(),
      issuedAt: iat === null ? null : new Date(iat * 1000),
      algorithm: typeof header.alg === "string" ? header.alg : null,
      type: typeof header.typ === "string" ? header.typ : null,
    },
  };
}

/* -------------------------------------------------------------------------- */
/*  Hashing                                                                   */
/* -------------------------------------------------------------------------- */

export type HashAlgorithm = "MD5" | "SHA-1" | "SHA-256" | "SHA-384" | "SHA-512";

export const HASH_ALGORITHMS: HashAlgorithm[] = ["MD5", "SHA-1", "SHA-256", "SHA-384", "SHA-512"];

/**
 * MD5 of a string (RFC 1321), hex output.
 *
 * Implemented here only because Web Crypto refuses to expose MD5; it is used
 * for cache keys and legacy checksums, never for anything security-related.
 */
export function md5(input: string): string {
  const bytes = new TextEncoder().encode(input);

  const s = [
    7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22,
    5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20,
    4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23,
    6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21,
  ];
  const K = Array.from({ length: 64 }, (_, i) => Math.floor(Math.abs(Math.sin(i + 1)) * 2 ** 32) >>> 0);

  const originalBitLength = bytes.length * 8;
  const paddedLength = (((bytes.length + 8) >> 6) + 1) << 6;
  const buffer = new Uint8Array(paddedLength);
  buffer.set(bytes);
  buffer[bytes.length] = 0x80;
  // Message length as a 64-bit little-endian integer.
  const view = new DataView(buffer.buffer);
  view.setUint32(paddedLength - 8, originalBitLength >>> 0, true);
  view.setUint32(paddedLength - 4, Math.floor(originalBitLength / 2 ** 32), true);

  let a0 = 0x67452301;
  let b0 = 0xefcdab89;
  let c0 = 0x98badcfe;
  let d0 = 0x10325476;

  const M = new Uint32Array(16);

  for (let offset = 0; offset < paddedLength; offset += 64) {
    for (let i = 0; i < 16; i += 1) {
      M[i] = view.getUint32(offset + i * 4, true);
    }

    let A = a0;
    let B = b0;
    let C = c0;
    let D = d0;

    for (let i = 0; i < 64; i += 1) {
      let F: number;
      let g: number;
      if (i < 16) {
        F = (B & C) | (~B & D);
        g = i;
      } else if (i < 32) {
        F = (D & B) | (~D & C);
        g = (5 * i + 1) % 16;
      } else if (i < 48) {
        F = B ^ C ^ D;
        g = (3 * i + 5) % 16;
      } else {
        F = C ^ (B | ~D);
        g = (7 * i) % 16;
      }
      F = (F + A + (K[i] ?? 0) + (M[g] ?? 0)) >>> 0;
      const shift = s[i] ?? 0;
      A = D;
      D = C;
      C = B;
      B = (B + (((F << shift) | (F >>> (32 - shift))) >>> 0)) >>> 0;
    }

    a0 = (a0 + A) >>> 0;
    b0 = (b0 + B) >>> 0;
    c0 = (c0 + C) >>> 0;
    d0 = (d0 + D) >>> 0;
  }

  return [a0, b0, c0, d0]
    .map((word) =>
      [0, 8, 16, 24]
        .map((shift) => ((word >>> shift) & 0xff).toString(16).padStart(2, "0"))
        .join(""),
    )
    .join("");
}

function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Hash a string. Uses Web Crypto for the SHA family and the local MD5
 * implementation for MD5, so the result is always a lowercase hex digest.
 */
export async function hashText(text: string, algorithm: HashAlgorithm): Promise<string> {
  if (algorithm === "MD5") return md5(text);
  const digest = await crypto.subtle.digest(algorithm, new TextEncoder().encode(text));
  return toHex(digest);
}

/* -------------------------------------------------------------------------- */
/*  UUID                                                                      */
/* -------------------------------------------------------------------------- */

/** RFC 4122 version-4 UUID (crypto-backed, falls back to Math.random). */
export function uuidV4(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  const bytes = new Uint8Array(16);
  const webCrypto = globalThis.crypto as Crypto | undefined;
  if (webCrypto && typeof webCrypto.getRandomValues === "function") {
    webCrypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < 16; i += 1) bytes[i] = Math.floor(Math.random() * 256);
  }
  bytes[6] = ((bytes[6] ?? 0) & 0x0f) | 0x40;
  bytes[8] = ((bytes[8] ?? 0) & 0x3f) | 0x80;
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
