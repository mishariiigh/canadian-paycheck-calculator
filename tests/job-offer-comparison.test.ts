import { describe, expect, it } from "vitest";
import {
  buildChartData,
  calculateComparison,
  calculateOffer,
  rankOffers,
  type JobOfferInput,
} from "@/lib/job-offer-comparison";
import { calculateAnnualTax } from "@/engine/annual-tax";
import { ALL_PROVINCES, getProvinceName, getTaxYear } from "@/engine/tax-data";

const OFFER = (over: Partial<JobOfferInput> = {}): JobOfferInput => ({
  id: "t1",
  label: "Offer A",
  province: "ON",
  annualSalary: 80000,
  annualBonus: 0,
  signingBonus: 0,
  vacationAllowance: 0,
  compensation: { employerPension: 0, employerBenefits: 0, workExpenses: 0 },
  ...over,
});

/* ------------------------- engine integration (reuse) ------------------------ */

describe("offer calculation reuses the engine", () => {
  it("matches a direct calculateAnnualTax call for the same inputs", () => {
    const r = calculateOffer(OFFER());
    const direct = calculateAnnualTax({ grossAnnualIncome: 80000, province: "ON", taxYear: getTaxYear() });
    expect(r.base.totals.netAnnualIncome).toBe(direct.totals.netAnnualIncome);
    expect(r.base.federal.effectiveAbatedTax).toBe(direct.federal.effectiveAbatedTax);
    expect(r.base.payroll.pensionTotal).toBe(direct.payroll.pensionTotal);
  });

  it("does not define a second tax engine: deductions equal engine totals", () => {
    const r = calculateOffer(OFFER());
    expect(r.totals.totalDeductions).toBe(r.base.totals.totalTaxAndDeductions);
    expect(r.totals.netAnnualIncome).toBe(
      r.totals.grossEmploymentIncome - r.totals.totalDeductions
    );
  });

  it("reports monthly and biweekly nets that match calculatePayrollPeriods", () => {
    const r = calculateOffer(OFFER());
    expect(r.totals.netMonthly).toBe(r.perPeriod.find((p) => p.frequency === "monthly")!.net);
    expect(r.totals.netBiweekly).toBe(r.perPeriod.find((p) => p.frequency === "biweekly")!.net);
    // 12 monthly + 26 biweekly amounts each sum back to annual net (±rounding)
    expect(r.totals.netMonthly * 12).toBeCloseTo(r.totals.netAnnualIncome, 1);
    expect(r.totals.netBiweekly * 26).toBeCloseTo(r.totals.netAnnualIncome, 1);
  });
});

/* --------------------------- CPP2 / QPP2 / QPIP ------------------------------ */

describe("provincial payroll differences", () => {
  it("shows CPP2 for high earners in non-QC provinces", () => {
    const r = calculateOffer(OFFER({ province: "ON", annualSalary: 200000 }));
    expect(r.base.payroll.pensionName).toBe("CPP");
    expect(r.base.payroll.pensionSecondAdditional).toBeGreaterThan(0);
    expect(r.base.payroll.pensionTotal).toBeGreaterThan(r.base.payroll.pensionBase + r.base.payroll.pensionFirstAdditional);
  });

  it("uses QPP and QPIP for Quebec", () => {
    const r = calculateOffer(OFFER({ province: "QC", annualSalary: 80000 }));
    expect(r.base.payroll.pensionName).toBe("QPP");
    expect(r.base.payroll.eiName).toBe("QPIP");
    expect(r.base.federal.abatement).toBeGreaterThan(0);
  });

  it("applies the 2% NT payroll tax", () => {
    const r = calculateOffer(OFFER({ province: "NT", annualSalary: 80000 }));
    expect(r.base.payroll.provincialPayrollTax).toBeCloseTo(1600, 0);
  });
});

/* ------------------------------ tax year ------------------------------------ */

describe("tax year handling", () => {
  it("uses the engine's supported tax year only", () => {
    expect(getTaxYear()).toBe(2026);
    const c = calculateComparison([OFFER()]);
    expect(c.taxYear).toBe(2026);
  });
});

/* ------------------------------- bonuses ------------------------------------ */

describe("bonus handling", () => {
  it("recurring bonus is included in taxable employment income", () => {
    const r = calculateOffer(OFFER({ annualSalary: 80000, annualBonus: 5000 }));
    expect(r.totals.grossEmploymentIncome).toBe(85000);
    expect(r.totals.netAnnualIncome).toBeLessThan(
      calculateOffer(OFFER({ annualSalary: 80000 })).totals.netAnnualIncome + 5000
    );
  });

  it("signing bonus is taxed at marginal rate and NOT double counted in net", () => {
    const r = calculateOffer(OFFER({ annualSalary: 80000, signingBonus: 10000 }));
    expect(r.totals.grossYearOne).toBe(90000);
    // net shows recurring income; signing bonus net is separate
    expect(r.signingBonusNet).toBeGreaterThan(0);
    expect(r.signingBonusNet).toBeLessThan(10000);
    expect(r.signingBonusTax).toBeCloseTo(10000 - r.signingBonusNet, 2);
    // recurring net is identical to an offer without the signing bonus
    const plain = calculateOffer(OFFER({ annualSalary: 80000 }));
    expect(r.totals.netAnnualIncome).toBe(plain.totals.netAnnualIncome);
  });
});

/* --------------------------- employer compensation -------------------------- */

describe("employer contributions and expenses", () => {
  it("employer pension is NEVER added to employee take-home", () => {
    const r = calculateOffer(OFFER({ compensation: { employerPension: 6000, employerBenefits: 1200, workExpenses: 0 } }));
    expect(r.totals.netAnnualIncome).toBe(calculateOffer(OFFER()).totals.netAnnualIncome);
    expect(r.totals.totalCompensation).toBeCloseTo(r.totals.netAnnualIncome + 6000 + 1200, 2);
  });

  it("work expenses only reduce the netAfterWorkExpenses line", () => {
    const r = calculateOffer(OFFER({ compensation: { employerPension: 0, employerBenefits: 0, workExpenses: 3000 } }));
    expect(r.totals.netAnnualIncome).toBe(r.totals.netAfterWorkExpenses + 3000);
  });

  it("missing optional fields default to zero, not NaN", () => {
    const r = calculateOffer(OFFER({ annualBonus: undefined as unknown as number, signingBonus: undefined as unknown as number }));
    expect(r.totals.grossEmploymentIncome).toBe(80000);
    expect(Number.isFinite(r.totals.totalCompensation)).toBe(true);
  });

  it("negative or invalid numeric inputs are clamped to zero", () => {
    const r = calculateOffer(OFFER({ annualSalary: -5000, annualBonus: NaN as unknown as number }));
    expect(r.totals.grossEmploymentIncome).toBe(0);
    expect(r.totals.totalDeductions).toBe(0);
  });
});

/* --------------------------- all provinces / territories -------------------- */

describe("all 13 provinces and territories", () => {
  it.each(ALL_PROVINCES.map((p) => p.code))("produces a valid result for %s", (code) => {
    const r = calculateOffer(OFFER({ province: code, annualSalary: 95000 }));
    expect(Number.isFinite(r.totals.netAnnualIncome)).toBe(true);
    expect(r.totals.netAnnualIncome).toBeGreaterThan(0);
    expect(r.totals.netAnnualIncome).toBeLessThan(95000);
    expect(r.totals.grossEmploymentIncome).toBe(95000);
    expect(getProvinceName(code)).toBeTruthy();
  });

  it.each([20000, 55000, 120000, 250000])("handles salary %i across ON/QC/AB", (salary) => {
    for (const province of ["ON", "QC", "AB"] as const) {
      const r = calculateOffer(OFFER({ province, annualSalary: salary }));
      expect(r.totals.totalDeductions).toBeGreaterThan(0);
      expect(r.totals.netMonthly).toBeGreaterThan(0);
    }
  });
});

/* ------------------------------- comparison & ranking ----------------------- */

describe("comparison ranking", () => {
  it("single-offer comparison works", () => {
    const c = calculateComparison([OFFER({ annualSalary: 100000 })]);
    expect(c.offers).toHaveLength(1);
    expect(c.offers[0].totals.netMonthly).toBeGreaterThan(0);
  });

  it("two-offer comparison ranks correctly", () => {
    const c = calculateComparison([
      OFFER({ id: "a", annualSalary: 70000 }),
      OFFER({ id: "b", annualSalary: 90000 }),
    ]);
    const rank = rankOffers(c.offers, "netAnnualIncome");
    expect(rank[0].id).toBe("b");
    expect(rank[0].rank).toBe(1);
  });

  it("three-offer comparison ranks correctly", () => {
    const c = calculateComparison([
      OFFER({ id: "a", annualSalary: 75000 }),
      OFFER({ id: "b", annualSalary: 95000 }),
      OFFER({ id: "c", annualSalary: 85000 }),
    ]);
    const rank = rankOffers(c.offers, "netAnnualIncome");
    expect(rank.map((r) => r.id)).toEqual(["b", "c", "a"]);
    expect(rank[0].value).toBeGreaterThan(rank[2].value);
  });

  it("lower-is-better metrics invert the ranking", () => {
    const c = calculateComparison([
      OFFER({ id: "a", annualSalary: 70000 }),
      OFFER({ id: "b", annualSalary: 90000 }),
    ]);
    const rank = rankOffers(c.offers, "totalDeductions");
    expect(rank[0].id).toBe("a");
    expect(rank[0].lowerIsBetter).toBe(true);
  });

  it("total compensation can differ from net ranking when pension differs", () => {
    const c = calculateComparison([
      OFFER({ id: "net", annualSalary: 90000 }),
      OFFER({ id: "comp", annualSalary: 88000, compensation: { employerPension: 10000, employerBenefits: 0, workExpenses: 0 } }),
    ]);
    const byNet = rankOffers(c.offers, "netAnnualIncome");
    const byComp = rankOffers(c.offers, "totalCompensation");
    expect(byNet[0].id).toBe("net");
    expect(byComp[0].id).toBe("comp");
  });

  it("empty offers are filtered out with a warning", () => {
    const c = calculateComparison([OFFER({ annualSalary: 0 }), OFFER({ id: "b", annualSalary: 80000 })]);
    expect(c.offers).toHaveLength(1);
    expect(c.warnings.join(" ")).toMatch(/no salary/i);
  });
});

/* ------------------------------ chart data ----------------------------------- */

describe("chart data generation", () => {
  it("builds one datum per offer with the right fields", () => {
    const c = calculateComparison([
      OFFER({ id: "a", annualSalary: 80000 }),
      OFFER({ id: "b", annualSalary: 100000, compensation: { employerPension: 5000, employerBenefits: 800, workExpenses: 0 } }),
    ]);
    const data = buildChartData(c.offers);
    expect(data).toHaveLength(2);
    expect(data[1].gross).toBe(100000);
    expect(data[1].employerPension).toBe(5000);
    expect(data[1].net).toBeLessThan(data[1].gross);
    expect(data.every((d) => d.monthlyNet > 0)).toBe(true);
  });
});
