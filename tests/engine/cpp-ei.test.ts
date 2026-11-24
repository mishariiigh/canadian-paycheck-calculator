import { describe, expect, it } from "vitest";
import { calculatePension } from "@/engine/cpp";
import { calculateEi } from "@/engine/ei";
import { getPayrollData } from "@/engine/tax-data";

const payroll = getPayrollData();

describe("CPP 2026", () => {
  it("data matches CRA: rate 5.95%, YMPE 74,600, exemption 3,500, max 4,230.45", () => {
    expect(payroll.cpp.rate).toBe(0.0595);
    expect(payroll.cpp.ympe).toBe(74600);
    expect(payroll.cpp.basicExemption).toBe(3500);
    expect(payroll.cpp.maximumEmployeeContribution).toBe(4230.45);
  });

  it("maximum contribution reached at or above YMPE", () => {
    const r = calculatePension({ province: "ON", annualPensionableEarnings: 74600 });
    expect(r.total).toBeCloseTo(4230.45, 2);
  });

  it("below YMPE: 5.95% of (earnings - 3,500)", () => {
    // 60,000: (60,000-3,500)*0.0595 = 3,361.75
    const r = calculatePension({ province: "ON", annualPensionableEarnings: 60000 });
    expect(r.total).toBeCloseTo(3361.75, 2);
  });

  it("CPP2 4% on earnings between YMPE and YAMPE (85,000), max $416", () => {
    // 85,000: base max 4,230.45 + 4% * 10,400 = 416 => 4,646.45
    const r = calculatePension({ province: "ON", annualPensionableEarnings: 85000 });
    expect(r.base).toBeCloseTo(4230.45, 2);
    expect(r.secondAdditional).toBeCloseTo(416.0, 2);
    expect(r.total).toBeCloseTo(4646.45, 2);
  });

  it("no pension contributions below exemption", () => {
    const r = calculatePension({ province: "ON", annualPensionableEarnings: 3000 });
    expect(r.total).toBe(0);
  });
});

describe("QPP 2026 (Quebec)", () => {
  it("employee base+1st additional rate 6.3%, max 4,479 at MPE", () => {
    const r = calculatePension({ province: "QC", annualPensionableEarnings: 74600 });
    expect(r.name).toBe("QPP");
    expect(r.base).toBeCloseTo(4479.0, 2);
  });

  it("QPP2 max $416 on earnings up to YAMPE 85,000", () => {
    const r = calculatePension({ province: "QC", annualPensionableEarnings: 90000 });
    expect(r.secondAdditional).toBeCloseTo(416.0, 2);
    expect(r.total).toBeCloseTo(4895.0, 2);
  });
});

describe("EI 2026", () => {
  it("rate 1.63%, MIE 68,900, max $1,123.07", () => {
    expect(payroll.ei.rateOutsideQuebec).toBe(0.0163);
    expect(payroll.ei.maximumInsurableEarnings).toBe(68900);
    const r = calculateEi({ province: "ON", annualInsurableEarnings: 100000 });
    expect(r.premium).toBeCloseTo(1123.07, 2);
  });

  it("partial year prorates maximum", () => {
    const r = calculateEi({ province: "ON", annualInsurableEarnings: 100000, monthsWorked: 6 });
    expect(r.premium).toBeCloseTo(Math.round(68900 / 2) * 0.0163, 2);
  });

  it("Quebec residents pay reduced EI 1.30% + QPIP 0.430% on the same earnings", () => {
    const r = calculateEi({ province: "QC", annualInsurableEarnings: 68900 });
    expect(r.name).toBe("QPIP");
    // 68,900 * (0.013 + 0.0043) = 1,191.97
    expect(r.premium).toBeCloseTo(68900 * 0.0173, 2);
  });

  it("Quebec employee premiums: EI 1.30% capped $895.70 + QPIP 0.430% capped $442.90", () => {
    const r = calculateEi({ province: "QC", annualInsurableEarnings: 200000 });
    expect(r.premium).toBeCloseTo(895.7 + 442.9, 2);
  });
});
