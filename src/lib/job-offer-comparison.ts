/**
 * Job Offer Comparison — calculation module.
 *
 * This module contains NO tax formulas. Every tax/deduction figure comes from
 * the existing engine (calculateAnnualTax / calculatePayrollPeriods /
 * calculateBonusTax). It only composes offers, converts inputs to what the
 * engine expects, ranks results and generates chart/insight data.
 */
import { calculateAnnualTax } from "@/engine/annual-tax";
import { calculatePayrollPeriods } from "@/engine/payroll";
import { calculateBonusTax } from "@/engine/salary-conversion";
import { getTaxYear } from "@/engine/tax-data";
import { roundToCents } from "@/engine/rounding";
import type { ProvinceCode, TaxCalculationResult } from "@/engine/types";

/** Employer benefits / costs. Shown separately from take-home pay — the
 * existing engine does not model employer pension as an employee pre-tax
 * deduction, so it is never subtracted from net income. */
export interface OfferCompensation {
  /** Employer pension contribution (employer cost, not employee take-home). */
  employerPension: number;
  /** Other taxable cash-equivalent employer benefits (e.g. car allowance). */
  employerBenefits: number;
  /** Annual work-related expenses the employee pays (after-tax cost). */
  workExpenses: number;
}

export interface JobOfferInput {
  id: string;
  label: string;
  province: ProvinceCode;
  /** Annual gross base salary in CAD. */
  annualSalary: number;
  /** Annual bonus amount in CAD. */
  annualBonus: number;
  /** One-time signing bonus in CAD. */
  signingBonus: number;
  vacationAllowance: number;
  compensation: OfferCompensation;
}

export interface OfferResult {
  input: JobOfferInput;
  /** Engine result for recurring employment income (salary + bonus + vacation pay). */
  base: TaxCalculationResult;
  /** Engine result including the one-time signing bonus (first year). */
  withSigning: TaxCalculationResult;
  /** Marginal-rate tax on the signing bonus (from calculateBonusTax). */
  signingBonusTax: number;
  /** Net value of the signing bonus after tax at marginal rate. */
  signingBonusNet: number;
  perPeriod: ReturnType<typeof calculatePayrollPeriods>;
  totals: {
    /** Salary + recurring bonus (taxable employment income). */
    grossEmploymentIncome: number;
    /** All taxable income including signing bonus. */
    grossYearOne: number;
    totalDeductions: number;
    /** Recurring annual net income (excludes one-time signing bonus). */
    netAnnualIncome: number;
    /** First-year net: recurring net + net signing bonus (taxed once). */
    netYearOne: number;
    /** First-year total deductions: recurring + signing bonus tax. */
    totalDeductionsYearOne: number;
    netMonthly: number;
    netBiweekly: number;
    /** Employer pension — employer cost, NOT employee take-home. */
    employerPension: number;
    /** Non-taxable assumed employer benefits (e.g. health/dental premium value). */
    employerBenefits: number;
    /** After-tax annual work expenses. */
    workExpenses: number;
    /** Take-home minus work expenses (financial reality check). */
    netAfterWorkExpenses: number;
    /** Net pay + employer pension + employer benefits = total compensation value. */
    totalCompensation: number;
    /** Deductions as a share of gross employment income. */
    effectiveDeductionRate: number;
  };
}

export interface ComparisonResult {
  taxYear: number;
  offers: OfferResult[];
  warnings: string[];
}

const nonNegative = (v: number | undefined | null) => (typeof v === "number" && Number.isFinite(v) && v > 0 ? v : 0);

export function calculateOffer(offer: JobOfferInput): OfferResult {
  const salary = nonNegative(offer.annualSalary);
  const bonus = nonNegative(offer.annualBonus);
  // Vacation allowance entered here is ADDITIONAL taxable vacation pay on top
  // of the base salary (see helper text in the form). It is employment income.
  const vacationPay = nonNegative(offer.vacationAllowance);
  const signing = nonNegative(offer.signingBonus);
  const employmentIncome = salary + bonus + vacationPay;

  const base = calculateAnnualTax({
    grossAnnualIncome: employmentIncome,
    province: offer.province,
    taxYear: getTaxYear(),
  });

  // Signing bonus is first-year income: taxed once at the marginal rate via
  // the engine's bonus method (CPP/EI only where annual room remains), and
  // INCLUDED in first-year gross and first-year net — exactly once.
  const signingResult = signing > 0
    ? calculateBonusTax({ province: offer.province, baseSalary: employmentIncome, bonus: signing })
    : null;
  const signingBonusTax = signingResult
    ? roundToCents(
      signingResult.bonusFederalTax + signingResult.bonusProvincialTax +
      signingResult.bonusPension + signingResult.bonusEi + signingResult.bonusProvincialPayrollTax
    )
    : 0;
  const signingBonusNet = roundToCents(signing - signingBonusTax);

  const withSigning = signing > 0
    ? calculateAnnualTax({
      grossAnnualIncome: employmentIncome + signing,
      province: offer.province,
      taxYear: getTaxYear(),
    })
    : base;

  // Recurring per-period figures (monthly/biweekly) come from the RECURRING
  // employment income only — a one-time signing bonus must not be spread
  // across every future pay period.
  const perPeriod = calculatePayrollPeriods({
    grossAnnualIncome: employmentIncome,
    province: offer.province,
    taxYear: getTaxYear(),
  });

  const comp = offer.compensation;
  const employerPension = nonNegative(comp?.employerPension);
  const employerBenefits = nonNegative(comp?.employerBenefits);
  const workExpenses = nonNegative(comp?.workExpenses);

  const totalDeductions = base.totals.totalTaxAndDeductions;
  const netAnnualIncome = base.totals.netAnnualIncome;

  return {
    input: offer,
    base,
    withSigning,
    signingBonusTax,
    signingBonusNet,
    perPeriod,
    totals: {
      grossEmploymentIncome: roundToCents(employmentIncome),
      /** First-year gross: recurring income + one-time signing bonus. */
      grossYearOne: roundToCents(employmentIncome + signing),
      totalDeductions,
      /** Recurring annual net (excludes one-time signing bonus). */
      netAnnualIncome,
      /** First-year net: recurring net + net signing bonus (taxed once). */
      netYearOne: roundToCents(netAnnualIncome + signingBonusNet),
      /** First-year deductions include the signing bonus tax, once. */
      totalDeductionsYearOne: roundToCents(totalDeductions + signingBonusTax),
      netMonthly: perPeriod.find((p) => p.frequency === "monthly")!.net,
      netBiweekly: perPeriod.find((p) => p.frequency === "biweekly")!.net,
      employerPension,
      employerBenefits,
      workExpenses,
      netAfterWorkExpenses: roundToCents(netAnnualIncome - workExpenses),
      totalCompensation: roundToCents(netAnnualIncome + signingBonusNet + employerPension + employerBenefits),
      effectiveDeductionRate: employmentIncome > 0 ? roundToCents((totalDeductions / employmentIncome) * 100) / 100 : 0,
    },
  };
}

export function calculateComparison(offers: JobOfferInput[]): ComparisonResult {
  const warnings: string[] = [];
  // Offers without any income entered are not comparable — skip them.
  const usable = offers.filter((o) => nonNegative(o.annualSalary) > 0);
  if (usable.length < offers.length) {
    warnings.push("One or more offers have no salary entered — those offers are excluded from the comparison until you add a salary.");
  }
  const results = usable.map(calculateOffer);

  if (offers.some((o) => nonNegative(o.annualSalary) === 0)) {
    warnings.push("One or more offers have no salary entered — those columns show zero income.");
  }
  if (offers.some((o) => nonNegative(o.vacationAllowance) > 0)) {
    warnings.push(
      "Vacation allowance entries are treated as additional taxable vacation pay on top of the base salary. If vacation pay is already included in your salary figure, leave this field at zero."
    );
  }

  return { taxYear: getTaxYear(), offers: results, warnings };
}

/* ---------------------------------- ranking --------------------------------- */

export type RankingMetric = "netAnnualIncome" | "totalCompensation" | "totalDeductions" | "workExpenses" | "grossEmploymentIncome";

export interface RankedOffer {
  id: string;
  label: string;
  rank: number;
  value: number;
  /** For deductions/expenses, lower is better. */
  lowerIsBetter: boolean;
}

export function rankOffers(results: OfferResult[], metric: RankingMetric): RankedOffer[] {
  const lowerIsBetter = metric === "totalDeductions" || metric === "workExpenses";
  const rows = results.map((r) => ({
    id: r.input.id,
    label: r.input.label,
    value: r.totals[metric],
    lowerIsBetter,
  }));
  const sorted = [...rows].sort((a, b) => (lowerIsBetter ? a.value - b.value : b.value - a.value));
  return sorted.map((row, i) => ({ ...row, rank: i + 1 }));
}

/* ------------------------------- chart data --------------------------------- */

export interface ChartDatum {
  name: string;
  gross: number;
  deductions: number;
  net: number;
  monthlyNet: number;
  employerPension: number;
  employerBenefits: number;
}

export function buildChartData(results: OfferResult[]): ChartDatum[] {
  return results.map((r) => ({
    name: r.input.label,
    gross: r.totals.grossEmploymentIncome,
    deductions: r.totals.totalDeductions,
    net: r.totals.netAnnualIncome,
    monthlyNet: r.totals.netMonthly,
    employerPension: r.totals.employerPension,
    employerBenefits: r.totals.employerBenefits,
  }));
}
