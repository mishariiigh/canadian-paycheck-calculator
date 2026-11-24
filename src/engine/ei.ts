import { getPayrollData } from "./tax-data";
import { roundToCents } from "./rounding";
import type { ProvinceCode } from "./types";

export interface EiResult {
  name: "EI" | "QPIP";
  premium: number;
}

/**
 * Annual employee EI premium (or QPIP premium in Quebec).
 * Premiums apply to insurable earnings up to the annual maximum; prorated
 * by months worked.
 */
export function calculateEi(options: {
  province: ProvinceCode;
  annualInsurableEarnings: number;
  monthsWorked?: number;
}): EiResult {
  const payroll = getPayrollData();
  const months = options.monthsWorked ?? 12;
  const isQuebec = options.province === "QC";

  const rate = isQuebec ? payroll.ei.rateQuebec : payroll.ei.rateOutsideQuebec;
  const maxPremium = isQuebec ? payroll.ei.maximumEmployeePremiumQuebec : payroll.ei.maximumEmployeePremiumOutsideQuebec;

  if (isQuebec) {
    // Quebec employees pay both reduced EI (1.30%) and QPIP (0.430%).
    const maxInsurable = Math.round((payroll.ei.maximumInsurableEarnings / 12) * months);
    const eiPremium = Math.min(
      roundToCents(Math.min(options.annualInsurableEarnings, maxInsurable) * payroll.ei.rateQuebec),
      roundToCents(payroll.ei.maximumEmployeePremiumQuebec * (months / 12))
    );
    const qpip = payroll.qpip;
    const qpipMaxInsurable = Math.round((qpip.maximumInsurableEarnings / 12) * months);
    const qpipPremium = Math.min(
      roundToCents(Math.min(options.annualInsurableEarnings, qpipMaxInsurable) * qpip.rateEmployee),
      roundToCents(qpip.maximumEmployeePremium * (months / 12))
    );
    return { name: "QPIP", premium: roundToCents(eiPremium + qpipPremium) };
  }

  const maxInsurable = Math.round((payroll.ei.maximumInsurableEarnings / 12) * months);
  const premium = Math.min(
    roundToCents(Math.min(options.annualInsurableEarnings, maxInsurable) * rate),
    roundToCents(maxPremium * (months / 12))
  );
  return { name: "EI", premium };
}
