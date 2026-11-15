import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { intents, heroIntents } from "@/data/intents";
import { landings } from "@/data/landings";
import { toolFaqs, faqToolCount } from "@/data/tool-faqs";
import { tools, getToolBySlug } from "@/data/tools";
import { popularQuestions } from "@/data/popular-questions";

/**
 * Cross-registry guards. Every link the site generates from a *second* data file
 * (intents, popular questions, landings, FAQs) must point at a tool that really
 * exists — a typo here is a dead link in the hero, and nothing else catches it.
 */

const slugOf = (href: string) => href.replace(/^\/tools\//, "");

describe("intents", () => {
  it("every intent points at a real tool", () => {
    for (const intent of intents) {
      assert.ok(intent.href.startsWith("/tools/"), intent.id);
      assert.ok(getToolBySlug(slugOf(intent.href)), `intent ${intent.id}`);
    }
  });

  it("has unique ids and no duplicate destinations", () => {
    assert.equal(new Set(intents.map((i) => i.id)).size, intents.length);
    assert.equal(new Set(intents.map((i) => i.href)).size, intents.length);
  });

  it("exposes the first six as the hero set", () => {
    assert.equal(heroIntents.length, 6);
    assert.equal(heroIntents[0], intents[0]);
  });
});

describe("popular questions", () => {
  it("every question links to a real tool", () => {
    for (const item of popularQuestions) {
      assert.ok(getToolBySlug(item.slug), `question «${item.question}»`);
      assert.ok(item.toolLabel.length > 3, item.question);
    }
  });

  it("has at least eight questions with unique wording and destinations", () => {
    assert.ok(popularQuestions.length >= 8);
    assert.equal(new Set(popularQuestions.map((q) => q.question)).size, popularQuestions.length);
    assert.equal(new Set(popularQuestions.map((q) => q.slug)).size, popularQuestions.length);
  });
});

describe("landing pages", () => {
  it("every landing targets a real tool", () => {
    for (const landing of landings) {
      assert.ok(getToolBySlug(landing.slug), `/${landing.path}`);
    }
  });

  it("paths are unique, url-safe and do not shadow a real route", () => {
    const reserved = new Set([
      "tools",
      "categories",
      "blog",
      "about",
      "contact",
      "privacy",
      "how-it-works",
      "search",
      "sitemap.xml",
      "robots.txt",
    ]);
    assert.equal(new Set(landings.map((l) => l.path)).size, landings.length);
    for (const landing of landings) {
      assert.match(landing.path, /^[a-z0-9-]+$/);
      assert.equal(reserved.has(landing.path), false);
    }
  });

  it("every landing has bullets, an intro and at least two FAQs", () => {
    for (const landing of landings) {
      assert.ok(landing.bullets.length >= 3, landing.path);
      assert.ok(landing.intro.length > 40, landing.path);
      assert.ok(landing.faq.length >= 2, landing.path);
    }
  });

  it("related tools all resolve", () => {
    for (const landing of landings) {
      for (const slug of landing.related) {
        assert.ok(getToolBySlug(slug), `${landing.path} → ${slug}`);
      }
    }
  });

  it("descriptions stay within a sane meta length", () => {
    for (const landing of landings) {
      assert.ok(landing.description.length <= 200, landing.path);
      assert.ok(landing.description.length >= 60, landing.path);
    }
  });
});

describe("tool FAQs", () => {
  it("covers the ten highest-traffic tools", () => {
    assert.equal(faqToolCount, 10);
  });

  it("every FAQ key is a real tool and every answer is substantial", () => {
    const slugs = new Set(tools.map((t) => t.slug));
    for (const [slug, items] of Object.entries(toolFaqs)) {
      assert.ok(slugs.has(slug), `faq key ${slug}`);
      assert.ok(items.length >= 2);
      for (const item of items) {
        assert.ok(item.q.endsWith("؟") || item.q.endsWith("?"), `${slug}: ${item.q}`);
        assert.ok(item.a.length > 30, `${slug}: ${item.q}`);
      }
    }
  });
});
