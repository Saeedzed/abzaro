import { test } from "node:test";
import assert from "node:assert/strict";
import {
  EMPLOYEE_INSURANCE_RATE,
  MIN_MONTHLY_WAGE_1404,
  calculateEidi,
  calculateSalary,
  calculateSalaryTax,
  calculateSanavat,
} from "./payroll";

test("salary tax is zero below the monthly exemption", () => {
  assert.equal(calculateSalaryTax(24_000_000).tax, 0);
  assert.equal(calculateSalaryTax(10_000_000).tax, 0);
});

test("salary tax is bracketed (۲۴→۳۰ at ۱۰٪)", () => {
  // 6,000,000 × 10%
  assert.equal(calculateSalaryTax(30_000_000).tax, 600_000);
  // 600,000 + 8,000,000 × 15%
  assert.equal(calculateSalaryTax(38_000_000).tax, 1_800_000);
  // 600,000 + 1,200,000 + 12,000,000 × 20%
  assert.equal(calculateSalaryTax(50_000_000).tax, 4_200_000);
});

test("tax brackets are progressive, not flat", () => {
  const result = calculateSalaryTax(66_600_000);
  // 600k + 1.2M + 2.4M + (66.6M − 50M) × 25% = 4.15M
  assert.equal(result.tax, 8_350_000);
  assert.ok(result.effectiveRate < 0.3);
  assert.equal(result.lines.length, 5);
});

test("a full payslip subtracts insurance before tax", () => {
  const result = calculateSalary({ baseSalary: 30_000_000, exemptExtras: 9_000_000 });
  assert.ok(result);
  assert.equal(result.insurance, Math.round(30_000_000 * EMPLOYEE_INSURANCE_RATE));
  assert.equal(result.taxable, 30_000_000 - result.insurance);
  // 27.9M taxable → 3.9M over the 24M exemption at 10%
  assert.equal(result.tax, 390_000);
  assert.equal(result.net, 30_000_000 - result.insurance - result.tax + 9_000_000);
});

test("salary below the legal minimum still computes", () => {
  const result = calculateSalary({ baseSalary: 5_000_000 });
  assert.ok(result);
  assert.equal(result.tax, 0);
});

test("invalid salary returns null", () => {
  assert.equal(calculateSalary({ baseSalary: 0 }), null);
  assert.equal(calculateSalary({ baseSalary: -10 }), null);
});

test("eidi for a minimum-wage worker is 2× the minimum wage (20.78M toman)", () => {
  const eidi = calculateEidi({ monthlyWage: MIN_MONTHLY_WAGE_1404, monthsWorked: 12 });
  assert.ok(eidi);
  assert.equal(eidi.amount, 20_781_936);
});

test("eidi is capped at 3× the minimum wage (31.17M toman)", () => {
  const eidi = calculateEidi({ monthlyWage: 25_000_000, monthsWorked: 12 });
  assert.ok(eidi);
  assert.equal(eidi.amount, 31_172_904);
});

test("eidi is prorated by months worked", () => {
  const eidi = calculateEidi({ monthlyWage: MIN_MONTHLY_WAGE_1404, monthsWorked: 6 });
  assert.ok(eidi);
  // two months' wage × 6/12 = one month's wage
  assert.equal(eidi.amount, MIN_MONTHLY_WAGE_1404);
});

test("eidi is capped at three times the minimum wage", () => {
  const eidi = calculateEidi({ monthlyWage: 500_000_000, monthsWorked: 12 });
  assert.ok(eidi);
  assert.equal(eidi.amount, MIN_MONTHLY_WAGE_1404 * 3);
  assert.equal(eidi.cappedAtCeiling, true);
  // excess over the 24M monthly exemption is taxed at 10%
  assert.equal(eidi.tax, Math.round((MIN_MONTHLY_WAGE_1404 * 3 - 24_000_000) * 0.1));
  assert.equal(eidi.tax, 717_290);
});

test("sanavat is one month of wage per year", () => {
  assert.equal(calculateSanavat({ monthlyWage: 20_000_000, years: 1 }), 20_000_000);
  assert.equal(calculateSanavat({ monthlyWage: 20_000_000, years: 5 }), 100_000_000);
  assert.equal(calculateSanavat({ monthlyWage: 20_000_000, years: 0 }), 0);
  assert.equal(calculateSanavat({ monthlyWage: 0, years: 3 }), null);
});
