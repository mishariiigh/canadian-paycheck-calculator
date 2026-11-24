/** Core types for the tax calculation engine. Engine is framework-agnostic. */

export type ProvinceCode =
  | "AB" | "BC" | "MB" | "NB" | "NL" | "NS" | "NT"
  | "NU" | "ON" | "PE" | "QC" | "SK" | "YT";

export interface TaxBracket {
  /** Taxable income upper bound of the bracket; null = no upper bound. */
  upTo: number | null;
  rate: number;
}

export interface Source {
  name: string;
  url: string;
}

export interface FederalTaxData {
  taxYear: number;
  jurisdiction: "federal";
  effectiveDate: string;
  lastVerified: string;
  sources: Source[];
  taxBrackets: TaxBracket[];
  basicPersonalAmount: {
    minimum: number;
    maximum: number;
    creditRate: number;
    phaseOutStartNetIncome: number;
    phaseOutEndNetIncome: number;
  };
  otherCredits: {
    employmentAmount: number;
  };
  indexationFactor: number;
}

export interface ProvincialTaxData {
  taxYear: number;
  province: ProvinceCode;
  provinceName: string;
  effectiveDate: string;
  lastVerified: string;
  sources: Source[];
  taxBrackets: TaxBracket[];
  basicPersonalAmount: { amount: number; creditRate: number };
  indexationFactor: number | null;
  notes?: string[];
  surtax?: {
    tiers: { rate: number; onTaxOver: number }[];
  };
  healthPremium?: {
    bands: (
      | { upTo: number | null; amount: number }
      | { upTo: number | null; amount: null; base: number; rate: number; over: number }
    )[];
  };
  federalAbatement?: { rate: number; note: string };
  payrollTax?: { type: "employee"; rate: number; basis: string; note: string };
  /** Newfoundland and Labrador low-income tax reduction (Income Tax Act, 2000 s.21.1; Reg 18/26). */
  lowIncomeReduction?: {
    /** Amount A prescribed by regulation for 21.1(2.1)(a). */
    amountA: number;
    /** Amount B prescribed by regulation for 21.1(2.1)(b) — applies only with qualified relation / 9(1)(b) claim. */
    amountB: number;
    /** Threshold for 21.1(2)(b) — single individual, no qualified relation. */
    thresholdIndividual: number;
    /** Threshold for 21.1(2)(c) — qualified relation or 9(1)(b) claim. */
    thresholdFamily: number;
    /** Clawback rate per 21.1(2) — 16%. */
    clawbackRate: number;
  };
}

export interface PayrollData {
  taxYear: number;
  jurisdiction: "payroll";
  effectiveDate: string;
  lastVerified: string;
  sources: Source[];
  cpp: { rate: number; basicExemption: number; ympe: number; maximumEmployeeContribution: number };
  cpp2: { rate: number; yampe: number; maximumEmployeeContribution: number };
  ei: {
    rateOutsideQuebec: number;
    rateQuebec: number;
    maximumInsurableEarnings: number;
    maximumEmployeePremiumOutsideQuebec: number;
    maximumEmployeePremiumQuebec: number;
    employerMultiple: number;
  };
  qpp: {
    baseRateEmployee: number;
    firstAdditionalRateEmployee: number;
    basicExemption: number;
    mpe: number;
    maximumEmployeeBasePlusFirstAdditional: number;
    yampe: number;
    secondAdditionalRateEmployee: number;
    maximumEmployeeSecondAdditional: number;
  };
  qpip: { rateEmployee: number; maximumInsurableEarnings: number; maximumEmployeePremium: number };
}

export type PayFrequency =
  | "weekly"
  | "biweekly"
  | "semiMonthly"
  | "monthly"
  | "annual";

export interface PayFrequencyInfo {
  periodsPerYear: number;
}

export const PAY_FREQUENCIES: Record<PayFrequency, PayFrequencyInfo> = {
  weekly: { periodsPerYear: 52 },
  biweekly: { periodsPerYear: 26 },
  semiMonthly: { periodsPerYear: 24 },
  monthly: { periodsPerYear: 12 },
  annual: { periodsPerYear: 1 },
};

export interface TaxCalculationInput {
  /** Annual gross employment income (salary + bonus, before deductions). */
  grossAnnualIncome: number;
  province: ProvinceCode;
  taxYear: number;
  /** Additional annual pre-tax deductions (e.g. pension adjustment, union dues treated as deductions). */
  otherDeductions?: number;
  /** Number ofCPP/EI contribution months; defaults to 12. */
  monthsWorked?: number;
  /** Whether the individual has a cohabiting spouse/common-law partner (qualified relation per s.21.1(1)(c)). */
  hasQualifiedRelation?: boolean;
  /** Whether the individual claims an amount under paragraph 9(1)(b) for an eligible dependant. */
  claimsEligibleDependant?: boolean;
  /** Adjusted income per s.21.1(1)(a) — includes qualified relation's income per federal s.122.6. Defaults to taxable income. Does NOT include an eligible dependant's income. */
  adjustedIncome?: number;
}

export interface TaxCalculationResult {
  grossAnnualIncome: number;
  taxableIncome: number;
  federal: {
    grossTax: number;
    bpaCredit: number;
    employmentCredit: number;
    cppEiCredit: number;
    netTax: number;
    abatement: number;
    effectiveAbatedTax: number;
  };
  provincial: {
    grossTax: number;
    bpaCredit: number;
    cppEiCredit: number;
    lowIncomeReduction: number;
    surtax: number;
    netTaxBeforeSurtaxAdjustment: number;
    netTax: number;
    healthPremium: number;
    totalPayable: number;
  };
  payroll: {
    pensionName: "CPP" | "QPP";
    pensionBase: number;
    pensionFirstAdditional: number;
    pensionSecondAdditional: number;
    pensionTotal: number;
    ei: number;
    eiName: "EI" | "QPIP";
    provincialPayrollTax: number;
  };
  totals: {
    totalTaxAndDeductions: number;
    netAnnualIncome: number;
    averageTaxRate: number;
    marginalRate: number;
  };
  breakdownByBracket: {
    jurisdiction: "federal" | "provincial";
    rate: number;
    from: number;
    to: number | null;
    taxableInBracket: number;
    tax: number;
  }[];
}

export interface PerPeriodResult {
  frequency: PayFrequency;
  periodsPerYear: number;
  gross: number;
  federalTax: number;
  provincialTax: number;
  pension: number;
  ei: number;
  provincialPayrollTax: number;
  totalDeductions: number;
  net: number;
}

export interface FullCalculationResult {
  annual: TaxCalculationResult;
  perPeriod: PerPeriodResult[];
}
