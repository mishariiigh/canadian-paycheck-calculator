"use client";

import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ALL_PROVINCES, getProvinceName } from "@/engine/tax-data";
import type { ProvinceCode } from "@/engine/types";
import {
  buildChartData,
  calculateComparison,
  type JobOfferInput,
} from "@/lib/job-offer-comparison";
import { trackEvent } from "@/lib/analytics";
import { formatCurrency, formatPercent } from "@/lib/formatting";
import { printComparisonReport } from "@/components/job-offer-comparison/print-report";

const MAX_OFFERS = 3;
const COLORS = ["#17243A", "#D92736", "#16A36A"];

type OfferForm = JobOfferInput;

function emptyOffer(index: number): OfferForm {
  return {
    id: `offer-${Date.now()}-${index}`,
    label: `Offer ${String.fromCharCode(65 + index)}`,
    province: "ON",
    annualSalary: 0,
    annualBonus: 0,
    signingBonus: 0,
    vacationAllowance: 0,
    compensation: { employerPension: 0, employerBenefits: 0, workExpenses: 0 },
  };
}

function validateOffer(offer: OfferForm): string[] {
  const errors: string[] = [];
  if (!offer.label.trim()) errors.push("Give this offer a name so you can tell them apart.");
  if (offer.annualSalary < 0 || !Number.isFinite(offer.annualSalary)) errors.push("Salary must be zero or a positive number.");
  if (offer.annualBonus < 0 || !Number.isFinite(offer.annualBonus)) errors.push("Bonus must be zero or a positive number.");
  if (offer.signingBonus < 0 || !Number.isFinite(offer.signingBonus)) errors.push("Signing bonus must be zero or a positive number.");
  if (offer.vacationAllowance < 0 || !Number.isFinite(offer.vacationAllowance)) errors.push("Vacation allowance must be zero or a positive number.");
  if (offer.compensation.employerPension < 0 || !Number.isFinite(offer.compensation.employerPension)) errors.push("Employer pension must be zero or a positive number.");
  if (offer.compensation.employerBenefits < 0 || !Number.isFinite(offer.compensation.employerBenefits)) errors.push("Employer benefits must be zero or a positive number.");
  if (offer.compensation.workExpenses < 0 || !Number.isFinite(offer.compensation.workExpenses)) errors.push("Work expenses must be zero or a positive number.");
  if (offer.annualSalary === 0 && (offer.annualBonus > 0 || offer.signingBonus > 0)) {
    errors.push("Enter a base salary before adding a bonus.");
  }
  return errors;
}

/* ------------------------------- form field --------------------------------- */

function MoneyField({
  label,
  value,
  onChange,
  hint,
  allowZero = true,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  hint?: string;
  allowZero?: boolean;
}) {
  return (
    <div>
      <label className="sfx-label" style={{ display: "flex", justifyContent: "space-between", gap: "0.5rem" }}>
        <span>{label}</span>
      </label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" aria-hidden="true">$</span>
        <input
          type="number"
          min={0}
          step={1000}
          value={value === 0 && allowZero ? "" : value}
          onChange={(e) => onChange(Math.max(0, Number(e.target.value) || 0))}
          className="sfx-input sfx-input--currency"
          placeholder="0"
        />
      </div>
      {hint && <p className="mt-1 text-xs text-[var(--color-text-muted)]">{hint}</p>}
    </div>
  );
}

/* ------------------------------ offer editor -------------------------------- */

function OfferEditor({
  offer,
  index,
  canRemove,
  onChange,
  onRemove,
}: {
  offer: OfferForm;
  index: number;
  canRemove: boolean;
  onChange: (o: OfferForm) => void;
  onRemove: () => void;
}) {
  const [open, setOpen] = useState(true);
  const errors = validateOffer(offer);
  const letter = String.fromCharCode(65 + index);

  return (
    <div className="sfx-card p-6" data-offer-index={index}>
      <div className="flex items-center justify-between gap-3 mb-4">
        <h3 className="sfx-h3 flex items-center gap-2">
          <span
            className="inline-flex items-center justify-center w-7 h-7 rounded-full text-white text-sm font-bold"
            style={{ background: COLORS[index % COLORS.length] }}
            aria-hidden="true"
          >
            {letter}
          </span>
          {offer.label || `Offer ${letter}`}
        </h3>
        <div className="flex flex-wrap gap-2">
          {canRemove && (
            <button
              type="button"
              className="sfx-button sfx-button--ghost text-sm"
              onClick={onRemove}
              aria-label={`Remove ${offer.label || `Offer ${letter}`}`}
            >
              Remove
            </button>
          )}
          <button
            type="button"
            className="sfx-button sfx-button--secondary text-sm"
            aria-expanded={open}
            onClick={() => setOpen(!open)}
          >
            {open ? "Collapse" : "Expand"}
          </button>
        </div>
      </div>

      {errors.length > 0 && (
        <div className="mb-4 rounded-[var(--radius-md)] border border-[var(--color-danger)] bg-[var(--color-danger-muted)] px-4 py-3" role="alert">
          <ul className="text-sm text-[var(--color-danger)] list-disc pl-4 space-y-0.5">
            {errors.map((e) => <li key={e}>{e}</li>)}
          </ul>
        </div>
      )}

      {open && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <label className="sfx-label" htmlFor={`label-${offer.id}`}>Offer name / employer</label>
            <input
              id={`label-${offer.id}`}
              type="text"
              maxLength={60}
              value={offer.label}
              onChange={(e) => onChange({ ...offer, label: e.target.value })}
              className="sfx-input"
              placeholder={`Offer ${letter}`}
            />
          </div>
          <div>
            <label className="sfx-label" htmlFor={`prov-${offer.id}`}>Province or territory of residence on December 31</label>
            <select
              id={`prov-${offer.id}`}
              value={offer.province}
              onChange={(e) => onChange({ ...offer, province: e.target.value as ProvinceCode })}
              className="sfx-select"
            >
              {ALL_PROVINCES.map((p) => <option key={p.code} value={p.code}>{p.name}</option>)}
            </select>
            <p className="mt-1 text-xs text-[var(--color-text-muted)]">
              Used for annual income tax. Payroll withholding instead uses the province of employment, which this calculator does not model —{" "}
              <a className="sfx-link" href="https://www.canada.ca/en/revenue-agency/services/tax/businesses/topics/payroll/set-up-new-employee/determine-province-employment.html" target="_blank" rel="noopener noreferrer">CRA guidance</a>.
            </p>
          </div>
          <MoneyField
            label="Annual gross salary"
            value={offer.annualSalary}
            onChange={(v) => onChange({ ...offer, annualSalary: v })}
            hint="Base salary including any amounts paid as vacation pay."
          />
          <MoneyField label="Annual bonus" value={offer.annualBonus} onChange={(v) => onChange({ ...offer, annualBonus: v })} />
          <MoneyField label="Signing bonus (one-time)" value={offer.signingBonus} onChange={(v) => onChange({ ...offer, signingBonus: v })} />
          <MoneyField
            label="Additional taxable vacation pay (annual)"
            value={offer.vacationAllowance}
            onChange={(v) => onChange({ ...offer, vacationAllowance: v })}
            hint="Extra taxable vacation pay paid on top of the salary above. It is added to your employment income and taxed. Leave at zero if vacation pay is already part of your salary figure."
          />

          <div className="sm:col-span-2 lg:col-span-3">
            <hr className="sfx-divider my-1" />
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)] mb-3">
              Optional — employer benefits &amp; work costs
            </p>
          </div>
          <MoneyField
            label="Employer pension contribution (annual)"
            value={offer.compensation.employerPension}
            onChange={(v) => onChange({ ...offer, compensation: { ...offer.compensation, employerPension: v } })}
            hint="Employer cost — shown separately, not added to your take-home pay."
          />
          <MoneyField
            label="Other employer benefits (annual value)"
            value={offer.compensation.employerBenefits}
            onChange={(v) => onChange({ ...offer, compensation: { ...offer.compensation, employerBenefits: v } })}
            hint="Estimated value of health/dental, car allowance, etc."
          />
          <MoneyField
            label="Annual work-related expenses"
            value={offer.compensation.workExpenses}
            onChange={(v) => onChange({ ...offer, compensation: { ...offer.compensation, workExpenses: v } })}
            hint="Tools, commuting, professional dues you pay yourself."
          />
        </div>
      )}
    </div>
  );
}

/* ------------------------------ main component ------------------------------ */

export function JobOfferComparison() {
  const [offers, setOffers] = useState<OfferForm[]>([emptyOffer(0)]);
  const [touched, setTouched] = useState(false);
  const [copied, setCopied] = useState(false);
  const startedRef = useMemo(() => ({ current: false }), []);

  const results = useMemo(
    () => calculateComparison(offers.filter((o) => o.annualSalary > 0)),
    [offers]
  );
  const filled = offers.filter((o) => o.annualSalary > 0);
  const chartData = useMemo(() => buildChartData(results.offers), [results]);

  if (!startedRef.current && offers.length > 0) {
    startedRef.current = true;
    trackEvent("job_comparison_started", { offer_count: offers.length });
  }

  const updateOffer = (index: number, next: OfferForm) => {
    setOffers((prev) => prev.map((o, i) => (i === index ? next : o)));
    setTouched(true);
  };

  const addOffer = () => {
    if (offers.length >= MAX_OFFERS) return;
    setOffers((prev) => [...prev, emptyOffer(prev.length)]);
    trackEvent("job_offer_added", { offer_count: offers.length + 1 });
  };

  const removeOffer = (index: number) => {
    setOffers((prev) => prev.filter((_, i) => i !== index));
    trackEvent("job_offer_removed", { offer_count: offers.length - 1 });
  };

  const reset = () => {
    setOffers([emptyOffer(0)]);
    setTouched(false);
    trackEvent("job_comparison_reset", {});
  };

  const completed = filled.length >= 2 && touched;
  if (completed) trackEvent("job_comparison_completed", { offer_count: filled.length });

  const copySummary = async () => {
    const lines = [
      `Job Offer Comparison — tax year ${results.taxYear} (annual T1-style estimates based on province/territory of residence on Dec 31; not payroll withholding, not tax advice)`,
      "",
      ...results.offers.map((r) => {
        const t = r.totals;
        return [
          `— ${r.input.label} (${getProvinceName(r.input.province)}) —`,
          `Recurring gross employment income: ${formatCurrency(t.grossEmploymentIncome)}`,
          r.input.signingBonus > 0 ? `Signing bonus (one-time): ${formatCurrency(r.input.signingBonus)} → net ${formatCurrency(r.signingBonusNet)}` : "",
          `First-year gross: ${formatCurrency(t.grossYearOne)}`,
          `Total first-year deductions: ${formatCurrency(t.totalDeductionsYearOne)}`,
          `Recurring annual net: ${formatCurrency(t.netAnnualIncome)}`,
          `First-year net: ${formatCurrency(t.netYearOne)}`,
          `Monthly net (recurring): ${formatCurrency(t.netMonthly)} · Biweekly net (recurring): ${formatCurrency(t.netBiweekly)}`,
          t.employerPension > 0 ? `Employer pension (employer cost): ${formatCurrency(t.employerPension)}` : "",
          t.workExpenses > 0 ? `Work expenses: ${formatCurrency(t.workExpenses)}` : "",
          "",
        ].filter(Boolean).join("\n");
      }),
      `Source: Canadian take-home pay calculators — estimates based on ${results.taxYear} CRA and provincial parameters. Provincial tax uses the province or territory of residence on December 31, per CRA rules.`,
    ];
    try {
      await navigator.clipboard.writeText(lines.join("\n"));
      setCopied(true);
      trackEvent("comparison_summary_copied", { offer_count: filled.length });
      setTimeout(() => setCopied(false), 2500);
    } catch {
      /* clipboard unavailable */
    }
  };

  return (
    <div className="space-y-8">
      {/* ------------------------------- offers ------------------------------ */}
      <section aria-labelledby="offers-heading">
        <div className="flex items-baseline justify-between gap-4 mb-4">
          <h2 id="offers-heading" className="sfx-h2">Your offers</h2>
          <button
            type="button"
            className="sfx-button sfx-button--secondary"
            onClick={addOffer}
            disabled={offers.length >= MAX_OFFERS}
          >
            + Add offer {offers.length >= MAX_OFFERS ? "(max 3)" : `(${offers.length}/${MAX_OFFERS})`}
          </button>
        </div>
        <div className="space-y-4">
          {offers.map((offer, i) => (
            <OfferEditor
              key={offer.id}
              offer={offer}
              index={i}
              canRemove={offers.length > 1}
              onChange={(next) => updateOffer(i, next)}
              onRemove={() => removeOffer(i)}
            />
          ))}
        </div>
      </section>

      {/* ----------------------------- dashboard ----------------------------- */}
      {filled.length === 0 ? (
        <div className="sfx-card p-10 text-center">
          <h2 className="sfx-h3 mb-2">Enter an offer to see your comparison</h2>
          <p className="sfx-text-muted max-w-md mx-auto">
            Add each offer&apos;s salary, province and optional benefits above. The comparison
            dashboard appears automatically once you enter a salary.
          </p>
        </div>
      ) : (
        <Dashboard
          results={results}
          chartData={chartData}
          copied={copied}
          onCopy={copySummary}
          onReset={reset}
          canPrint={filled.length >= 1}
        />
      )}
    </div>
  );
}

/* --------------------------------- dashboard -------------------------------- */

function Dashboard({
  results,
  chartData,
  copied,
  onCopy,
  onReset,
  canPrint,
}: {
  results: ReturnType<typeof calculateComparison>;
  chartData: ReturnType<typeof buildChartData>;
  copied: boolean;
  onCopy: () => void;
  onReset: () => void;
  canPrint: boolean;
}) {
  const best = results.offers.reduce((a, b) => (b.totals.netYearOne > a.totals.netYearOne ? b : a));
  const worst = results.offers.reduce((a, b) => (b.totals.netYearOne < a.totals.netYearOne ? b : a));
  const lowestDed = results.offers.reduce((a, b) => (b.totals.totalDeductionsYearOne < a.totals.totalDeductionsYearOne ? b : a));
  const bestMonthly = results.offers.reduce((a, b) => (b.totals.netMonthly > a.totals.netMonthly ? b : a));

  return (
    <section aria-labelledby="dashboard-heading" className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="dashboard-heading" className="sfx-h2">Comparison dashboard</h2>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="sfx-button sfx-button--secondary text-sm" onClick={onCopy}>
            {copied ? "Copied ✓" : "Copy summary"}
          </button>
          {canPrint && (
            <button
              type="button"
              className="sfx-button sfx-button--secondary text-sm"
              onClick={() => {
                trackEvent("comparison_report_downloaded", { format: "pdf-print", offer_count: results.offers.length });
                printComparisonReport(results);
              }}
            >
              Download PDF report
            </button>
          )}
          <button type="button" className="sfx-button sfx-button--ghost text-sm" onClick={onReset}>
            Reset
          </button>
        </div>
      </div>

      {results.warnings.length > 0 && (
        <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-card)] px-4 py-3 text-xs text-[var(--color-text-muted)]">
          {results.warnings.map((w) => <p key={w}>{w}</p>)}
        </div>
      )}

      {/* summary cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <SummaryCard label="Highest first-year gross" value={formatCurrency(results.offers.reduce((a, b) => (b.totals.grossYearOne > a.totals.grossYearOne ? b : a)).totals.grossYearOne)} sub={results.offers.reduce((a, b) => (b.totals.grossYearOne > a.totals.grossYearOne ? b : a)).input.label} />
        <SummaryCard label="Highest first-year net income" value={formatCurrency(best.totals.netYearOne)} sub={best.input.label} highlight />
        <SummaryCard label="Highest monthly take-home" value={formatCurrency(bestMonthly.totals.netMonthly)} sub={bestMonthly.input.label} />
        <SummaryCard label="Lowest first-year deductions" value={formatCurrency(lowestDed.totals.totalDeductionsYearOne)} sub={`${lowestDed.input.label} · ${formatPercent(lowestDed.totals.effectiveDeductionRate, 1)} of gross`} />
        <SummaryCard label="Best vs lowest first-year net gap" value={formatCurrency(best.totals.netYearOne - worst.totals.netYearOne)} sub={`${best.input.label} vs ${worst.input.label}`} />
      </div>

      {/* comparison table */}
      <div className="sfx-card">
        <div className="px-6 py-5 border-b border-[var(--color-border)]">
          <h3 className="sfx-h3 mb-1">Offer-by-offer breakdown</h3>
          <p className="text-xs text-[var(--color-text-muted)]">
            Tax year {results.taxYear}. Annual T1-style liability estimates based on your province or territory of residence on December 31 — not actual payroll withholding (T4127), which follows the province of employment.{" "}
            <a className="sfx-link" href="https://www.canada.ca/en/revenue-agency/services/tax/individuals/topics/about-your-tax-return/tax-return/completing-a-tax-return/personal-address-information/your-province-territory-residence.html" target="_blank" rel="noopener noreferrer">CRA: province or territory of residence</a>
          </p>
        </div>
        <div className="sfx-table-scroll">
          <table className="sfx-table sfx-table--fixed w-full text-sm">
            <colgroup>
              <col style={{ width: "28%" }} />
              {results.offers.map((_, i) => <col key={i} style={{ width: `${72 / results.offers.length}%` }} />)}
            </colgroup>
            <thead>
              <tr className="border-b border-[var(--color-border)]">
                <th className="px-4 py-3">Metric</th>
                {results.offers.map((r, i) => (
                  <th key={r.input.id} className="px-4 py-3 text-right">{r.input.label || `Offer ${String.fromCharCode(65 + i)}`}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              <Row label="Province or territory of residence (Dec 31)" cells={results.offers.map((r) => getProvinceName(r.input.province))} muted />
              <Row label="Gross annual salary" cells={results.offers.map((r) => formatCurrency(r.input.annualSalary))} />
              <Row label="Annual bonus (recurring)" cells={results.offers.map((r) => formatCurrency(r.input.annualBonus))} />
              <Row label="Additional taxable vacation pay" cells={results.offers.map((r) => formatCurrency(r.input.vacationAllowance))} />
              <Row label="Recurring gross employment income" cells={results.offers.map((r) => formatCurrency(r.totals.grossEmploymentIncome))} strong />
              <Row label="Signing bonus (one-time, year 1)" cells={results.offers.map((r) => formatCurrency(r.input.signingBonus))} />
              <Row label="First-year gross (incl. signing bonus)" cells={results.offers.map((r) => formatCurrency(r.totals.grossYearOne))} strong />
              <Row label="Federal income tax (recurring)" cells={results.offers.map((r) => `-${formatCurrency(r.base.federal.effectiveAbatedTax, { decimals: 2 })}`)} muted />
              <Row label="Provincial/territorial tax (recurring)" cells={results.offers.map((r) => `-${formatCurrency(r.base.provincial.totalPayable, { decimals: 2 })}`)} muted />
              <Row label={`${results.offers[0].base.payroll.pensionName} incl. ${results.offers[0].base.payroll.pensionName}2 (recurring)`} cells={results.offers.map((r) => `-${formatCurrency(r.base.payroll.pensionTotal, { decimals: 2 })}`)} muted />
              <Row label={results.offers[0].base.payroll.eiName === "QPIP" ? "EI + QPIP (recurring)" : "EI premiums (recurring)"} cells={results.offers.map((r) => `-${formatCurrency(r.base.payroll.ei, { decimals: 2 })}`)} muted />
              <Row label="Provincial payroll tax (recurring)" cells={results.offers.map((r) => (r.base.payroll.provincialPayrollTax > 0 ? `-${formatCurrency(r.base.payroll.provincialPayrollTax, { decimals: 2 })}` : "—"))} muted />
              <Row label="Total estimated deductions (recurring)" cells={results.offers.map((r) => `-${formatCurrency(r.totals.totalDeductions)}`)} strong />
              <Row label="Tax on signing bonus (one-time)" cells={results.offers.map((r) => (r.totals.totalDeductionsYearOne > r.totals.totalDeductions ? `-${formatCurrency(r.totals.totalDeductionsYearOne - r.totals.totalDeductions, { decimals: 2 })}` : "—"))} muted />
              <Row label="Total first-year deductions" cells={results.offers.map((r) => `-${formatCurrency(r.totals.totalDeductionsYearOne)}`)} strong />
              <Row label="Estimated annual net (recurring)" cells={results.offers.map((r) => formatCurrency(r.totals.netAnnualIncome))} highlight />
              <Row label="Net from signing bonus (one-time)" cells={results.offers.map((r) => (r.input.signingBonus > 0 ? formatCurrency(r.signingBonusNet) : "—"))} />
              <Row label="Estimated first-year net" cells={results.offers.map((r) => formatCurrency(r.totals.netYearOne))} highlight />
              <Row label="Estimated monthly net (recurring)" cells={results.offers.map((r) => formatCurrency(r.totals.netMonthly))} />
              <Row label="Estimated biweekly net (recurring)" cells={results.offers.map((r) => formatCurrency(r.totals.netBiweekly))} />
              <Row label="Average deduction rate (recurring)" cells={results.offers.map((r) => formatPercent(r.totals.effectiveDeductionRate, 1))} muted />
              <Row label="Employer pension (employer cost)" cells={results.offers.map((r) => (r.totals.employerPension > 0 ? formatCurrency(r.totals.employerPension) : "—"))} muted />
              <Row label="Other employer benefits (annual value)" cells={results.offers.map((r) => (r.totals.employerBenefits > 0 ? formatCurrency(r.totals.employerBenefits) : "—"))} muted />
              <Row label="Annual work-related expenses" cells={results.offers.map((r) => (r.totals.workExpenses > 0 ? formatCurrency(r.totals.workExpenses) : "—"))} muted />
              <Row label="Net after work expenses (recurring)" cells={results.offers.map((r) => formatCurrency(r.totals.netAfterWorkExpenses))} muted />
              <Row label="First-year total compensation value" cells={results.offers.map((r) => formatCurrency(r.totals.totalCompensation))} strong />
            </tbody>
          </table>
        </div>
      </div>

      {/* charts */}
      <Charts chartData={chartData} results={results} />

      {/* insights */}
      <Insights results={results} />

      {/* assumptions */}
      <div className="sfx-card p-6">
        <h3 className="sfx-h3 mb-3">Assumptions &amp; limitations</h3>
        <ul className="text-sm text-[var(--color-text-muted)] list-disc pl-5 space-y-1.5">
          <li>Tax year {results.taxYear} figures built on confirmed CRA and provincial parameters; a single employee claiming the basic personal amount and standard credits only.</li>
          <li>Provincial/territorial tax is based on your province or territory of <strong>residence on December 31</strong> (CRA rule for annual income tax). Actual payroll withholding uses the province of employment instead and is <strong>not</strong> modelled here —{" "}
            <a className="sfx-link" href="https://www.canada.ca/en/revenue-agency/services/tax/individuals/topics/about-your-tax-return/tax-return/completing-a-tax-return/personal-address-information/your-province-territory-residence.html" target="_blank" rel="noopener noreferrer">residence rules</a>,{" "}
            <a className="sfx-link" href="https://www.canada.ca/en/revenue-agency/services/tax/businesses/topics/payroll/set-up-new-employee/determine-province-employment.html" target="_blank" rel="noopener noreferrer">province of employment</a>.</li>
          <li>Annual liability estimates (T1-style) — actual payroll withholding follows CRA T4127 per-period formulas and may differ due to rounding and timing.</li>
          <li>Recurring bonuses are part of employment income; the one-time signing bonus is taxed once at your marginal rate and included only in first-year figures.</li>
          <li>Additional taxable vacation pay entered is added to employment income and taxed. Do not re-enter vacation pay that is already part of the salary figure.</li>
          <li>Employer pension and benefits are employer costs — shown for total-compensation context, never added to take-home pay.</li>
          <li>Work-related expenses are after-tax personal costs and are subtracted only in the “net after work expenses” line.</li>
          <li>Other credits (RRSP, childcare, tuition, disability) are not modelled. Not tax advice.</li>
        </ul>
        <p className="mt-3 text-xs text-[var(--color-text-muted)]">
          References:{" "}
          <a className="sfx-link" href="https://www.canada.ca/en/revenue-agency/services/forms-publications/payroll/payroll-deductions-t4127-payroll-deductions-formulas.html" rel="noopener noreferrer" target="_blank">CRA T4127 payroll deductions</a>{" "}·{" "}
          <a className="sfx-link" href="https://www.canada.ca/en/revenue-agency/services/tax/individuals.html" rel="noopener noreferrer" target="_blank">CRA — Individuals</a>
        </p>
      </div>
    </section>
  );
}

function SummaryCard({ label, value, sub, highlight }: { label: string; value: string; sub?: string; highlight?: boolean }) {
  return (
    <div className={`bg-[var(--color-background)] p-4 rounded-[var(--radius-md)] border ${highlight ? "border-[var(--color-success)]" : "border-[var(--color-border)]"}`}>
      <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)] mb-1">{label}</p>
      <p className={`text-lg font-semibold money ${highlight ? "text-[var(--color-success)]" : "text-[var(--color-text-primary)]"}`}>{value}</p>
      {sub && <p className="mt-0.5 text-xs text-[var(--color-text-muted)]">{sub}</p>}
    </div>
  );
}

function Row({ label, cells, strong, muted, highlight }: { label: string; cells: string[]; strong?: boolean; muted?: boolean; highlight?: boolean }) {
  return (
    <tr>
      <td className={`px-4 py-3 ${muted ? "text-[var(--color-text-muted)]" : "text-[var(--color-text-secondary)]"}${strong ? " font-semibold" : ""}`}>{label}</td>
      {cells.map((c, i) => (
        <td key={i} className={`px-4 py-3 text-right tabular-nums ${highlight ? "font-semibold money money--positive" : ""}${strong ? " font-semibold" : ""}${muted && !highlight ? " text-[var(--color-text-muted)]" : ""}`}>{c}</td>
      ))}
    </tr>
  );
}

/* ---------------------------------- charts ---------------------------------- */

function Charts({ chartData, results }: { chartData: ReturnType<typeof buildChartData>; results: ReturnType<typeof calculateComparison> }) {
  const currencyTick = (v: number) => formatCurrency(v, { decimals: 0 });
  // Integer-only ticks with a minimum domain of $1 so all-zero data
  // (e.g. no employer benefits entered) cannot produce meaningless
  // fractional axis labels like $1–$4.
  const axisProps = { tickFormatter: currencyTick, allowDecimals: false as const, domain: [0, (max: number) => Math.max(max, 1)] as [number, (max: number) => number] };
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="sfx-card">
        <div className="px-6 py-5 border-b border-[var(--color-border)]">
          <h3 className="sfx-h3 mb-1">Gross vs net income</h3>
          <p className="text-xs text-[var(--color-text-muted)]">Annual employment income before and after deductions.</p>
        </div>
        <div className="px-4 pb-6 h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 8, right: 8, left: 8, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5EAF1" />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#64748B" }} axisLine={false} tickLine={false} />
              <YAxis {...axisProps} tick={{ fontSize: 12, fill: "#64748B" }} axisLine={false} tickLine={false} width={70} />
              <Tooltip formatter={(v) => formatCurrency(Number(v ?? 0))} contentStyle={{ border: "1px solid #E5EAF1", borderRadius: 8 }} />
              <Legend />
              <Bar dataKey="gross" name="Gross" fill="#17243A" radius={[6, 6, 0, 0]} />
              <Bar dataKey="net" name="Net" fill="#16A36A" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="sfx-card">
        <div className="px-6 py-5 border-b border-[var(--color-border)]">
          <h3 className="sfx-h3 mb-1">Deduction breakdown</h3>
          <p className="text-xs text-[var(--color-text-muted)]">Where the deductions go, by offer.</p>
        </div>
        <div className="px-4 pb-6 h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData.map((d, i) => ({
                name: d.name,
                Federal: results.offers[i]?.base.federal.effectiveAbatedTax ?? 0,
                Provincial: results.offers[i]?.base.provincial.totalPayable ?? 0,
                Pension: results.offers[i]?.base.payroll.pensionTotal ?? 0,
                EI: results.offers[i]?.base.payroll.ei ?? 0,
              }))}
              margin={{ top: 8, right: 8, left: 8, bottom: 4 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#E5EAF1" />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#64748B" }} axisLine={false} tickLine={false} />
              <YAxis {...axisProps} tick={{ fontSize: 12, fill: "#64748B" }} axisLine={false} tickLine={false} width={70} />
              <Tooltip formatter={(v) => formatCurrency(Number(v ?? 0))} contentStyle={{ border: "1px solid #E5EAF1", borderRadius: 8 }} />
              <Legend />
              <Bar dataKey="Federal" fill="#17243A" radius={[6, 6, 0, 0]} />
              <Bar dataKey="Provincial" fill="#D92736" radius={[6, 6, 0, 0]} />
              <Bar dataKey="Pension" fill="#64748B" radius={[6, 6, 0, 0]} />
              <Bar dataKey="EI" fill="#94A3B8" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="sfx-card">
        <div className="px-6 py-5 border-b border-[var(--color-border)]">
          <h3 className="sfx-h3 mb-1">Monthly take-home</h3>
          <p className="text-xs text-[var(--color-text-muted)]">Estimated net pay per month, by offer.</p>
        </div>
        <div className="px-4 pb-6 h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData.map((d) => ({ name: d.name, net: d.monthlyNet }))} margin={{ top: 8, right: 8, left: 8, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5EAF1" />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#64748B" }} axisLine={false} tickLine={false} />
              <YAxis {...axisProps} tick={{ fontSize: 12, fill: "#64748B" }} axisLine={false} tickLine={false} width={70} />
              <Tooltip formatter={(v) => formatCurrency(Number(v ?? 0))} contentStyle={{ border: "1px solid #E5EAF1", borderRadius: 8 }} />
              <Bar dataKey="net" name="Monthly net" fill="#D92736" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="sfx-card">
        <div className="px-6 py-5 border-b border-[var(--color-border)]">
          <h3 className="sfx-h3 mb-1">Employer benefits value</h3>
          <p className="text-xs text-[var(--color-text-muted)]">Employer pension and benefits — compensation value, not take-home pay.</p>
        </div>
        {chartData.every((d) => d.employerPension === 0 && d.employerBenefits === 0) ? (
          <div className="px-6 pb-10 h-72 flex flex-col items-center justify-center text-center">
            <p className="text-sm font-medium text-[var(--color-text-primary)] mb-1">No employer benefits entered</p>
            <p className="text-xs text-[var(--color-text-muted)] max-w-xs">
              Enter employer pension contributions or benefits values for any offer to see this comparison.
            </p>
          </div>
        ) : (
        <div className="px-4 pb-6 h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData.map((d) => ({ name: d.name, pension: d.employerPension, benefits: d.employerBenefits }))}
              margin={{ top: 8, right: 8, left: 8, bottom: 4 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#E5EAF1" />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#64748B" }} axisLine={false} tickLine={false} />
              <YAxis {...axisProps} tick={{ fontSize: 12, fill: "#64748B" }} axisLine={false} tickLine={false} width={64} />
              <Tooltip formatter={(v) => formatCurrency(Number(v ?? 0))} contentStyle={{ border: "1px solid #E5EAF1", borderRadius: 8 }} />
              <Legend />
              <Bar dataKey="pension" name="Employer pension" fill="#64748B" radius={[6, 6, 0, 0]} />
              <Bar dataKey="benefits" name="Other benefits" fill="#94A3B8" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        )}
      </div>
    </div>
  );
}

/* --------------------------------- insights --------------------------------- */

function Insights({
  results,
}: {
  results: ReturnType<typeof calculateComparison>;
}) {
  if (results.offers.length === 0) return null;
  const offers = results.offers;
  const bestNet = offers.reduce((a, b) => (b.totals.netYearOne > a.totals.netYearOne ? b : a));
  const bestComp = offers.reduce((a, b) => (b.totals.totalCompensation > a.totals.totalCompensation ? b : a));
  const bestGross = offers.reduce((a, b) => (b.totals.grossYearOne > a.totals.grossYearOne ? b : a));
  const lowestDed = offers.reduce((a, b) => (b.totals.effectiveDeductionRate < a.totals.effectiveDeductionRate ? b : a));
  const lowestDedTotal = offers.reduce((a, b) => (b.totals.totalDeductionsYearOne < a.totals.totalDeductionsYearOne ? b : a));
  const lowestAfterExp = offers.reduce((a, b) => (b.totals.netAfterWorkExpenses < a.totals.netAfterWorkExpenses ? b : a));
  const highestExp = offers.reduce((a, b) => (b.totals.workExpenses > a.totals.workExpenses ? b : a));
  const bestAfterExp = offers.reduce((a, b) => (b.totals.netAfterWorkExpenses > a.totals.netAfterWorkExpenses ? b : a));
  const insights: { title: string; body: string }[] = [];

  insights.push({
    title: `Highest first-year take-home pay: ${bestNet.input.label}`,
    body: `Estimated ${formatCurrency(bestNet.totals.netYearOne)} net in year one (${formatCurrency(bestNet.totals.netMonthly)} per month recurring) after ${formatPercent(bestNet.totals.effectiveDeductionRate, 1)} average deductions. Tax is based on residence on December 31, not province of employment.`,
  });

  if (bestComp.input.id !== bestNet.input.id) {
    insights.push({
      title: `Highest total compensation value: ${bestComp.input.label}`,
      body: `Including employer pension (${formatCurrency(bestComp.totals.employerPension)}) and benefits (${formatCurrency(bestComp.totals.employerBenefits)}), this offer is worth an estimated ${formatCurrency(bestComp.totals.totalCompensation)} per year in combined value. Employer contributions are long-term value, not take-home pay.`,
    });
  }

  if (bestGross.input.id !== bestNet.input.id) {
    insights.push({
      title: `Gross pay is not the whole story`,
      body: `${bestGross.input.label} has the highest first-year gross (${formatCurrency(bestGross.totals.grossYearOne)}), but ${bestNet.input.label} keeps more after taxes and deductions (${formatCurrency(bestNet.totals.netYearOne)} first-year net vs ${formatCurrency(bestGross.totals.netYearOne)}). Compare net figures, not headline salary.`,
    });
  }

  insights.push({
    title: `Lowest average deduction rate: ${lowestDed.input.label}`,
    body: `${formatPercent(lowestDed.totals.effectiveDeductionRate, 1)} of gross goes to deductions (about ${formatCurrency(lowestDed.totals.totalDeductionsYearOne)} per year). ${lowestDedTotal.input.id !== lowestDed.input.id ? `${lowestDedTotal.input.label} has the lowest total dollar deductions (${formatCurrency(lowestDedTotal.totals.totalDeductionsYearOne)}), but that is largely because its gross income is lower — lower total deductions do not necessarily mean a better offer.` : `This is the lowest both in rate and in total dollars among your offers.`} Deduction rates are driven by income level and province or territory of residence, not by province of employment.`,
  });

  const monthlyGap = Math.abs(bestNet.totals.netMonthly - offers.reduce((a, b) => (b.totals.netMonthly < a.totals.netMonthly ? b : a)).totals.netMonthly);
  if (offers.length >= 2 && monthlyGap > 0) {
    insights.push({
      title: "Monthly take-home gap",
      body: `The highest and lowest offers differ by about ${formatCurrency(monthlyGap)} per month in estimated take-home pay.`,
    });
  }

  if (highestExp.totals.workExpenses > 0) {
    insights.push({
      title: "Work expenses change the picture",
      body: `${highestExp.input.label} carries the highest estimated work-related expenses (${formatCurrency(highestExp.totals.workExpenses)}/yr), leaving it ${formatCurrency(highestExp.totals.netAfterWorkExpenses)} after expenses — the ${bestAfterExp.input.id === highestExp.input.id ? "highest" : "lowest"} net-after-expenses among your offers (${lowestAfterExp.input.label}: ${formatCurrency(lowestAfterExp.totals.netAfterWorkExpenses)}; ${bestAfterExp.input.label}: ${formatCurrency(bestAfterExp.totals.netAfterWorkExpenses)}).`,
    });
  }

  insights.push({
    title: "What this comparison does not tell you",
    body: "It does not value career growth, job security, commute, hours, culture or termination terms — and it cannot declare a single \"best\" offer. It shows four different rankings (take-home, total compensation, deductions, expenses) so you can weigh what matters to you. Estimates only — not tax advice.",
  });

  return (
    <div className="sfx-card p-6">
      <h3 className="sfx-h3 mb-4">Financial insights</h3>
      <div className="grid gap-4 md:grid-cols-2">
        {insights.map((ins) => (
          <div key={ins.title} className="bg-[var(--color-background)] p-4 rounded-[var(--radius-md)] border border-[var(--color-border)]">
            <p className="font-semibold text-[var(--color-text-primary)] text-sm mb-1">{ins.title}</p>
            <p className="text-sm text-[var(--color-text-muted)] leading-relaxed">{ins.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
