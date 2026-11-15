import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { getPostBySlug, posts } from "@/data/posts";
import { toolPosts } from "@/data/posts-tools";
import { tools } from "@/data/tools";

const SLUGS = new Set(tools.map((tool) => tool.slug));

describe("posts: structure", () => {
  it("has at least 20 tool-anchored articles", () => {
    assert.ok(toolPosts.length >= 20, `only ${toolPosts.length}`);
  });

  it("every slug is unique across all posts", () => {
    const seen = new Set<string>();
    for (const post of posts) {
      assert.ok(!seen.has(post.slug), `duplicate slug ${post.slug}`);
      seen.add(post.slug);
    }
  });

  it("every tool-anchored article links to a real tool", () => {
    for (const post of toolPosts) {
      assert.ok(post.tool, `${post.slug} has no tool`);
      assert.ok(SLUGS.has(post.tool), `${post.slug} → unknown tool ${post.tool}`);
    }
  });

  it("related tools, when present, also exist", () => {
    for (const post of toolPosts) {
      for (const slug of post.related ?? []) {
        assert.ok(SLUGS.has(slug), `${post.slug} → unknown related ${slug}`);
      }
    }
  });

  it("each article is long enough to be worth publishing", () => {
    for (const post of toolPosts) {
      assert.ok(post.content.length >= 3, `${post.slug} has ${post.content.length} paragraphs`);
      const words = post.content.join(" ").split(/\s+/).length;
      assert.ok(words >= 150, `${post.slug} has only ${words} words`);
    }
  });

  it("reading time is plausible for the length", () => {
    for (const post of toolPosts) {
      const words = post.content.join(" ").split(/\s+/).length;
      const minutes = words / 200;
      assert.ok(post.readingMinutes >= Math.floor(minutes) - 1, `${post.slug} understated`);
      assert.ok(post.readingMinutes <= Math.ceil(minutes) + 3, `${post.slug} overstated`);
    }
  });

  it("dates are ISO and not in the future", () => {
    const today = new Date("2026-11-14T00:00:00Z");
    for (const post of posts) {
      assert.match(post.date, /^\d{4}-\d{2}-\d{2}$/, post.slug);
      assert.ok(new Date(post.date) <= today, `${post.slug} is dated in the future`);
    }
  });

  it("every article has an excerpt", () => {
    for (const post of toolPosts) {
      assert.ok(post.excerpt.length > 40, `${post.slug} excerpt too short`);
    }
  });

  it("the archive contains both the new and the legacy articles", () => {
    const legacy = posts.length - toolPosts.length;
    assert.ok(legacy >= 3, `legacy posts missing (${legacy})`);
  });

  it("lookup by slug works for a tool article", () => {
    const first = toolPosts[0]!;
    assert.equal(getPostBySlug(first.slug)?.title, first.title);
  });

  it("no article is anchored to the same tool twice", () => {
    const seen = new Set<string>();
    for (const post of toolPosts) {
      assert.ok(!seen.has(post.tool!), `two articles on ${post.tool}`);
      seen.add(post.tool!);
    }
  });
});
