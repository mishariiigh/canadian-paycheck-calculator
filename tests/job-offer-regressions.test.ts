import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import {
  buildChartData,
  calculateComparison,
  calculateOffer,
  rankOffers,
  type JobOfferInput,
} from "@/lib/job-offer-comparison";
import { calculateAnnualTax } from "@/engine/annual-tax";
import { calculateBonusTax } from "@/engine/salary-conversion";
import { getTaxYear } from "@/engine/tax-data";
import { roundToCents } from "@/engine/rounding";

/** Exact manual-test scenario from the M1.2 audit. */
const MICROSOFT: JobOfferInput = {
  id: "msft",
  label: "Microsoft",
  province: "ON",
  annualSalary: 10000,
  annualBonus: 1000,
  signingBonus: 3400,
  vacationAllowance: 10000,
  compensation: { employerPension: 0, employerBenefits: 0, workExpenses: 2000 },
};
/** Apple: different province, no bonus/signing, no expenses — the counterfactual. */
const APPLE: JobOfferInput = {
  id: "apple",
  label: "Apple",
  province: "BC",
  annualSalary: 50000,
  annualBonus: 0,
  signingBonus: 0,
  vacationAllowance: 0,
  compensation: { employerPension: 0, employerBenefits: 0, workExpenses: 0 },
};

describe("M1.2 vacation allowance inclusion", () => {
  it("recurring gross = salary + bonus + vacation allowance", () => {
    const r = calculateOffer(MICROSOFT);
    expect(r.totals.grossEmploymentIncome).toBe(21000); // 10000 + 1000 + 10000
    expect(r.totals.grossEmploymentIncome).toBe(
      r.input.annualSalary + r.input.annualBonus + r.input.vacationAllowance
    );
  });

  it("vacation pay is included in the tax calculation (engine called with 21000)", () => {
    const r = calculateOffer(MICROSOFT);
    const direct = calculateAnnualTax({ grossAnnualIncome: 21000, province: "ON", taxYear: getTaxYear() });
    expect(r.base.totals.netAnnualIncome).toBe(direct.totals.netAnnualIncome);
    expect(r.base.totals.totalTaxAndDeductions).toBe(direct.totals.totalTaxAndDeductions);
  });

  it("vacation pay raises net income but is taxed", () => {
    const withVac = calculateOffer(MICROSOFT);
    const withoutVac = calculateOffer({ ...MICROSOFT, vacationAllowance: 0 });
    const gain = withVac.totals.netAnnualIncome - withoutVac.totals.netAnnualIncome;
    expect(gain).toBeGreaterThan(0);
    expect(gain).toBeLessThan(10000);
  });

  it("vacation pay is included in monthly/biweekly conversions", () => {
    const r = calculateOffer(MICROSOFT);
    expect(r.totals.netMonthly * 12).toBeCloseTo(r.totals.netAnnualIncome, 0);
    expect(r.totals.netBiweekly * 26).toBeCloseTo(r.totals.netAnnualIncome, 0);
  });

  it("omitted vacation allowance equals zero (no NaN)", () => {
    const omitted = calculateOffer({ ...MICROSOFT, vacationAllowance: undefined as unknown as number });
    expect(omitted.totals.grossEmploymentIncome).toBe(11000);
    expect(Number.isFinite(omitted.totals.netYearOne)).toBe(true);
  });
});

describe("M1.2 signing bonus first-year figures", () => {
  it("first-year gross includes the signing bonus exactly once", () => {
    const r = calculateOffer(MICROSOFT);
    expect(r.totals.grossYearOne).toBe(24400); // 21000 + 3400
  });

  it("signing bonus taxed exactly once; first-year deductions include it", () => {
    const r = calculateOffer(MICROSOFT);
    const engine = calculateBonusTax({ province: "ON", baseSalary: 21000, bonus: 3400 });
    const engineTax = roundToCents(
      engine.bonusFederalTax + engine.bonusProvincialTax + engine.bonusPension + engine.bonusEi + engine.bonusProvincialPayrollTax
    );
    expect(r.signingBonusTax).toBe(engineTax);
    expect(r.totals.totalDeductionsYearOne).toBeCloseTo(r.totals.totalDeductions + r.signingBonusTax, 2);
  });

  it("recurring net excludes the one-time signing bonus", () => {
    const r = calculateOffer(MICROSOFT);
    const noSigning = calculateOffer({ ...MICROSOFT, signingBonus: 0 });
    expect(r.totals.netAnnualIncome).toBe(noSigning.totals.netAnnualIncome);
    expect(r.totals.netMonthly).toBe(noSigning.totals.netMonthly);
    expect(r.totals.netBiweekly).toBe(noSigning.totals.netBiweekly);
    expect(r.totals.totalDeductions).toBe(noSigning.totals.totalDeductions);
  });

  it("first-year reconciliation: grossYearOne − totalDeductionsYearOne = netYearOne", () => {
    const r = calculateOffer(MICROSOFT);
    expect(r.totals.netYearOne).toBeCloseTo(
      r.totals.grossYearOne - r.totals.totalDeductionsYearOne, 2
    );
  });
});

describe("M1.2 work-expenses ranking (Microsoft vs Apple manual scenario)", () => {
  it("Microsoft: net after expenses = recurring net − 2000", () => {
    const r = calculateOffer(MICROSOFT);
    expect(r.totals.netAfterWorkExpenses).toBeCloseTo(r.totals.netAnnualIncome - 2000, 2);
  });

  it("Apple (no expenses) keeps more after expenses than Microsoft", () => {
    const result = calculateComparison([MICROSOFT, APPLE]);
    const ms = result.offers.find((o) => o.input.label === "Microsoft")!;
    const ap = result.offers.find((o) => o.input.label === "Apple")!;
    expect(ap.totals.netAfterWorkExpenses).toBeGreaterThan(ms.totals.netAfterWorkExpenses);
  });

  it("highest/lowest net-after-expenses is identified from values, and stays correct when order is reversed", () => {
    const forward = calculateComparison([MICROSOFT, APPLE]).offers;
    const reversed = calculateComparison([APPLE, MICROSOFT]).offers;
    const bestFwd = forward.reduce((a, b) => (b.totals.netAfterWorkExpenses > a.totals.netAfterWorkExpenses ? b : a));
    const bestRev = reversed.reduce((a, b) => (b.totals.netAfterWorkExpenses > a.totals.netAfterWorkExpenses ? b : a));
    const worstFwd = forward.reduce((a, b) => (b.totals.netAfterWorkExpenses < a.totals.netAfterWorkExpenses ? b : a));
    const worstRev = reversed.reduce((a, b) => (b.totals.netAfterWorkExpenses < a.totals.netAfterWorkExpenses ? b : a));
    expect(bestFwd.input.label).toBe("Apple");
    expect(bestRev.input.label).toBe("Apple");
    expect(worstFwd.input.label).toBe("Microsoft");
    expect(worstRev.input.label).toBe("Microsoft");
  });

  it("net-income ranking also survives order reversal", () => {
    for (const [first, second] of [[MICROSOFT, APPLE], [APPLE, MICROSOFT]] as const) {
      const result = calculateComparison([first, second]);
      const rank = rankOffers(result.offers, "netAnnualIncome");
      // Apple ($50k in BC) has much higher net than Microsoft ($21k)
      expect(rank[0].label).toBe("Apple");
      expect(rank[1].label).toBe("Microsoft");
    }
  });
});

describe("M1.2 monthly chart tick formatting", () => {
  const formatTick = (v: number) => {
    // mirrors the chart's shared formatter: formatCurrency(v, { decimals: 0 })
    return new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD", maximumFractionDigits: 0 }).format(v);
  };

  it("formats monthly tick values without dividing the magnitude", () => {
    expect(formatTick(865)).toBe("$865");
    expect(formatTick(3653)).toBe("$3,653");
    expect(formatTick(4586)).toBe("$4,586");
    expect(formatTick(7000)).toBe("$7,000");
  });

  it("never collapses a monthly value to a two-digit label (the old /100 bug)", () => {
    for (const v of [865, 3653, 4586, 7000]) {
      const digits = formatTick(v).replace(/[^\d]/g, "");
      expect(Number(digits)).toBeGreaterThanOrEqual(v); // magnitude preserved
    }
  });

  it("chart monthlyNet data matches the calculation (no scaling applied)", () => {
    const result = calculateComparison([MICROSOFT, APPLE]);
    const data = buildChartData(result.offers);
    const ms = data.find((d) => d.name === "Microsoft")!;
    expect(ms.monthlyNet).toBe(result.offers.find((o) => o.input.label === "Microsoft")!.totals.netMonthly);
    expect(ms.monthlyNet * 12).toBeCloseTo(ms.net, 0);
  });
});

describe("M1.2 displayed metrics agree with calculations", () => {
  it("chart data carries the exact recurring gross/monthly figures shown in the table", () => {
    const result = calculateComparison([MICROSOFT, APPLE]);
    const data = buildChartData(result.offers);
    for (const o of result.offers) {
      const d = data.find((x) => x.name === o.input.label)!;
      expect(d.gross).toBe(o.totals.grossEmploymentIncome);
      expect(d.net).toBe(o.totals.netAnnualIncome);
      expect(d.monthlyNet).toBe(o.totals.netMonthly);
      expect(d.employerPension).toBe(o.totals.employerPension);
    }
  });

  it("total compensation = first-year net + employer pension + employer benefits", () => {
    for (const o of calculateComparison([MICROSOFT, APPLE]).offers) {
      expect(o.totals.totalCompensation).toBeCloseTo(
        o.totals.netYearOne + o.totals.employerPension + o.totals.employerBenefits, 2
      );
    }
  });

  it("employer items never enter recurring or first-year net", () => {
    const withPension = calculateOffer({ ...MICROSOFT, compensation: { ...MICROSOFT.compensation, employerPension: 5000, employerBenefits: 1000 } });
    const plain = calculateOffer(MICROSOFT);
    expect(withPension.totals.netAnnualIncome).toBe(plain.totals.netAnnualIncome);
    expect(withPension.totals.netYearOne).toBe(plain.totals.netYearOne);
  });
});

describe("M1.3 signing bonus changes first-year, not recurring (MS/Apple scenario)", () => {
  const MS2 = { ...MICROSOFT, signingBonus: 2000 };
  const AP2: JobOfferInput = { ...APPLE, signingBonus: 30000 };

  it("Apple with $30,000 signing: first-year figures move, recurring do not", () => {
    const withSign = calculateOffer(AP2);
    const without = calculateOffer(APPLE);
    expect(withSign.totals.grossYearOne).toBe(80000); // 50000 + 30000
    expect(withSign.totals.grossEmploymentIncome).toBe(without.totals.grossEmploymentIncome);
    expect(withSign.totals.netAnnualIncome).toBe(without.totals.netAnnualIncome);
    expect(withSign.totals.netMonthly).toBe(without.totals.netMonthly);
    expect(withSign.totals.netBiweekly).toBe(without.totals.netBiweekly);
    expect(withSign.totals.totalDeductions).toBe(without.totals.totalDeductions);
    expect(withSign.totals.netYearOne).toBeCloseTo(without.totals.netAnnualIncome + withSign.signingBonusNet, 2);
    expect(withSign.totals.totalDeductionsYearOne).toBeCloseTo(without.totals.totalDeductions + withSign.signingBonusTax, 2);
  });

  it("Microsoft with $2,000 signing reconciles first-year math", () => {
    const r = calculateOffer(MS2);
    expect(r.totals.netYearOne).toBeCloseTo(r.totals.grossYearOne - r.totals.totalDeductionsYearOne, 2);
    expect(r.signingBonusNet).toBeCloseTo(2000 - r.signingBonusTax, 2);
  });

  it("signing bonus does not leak into recurring monthly/biweekly", () => {
    const r = calculateOffer(AP2);
    expect(r.totals.netMonthly).toBe(calculateOffer(APPLE).totals.netMonthly);
  });
});

describe("M1.2 no stale wording in annual liability context", () => {
  const files = [
    "src/components/job-offer-comparison/job-offer-comparison.tsx",
    "src/components/job-offer-comparison/print-report.ts",
    "src/lib/job-offer-comparison.ts",
  ];

  it("no 'province of employment and contribution caps' phrasing remains", () => {
    for (const f of files) {
      const src = readFileSync(f, "utf8");
      expect(src).not.toMatch(/province of employment and contribution caps/i);
    }
  });

  it("no 'vacation allowance is reference only' phrasing remains", () => {
    for (const f of files) {
      const src = readFileSync(f, "utf8");
      expect(src).not.toMatch(/vacation allowance is treated as part of gross salary only when included/i);
      expect(src).not.toMatch(/listed for reference and is not taxed separately/i);
    }
  });

  it("legitimate CRA province-of-employment distinction is preserved", () => {
    const ui = readFileSync("src/components/job-offer-comparison/job-offer-comparison.tsx", "utf8");
    expect(ui).toMatch(/Payroll withholding instead uses the province of employment, which this calculator does not model/);
    expect(ui).toMatch(/determine-province-employment\.html/);
  });
});
