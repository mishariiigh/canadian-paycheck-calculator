import { describe, expect, it } from "vitest";
import { calculateAnnualTax } from "@/engine/annual-tax";
import { calculatePayrollPeriods } from "@/engine/payroll";
import { hourlyToAnnualConversion, annualToHourlyConversion, calculateBonusTax } from "@/engine/salary-conversion";

describe("integration: full take-home calculation", () => {
  it("ON $80,000: deductions = federal + provincial + CPP + EI", () => {
    const r = calculateAnnualTax({ grossAnnualIncome: 80000, province: "ON", taxYear: 2026 });
    expect(r.payroll.pensionName).toBe("CPP");
    expect(r.payroll.pensionBase).toBeCloseTo(4230.45, 2);
    expect(r.payroll.pensionSecondAdditional).toBeCloseTo(216, 2);
    expect(r.payroll.ei).toBeCloseTo(1123.07, 2);
    expect(r.provincial.healthPremium).toBe(750);

    const expectedDeductions =
      r.federal.effectiveAbatedTax + r.provincial.totalPayable + r.payroll.pensionTotal + r.payroll.ei;
    expect(r.totals.totalTaxAndDeductions).toBeCloseTo(expectedDeductions, 2);
    expect(r.totals.netAnnualIncome).toBeCloseTo(80000 - expectedDeductions, 2);
  });

  it("QC applies 16.5% federal abatement and QPP/QPIP", () => {
    const r = calculateAnnualTax({ grossAnnualIncome: 80000, province: "QC", taxYear: 2026 });
    expect(r.federal.abatement).toBeCloseTo(r.federal.netTax * 0.165, 1);
    expect(r.payroll.pensionName).toBe("QPP");
    expect(r.payroll.eiName).toBe("QPIP");
  });

  it("NT applies 2% employee payroll tax", () => {
    const r = calculateAnnualTax({ grossAnnualIncome: 80000, province: "NT", taxYear: 2026 });
    expect(r.payroll.provincialPayrollTax).toBeCloseTo(1600, 2);
  });

  it("income below ON BPA has zero tax but still CPP/EI", () => {
    const r = calculateAnnualTax({ grossAnnualIncome: 12000, province: "ON", taxYear: 2026 });
    expect(r.federal.netTax).toBe(0);
    expect(r.provincial.netTax).toBe(0);
    expect(r.payroll.pensionTotal).toBeCloseTo(505.75, 2); // (12,000-3,500)*5.95%
  });

  it("all provinces produce positive net income", () => {
    for (const province of ["AB", "BC", "MB", "NB", "NL", "NS", "NT", "NU", "ON", "PE", "QC", "SK", "YT"] as const) {
      const r = calculateAnnualTax({ grossAnnualIncome: 120000, province, taxYear: 2026 });
      expect(r.totals.netAnnualIncome, province).toBeGreaterThan(0);
      expect(r.totals.averageTaxRate, province).toBeLessThan(0.5);
    }
  });
});

describe("payroll periods", () => {
  it("sum of 26 bi-weekly nets approximates annual net", () => {
    const input = { grossAnnualIncome: 80000, province: "ON" as const, taxYear: 2026 };
    const periods = calculatePayrollPeriods(input);
    const annual = calculateAnnualTax(input);
    const biweekly = periods.find((p) => p.frequency === "biweekly")!;
    expect(biweekly.periodsPerYear).toBe(26);
    expect(biweekly.net * 26).toBeCloseTo(annual.totals.netAnnualIncome, 0);
  });
});

describe("salary conversion", () => {
  it("$40/hour, 40h, 52 weeks = $83,200", () => {
    const r = hourlyToAnnualConversion(40, 40, 52);
    expect(r.annualSalary).toBe(83200);
    expect(r.monthlyGross).toBeCloseTo(6933.33, 2);
  });

  it("round trip hourly->annual->hourly", () => {
    const r = annualToHourlyConversion(hourlyToAnnualConversion(45.5, 37.5).annualSalary, 37.5);
    expect(r.hourlyRate).toBe(45.5);
  });
});

describe("bonus tax", () => {
  it("bonus net is less than bonus gross and marginal rate plausible", () => {
    const r = calculateBonusTax({ province: "ON", baseSalary: 80000, bonus: 10000 });
    expect(r.bonusNet).toBeGreaterThan(0);
    expect(r.bonusNet).toBeLessThan(10000);
    expect(r.effectiveMarginalRate).toBeGreaterThan(0.2);
    expect(r.effectiveMarginalRate).toBeLessThan(0.55);
  });

  it("no CPP on bonus for someone already at YMPE", () => {
    const r = calculateBonusTax({ province: "ON", baseSalary: 90000, bonus: 5000 });
    expect(r.bonusPension).toBe(0);
    expect(r.bonusEi).toBe(0);
  });
});
