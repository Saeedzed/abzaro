import { test } from "node:test";
import assert from "node:assert/strict";
import { bmiCategory, calculateBmi, calculateLoan } from "./finance";

test("calculateLoan: zero interest splits the principal evenly", () => {
  const result = calculateLoan({ principal: 12_000_000, annualRatePercent: 0, months: 12 });
  assert.ok(result);
  assert.equal(result.monthlyPayment, 1_000_000);
  assert.equal(result.totalPayment, 12_000_000);
  assert.equal(result.totalInterest, 0);
  assert.equal(result.schedule.length, 12);
});

test("calculateLoan: 100m at 23% over 36 months", () => {
  const result = calculateLoan({ principal: 100_000_000, annualRatePercent: 23, months: 36 });
  assert.ok(result);
  // Annuity payment for i=0.0191667, n=36 → ≈ 3,889,000 (within rounding drift).
  assert.ok(
    Math.abs(result.monthlyPayment - 3_889_000) < 20_000,
    `monthly=${result.monthlyPayment}`,
  );
  assert.ok(result.totalInterest > 0);
  assert.equal(result.schedule.length, 36);
});

test("calculateLoan: schedule balance reaches zero and totals add up", () => {
  const result = calculateLoan({ principal: 50_000_000, annualRatePercent: 18, months: 24 });
  assert.ok(result);
  const last = result.schedule[result.schedule.length - 1];
  assert.equal(last?.balance, 0);
  const principalSum = result.schedule.reduce((sum, row) => sum + row.principal, 0);
  assert.ok(Math.abs(principalSum - 50_000_000) < 5, `principalSum=${principalSum}`);
  assert.equal(result.totalPayment, result.totalInterest + 50_000_000);
});

test("calculateLoan: rejects invalid input", () => {
  assert.equal(calculateLoan({ principal: 0, annualRatePercent: 20, months: 12 }), null);
  assert.equal(calculateLoan({ principal: 10_000, annualRatePercent: 20, months: 0 }), null);
  assert.equal(calculateLoan({ principal: 10_000, annualRatePercent: -1, months: 12 }), null);
  assert.equal(calculateLoan({ principal: Number.NaN, annualRatePercent: 20, months: 12 }), null);
});

test("calculateBmi: 70kg / 175cm ≈ 22.9 نرمال", () => {
  const result = calculateBmi(70, 175);
  assert.ok(result);
  assert.equal(result.bmi, 22.9);
  assert.equal(result.category, "وزن نرمال");
  assert.equal(result.weightToAdjust, 0);
  assert.equal(result.healthyMin, 56.7);
  assert.equal(result.healthyMax, 76.3);
});

test("calculateBmi: categories match the WHO cut-offs", () => {
  assert.equal(bmiCategory(17), "کمبود وزن");
  assert.equal(bmiCategory(18.5), "وزن نرمال");
  assert.equal(bmiCategory(25), "اضافه وزن");
  assert.equal(bmiCategory(30), "چاقی درجه ۱");
  assert.equal(bmiCategory(37), "چاقی درجه ۲");
  assert.equal(bmiCategory(45), "چاقی درجه ۳");
});

test("calculateBmi: reports how much weight to gain or lose", () => {
  const under = calculateBmi(50, 175);
  assert.ok(under);
  assert.equal(under.category, "کمبود وزن");
  assert.ok(under.weightToAdjust > 6 && under.weightToAdjust < 7);

  const over = calculateBmi(90, 175);
  assert.ok(over);
  assert.equal(over.category, "اضافه وزن");
  assert.ok(over.weightToAdjust > 13 && over.weightToAdjust < 14);
});

test("calculateBmi: rejects impossible input", () => {
  assert.equal(calculateBmi(0, 175), null);
  assert.equal(calculateBmi(70, 0), null);
  assert.equal(calculateBmi(70, 400), null);
});
