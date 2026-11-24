import { describe, expect, it } from "vitest";
import { calculateProvincialTax } from "@/engine/provincial-tax";
import { calculateAnnualTax } from "@/engine/annual-tax";

describe("NL Low-Income Tax Reduction — Income Tax Act, 2000 s.21.1; Reg 18/26", () => {
  // 2026 parameters per Regulation 18/26 s.3(b):
  //   Amount A = $842 (21.1(2.1)(a))
  //   Amount B = $563 (21.1(2.1)(b) — qualified relation / 9(1)(b) only)
  // Thresholds per Act s.21.1(2), indexed under s.6.1(2) and NLR 121/07:
  //   $24,191 individual (2026 indexed from base $18,547 via 2025 $23,928 × 1.1%)
  //   $40,905 family (2026 indexed from base $31,362 via 2025 $40,460 × 1.1%)
  // Clawback: 16% of adjusted income over threshold (21.1(2))
  // Non-refundable: cannot exceed tax otherwise payable (applied last per s.21.1(5))
  // Adjusted income per s.21.1(1)(a): individual + qualified relation income (federal s.122.6).
  //   Eligible dependant's income is NOT included in adjusted income.

  describe("Single individual without qualified relation or eligible dependant (A=$842, threshold=$24,191)", () => {
    it("LITR capped at tax otherwise payable — non-refundable at low income", () => {
      const r = calculateProvincialTax({
        province: "NL" as const,
        taxableIncome: 15000,
        cppBaseAndFirstAdditional: 0,
        eiPremiums: 0,
      });
      // Tax before LITR: 1305.00 - 1139.178 = 165.822
      // LITR formula = 842 (below threshold) but capped at 165.82
      expect(r.lowIncomeReduction).toBeCloseTo(165.82, 2);
      expect(r.netTax).toBeCloseTo(0, 2);
    });

    it("LITR at threshold income $24,191 — formula gives $842, capped at tax payable", () => {
      const r = calculateProvincialTax({
        province: "NL" as const,
        taxableIncome: 24191,
        cppBaseAndFirstAdditional: 0,
        eiPremiums: 0,
      });
      // Tax before LITR: 2104.617 - 1139.178 = 965.439
      // LITR formula = 842, capped at 965.44 → 842
      expect(r.lowIncomeReduction).toBeCloseTo(842, 2);
      expect(r.netTax).toBeCloseTo(965.44 - 842, 2);
    });

    it("LITR phases out at 16% of income over threshold — income $25,000", () => {
      const r = calculateProvincialTax({
        province: "NL" as const,
        taxableIncome: 25000,
        cppBaseAndFirstAdditional: 0,
        eiPremiums: 0,
      });
      // Formula: 842 - 0.16 * (25000 - 24191) = 842 - 129.44 = 712.56
      expect(r.lowIncomeReduction).toBeCloseTo(712.56, 2);
    });

    it("LITR phases out at 16% of income over threshold — income $28,000", () => {
      const r = calculateProvincialTax({
        province: "NL" as const,
        taxableIncome: 28000,
        cppBaseAndFirstAdditional: 0,
        eiPremiums: 0,
      });
      // Formula: 842 - 0.16 * (28000 - 24191) = 842 - 609.44 = 232.56
      expect(r.lowIncomeReduction).toBeCloseTo(232.56, 2);
    });

    it("LITR near elimination — income $29,453", () => {
      const r = calculateProvincialTax({
        province: "NL" as const,
        taxableIncome: 29453,
        cppBaseAndFirstAdditional: 0,
        eiPremiums: 0,
      });
      // Formula: 842 - 0.16 * (29453 - 24191) = 842 - 841.92 = 0.08
      expect(r.lowIncomeReduction).toBeCloseTo(0.08, 2);
    });

    it("LITR fully eliminated — income $29,454 and above", () => {
      const r = calculateProvincialTax({
        province: "NL" as const,
        taxableIncome: 29454,
        cppBaseAndFirstAdditional: 0,
        eiPremiums: 0,
      });
      // Formula: 842 - 0.16 * (29454 - 24191) = 842 - 842.08 = negative → 0
      expect(r.lowIncomeReduction).toBeCloseTo(0, 2);
    });

    it("LITR is zero at high income — income $30,000", () => {
      const r = calculateProvincialTax({
        province: "NL" as const,
        taxableIncome: 30000,
        cppBaseAndFirstAdditional: 0,
        eiPremiums: 0,
      });
      expect(r.lowIncomeReduction).toBeCloseTo(0, 2);
    });
  });

  describe("Individual with qualified relation (A=$842 + B=$563 = $1,405, threshold=$40,905)", () => {
    it("LITR uses amount A + B with family threshold — income $30,000", () => {
      const r = calculateProvincialTax({
        province: "NL" as const,
        taxableIncome: 30000,
        cppBaseAndFirstAdditional: 0,
        eiPremiums: 0,
        hasQualifiedRelation: true,
      });
      // Below threshold: formula = 1405, tax before LITR: 2610 - 1139.178 = 1470.822
      expect(r.lowIncomeReduction).toBeCloseTo(1405, 2);
    });

    it("LITR at family threshold $40,905 — formula gives $1,405", () => {
      const r = calculateProvincialTax({
        province: "NL" as const,
        taxableIncome: 40905,
        cppBaseAndFirstAdditional: 0,
        eiPremiums: 0,
        hasQualifiedRelation: true,
      });
      // Formula: 1405 - 0 = 1405; tax payable: 3558.735 - 1139.178 = 2419.557
      expect(r.lowIncomeReduction).toBeCloseTo(1405, 2);
    });

    it("LITR phases out at 16% over family threshold — income $45,000", () => {
      const r = calculateProvincialTax({
        province: "NL" as const,
        taxableIncome: 45000,
        cppBaseAndFirstAdditional: 0,
        eiPremiums: 0,
        hasQualifiedRelation: true,
      });
      // Formula: 1405 - 0.16 * (45000 - 40905) = 1405 - 655.2 = 749.8
      expect(r.lowIncomeReduction).toBeCloseTo(749.80, 2);
    });

    it("LITR fully eliminated above family elimination point — income $49,687", () => {
      const r = calculateProvincialTax({
        province: "NL" as const,
        taxableIncome: 49687,
        cppBaseAndFirstAdditional: 0,
        eiPremiums: 0,
        hasQualifiedRelation: true,
      });
      // Formula: 1405 - 0.16 * (49687 - 40905) = 1405 - 1405.12 = negative → 0
      expect(r.lowIncomeReduction).toBeCloseTo(0, 2);
    });

    it("LITR near elimination with qualified relation — income $49,686", () => {
      const r = calculateProvincialTax({
        province: "NL" as const,
        taxableIncome: 49686,
        cppBaseAndFirstAdditional: 0,
        eiPremiums: 0,
        hasQualifiedRelation: true,
      });
      // Formula: 1405 - 0.16 * (49686 - 40905) = 1405 - 1404.96 = 0.04
      expect(r.lowIncomeReduction).toBeCloseTo(0.04, 2);
    });
  });

  describe("Individual with eligible dependant only (claimsEligibleDependant=true, no qualified relation)", () => {
    it("Amount B applies with eligible dependant claim — income $30,000", () => {
      const r = calculateProvincialTax({
        province: "NL" as const,
        taxableIncome: 30000,
        cppBaseAndFirstAdditional: 0,
        eiPremiums: 0,
        claimsEligibleDependant: true,
      });
      // A + B = 1405, below family threshold; tax before LITR: 2610 - 1139.178 = 1470.822
      expect(r.lowIncomeReduction).toBeCloseTo(1405, 2);
    });

    it("Family threshold applies with eligible dependant claim — income $40,905", () => {
      const r = calculateProvincialTax({
        province: "NL" as const,
        taxableIncome: 40905,
        cppBaseAndFirstAdditional: 0,
        eiPremiums: 0,
        claimsEligibleDependant: true,
      });
      // Formula: 1405 - 0 = 1405; tax payable: 3558.735 - 1139.178 = 2419.557
      expect(r.lowIncomeReduction).toBeCloseTo(1405, 2);
    });

    it("Individual threshold does NOT apply when eligible dependant claimed — income $30,000", () => {
      const r = calculateProvincialTax({
        province: "NL" as const,
        taxableIncome: 30000,
        cppBaseAndFirstAdditional: 0,
        eiPremiums: 0,
        claimsEligibleDependant: true,
      });
      // Below family threshold: formula = 1405, not 842 - 0.16*(30000-24191) = 911.44
      // Tax before LITR: 2610 - 1139.178 = 1470.822 > 1405, so uncapped
      expect(r.lowIncomeReduction).toBeCloseTo(1405, 2);
    });

    it("LITR fully eliminated with eligible dependant — income $49,687", () => {
      const r = calculateProvincialTax({
        province: "NL" as const,
        taxableIncome: 49687,
        cppBaseAndFirstAdditional: 0,
        eiPremiums: 0,
        claimsEligibleDependant: true,
      });
      expect(r.lowIncomeReduction).toBeCloseTo(0, 2);
    });
  });

  describe("Both qualified relation and eligible dependant claimed", () => {
    it("Amount B applies (not doubled) when both conditions true — income $30,000", () => {
      const r = calculateProvincialTax({
        province: "NL" as const,
        taxableIncome: 30000,
        cppBaseAndFirstAdditional: 0,
        eiPremiums: 0,
        hasQualifiedRelation: true,
        claimsEligibleDependant: true,
      });
      // A + B = 1405 (B applied once, not doubled)
      expect(r.lowIncomeReduction).toBeCloseTo(1405, 2);
    });

    it("Family threshold applies when both conditions true — income $40,905", () => {
      const r = calculateProvincialTax({
        province: "NL" as const,
        taxableIncome: 40905,
        cppBaseAndFirstAdditional: 0,
        eiPremiums: 0,
        hasQualifiedRelation: true,
        claimsEligibleDependant: true,
      });
      expect(r.lowIncomeReduction).toBeCloseTo(1405, 2);
    });
  });

  describe("Adjusted income overrides taxable income for clawback (s.21.1(1)(a))", () => {
    it("Uses adjustedIncome when provided, even if taxableIncome differs", () => {
      const r1 = calculateProvincialTax({
        province: "NL" as const,
        taxableIncome: 25000,
        cppBaseAndFirstAdditional: 0,
        eiPremiums: 0,
        adjustedIncome: 20000,
      });
      // Below threshold: formula = 842
      expect(r1.lowIncomeReduction).toBeCloseTo(842, 2);

      const r2 = calculateProvincialTax({
        province: "NL" as const,
        taxableIncome: 25000,
        cppBaseAndFirstAdditional: 0,
        eiPremiums: 0,
        adjustedIncome: 25000,
      });
      // Formula: 842 - 0.16 * (25000 - 24191) = 712.56
      expect(r2.lowIncomeReduction).toBeCloseTo(712.56, 2);
    });

    it("Eligible dependant's income is NOT included in adjusted income", () => {
      // When claimsEligibleDependant is true but adjustedIncome is not provided,
      // adjustedIncome defaults to taxableIncome (not taxableIncome + dependant income)
      const r = calculateProvincialTax({
        province: "NL" as const,
        taxableIncome: 30000,
        cppBaseAndFirstAdditional: 0,
        eiPremiums: 0,
        claimsEligibleDependant: true,
      });
      // Uses taxableIncome 30000 as adjustedIncome: below family threshold, LITR = 1405
      expect(r.lowIncomeReduction).toBeCloseTo(1405, 2);
    });
  });

  describe("Integration via calculateAnnualTax", () => {
    it("Single individual, no qualified relation — LITR at income $25,000", () => {
      const r = calculateAnnualTax({
        grossAnnualIncome: 25000,
        province: "NL",
        taxYear: 2026,
      });
      expect(r.provincial.lowIncomeReduction).toBeCloseTo(712.56, 2);
      expect(r.provincial.lowIncomeReduction).toBeLessThanOrEqual(
        Math.max(0, r.provincial.grossTax - r.provincial.bpaCredit - r.provincial.cppEiCredit) + 0.01
      );
    });

    it("LITR non-refundable — cannot exceed provincial tax otherwise payable", () => {
      const r = calculateAnnualTax({
        grossAnnualIncome: 15000,
        province: "NL",
        taxYear: 2026,
      });
      const taxBeforeLITR = Math.max(
        0,
        r.provincial.grossTax - r.provincial.bpaCredit - r.provincial.cppEiCredit
      );
      expect(r.provincial.lowIncomeReduction).toBeLessThanOrEqual(taxBeforeLITR + 0.01);
      expect(r.provincial.netTax).toBeCloseTo(0, 2);
    });

    it("LITR zero at high income — income $50,000 single", () => {
      const r = calculateAnnualTax({
        grossAnnualIncome: 50000,
        province: "NL",
        taxYear: 2026,
      });
      expect(r.provincial.lowIncomeReduction).toBeCloseTo(0, 2);
    });

    it("Eligible dependant claim triggers family threshold — income $45,000", () => {
      const r = calculateAnnualTax({
        grossAnnualIncome: 45000,
        province: "NL",
        taxYear: 2026,
        claimsEligibleDependant: true,
      });
      // Family threshold $40,905: LITR = 1405 - 0.16 * (45000 - 40905) = 749.80
      expect(r.provincial.lowIncomeReduction).toBeCloseTo(749.80, 2);
    });

    it("Qualified relation triggers family threshold — income $45,000", () => {
      const r = calculateAnnualTax({
        grossAnnualIncome: 45000,
        province: "NL",
        taxYear: 2026,
        hasQualifiedRelation: true,
      });
      expect(r.provincial.lowIncomeReduction).toBeCloseTo(749.80, 2);
    });
  });
});
