import { describe, expect, it } from "vitest";
import { calculateAnnualTax } from "@/engine/annual-tax";
import { calculatePayrollPeriods } from "@/engine/payroll";
import { getFederalData, getProvincialData, getPayrollData } from "@/engine/tax-data";
import type { ProvinceCode } from "@/engine/types";

const SALARIES = [25000, 40000, 50000, 65000, 75000, 85000, 100000, 125000, 150000, 200000];
const PROVINCES: ProvinceCode[] = [
  "AB", "BC", "MB", "NB", "NL", "NS", "NT", "NU", "ON", "PE", "QC", "SK", "YT",
];

describe("AUDIT: 2026 Canadian tax engine cross-jurisdiction verification", () => {
  it("all salaries x all provinces produce valid results with no negative net income", () => {
    for (const salary of SALARIES) {
      for (const prov of PROVINCES) {
        const r = calculateAnnualTax({ grossAnnualIncome: salary, province: prov, taxYear: 2026 });
        expect(r.totals.netAnnualIncome).toBeGreaterThanOrEqual(0);
        expect(r.totals.totalTaxAndDeductions).toBeGreaterThanOrEqual(0);
        expect(r.totals.totalTaxAndDeductions + r.totals.netAnnualIncome).toBeCloseTo(salary, 2);
      }
    }
  });

  it("federal CEA is $1,501 (verified against CRA T4032)", () => {
    const fed = getFederalData();
    expect(fed.otherCredits.employmentAmount).toBe(1501);
  });

  it("NL BPA is $13,094 (verified against official NL Department of Finance)", () => {
    const nl = getProvincialData("NL");
    expect(nl.basicPersonalAmount.amount).toBe(13094);
  });

  it("NT and NU apply 2% employee payroll tax on gross income", () => {
    for (const prov of ["NT", "NU"] as const) {
      for (const salary of [25000, 100000, 200000]) {
        const r = calculateAnnualTax({ grossAnnualIncome: salary, province: prov, taxYear: 2026 });
        expect(r.payroll.provincialPayrollTax).toBeCloseTo(salary * 0.02, 2);
      }
    }
  });

  it("QC applies 16.5% federal abatement on net federal tax", () => {
    for (const salary of SALARIES) {
      const r = calculateAnnualTax({ grossAnnualIncome: salary, province: "QC", taxYear: 2026 });
      expect(r.federal.abatement).toBeCloseTo(r.federal.netTax * 0.165, 2);
      expect(r.federal.effectiveAbatedTax).toBeCloseTo(r.federal.netTax - r.federal.abatement, 2);
    }
  });

  it("QC uses QPP not CPP, QPIP not EI", () => {
    for (const salary of SALARIES) {
      const r = calculateAnnualTax({ grossAnnualIncome: salary, province: "QC", taxYear: 2026 });
      expect(r.payroll.pensionName).toBe("QPP");
      expect(r.payroll.eiName).toBe("QPIP");
    }
  });

  it("CPP maxes at $4,230.45 base + CPP2 for income at or above YMPE ($74,600)", () => {
    const cases: [number, number][] = [
      [75000, 4230.45 + (75000 - 74600) * 0.04],
      [80000, 4230.45 + (80000 - 74600) * 0.04],
      [85000, 4230.45 + 416],
      [100000, 4230.45 + 416],
      [200000, 4230.45 + 416],
    ];
    for (const [salary, expected] of cases) {
      const r = calculateAnnualTax({ grossAnnualIncome: salary, province: "ON", taxYear: 2026 });
      expect(r.payroll.pensionTotal).toBeCloseTo(expected, 2);
    }
  });

  it("CPP2 applies 4% on earnings between YMPE ($74,600) and YAMPE ($85,000), max $416", () => {
    const cases: [number, number][] = [
      [74600, 0],
      [80000, (80000 - 74600) * 0.04],
      [85000, 416],
      [100000, 416],
      [200000, 416],
    ];
    for (const [salary, expectedCPP2] of cases) {
      const r = calculateAnnualTax({ grossAnnualIncome: salary, province: "ON", taxYear: 2026 });
      expect(r.payroll.pensionSecondAdditional).toBeCloseTo(expectedCPP2, 2);
    }
  });

  it("EI maxes at $1,123.07 outside QC for income at or above MIE ($68,900)", () => {
    for (const salary of [68900, 75000, 100000, 200000]) {
      const r = calculateAnnualTax({ grossAnnualIncome: salary, province: "ON", taxYear: 2026 });
      expect(r.payroll.ei).toBeCloseTo(1123.07, 2);
    }
  });

  it("Quebec EI+QPIP maxes at $895.70 + $442.90 = $1,338.60", () => {
    for (const salary of [103000, 150000, 200000]) {
      const r = calculateAnnualTax({ grossAnnualIncome: salary, province: "QC", taxYear: 2026 });
      expect(r.payroll.ei).toBeCloseTo(895.70 + 442.90, 2);
    }
  });

  it("Ontario health premium matches documented schedule", () => {
    const cases: [number, number][] = [
      [20000, 0],
      [22000, 120],
      [36000, 300],
      [37000, 360],
      [48000, 450],
      [49000, 600],
      [72000, 600],
      [73000, 750],
      [200000, 750],
      [200500, 875],
      [200600, 900],
      [250000, 900],
    ];
    for (const [income, expected] of cases) {
      const r = calculateAnnualTax({ grossAnnualIncome: income, province: "ON", taxYear: 2026 });
      expect(r.provincial.healthPremium).toBeCloseTo(expected, 2);
    }
  });

  it("Ontario surtax applies on tax net of credits, not on income", () => {
    const r80k = calculateAnnualTax({ grossAnnualIncome: 80000, province: "ON", taxYear: 2026 });
    expect(r80k.provincial.surtax).toBeCloseTo(0, 2);

    const r100k = calculateAnnualTax({ grossAnnualIncome: 100000, province: "ON", taxYear: 2026 });
    expect(r100k.provincial.surtax).toBeGreaterThan(0);
  });

  it("per-period nets sum approximately to annual net (biweekly)", () => {
    for (const prov of PROVINCES) {
      for (const salary of [50000, 100000, 150000]) {
        const input = { grossAnnualIncome: salary, province: prov, taxYear: 2026 };
        const periods = calculatePayrollPeriods(input);
        const annual = calculateAnnualTax(input);
        const biweekly = periods.find((p) => p.frequency === "biweekly")!;
        const sum = biweekly.net * 26;
        expect(Math.abs(sum - annual.totals.netAnnualIncome)).toBeLessThan(5);
      }
    }
  });
});

describe("AUDIT: Boundary value testing", () => {
  it("federal bracket boundaries", () => {
    const b1 = 58523;
    const r1 = calculateAnnualTax({ grossAnnualIncome: b1, province: "AB", taxYear: 2026 });
    expect(r1.federal.grossTax).toBeCloseTo(b1 * 0.14, 2);

    const b2 = 117045;
    const r2 = calculateAnnualTax({ grossAnnualIncome: b2, province: "AB", taxYear: 2026 });
    const expectedFed = 58523 * 0.14 + (117045 - 58523) * 0.205;
    expect(r2.federal.grossTax).toBeCloseTo(expectedFed, 2);

    const b3 = 181440;
    const r3 = calculateAnnualTax({ grossAnnualIncome: b3, province: "AB", taxYear: 2026 });
    const expectedFed3 = 58523 * 0.14 + (117045 - 58523) * 0.205 + (181440 - 117045) * 0.26;
    expect(r3.federal.grossTax).toBeCloseTo(expectedFed3, 2);

    const b4 = 258482;
    const r4 = calculateAnnualTax({ grossAnnualIncome: b4, province: "AB", taxYear: 2026 });
    const expectedFed4 = expectedFed3 + (258482 - 181440) * 0.29;
    expect(r4.federal.grossTax).toBeCloseTo(expectedFed4, 2);
  });

  it("CPP exemption boundary: no CPP below $3,500", () => {
    const r = calculateAnnualTax({ grossAnnualIncome: 3000, province: "ON", taxYear: 2026 });
    expect(r.payroll.pensionTotal).toBe(0);
  });

  it("CPP at exemption: zero CPP at exactly $3,500", () => {
    const r = calculateAnnualTax({ grossAnnualIncome: 3500, province: "ON", taxYear: 2026 });
    expect(r.payroll.pensionTotal).toBeCloseTo(0, 2);
  });

  it("EI MIE boundary: max EI at $68,900", () => {
    const r = calculateAnnualTax({ grossAnnualIncome: 68900, province: "ON", taxYear: 2026 });
    expect(r.payroll.ei).toBeCloseTo(68900 * 0.0163, 2);
  });

  it("CPP2 YAMPE boundary: max CPP2 at $85,000", () => {
    const r = calculateAnnualTax({ grossAnnualIncome: 85000, province: "ON", taxYear: 2026 });
    expect(r.payroll.pensionSecondAdditional).toBeCloseTo(416, 2);
  });
});

describe("AUDIT: Data source verification", () => {
  it("federal brackets match CRA 2026", () => {
    const fed = getFederalData();
    expect(fed.taxBrackets).toEqual([
      { upTo: 58523, rate: 0.14 },
      { upTo: 117045, rate: 0.205 },
      { upTo: 181440, rate: 0.26 },
      { upTo: 258482, rate: 0.29 },
      { upTo: null, rate: 0.33 },
    ]);
  });

  it("federal BPA max $16,452, min $14,829", () => {
    const fed = getFederalData();
    expect(fed.basicPersonalAmount.maximum).toBe(16452);
    expect(fed.basicPersonalAmount.minimum).toBe(14829);
    expect(fed.basicPersonalAmount.phaseOutStartNetIncome).toBe(181440);
    expect(fed.basicPersonalAmount.phaseOutEndNetIncome).toBe(258482);
  });

  it("CPP parameters match CRA 2026", () => {
    const p = getPayrollData();
    expect(p.cpp.rate).toBe(0.0595);
    expect(p.cpp.basicExemption).toBe(3500);
    expect(p.cpp.ympe).toBe(74600);
    expect(p.cpp.maximumEmployeeContribution).toBe(4230.45);
  });

  it("CPP2 parameters match CRA 2026", () => {
    const p = getPayrollData();
    expect(p.cpp2.rate).toBe(0.04);
    expect(p.cpp2.yampe).toBe(85000);
    expect(p.cpp2.maximumEmployeeContribution).toBe(416);
  });

  it("EI parameters match CRA 2026", () => {
    const p = getPayrollData();
    expect(p.ei.rateOutsideQuebec).toBe(0.0163);
    expect(p.ei.rateQuebec).toBe(0.013);
    expect(p.ei.maximumInsurableEarnings).toBe(68900);
    expect(p.ei.maximumEmployeePremiumOutsideQuebec).toBe(1123.07);
    expect(p.ei.maximumEmployeePremiumQuebec).toBe(895.7);
  });

  it("QPP parameters match Retraite Québec 2026", () => {
    const p = getPayrollData();
    expect(p.qpp.baseRateEmployee).toBe(0.053);
    expect(p.qpp.firstAdditionalRateEmployee).toBe(0.01);
    expect(p.qpp.mpe).toBe(74600);
    expect(p.qpp.maximumEmployeeBasePlusFirstAdditional).toBe(4479);
    expect(p.qpp.yampe).toBe(85000);
    expect(p.qpp.secondAdditionalRateEmployee).toBe(0.04);
    expect(p.qpp.maximumEmployeeSecondAdditional).toBe(416);
  });

  it("QPIP parameters match Revenu Québec 2026", () => {
    const p = getPayrollData();
    expect(p.qpip.rateEmployee).toBe(0.0043);
    expect(p.qpip.maximumInsurableEarnings).toBe(103000);
    expect(p.qpip.maximumEmployeePremium).toBe(442.9);
  });

  it("Quebec federal abatement rate is 16.5%", () => {
    const qc = getProvincialData("QC");
    expect(qc.federalAbatement?.rate).toBe(0.165);
  });
});
