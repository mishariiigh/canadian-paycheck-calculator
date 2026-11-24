import { describe, expect, it } from "vitest";
import { calculateProgressiveTax, federalBasicPersonalAmount, calculateFederalTax } from "@/engine/federal-tax";
import { getFederalData } from "@/engine/tax-data";

const fed = getFederalData();

describe("federal tax brackets 2026", () => {
  it("matches CRA/TaxTips confirmed 2026 thresholds", () => {
    expect(fed.taxBrackets).toEqual([
      { upTo: 58523, rate: 0.14 },
      { upTo: 117045, rate: 0.205 },
      { upTo: 181440, rate: 0.26 },
      { upTo: 258482, rate: 0.29 },
      { upTo: null, rate: 0.33 },
    ]);
  });

  it("zero income => zero tax", () => {
    expect(calculateProgressiveTax(0, fed.taxBrackets).grossTax).toBe(0);
  });

  it("first bracket boundary", () => {
    // 58,523 * 14% = 8,193.22
    const r = calculateProgressiveTax(58523, fed.taxBrackets);
    expect(r.grossTax).toBeCloseTo(8193.22, 2);
  });

  it("mid income brackets", () => {
    // 100,000: 58,523@14% + 41,477@20.5% = 8193.22 + 8502.785 = 16,696.005
    const r = calculateProgressiveTax(100000, fed.taxBrackets);
    expect(r.grossTax).toBeCloseTo(16696.01, 2);
  });

  it("top bracket", () => {
    // 300,000: 8193.22 + 58,522*20.5% + 64,395*26% + 77,042*29% + 41,518*33%
    // = 8193.22 + 11996.99 + 16742.70 + 22342.18 + 13700.94 = 72,976.03
    const r = calculateProgressiveTax(300000, fed.taxBrackets);
    expect(r.grossTax).toBeCloseTo(72976.05, 1);
  });
});

describe("enhanced basic personal amount", () => {
  it("maximum at or below 181,440", () => {
    expect(federalBasicPersonalAmount(181440)).toBe(16452);
    expect(federalBasicPersonalAmount(50000)).toBe(16452);
  });

  it("minimum at or above 258,482", () => {
    expect(federalBasicPersonalAmount(258482)).toBe(14829);
    expect(federalBasicPersonalAmount(500000)).toBe(14829);
  });

  it("linear phase-out midpoint", () => {
    const mid = (181440 + 258482) / 2;
    const expected = (16452 + 14829) / 2;
    expect(federalBasicPersonalAmount(mid)).toBeCloseTo(expected, 2);
  });
});

describe("federal tax with credits", () => {
  it("income below BPA yields zero tax", () => {
    const r = calculateFederalTax({
      taxableIncome: 10000,
      netIncomeForBpa: 10000,
      cppBaseAndFirstAdditional: 0,
      eiPremiums: 0,
      quebecAbatementRate: 0,
    });
    expect(r.netTax).toBe(0);
  });

  it("BPA credit is max * 14% = 2303.28", () => {
    const r = calculateFederalTax({
      taxableIncome: 100000,
      netIncomeForBpa: 100000,
      cppBaseAndFirstAdditional: 0,
      eiPremiums: 0,
      quebecAbatementRate: 0,
    });
    expect(r.bpaCredit).toBeCloseTo(2303.28, 2);
  });
});
