import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createVideoProgress, parseVideoProgressSeconds } from "./video-progress";

describe("video progress estimation", () => {
  it("uses output timestamps against the known duration", () => {
    const estimate = createVideoProgress(100);
    assert.equal(estimate(0), null);
    assert.equal(estimate(5), .05);
    assert.equal(estimate(50), .5);
    assert.equal(estimate(100), .99);
  });
  it("does not pretend an unknown duration or late first report is progress", () => {
    assert.equal(createVideoProgress(null)(1), null);
    const estimate = createVideoProgress(100);
    assert.equal(estimate(99), null);
    assert.equal(estimate(1), null);
  });
  it("stops estimating if the timestamps become inconsistent", () => {
    const estimate = createVideoProgress(100);
    assert.equal(estimate(10), .1);
    assert.equal(estimate(120), null);
    assert.equal(estimate(50), null);
    const backwards = createVideoProgress(100);
    assert.equal(backwards(10), .1);
    assert.equal(backwards(50), .5);
    assert.equal(backwards(10), null);
  });
  it("parses time logs", () => {
    assert.equal(parseVideoProgressSeconds("frame=99 time=01:02:03.45 speed=1x"), 3723.45);
    assert.equal(parseVideoProgressSeconds("Duration: 00:02:00.00"), null);
  });
});
