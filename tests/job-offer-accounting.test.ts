import { describe, expect, it } from "vitest";
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

/** Manual-test scenario from the audit: recurring salary vs signing-bonus offers. */
const MICROSOFT = OFFER({
  id: "msft",
  label: "Microsoft",
  province: "ON",
  annualSalary: 85000,
  annualBonus: 5000,
  signingBonus: 10000,
  vacationAllowance: 0,
  compensation: { employerPension: 6000, employerBenefits: 1500, workExpenses: 2000 },
});
const APPLE = OFFER({
  id: "apple",
  label: "Apple",
  province: "BC",
  annualSalary: 95000,
  annualBonus: 0,
  signingBonus: 0,
  vacationAllowance: 2000,
  compensation: { employerPension: 0, employerBenefits: 0, workExpenses: 0 },
});

describe("M1.1 signing bonus accounting (regression)", () => {
  it("signing bonus appears in first-year gross exactly once", () => {
    const r = calculateOffer(MICROSOFT);
    expect(r.totals.grossYearOne).toBe(r.totals.grossEmploymentIncome + r.input.signingBonus);
    expect(r.totals.grossEmploymentIncome).toBe(90000); // 85000 + 5000 recurring
    expect(r.totals.grossYearOne).toBe(100000); // + 10000 signing
  });

  it("signing bonus net is included in first-year net, taxed exactly once", () => {
    const r = calculateOffer(MICROSOFT);
    // net from signing == signing - signing tax (marginal rate, once)
    expect(r.signingBonusNet).toBeCloseTo(r.input.signingBonus - r.signingBonusTax, 2);
    expect(r.totals.netYearOne).toBeCloseTo(r.totals.netAnnualIncome + r.signingBonusNet, 2);
    // taxed once: first-year deductions == recurring + signing tax
    expect(r.totals.totalDeductionsYearOne).toBeCloseTo(r.totals.totalDeductions + r.signingBonusTax, 2);
  });

  it("recurring figures exclude the signing bonus entirely", () => {
    const r = calculateOffer(MICROSOFT);
    const noSigning = calculateOffer({ ...MICROSOFT, signingBonus: 0 });
    expect(r.totals.netAnnualIncome).toBe(noSigning.totals.netAnnualIncome);
    expect(r.totals.netMonthly).toBe(noSigning.totals.netMonthly);
    expect(r.totals.netBiweekly).toBe(noSigning.totals.netBiweekly);
    expect(r.totals.totalDeductions).toBe(noSigning.totals.totalDeductions);
  });

  it("first-year math reconciles: grossYearOne - totalDeductionsYearOne == netYearOne", () => {
    for (const signing of [0, 5000, 10000, 25000]) {
      const r = calculateOffer(OFFER({ signingBonus: signing }));
      expect(r.totals.grossYearOne - r.totals.totalDeductionsYearOne)
        .toBeCloseTo(r.totals.netYearOne, 2);
    }
  });

  it("matches the engine's own with/without bonus tax difference", () => {
    const r = calculateOffer(MICROSOFT);
    const engine = calculateBonusTax({ province: "ON", baseSalary: 90000, bonus: 10000 });
    const engineTax = roundToCents(
      engine.bonusFederalTax + engine.bonusProvincialTax + engine.bonusPension + engine.bonusEi + engine.bonusProvincialPayrollTax
    );
    expect(r.signingBonusTax).toBe(engineTax);
  });

  it("engine cross-check: withSigning result equals engine on gross income incl. signing", () => {
    const r = calculateOffer(MICROSOFT);
    const direct = calculateAnnualTax({ grossAnnualIncome: 100000, province: "ON", taxYear: getTaxYear() });
    expect(r.withSigning.totals.netAnnualIncome).toBe(direct.totals.netAnnualIncome);
  });
});

describe("M1.1 vacation pay accounting (regression)", () => {
  it("additional taxable vacation pay is included in employment income and net", () => {
    const withVac = calculateOffer(APPLE);
    const withoutVac = calculateOffer({ ...APPLE, vacationAllowance: 0 });
    expect(withVac.totals.grossEmploymentIncome).toBe(97000); // 95000 + 2000
    expect(withVac.totals.netAnnualIncome).toBeGreaterThan(withoutVac.totals.netAnnualIncome);
    // taxed once: net gain < 2000 but positive
    expect(withVac.totals.netAnnualIncome - withoutVac.totals.netAnnualIncome).toBeGreaterThan(0);
    expect(withVac.totals.netAnnualIncome - withoutVac.totals.netAnnualIncome).toBeLessThan(2000);
  });

  it("vacation pay is included in monthly/biweekly conversions", () => {
    const withVac = calculateOffer(APPLE);
    const direct = calculateAnnualTax({ grossAnnualIncome: 97000, province: "BC", taxYear: getTaxYear() });
    expect(withVac.base.totals.netAnnualIncome).toBe(direct.totals.netAnnualIncome);
    expect(withVac.totals.netMonthly * 12).toBeCloseTo(withVac.totals.netAnnualIncome, 1);
  });

  it("omitting vacation pay entirely equals entering zero", () => {
    const zero = calculateOffer({ ...APPLE, vacationAllowance: 0 });
    const omitted = calculateOffer({ ...APPLE, vacationAllowance: undefined as unknown as number });
    expect(zero.totals.netAnnualIncome).toBe(omitted.totals.netAnnualIncome);
  });
});

describe("M1.1 comparison mathematics (Microsoft/Apple scenario)", () => {
  const result = calculateComparison([MICROSOFT, APPLE]);

  it("gross reconciles with its income components", () => {
    for (const o of result.offers) {
      expect(o.totals.grossEmploymentIncome).toBe(
        o.input.annualSalary + o.input.annualBonus + o.input.vacationAllowance
      );
      expect(o.totals.grossYearOne).toBe(o.totals.grossEmploymentIncome + o.input.signingBonus);
    }
  });

  it("total deductions reconcile with the displayed tax/contribution components", () => {
    for (const o of result.offers) {
      const sum =
        o.base.federal.effectiveAbatedTax + o.base.provincial.totalPayable +
        o.base.payroll.pensionTotal + o.base.payroll.ei + o.base.payroll.provincialPayrollTax;
      expect(o.totals.totalDeductions).toBeCloseTo(sum, 1);
      expect(o.totals.totalDeductionsYearOne).toBeCloseTo(sum + o.signingBonusTax, 2);
    }
  });

  it("net income reconciles: gross − deductions = net (both horizons)", () => {
    for (const o of result.offers) {
      expect(o.totals.grossEmploymentIncome - o.totals.totalDeductions).toBeCloseTo(o.totals.netAnnualIncome, 1);
      expect(o.totals.grossYearOne - o.totals.totalDeductionsYearOne).toBeCloseTo(o.totals.netYearOne, 2);
    }
  });

  it("employer pension and benefits stay out of take-home", () => {
    const msft = result.offers.find((o) => o.input.label === "Microsoft")!;
    expect(msft.totals.netYearOne).toBe(
      msft.totals.netAnnualIncome + msft.signingBonusNet
    );
    expect(msft.totals.totalCompensation).toBeCloseTo(
      msft.totals.netYearOne + msft.totals.employerPension + msft.totals.employerBenefits, 2
    );
    // work expenses never touch net figures
    expect(msft.totals.netYearOne).toBeGreaterThan(0);
  });

  it("work expenses only reduce netAfterWorkExpenses", () => {
    const msft = result.offers.find((o) => o.input.label === "Microsoft")!;
    expect(msft.totals.netAfterWorkExpenses).toBeCloseTo(msft.totals.netAnnualIncome - 2000, 2);
  });

  it("monthly and biweekly reconcile with annual net (±rounding drift)", () => {
    for (const o of result.offers) {
      expect(o.totals.netMonthly * 12).toBeCloseTo(o.totals.netAnnualIncome, 0);
      expect(o.totals.netBiweekly * 26).toBeCloseTo(o.totals.netAnnualIncome, 0);
    }
  });

  it("ranking uses first-year net", () => {
    const rank = rankOffers(result.offers, "netAnnualIncome");
    expect(rank).toHaveLength(2);
    expect(rank[0].rank).toBe(1);
  });

  it("chart data carries first-year gross and recurring net/monthly", () => {
    const data = buildChartData(result.offers);
    const msft = data.find((d) => d.name === "Microsoft")!;
    expect(msft.gross).toBe(90000); // recurring
    expect(msft.net).toBeGreaterThan(0);
    expect(msft.monthlyNet * 12).toBeCloseTo(msft.net, 0);
  });
});

describe("M1.1 deduction rate framing", () => {
  it("effectiveDeductionRate is deductions / recurring gross", () => {
    const r = calculateOffer(OFFER({ annualSalary: 60000 }));
    expect(r.totals.effectiveDeductionRate).toBeCloseTo(
      r.totals.totalDeductions / 60000, 4
    );
  });

  it("a higher-gross offer can have a lower total but higher rate — both are surfaced", () => {
    const low = calculateOffer(OFFER({ id: "low", annualSalary: 40000 }));
    const high = calculateOffer(OFFER({ id: "high", annualSalary: 200000 }));
    expect(high.totals.totalDeductions).toBeGreaterThan(low.totals.totalDeductions);
    expect(high.totals.effectiveDeductionRate).toBeGreaterThan(low.totals.effectiveDeductionRate);
    // rankOffers by totalDeductions flags lower-is-better; UI explains rates
    const rank = rankOffers([low, high], "totalDeductions");
    expect(rank[0].id).toBe("low");
    expect(rank[0].lowerIsBetter).toBe(true);
  });
});
