import { test } from "node:test";
import assert from "node:assert/strict";
import { compactKey, foldPersian, searchTools } from "./search";
import type { Tool } from "../data/tools";

function makeTool(over: Partial<Tool> & Pick<Tool, "slug" | "title">): Tool {
  return {
    id: over.slug,
    slug: over.slug,
    title: over.title,
    description: over.description ?? "",
    steps: [],
    category: over.category ?? "text",
    icon: (() => null) as unknown as Tool["icon"],
    seoTitle: over.seoTitle ?? over.title,
    seoDescription: "",
    keywords: over.keywords ?? [],
    status: "live",
    popular: over.popular ?? false,
    addedAt: "2026-01-01",
  };
}

const tools: Tool[] = [
  makeTool({
    slug: "word-counter",
    title: "شمارش کلمات",
    description: "تعداد کلمات و کاراکترها",
    keywords: ["word", "counter", "کلمه"],
    popular: true,
  }),
  makeTool({
    slug: "image-compressor",
    title: "فشرده‌سازی تصویر",
    description: "کاهش حجم عکس بدون افت کیفیت",
    keywords: ["compress", "image", "عکس"],
  }),
  makeTool({
    slug: "pdf-merger",
    title: "ادغام PDF",
    category: "files",
    description: "چند فایل PDF را یکی کن",
    keywords: ["merge", "pdf"],
  }),
];

test("foldPersian unifies Arabic yeh/kaf and digits", () => {
  assert.equal(foldPersian("فشرده‌سازي"), "فشردهسازی");
  assert.equal(foldPersian("كلمات"), "کلمات");
  assert.equal(foldPersian("۲۵ ابزار"), "25 ابزار");
  assert.equal(foldPersian("  آزمون  "), "ازمون");
});

test("foldPersian strips ZWNJ so half-space words match", () => {
  assert.equal(foldPersian("فشرده‌سازی"), "فشردهسازی");
  assert.equal(compactKey("فشرده سازی"), compactKey("فشرده‌سازی"));
});

test("searchTools returns [] for an empty or whitespace query", () => {
  assert.deepEqual(searchTools("", tools), []);
  assert.deepEqual(searchTools("   ", tools), []);
});

test("searchTools finds a tool typed with Arabic yeh and spaces", () => {
  const results = searchTools("فشرده سازي", tools);
  assert.equal(results[0]?.slug, "image-compressor");
});

test("searchTools matches on keywords and latin input", () => {
  assert.equal(searchTools("pdf", tools)[0]?.slug, "pdf-merger");
  assert.equal(searchTools("compress", tools)[0]?.slug, "image-compressor");
});

test("searchTools ranks title matches above description-only matches", () => {
  const results = searchTools("کلمه", tools);
  assert.equal(results[0]?.slug, "word-counter");
});

test("searchTools requires every term to match", () => {
  assert.deepEqual(searchTools("کلمات ناموجود", tools), []);
});

test("searchTools respects the limit", () => {
  const many = Array.from({ length: 10 }, (_, i) =>
    makeTool({ slug: `t${i}`, title: `ابزار شماره ${i}` }),
  );
  assert.equal(searchTools("ابزار", many, 3).length, 3);
});
