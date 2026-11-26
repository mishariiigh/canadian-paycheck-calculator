import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import {
  validateOfferPayload,
  JOB_COMPARISON_EVENTS,
  trackEvent,
} from "@/lib/analytics";
import { calculateComparison } from "@/lib/job-offer-comparison";
import type { ComparisonResult } from "@/lib/job-offer-comparison";
import { buildInsightLinesForTest, buildReportRowsForTest } from "@/components/job-offer-comparison/print-report";

/* --------------------------- analytics payload privacy ---------------------- */

describe("analytics privacy", () => {
  beforeEach(() => {
    vi.stubGlobal("window", { dataLayer: [] as unknown[] });
  });
  afterEach(() => vi.unstubAllGlobals());

  it("event names include the required set", () => {
    for (const name of [
      "job_comparison_started",
      "job_offer_added",
      "job_offer_removed",
      "job_comparison_completed",
      "job_comparison_reset",
      "comparison_report_downloaded",
      "comparison_summary_copied",
    ]) {
      expect(JOB_COMPARISON_EVENTS).toContain(name);
    }
  });

  it("pushes events onto the existing dataLayer (no new tag)", () => {
    trackEvent("job_comparison_started", { offer_count: 2 });
    expect((window.dataLayer as unknown[])[0]).toEqual({ event: "job_comparison_started", offer_count: 2 });
  });

  it("strips any key outside the allow-list (salaries, names, amounts cannot leak)", () => {
    const payload = validateOfferPayload({
      offer_count: 3,
      salary: 95000,            // must be dropped
      employer_name: "Acme",    // must be dropped
      annualBonus: 5000,        // must be dropped
      label: "Offer A",         // not allow-listed
      metric: "netAnnualIncome", // allowed
      offer_index: 1,           // allowed
    });
    expect(payload).toEqual({ metric: "netAnnualIncome", offer_index: 1, offer_count: 3 });
  });

  it("drops string values that look like financial data (4+ digit numbers)", () => {
    expect(validateOfferPayload({ feature: "80,000 - 95,000 CAD" })).toBeUndefined();
    expect(validateOfferPayload({ feature: "comparison" })).toEqual({ feature: "comparison" });
  });

  it("does nothing server-side", () => {
    vi.stubGlobal("window", undefined);
    expect(() => trackEvent("job_comparison_reset")).not.toThrow();
    expect(typeof (globalThis as { window?: unknown }).window).toBe("undefined");
  });
});

/* ------------------------------- PDF report --------------------------------- */

describe("PDF (print) report content", () => {
  const result: ComparisonResult = calculateComparison([
    { id: "a", label: "Offer A", province: "ON", annualSalary: 80000, annualBonus: 0, signingBonus: 0, vacationAllowance: 0, compensation: { employerPension: 0, employerBenefits: 0, workExpenses: 0 } },
    { id: "b", label: "Offer B", province: "QC", annualSalary: 85000, annualBonus: 5000, signingBonus: 0, vacationAllowance: 0, compensation: { employerPension: 4000, employerBenefits: 0, workExpenses: 1500 } },
  ]);

  it("builds a row per metric with every offer as a column", () => {
    const rows = buildReportRowsForTest(result.offers);
    expect(rows[0]).toHaveLength(3); // label + 2 offers
    expect(rows.some((r: string[]) => r[0] === "Estimated first-year net")).toBe(true);
    expect(rows.some((r: string[]) => r[0] === "Estimated monthly net (recurring)")).toBe(true);
    expect(rows.some((r: string[]) => r[0] === "Estimated biweekly net (recurring)")).toBe(true);
    expect(rows.some((r: string[]) => r[0] === "First-year total compensation value")).toBe(true);
  });

  it("insights never hard-declare a single best offer", () => {
    const lines = buildInsightLinesForTest(result.offers);
    const joined = lines.map((l: string[]) => l.join(" ")).join(" ");
    expect(joined).toMatch(/Highest first-year take-home pay/);
    expect(joined).toMatch(/not tax advice|rankings/i);
  });

  it("escapes HTML in labels to prevent injection into the report", () => {
    const evil: ComparisonResult = calculateComparison(
      [
        { id: "x", label: "<script>alert(1)</script>", province: "ON", annualSalary: 80000, annualBonus: 0, signingBonus: 0, vacationAllowance: 0, compensation: { employerPension: 0, employerBenefits: 0, workExpenses: 0 } },
      ]
    );
    const rows = buildReportRowsForTest(evil.offers);
    // label appears escaped in the generated table row
    expect(JSON.stringify(rows)).not.toContain("<script>");
  });
});
