import { calculateAnnualTax } from "./annual-tax";
import { calculatePension } from "./cpp";
import { calculateEi } from "./ei";
import { calculateProvincialPayrollTax } from "./provincial-payroll-tax";
import { roundToCents } from "./rounding";
import type { ProvinceCode, TaxCalculationResult } from "./types";

export interface BonusResult {
  bonusGross: number;
  bonusFederalTax: number;
  bonusProvincialTax: number;
  bonusPension: number;
  bonusEi: number;
  bonusProvincialPayrollTax: number;
  bonusNet: number;
  effectiveMarginalRate: number;
  base: TaxCalculationResult;
  withBonus: TaxCalculationResult;
}

/**
 * Bonus tax estimate. A bonus is employment income taxed at the employee's
 * marginal rate. CPP/EI only apply to the portion of the bonus that fills
 * remaining annual room (mirroring how employers actually withhold).
 */
export function calculateBonusTax(options: {
  province: ProvinceCode;
  baseSalary: number;
  bonus: number;
}): BonusResult {
  const bonus = Math.max(0, options.bonus);
  const baseSalary = Math.max(0, options.baseSalary);

  const base = calculateAnnualTax({ grossAnnualIncome: baseSalary, province: options.province, taxYear: 2026 });
  const withBonus = calculateAnnualTax({
    grossAnnualIncome: baseSalary + bonus,
    province: options.province,
    taxYear: 2026,
  });

  const bonusFederalTax = withBonus.federal.effectiveAbatedTax - base.federal.effectiveAbatedTax;
  const bonusProvincialTax = withBonus.provincial.totalPayable - base.provincial.totalPayable;

  const basePension = calculatePension({ province: options.province, annualPensionableEarnings: baseSalary });
  const bonusPensionCalc = calculatePension({ province: options.province, annualPensionableEarnings: baseSalary + bonus });
  const bonusPension = Math.max(0, bonusPensionCalc.total - basePension.total);

  const baseEi = calculateEi({ province: options.province, annualInsurableEarnings: baseSalary });
  const bonusEiCalc = calculateEi({ province: options.province, annualInsurableEarnings: baseSalary + bonus });
  const bonusEi = Math.max(0, bonusEiCalc.premium - baseEi.premium);

  const bonusProvincialPayrollTax =
    calculateProvincialPayrollTax({ province: options.province, grossEmploymentIncome: baseSalary + bonus }) -
    calculateProvincialPayrollTax({ province: options.province, grossEmploymentIncome: baseSalary });

  const bonusNet =
    bonus - bonusFederalTax - bonusProvincialTax - bonusPension - bonusEi - bonusProvincialPayrollTax;
  const effectiveMarginalRate = bonus > 0 ? 1 - bonusNet / bonus : 0;

  return {
    bonusGross: roundToCents(bonus),
    bonusFederalTax: roundToCents(bonusFederalTax),
    bonusProvincialTax: roundToCents(bonusProvincialTax),
    bonusPension: roundToCents(bonusPension),
    bonusEi: roundToCents(bonusEi),
    bonusProvincialPayrollTax: roundToCents(bonusProvincialPayrollTax),
    bonusNet: roundToCents(bonusNet),
    effectiveMarginalRate: Math.round(effectiveMarginalRate * 10000) / 10000,
    base,
    withBonus,
  };
}

export interface ConversionResult {
  hourlyRate: number;
  hoursPerWeek: number;
  weeksPerYear: number;
  annualSalary: number;
  monthlyGross: number;
  weeklyGross: number;
}

export function hourlyToAnnualConversion(
  hourlyRate: number,
  hoursPerWeek: number,
  weeksPerYear = 52
): ConversionResult {
  const annual = roundToCents(hourlyRate * hoursPerWeek * weeksPerYear);
  return {
    hourlyRate,
    hoursPerWeek,
    weeksPerYear,
    annualSalary: annual,
    monthlyGross: roundToCents(annual / 12),
    weeklyGross: roundToCents(annual / weeksPerYear),
  };
}

export function annualToHourlyConversion(
  annualSalary: number,
  hoursPerWeek: number,
  weeksPerYear = 52
): ConversionResult {
  const hourly = roundToCents(annualSalary / (hoursPerWeek * weeksPerYear));
  return {
    hourlyRate: hourly,
    hoursPerWeek,
    weeksPerYear,
    annualSalary,
    monthlyGross: roundToCents(annualSalary / 12),
    weeklyGross: roundToCents(annualSalary / weeksPerYear),
  };
}
