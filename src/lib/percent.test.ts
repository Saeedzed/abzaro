import { test } from "node:test";
import assert from "node:assert/strict";
import {
  discountByAmount,
  discountByPercent,
  originalPriceFromDiscounted,
  percentChange,
  percentOf,
  whatPercent,
} from "./percent";

test("percentOf: 20% of 500 = 100", () => {
  assert.equal(percentOf(20, 500), 100);
  assert.equal(percentOf(2.5, 200), 5);
  assert.equal(percentOf(0, 500), 0);
});

test("percentOf returns null for invalid input", () => {
  assert.equal(percentOf(Number.NaN, 10), null);
  assert.equal(percentOf(10, Number.POSITIVE_INFINITY), null);
});

test("whatPercent: 25 out of 200 = 12.5%", () => {
  assert.equal(whatPercent(25, 200), 12.5);
  assert.equal(whatPercent(50, 50), 100);
});

test("whatPercent rejects a zero total", () => {
  assert.equal(whatPercent(5, 0), null);
});

test("percentChange: 100 → 120 is +20%", () => {
  const result = percentChange(100, 120);
  assert.ok(result);
  assert.equal(result.change, 20);
  assert.equal(result.direction, "increase");
});

test("percentChange: 200 → 150 is -25%", () => {
  const result = percentChange(200, 150);
  assert.ok(result);
  assert.equal(result.change, -25);
  assert.equal(result.direction, "decrease");
});

test("discountByPercent: 500,000 at 30% → pay 350,000", () => {
  const result = discountByPercent(500_000, 30);
  assert.ok(result);
  assert.equal(result.discountAmmount, 150_000);
  assert.equal(result.finalPrice, 350_000);
});

test("discountByPercent rejects negatives", () => {
  assert.equal(discountByPercent(-100, 10), null);
  assert.equal(discountByPercent(100, -10), null);
});

test("discountByAmount: 500,000 minus 80,000 → pay 420,000 (16%)", () => {
  const result = discountByAmount(500_000, 80_000);
  assert.ok(result);
  assert.equal(result.finalPrice, 420_000);
  assert.equal(result.discountAmmount, 80_000);
  assert.equal(result.effectivePercent, 16);
});

test("discountByAmount never goes below zero", () => {
  const result = discountByAmount(100, 500);
  assert.ok(result);
  assert.equal(result.finalPrice, 0);
});

test("originalPriceFromDiscounted: 700,000 after 30% was 1,000,000", () => {
  const result = originalPriceFromDiscounted(700_000, 30);
  assert.ok(result);
  assert.equal(Math.round(result.originalPrice), 1_000_000);
  assert.equal(Math.round(result.discountAmmount), 300_000);
});

test("originalPriceFromDiscounted rejects 100% and above", () => {
  assert.equal(originalPriceFromDiscounted(100, 100), null);
  assert.equal(originalPriceFromDiscounted(100, 120), null);
});
