import { getPayrollData } from "./tax-data";
import { roundToCents } from "./rounding";
import type { ProvinceCode } from "./types";

export interface PensionResult {
  name: "CPP" | "QPP";
  base: number;
  firstAdditional: number;
  secondAdditional: number;
  total: number;
}

/**
 * Annual CPP/QPP employee contribution.
 *
 * Base + 1st additional (rate x (min(earnings, YMPE) - exemption)), capped.
 * 2nd additional (CPP2/QPP2): rate x (min(earnings, YAMPE) - YMPE), capped.
 *
 * `monthsWorked` prorates the exemption and the maximums (CRA prorates the
 * YMPE/YAMPE and exemption by months of pensionable service).
 */
export function calculatePension(options: {
  province: ProvinceCode;
  annualPensionableEarnings: number;
  monthsWorked?: number;
}): PensionResult {
  const payroll = getPayrollData();
  const months = options.monthsWorked ?? 12;
  const isQuebec = options.province === "QC";

  const cfg = isQuebec ? payroll.qpp : payroll.cpp;
  const rate = isQuebec ? payroll.qpp.baseRateEmployee + payroll.qpp.firstAdditionalRateEmployee : payroll.cpp.rate;
  const ympe = isQuebec ? payroll.qpp.mpe : payroll.cpp.ympe;
  const exemption = Math.min(cfg.basicExemption, (cfg.basicExemption / 12) * months);
  const maxBase = roundToCents(
    isQuebec
      ? payroll.qpp.maximumEmployeeBasePlusFirstAdditional
      : payroll.cpp.maximumEmployeeContribution
  ) * (months / 12);

  const pensionable = Math.max(0, Math.min(options.annualPensionableEarnings, ympe) - exemption);
  const base = Math.min(roundToCents(pensionable * rate), roundToCents(maxBase));

  // Second additional (CPP2/QPP2)
  const cpp2cfg = payroll.cpp2;
  const yampe = isQuebec ? payroll.qpp.yampe : cpp2cfg.yampe;
  const cpp2Rate = isQuebec ? payroll.qpp.secondAdditionalRateEmployee : cpp2cfg.rate;
  const proratedYampe = roundToCents((yampe / 12) * months);
  const proratedYmpe = roundToCents((ympe / 12) * months);
  const maxSecond = roundToCents(
    (isQuebec ? payroll.qpp.maximumEmployeeSecondAdditional : cpp2cfg.maximumEmployeeContribution) * (months / 12)
  );
  const secondEarnings = Math.max(0, Math.min(options.annualPensionableEarnings, proratedYampe) - proratedYmpe);
  const secondAdditional = Math.min(roundToCents(secondEarnings * cpp2Rate), maxSecond);

  return {
    name: isQuebec ? "QPP" : "CPP",
    base: roundToCents(base),
    firstAdditional: 0, // Combined into base for employee presentation.
    secondAdditional,
    total: roundToCents(base + secondAdditional),
  };
}

export function calculateCpp(options: { annualPensionableEarnings: number; monthsWorked?: number }): PensionResult {
  return calculatePension({ province: "ON", ...options });
}

export function calculateCpp2(options: {
  province?: ProvinceCode;
  annualPensionableEarnings: number;
  monthsWorked?: number;
}): number {
  return calculatePension({ province: options.province ?? "ON", annualPensionableEarnings: options.annualPensionableEarnings, monthsWorked: options.monthsWorked }).secondAdditional;
}
