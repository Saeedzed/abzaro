import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  ANNUAL_LEAVE_DAYS,
  EMPLOYER_INSURANCE_RATE,
  MONTHLY_HOURS,
  VAT_RATE,
  calculateHiringCost,
  calculateInsurance,
  calculateLatePayment,
  calculateLeavePay,
  calculateMahr,
  calculateMargin,
  calculateOvertime,
  calculateVat,
} from "@/lib/labour";
import { getPayrollYear } from "@/lib/payroll";

describe("labour: insurance", () => {
  it("takes 7% from the employee and 23% from the employer", () => {
    const result = calculateInsurance({ monthlySalary: 20_000_000 });
    assert.equal(result.employeeShare, 1_400_000);
    assert.equal(result.employerShare, 4_600_000); // 20% + 3% unemployment
    assert.equal(result.rate.employer, EMPLOYER_INSURANCE_RATE + 0.03);
  });

  it("uses the minimum wage as the basis when the salary is lower", () => {
    const data = getPayrollYear(1404);
    const result = calculateInsurance({ monthlySalary: 5_000_000 });
    assert.equal(result.usedMinimumWage, true);
    assert.equal(result.basis, data.minMonthlyWage);
  });

  it("uses the actual salary when it is above the minimum", () => {
    const result = calculateInsurance({ monthlySalary: 30_000_000 });
    assert.equal(result.usedMinimumWage, false);
    assert.equal(result.basis, 30_000_000);
  });

  it("can exclude unemployment insurance", () => {
    const withIt = calculateInsurance({ monthlySalary: 20_000_000 });
    const without = calculateInsurance({ monthlySalary: 20_000_000, includeUnemployment: false });
    assert.equal(without.employerShare, 4_000_000);
    assert.ok(without.total < withIt.total);
  });

  it("the 1405 minimum wage also drives the basis", () => {
    const data = getPayrollYear(1405);
    const result = calculateInsurance({ monthlySalary: 1_000_000, year: 1405 });
    assert.equal(result.basis, data.minMonthlyWage);
  });
});

describe("labour: overtime", () => {
  it("divides the monthly wage by 220 hours", () => {
    const result = calculateOvertime({ monthlyWage: 22_000_000, overtimeHours: 0 });
    assert.equal(result.hourlyRate, 22_000_000 / MONTHLY_HOURS);
  });

  it("pays overtime at 1.4x", () => {
    const result = calculateOvertime({ monthlyWage: 22_000_000, overtimeHours: 10 });
    assert.equal(result.overtimeRate, Math.round((22_000_000 / 220) * 1.4));
    assert.equal(result.overtimePay, Math.round((22_000_000 / 220) * 1.4 * 10));
  });

  it("adds a 35% night premium", () => {
    const result = calculateOvertime({ monthlyWage: 22_000_000, overtimeHours: 0, nightHours: 10 });
    assert.equal(result.nightRate, Math.round((22_000_000 / 220) * 1.35));
  });

  it("sums overtime, holiday and night pay", () => {
    const result = calculateOvertime({
      monthlyWage: 22_000_000,
      overtimeHours: 5,
      holidayHours: 8,
      nightHours: 4,
    });
    assert.equal(result.total, result.overtimePay + result.holidayPay + result.nightPay);
  });

  it("is zero when no hours are entered", () => {
    const result = calculateOvertime({ monthlyWage: 22_000_000, overtimeHours: 0 });
    assert.equal(result.total, 0);
  });
});

describe("labour: leave pay", () => {
  it("uses (salary + housing + food) / 30 as the daily rate", () => {
    const data = getPayrollYear(1404);
    const result = calculateLeavePay({ monthlyWage: 20_000_000, usedDays: 5 });
    const expected = (20_000_000 + data.housingAllowance + data.foodAllowance) / 30;
    assert.equal(result.dailyRate, Math.round(expected));
    assert.equal(result.total, Math.round(expected * 5));
  });

  it("reports 30 entitled days per year", () => {
    const result = calculateLeavePay({ monthlyWage: 20_000_000, usedDays: 2, usedSoFar: 12 });
    assert.equal(result.entitledDays, ANNUAL_LEAVE_DAYS);
    assert.equal(result.remainingDays, 18);
  });

  it("never reports negative remaining days", () => {
    const result = calculateLeavePay({ monthlyWage: 20_000_000, usedDays: 40, usedSoFar: 40 });
    assert.equal(result.remainingDays, 0);
  });

  it("uses the year's allowances, so 1404 and 1405 differ", () => {
    const a = calculateLeavePay({ monthlyWage: 20_000_000, usedDays: 1, year: 1404 });
    const b = calculateLeavePay({ monthlyWage: 20_000_000, usedDays: 1, year: 1405 });
    assert.ok(b.dailyRate > a.dailyRate);
  });
});

describe("labour: mahr", () => {
  it("converts a cash mahr to coins at the given rate", () => {
    const result = calculateMahr({ nominal: 1_000_000_000, coinPrice: 50_000_000 });
    assert.equal(result.coins, 20);
  });

  it("converts to grams when a gold price is given", () => {
    const result = calculateMahr({ nominal: 100_000_000, coinPrice: 50_000_000, goldGramPrice: 5_000_000 });
    assert.equal(result.inGoldGrams.grams, 20);
  });

  it("does not divide by zero", () => {
    const result = calculateMahr({ nominal: 500_000_000, coinPrice: 0 });
    assert.equal(result.coins, 0);
  });

  it("states that the rate is user-supplied", () => {
    assert.match(calculateMahr({ nominal: 1, coinPrice: 1 }).note, /نرخ/);
  });
});

describe("labour: VAT", () => {
  it("adds 10% by default", () => {
    const result = calculateVat({ amount: 1_000_000, mode: "add" });
    assert.equal(result.vat, 100_000);
    assert.equal(result.gross, 1_100_000);
    assert.equal(result.rate, VAT_RATE);
  });

  it("extracts VAT from a gross amount", () => {
    const result = calculateVat({ amount: 1_100_000, mode: "extract" });
    assert.equal(result.net, 1_000_000);
    assert.equal(result.includedVat, 100_000);
  });

  it("add-then-extract round-trips", () => {
    const added = calculateVat({ amount: 4_567_000, mode: "add" });
    const back = calculateVat({ amount: added.gross, mode: "extract" });
    assert.equal(back.net, added.net);
  });

  it("accepts a custom rate", () => {
    const result = calculateVat({ amount: 1_000_000, mode: "add", rate: 0.2 });
    assert.equal(result.vat, 200_000);
  });
});

describe("labour: profit margin", () => {
  it("computes margin and markup differently", () => {
    const result = calculateMargin({ cost: 70_000, price: 100_000 });
    assert.equal(result.profit, 30_000);
    assert.equal(result.marginPercent, 30);
    assert.equal(result.markupPercent, 42.9);
  });

  it("suggests the price needed for a target margin", () => {
    const result = calculateMargin({ cost: 70_000, price: 0, targetMarginPercent: 30 });
    assert.equal(result.priceForTargetMargin, 100_000);
  });

  it("does not divide by zero on a free product", () => {
    const result = calculateMargin({ cost: 10_000, price: 0 });
    assert.equal(result.marginPercent, 0);
    assert.equal(result.profit, -10_000);
  });

  it("handles a loss", () => {
    const result = calculateMargin({ cost: 100_000, price: 80_000 });
    assert.equal(result.profit, -20_000);
    assert.ok(result.marginPercent < 0);
  });
});

describe("labour: hiring cost", () => {
  it("adds the employer's insurance on top of the gross salary", () => {
    const result = calculateHiringCost({ grossMonthly: 20_000_000 });
    assert.equal(result.employerMonthlyCost, 20_000_000 + 4_600_000);
    assert.equal(result.netToEmployee, 20_000_000 - 1_400_000);
  });

  it("caps the eidi at three times the minimum wage", () => {
    const data = getPayrollYear(1404);
    const result = calculateHiringCost({ grossMonthly: 100_000_000 });
    assert.equal(result.eidi, data.minMonthlyWage * 3);
  });

  it("pays two months of salary as eidi when that is below the cap", () => {
    const data = getPayrollYear(1404);
    const small = Math.round(data.minMonthlyWage / 3);
    const result = calculateHiringCost({ grossMonthly: small });
    assert.equal(result.eidi, small * 2);
  });

  it("includes eidi and severance in the yearly cost", () => {
    const result = calculateHiringCost({ grossMonthly: 20_000_000 });
    assert.equal(
      result.employerYearlyCost,
      (20_000_000 + 4_600_000) * 12 + result.eidi + 20_000_000,
    );
  });

  it("1405 data changes the eidi cap", () => {
    const a = calculateHiringCost({ grossMonthly: 100_000_000, year: 1404 });
    const b = calculateHiringCost({ grossMonthly: 100_000_000, year: 1405 });
    assert.ok(b.eidi > a.eidi);
  });
});

describe("labour: late payment", () => {
  it("computes penalty as principal × rate × days/365", () => {
    const result = calculateLatePayment({ principal: 100_000_000, days: 365, annualRate: 0.18 });
    assert.equal(result.penalty, 18_000_000);
    assert.equal(result.total, 118_000_000);
  });

  it("prorates for part of a year", () => {
    const result = calculateLatePayment({ principal: 100_000_000, days: 100, annualRate: 0.18 });
    assert.equal(result.penalty, Math.round(100_000_000 * 0.18 * (100 / 365)));
  });

  it("is zero for zero days", () => {
    assert.equal(calculateLatePayment({ principal: 5_000_000, days: 0 }).penalty, 0);
  });

  it("warns that the rate is not a fixed legal number", () => {
    assert.match(calculateLatePayment({ principal: 1, days: 1 }).note, /نرخ/);
  });
});
