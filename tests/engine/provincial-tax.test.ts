import { describe, expect, it } from "vitest";
import { calculateProvincialTax, calculateOntarioSurtax, calculateOntarioHealthPremium } from "@/engine/provincial-tax";
import { getProvincialData } from "@/engine/tax-data";

describe("Ontario 2026", () => {
  const data = getProvincialData("ON");

  it("brackets match confirmed 2026-2027 values", () => {
    expect(data.taxBrackets).toEqual([
      { upTo: 53891, rate: 0.0505 },
      { upTo: 107785, rate: 0.0915 },
      { upTo: 150000, rate: 0.1116 },
      { upTo: 220000, rate: 0.1216 },
      { upTo: null, rate: 0.1316 },
    ]);
  });

  it("BPA is 12,989 at 5.05%", () => {
    expect(data.basicPersonalAmount.amount).toBe(12989);
    expect(data.basicPersonalAmount.creditRate).toBe(0.0505);
  });

  it("surtax thresholds: 20% over $5,818, 36% over $7,446", () => {
    expect(calculateOntarioSurtax(5818)).toBe(0);
    expect(calculateOntarioSurtax(6818)).toBeCloseTo(200, 2);
    // tax 8,000: 20%*(8000-5818) + 36%*(8000-7446) = 436.4 + 199.44 = 635.84
    expect(calculateOntarioSurtax(8000)).toBeCloseTo(635.84, 2);
  });

  it("health premium bands", () => {
    expect(calculateOntarioHealthPremium(20000)).toBe(0);
    expect(calculateOntarioHealthPremium(22000)).toBeCloseTo(120, 2); // 6% of 2,000
    expect(calculateOntarioHealthPremium(36000)).toBe(300);
    expect(calculateOntarioHealthPremium(50000)).toBe(600);
    expect(calculateOntarioHealthPremium(100000)).toBe(750);
    expect(calculateOntarioHealthPremium(250000)).toBe(900);
  });

  it("income <= BPA pays no provincial tax", () => {
    const r = calculateProvincialTax({ province: "ON", taxableIncome: 12000, cppBaseAndFirstAdditional: 0, eiPremiums: 0 });
    expect(r.netTax).toBe(0);
    expect(r.healthPremium).toBe(0);
  });
});

describe("provincial data sanity for all provinces", () => {
  const codes = ["AB", "BC", "MB", "NB", "NL", "NS", "NT", "NU", "PE", "QC", "SK", "YT"] as const;

  it.each(codes)("brackets and BPA exist for %s", (code) => {
    const d = getProvincialData(code);
    expect(d.taxBrackets.length).toBeGreaterThan(0);
    expect(d.basicPersonalAmount.amount).toBeGreaterThan(0);
    expect(d.basicPersonalAmount.creditRate).toBeGreaterThan(0);
    // Rates strictly increasing
    for (let i = 1; i < d.taxBrackets.length; i++) {
      expect(d.taxBrackets[i].rate).toBeGreaterThan(d.taxBrackets[i - 1].rate);
    }
  });

  it("Quebec abatement 16.5% configured", () => {
    expect(getProvincialData("QC").federalAbatement?.rate).toBe(0.165);
  });

  it("Territories have 2% employee payroll tax", () => {
    expect(getProvincialData("NT").payrollTax?.rate).toBe(0.02);
    expect(getProvincialData("NU").payrollTax?.rate).toBe(0.02);
  });
});
