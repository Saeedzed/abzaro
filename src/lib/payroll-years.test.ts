import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { calculateSalary, calculateEidi, getPayrollYear, PAYROLL_DATA, payrollYears } from "./payroll";

/**
 * C1 guards: the two tax years must both exist, behave differently where they
 * should, and the unverified year must say so.
 */

describe("payroll year registry", () => {
  it("exposes 1404 and 1405 in order", () => {
    assert.deepEqual(payrollYears, [1404, 1405]);
  });

  it("1404 is the verified default with the published numbers", () => {
    const y = getPayrollYear(1404);
    assert.equal(y.verified, true);
    assert.equal(y.minMonthlyWage, 10_390_968);
    assert.equal(y.monthlyTaxExemption, 24_000_000);
    assert.equal(y.brackets.length, 6);
  });

  it("1405 carries its own numbers and is flagged unverified", () => {
    const y = getPayrollYear(1405);
    assert.equal(y.minMonthlyWage, 16_625_550);
    assert.equal(y.monthlyTaxExemption, 40_000_000);
    assert.equal(y.housingAllowance, 3_000_000);
    assert.equal(y.foodAllowance, 2_200_000);
    assert.equal(y.verified, false, "must stay unverified until the insurance ceiling is confirmed");
    assert.match(y.note, /بازبینی/);
  });

  it("falls back to the default year for an unknown year", () => {
    assert.equal(getPayrollYear(1500).year, 1404);
  });

  it("brackets are strictly increasing and end at Infinity", () => {
    for (const year of payrollYears) {
      const brackets = PAYROLL_DATA[year]!.brackets;
      for (let i = 1; i < brackets.length; i += 1) {
        assert.ok(brackets[i]!.upTo > brackets[i - 1]!.upTo, `${year} bracket ${i}`);
      }
      assert.equal(brackets.at(-1)!.upTo, Infinity);
      assert.equal(brackets[0]!.rate, 0, "first bracket must be the exemption");
    }
  });
});

describe("year-aware salary tax", () => {
  it("same gross salary is taxed less in 1405 (higher exemption)", () => {
    const y1404 = calculateSalary({ baseSalary: 30_000_000, year: 1404 });
    const y1405 = calculateSalary({ baseSalary: 30_000_000, year: 1405 });
    assert.ok(y1404 && y1405);
    assert.equal(y1404.tax > 0, true, "30m is taxable in 1404");
    assert.equal(y1405.tax, 0, "30m is fully exempt in 1405");
    assert.ok(y1405.net > y1404.net);
  });

  it("uses the selected year's brackets, not the default", () => {
    const high = 90_000_000;
    const y1404 = calculateSalary({ baseSalary: high, year: 1404 });
    const y1405 = calculateSalary({ baseSalary: high, year: 1405 });
    assert.ok(y1404 && y1405);
    assert.notEqual(y1404.tax, y1405.tax);
    assert.ok(y1405.tax < y1404.tax, "1405 exemption is 16m higher");
  });

  it("keeps the 1404 result identical when no year is passed", () => {
    const implicit = calculateSalary({ baseSalary: 45_000_000 });
    const explicit = calculateSalary({ baseSalary: 45_000_000, year: 1404 });
    assert.deepEqual(implicit, explicit);
  });

  it("eidi follows the year's minimum wage and exemption", () => {
    const e1404 = calculateEidi({ monthlyWage: 20_000_000, monthsWorked: 12, year: 1404 });
    const e1405 = calculateEidi({ monthlyWage: 20_000_000, monthsWorked: 12, year: 1405 });
    assert.ok(e1404 && e1405);
    // 1405 exemption (40m) is above a 40m eidi, so it is untaxed
    assert.equal(e1405.tax, 0);
    assert.ok(e1404.tax > 0);
  });
});
