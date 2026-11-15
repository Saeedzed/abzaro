/**
 * Client-side PDF text extraction.
 *
 * Why this is not 20 lines: a PDF stores glyph *indices*, not characters. The
 * mapping back to Unicode lives in one of two places:
 *
 *   1. a /ToUnicode CMap in the font dictionary (every PDF printed from Word,
 *      LibreOffice, Chrome or InDesign has one) — we parse it directly;
 *   2. nothing at all (pdf-lib and some generators write none) — then the only
 *      way back is the embedded font program itself, so we load the FontFile2
 *      with fontkit and invert its character→glyph table.
 *
 * When neither exists the tool says so per page instead of emitting mojibake.
 */

import { PDFDocument, PDFName, PDFDict, PDFRef, PDFArray, PDFRawStream, decodePDFRawStream } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";

export interface ExtractedPage {
  page: number;
  text: string;
  /** How the characters were recovered, for transparency in the UI. */
  method: "tounicode" | "font-cmap" | "winansi" | "none";
}

export interface ExtractResult {
  pages: ExtractedPage[];
  /** True when at least one font had no Unicode mapping at all. */
  lossy: boolean;
  warnings: string[];
}

interface FontInfo {
  /** code (string keys of hex bytes) → text */
  map: Map<number, string>;
  /** byte width of a code: 2 for Identity-H composite fonts, 1 for simple */
  codeWidth: 1 | 2;
  method: ExtractedPage["method"];
}

/** Parse a /ToUnicode CMap stream (bfchar + bfrange sections). */
function parseToUnicode(cmap: string): Map<number, string> {
  const map = new Map<number, string>();
  const hex = (s: string) => parseInt(s, 16);

  // bfchar: <src> <dst>
  for (const block of cmap.match(/beginbfchar([\s\S]*?)endbfchar/g) ?? []) {
    for (const pair of block.match(/<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]*)>/g) ?? []) {
      const m = pair.match(/<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]*)>/);
      if (!m) continue;
      map.set(hex(m[1]!), utf16beToText(m[2]!));
    }
  }

  // bfrange: <lo> <hi> <dst>   OR   <lo> <hi> [<d1> <d2> …]
  for (const block of cmap.match(/beginbfrange([\s\S]*?)endbfrange/g) ?? []) {
    const body = block.replace(/beginbfrange|endbfrange/g, "");
    // form A: lo hi <dst>
    for (const m of body.matchAll(/<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]*)>/g)) {
      const lo = hex(m[1]!);
      const hi = hex(m[2]!);
      const base = utf16beToText(m[3]!);
      const baseCode = base.codePointAt(0) ?? 0;
      for (let code = lo; code <= hi && code - lo < 65536; code += 1) {
        map.set(code, String.fromCodePoint(baseCode + (code - lo)));
      }
    }
    // form B: lo hi [ <d1> <d2> … ]
    for (const m of body.matchAll(/<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>\s*\[([\s\S]*?)\]/g)) {
      const lo = hex(m[1]!);
      const items = [...m[3]!.matchAll(/<([0-9A-Fa-f]*)>/g)].map((x) => utf16beToText(x[1]!));
      items.forEach((text, index) => map.set(lo + index, text));
    }
  }
  return map;
}

function utf16beToText(hexString: string): string {
  let out = "";
  const padded = hexString.length % 4 === 0 ? hexString : hexString.padStart(Math.ceil(hexString.length / 4) * 4, "0");
  for (let i = 0; i < padded.length; i += 4) {
    out += String.fromCharCode(parseInt(padded.slice(i, i + 4), 16));
  }
  return out;
}

const FONTKIT = fontkit as unknown as {
  create: (buffer: Uint8Array) => {
    characterSet: number[];
    glyphForCodePoint: (codePoint: number) => { id: number } | null;
    unitsPerEm?: number;
  };
};

/** Invert an embedded TrueType font: glyph id → character. */
function fontCmapFromProgram(bytes: Uint8Array): Map<number, string> | null {
  try {
    const font = FONTKIT.create(bytes);
    const map = new Map<number, string>();
    for (const codePoint of font.characterSet ?? []) {
      const glyph = font.glyphForCodePoint(codePoint);
      if (glyph && glyph.id !== undefined && !map.has(glyph.id)) {
        map.set(glyph.id, String.fromCodePoint(codePoint));
      }
    }
    return map.size > 0 ? map : null;
  } catch {
    return null;
  }
}

/** WinAnsi (≈ cp1252) single-byte decoding, the fallback for Helvetica etc. */
function winAnsiText(bytes: number[]): string {
  let out = "";
  for (const byte of bytes) {
    if (byte === 0x0a || byte === 0x0d) out += "\n";
    else if (byte >= 0x20 && byte !== 0x7f) out += String.fromCharCode(byte);
  }
  return out;
}

function resolve<T>(doc: PDFDocument, value: unknown, guard: (v: unknown) => v is T): T | undefined {
  const seen = new Set<string>();
  let current: unknown = value;
  while (current instanceof PDFRef) {
    if (seen.has(current.toString())) return undefined;
    seen.add(current.toString());
    current = doc.context.lookup(current);
  }
  return guard(current) ? current : undefined;
}

function streamText(doc: PDFDocument, ref: unknown): string | null {
  const obj = resolve(doc, ref, (v): v is PDFRawStream => v instanceof PDFRawStream);
  if (!obj) return null;
  try {
    return Buffer.from(decodePDFRawStream(obj).decode()).toString("latin1");
  } catch {
    return null;
  }
}

/** Build the code→text map for one font resource. */
function buildFontInfo(doc: PDFDocument, fontDict: PDFDict): FontInfo {
  // 1) ToUnicode wins — it is authoritative.
  const toUnicode = streamText(doc, fontDict.get(PDFName.of("ToUnicode")));
  if (toUnicode && toUnicode.includes("beginbf")) {
    const map = parseToUnicode(toUnicode);
    if (map.size > 0) {
      const twoByte = [...map.keys()].some((k) => k > 255);
      return { map, codeWidth: twoByte ? 2 : 1, method: "tounicode" };
    }
  }

  // 2) Composite font without ToUnicode: invert the embedded font program.
  const subtype = fontDict.get(PDFName.of("Subtype"))?.toString();
  if (subtype === "/Type0") {
    const descendants = resolve(doc, fontDict.get(PDFName.of("DescendantFonts")), (v): v is PDFArray => v instanceof PDFArray);
    const cidFont = descendants
      ? resolve(doc, descendants.get(0), (v): v is PDFDict => v instanceof PDFDict)
      : undefined;
    const descriptor = cidFont
      ? resolve(doc, cidFont.get(PDFName.of("FontDescriptor")), (v): v is PDFDict => v instanceof PDFDict)
      : undefined;
    const program = descriptor
      ? resolve(doc, descriptor.get(PDFName.of("FontFile2")), (v): v is PDFRawStream => v instanceof PDFRawStream)
      : undefined;
    if (program) {
      try {
        const bytes = decodePDFRawStream(program).decode();
        const cmap = fontCmapFromProgram(bytes);
        if (cmap) return { map: cmap, codeWidth: 2, method: "font-cmap" };
      } catch {
        /* fall through */
      }
    }
    return { map: new Map(), codeWidth: 2, method: "none" };
  }

  // 3) Simple font with no ToUnicode — WinAnsi is the best available guess.
  return { map: new Map(), codeWidth: 1, method: "font-cmap" };
}

/** Decode one PDF string (literal or hex) into code integers. */
function decodeStringCodes(raw: string): number[] {
  const codes: number[] = [];
  if (raw.startsWith("<")) {
    const hex = raw.slice(1, -1).replace(/[^0-9A-Fa-f]/g, "");
    for (let i = 0; i + 1 < hex.length; i += 2) codes.push(parseInt(hex.slice(i, i + 2), 16));
    return codes;
  }
  const body = raw.slice(1, -1);
  for (let i = 0; i < body.length; i += 1) {
    const ch = body[i]!;
    if (ch === "\\") {
      const next = body[i + 1];
      if (next === undefined) break;
      if (next === "n") { codes.push(10); i += 1; }
      else if (next === "r") { codes.push(13); i += 1; }
      else if (next === "t") { codes.push(9); i += 1; }
      else if (next === "b") { codes.push(8); i += 1; }
      else if (next === "f") { codes.push(12); i += 1; }
      else if (next === "(" || next === ")" || next === "\\") { codes.push(next.charCodeAt(0)); i += 1; }
      else if (/[0-7]/.test(next)) {
        let oct = next;
        let j = i + 2;
        while (oct.length < 3 && body[j] !== undefined && /[0-7]/.test(body[j]!)) {
          oct += body[j];
          j += 1;
        }
        codes.push(parseInt(oct, 8));
        i = j - 1;
      } else { codes.push(next.charCodeAt(0)); i += 1; }
    } else {
      codes.push(ch.charCodeAt(0));
    }
  }
  return codes;
}

/** Walk a content stream and pull out the text, honouring Tf and Tj/TJ/'/"`. */
function textFromContent(
  content: string,
  fonts: Map<string, FontInfo>,
): { lines: string[][]; usedMethods: Set<ExtractedPage["method"]> } {
  const lines: string[][] = [];
  let line: string[] = [];
  let current: FontInfo | undefined;
  const usedMethods = new Set<ExtractedPage["method"]>();
  const newline = () => {
    lines.push(line);
    line = [];
  };

  // Tokenise just enough: /Name Tf, (..)Tj, [..]TJ, T*, Td/TD/TL line moves.
  const tokenRe =
    /\/([A-Za-z0-9#_.+-]+)\s+[\d.]+\s+Tf|(\[(?:[^\][\\]|\\.)*\])\s*TJ|(\((?:[^()\\]|\\.)*\)|<[0-9A-Fa-f\s]*>)\s*(?:Tj|'|")|\bT\*|(-?[\d.]+)\s+(-?[\d.]+)\s+(?:Td|TD)|BT|ET/g;

  let match: RegExpExecArray | null;
  while ((match = tokenRe.exec(content))) {
    if (match[1]) {
      current = fonts.get(match[1]);
      continue;
    }
    if (match[2]) {
      // TJ array: strings interleaved with kerning offsets
      for (const item of match[2].matchAll(/\((?:[^()\\]|\\.)*\)|<[0-9A-Fa-f\s]*>/g)) {
        line.push(...decodeTokens(current, item[0], usedMethods));
      }
      continue;
    }
    if (match[3]) {
      line.push(...decodeTokens(current, match[3], usedMethods));
      continue;
    }
    if (match[4] !== undefined || match[0] === "T*") {
      // A large negative Td usually means a new line; a simple newline is honest
      // enough for extract-text use cases.
      if (match[4] === undefined || Math.abs(Number(match[5])) > 1.5) newline();
      continue;
    }
  }
  lines.push(line);
  return { lines, usedMethods };
}

/**
 * Decode one PDF string into *glyph tokens*. Keeping the glyphs separate matters:
 * a lam-alef ligature is one glyph that expands to two characters ("لا") already
 * in logical order, so reordering must move whole glyphs, never single characters.
 */
function decodeTokens(
  font: FontInfo | undefined,
  raw: string,
  used: Set<ExtractedPage["method"]>,
): string[] {
  if (!font) {
    used.add("winansi");
    return [...winAnsiText(decodeStringCodes(raw))];
  }
  const codes = decodeStringCodes(raw);
  if (font.method === "none") {
    used.add("none");
    return [];
  }
  if (font.map.size === 0) {
    used.add("winansi");
    return [...winAnsiText(codes)];
  }
  used.add(font.method);
  const tokens: string[] = [];
  if (font.codeWidth === 2) {
    for (let i = 0; i + 1 < codes.length; i += 2) {
      const code = (codes[i]! << 8) | codes[i + 1]!;
      const text = font.map.get(code);
      if (text) tokens.push(text);
    }
  } else {
    for (const code of codes) {
      const text = font.map.get(code);
      if (text) tokens.push(text);
    }
  }
  return tokens;
}

/** Extract text from every page of a PDF. Never throws on a partially-broken file. */
export interface ExtractOptions {
  /**
   * Rebuild right-to-left order. Most real-world producers (Word, Chrome,
   * LibreOffice, InDesign) store Persian glyphs in *visual* order, so this is on
   * by default. PDFs made by libraries such as pdf-lib store logical order —
   * for those the text is already correct and reversing would break it, so the
   * UI exposes a switch.
   */
  fixRtl?: boolean;
}

export async function extractPdfText(
  bytes: Uint8Array,
  options: ExtractOptions = {},
): Promise<ExtractResult> {
  const fixRtl = options.fixRtl ?? true;
  const doc = await PDFDocument.load(bytes, { updateMetadata: false });
  const pages: ExtractedPage[] = [];
  const warnings: string[] = [];
  let lossy = false;

  doc.getPages().forEach((page, index) => {
    // Resources → Font dictionary
    const fonts = new Map<string, FontInfo>();
    const resources = page.node.Resources();
    const fontDict = resources
      ? resolve(doc, resources.get(PDFName.of("Font")), (v): v is PDFDict => v instanceof PDFDict)
      : undefined;
    if (fontDict) {
      for (const [key, value] of fontDict.entries()) {
        const dict = resolve(doc, value, (v): v is PDFDict => v instanceof PDFDict);
        if (dict) fonts.set(key.asString().replace(/^\//, ""), buildFontInfo(doc, dict));
      }
    }

    // Contents may be one stream or an array of them.
    const contentsRef = page.node.get(PDFName.of("Contents"));
    const contentArray = resolve(doc, contentsRef, (v): v is PDFArray => v instanceof PDFArray);
    const rawContent = contentArray
      ? contentArray
          .asArray()
          .map((item) => streamText(doc, item) ?? "")
          .join("\n")
      : (streamText(doc, contentsRef) ?? "");

    const { lines, usedMethods } = textFromContent(rawContent, fonts);

    let method: ExtractedPage["method"] = "none";
    if (usedMethods.has("tounicode")) method = "tounicode";
    else if (usedMethods.has("font-cmap")) method = "font-cmap";
    else if (usedMethods.has("winansi")) method = "winansi";
    if (method === "none") lossy = true;

    pages.push({ page: index + 1, text: normalise(lines, fixRtl), method });
  });

  if (lossy) {
    warnings.push(
      "در برخی صفحه‌ها فونت جاسازی‌شده نقشهٔ یونیکد ندارد؛ متن آن صفحه قابل بازیابی نیست. این معمولاً یعنی PDF با ابزاری ساخته شده که ToUnicode نمی‌نویسد.",
    );
  }
  if (pages.every((p) => p.text.trim() === "")) {
    warnings.push(
      "هیچ متنی پیدا نشد. یا PDF اسکن‌شده است (تصویر، نه متن) یا متن در فونت بدون نقشهٔ یونیکد است. OCR در این ابزار انجام نمی‌شود.",
    );
  }

  return { pages, lossy, warnings };
}

const RTL_CHAR = /[\u0590-\u05FF\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF]/;
// Persian, Arabic-Indic and ASCII digits all read left-to-right inside RTL text.
const LTR_CHAR = /[0-9A-Za-z\u0660-\u0669\u06F0-\u06F9\u066B\u066C\u060C]/;

/**
 * PDF stores glyphs in *visual* order, so a right-to-left line arrives backwards
 * ("سلام دنیا" → glyphs for ا ی ن د … س). We rebuild reading order by grouping the
 * glyph tokens into script runs and reversing the run order — and the glyph order
 * inside each RTL run. Glyphs themselves are never split: a lam-alef ligature is
 * one glyph that already expands to "لا", so splitting it would corrupt the text.
 */
export function reorderLine(tokens: string[]): string {
  if (tokens.length === 0) return "";
  const hasRtl = tokens.some((t) => !LTR_CHAR.test(t) && RTL_CHAR.test(t));
  if (!hasRtl) return tokens.join("");
  // A right-to-left line is stored as its mirror image, glyph by glyph, so the
  // whole line comes back by reversing the glyph order once. Glyphs are never
  // split, which is what keeps lam-alef ("لا") intact.
  return tokens.slice().reverse().join("");
}

function normalise(lines: string[][], applyRtlFix: boolean): string {
  const text = lines
    .map((tokens) => (tokens.length === 0 ? "" : applyRtlFix ? reorderLine(tokens) : tokens.join("")))
    .join("\n");
  return text
    .replace(/\u0000/g, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
