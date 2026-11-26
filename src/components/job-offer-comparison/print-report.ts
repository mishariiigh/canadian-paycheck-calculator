/**
 * PDF report generation via the browser's native print-to-PDF
 * (File > Save as PDF). Zero dependencies: builds a self-contained styled
 * print document in a hidden iframe with the comparison data, charts rendered
 * as simple CSS bars, insights and assumptions.
 */
import type { ComparisonResult } from "@/lib/job-offer-comparison";
import { getProvinceName } from "@/engine/tax-data";
import { formatCurrency, formatPercent } from "@/lib/formatting";

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export function printComparisonReport(results: ComparisonResult): void {
  if (typeof window === "undefined") return;
  const date = new Date().toLocaleDateString("en-CA", { year: "numeric", month: "long", day: "numeric" });
  const offers = results.offers;
  if (offers.length === 0) return;

  const best = offers.reduce((a, b) => (b.totals.netYearOne > a.totals.netYearOne ? b : a));

  const offerTableRows = [
    ["Province or territory of residence (Dec 31)", ...offers.map((o) => getProvinceName(o.input.province))],
    ["Gross annual salary", ...offers.map((o) => formatCurrency(o.input.annualSalary))],
    ["Annual bonus (recurring)", ...offers.map((o) => formatCurrency(o.input.annualBonus))],
    ["Additional taxable vacation pay", ...offers.map((o) => formatCurrency(o.input.vacationAllowance))],
    ["Recurring gross employment income", ...offers.map((o) => formatCurrency(o.totals.grossEmploymentIncome))],
    ["Signing bonus (one-time, year 1)", ...offers.map((o) => formatCurrency(o.input.signingBonus))],
    ["First-year gross (incl. signing bonus)", ...offers.map((o) => formatCurrency(o.totals.grossYearOne))],
    ["Federal income tax (recurring)", ...offers.map((o) => `-${formatCurrency(o.base.federal.effectiveAbatedTax, { decimals: 2 })}`)],
    ["Provincial/territorial tax (recurring)", ...offers.map((o) => `-${formatCurrency(o.base.provincial.totalPayable, { decimals: 2 })}`)],
    [`${offers[0].base.payroll.pensionName} (incl. CPP2/QPP2, recurring)`, ...offers.map((o) => `-${formatCurrency(o.base.payroll.pensionTotal, { decimals: 2 })}`)],
    [offers[0].base.payroll.eiName === "QPIP" ? "EI + QPIP (recurring)" : "EI premiums (recurring)", ...offers.map((o) => `-${formatCurrency(o.base.payroll.ei, { decimals: 2 })}`)],
    ["Provincial payroll tax (recurring)", ...offers.map((o) => (o.base.payroll.provincialPayrollTax > 0 ? `-${formatCurrency(o.base.payroll.provincialPayrollTax, { decimals: 2 })}` : "—"))],
    ["Total estimated deductions (recurring)", ...offers.map((o) => `-${formatCurrency(o.totals.totalDeductions)}`)],
    ["Tax on signing bonus (one-time)", ...offers.map((o) => (o.totals.totalDeductionsYearOne > o.totals.totalDeductions ? `-${formatCurrency(o.totals.totalDeductionsYearOne - o.totals.totalDeductions, { decimals: 2 })}` : "—"))],
    ["Total first-year deductions", ...offers.map((o) => `-${formatCurrency(o.totals.totalDeductionsYearOne)}`)],
    ["Estimated annual net (recurring)", ...offers.map((o) => formatCurrency(o.totals.netAnnualIncome))],
    ["Net from signing bonus (one-time)", ...offers.map((o) => (o.input.signingBonus > 0 ? formatCurrency(o.signingBonusNet) : "—"))],
    ["Estimated first-year net", ...offers.map((o) => formatCurrency(o.totals.netYearOne))],
    ["Estimated monthly net (recurring)", ...offers.map((o) => formatCurrency(o.totals.netMonthly))],
    ["Estimated biweekly net (recurring)", ...offers.map((o) => formatCurrency(o.totals.netBiweekly))],
    ["Employer pension (employer cost)", ...offers.map((o) => (o.totals.employerPension > 0 ? formatCurrency(o.totals.employerPension) : "—"))],
    ["Other employer benefits", ...offers.map((o) => (o.totals.employerBenefits > 0 ? formatCurrency(o.totals.employerBenefits) : "—"))],
    ["Annual work-related expenses", ...offers.map((o) => (o.totals.workExpenses > 0 ? formatCurrency(o.totals.workExpenses) : "—"))],
    ["Net after work expenses (recurring)", ...offers.map((o) => formatCurrency(o.totals.netAfterWorkExpenses))],
    ["First-year total compensation value", ...offers.map((o) => formatCurrency(o.totals.totalCompensation))],
  ];

  const insights = buildInsightLines(offers);

  const html = `<!doctype html><html><head><meta charset="utf-8"><title>Job Offer Comparison — ${esc(date)}</title>
<style>
  body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;color:#263449;margin:32px;font-size:12px}
  h1{font-size:20px;margin:0 0 4px} h2{font-size:14px;margin:24px 0 8px;border-bottom:1px solid #E5EAF1;padding-bottom:4px}
  .muted{color:#64748B;font-size:11px}
  table{border-collapse:collapse;width:100%;margin-top:8px}
  th,td{border-bottom:1px solid #E5EAF1;padding:5px 8px;text-align:right;font-variant-numeric:tabular-nums}
  th:first-child,td:first-child{text-align:left}
  th{font-size:10px;text-transform:uppercase;letter-spacing:.05em;color:#64748B}
  tr.hl td{font-weight:700;color:#16A36A}
  .cards{display:flex;gap:8px;margin-top:8px;flex-wrap:wrap}
  .card{flex:1;min-width:150px;border:1px solid #E5EAF1;border-radius:8px;padding:10px}
  .card b{display:block;font-size:13px;margin-top:2px}
  .card span{font-size:10px;color:#64748B;text-transform:uppercase;letter-spacing:.05em}
  ul{padding-left:18px;margin:6px 0} li{margin-bottom:4px}
  .bar{height:8px;background:#16A36A;border-radius:4px;margin-top:3px}
  .barwrap{background:#F5F7FB;border-radius:4px}
  footer{margin-top:24px;border-top:1px solid #E5EAF1;padding-top:8px;font-size:10px;color:#64748B}
  @media print{body{margin:12mm}}
</style></head><body>
<h1>Job Offer Comparison Report</h1>
<p class="muted">Prepared ${esc(date)} · Tax year ${results.taxYear} · ${offers.length} offer${offers.length > 1 ? "s" : ""} · Annual T1-style estimates based on province/territory of residence on Dec 31 — not payroll withholding · Not tax advice</p>

<div class="cards">
  <div class="card"><span>Highest net income</span><b>${formatCurrency(best.totals.netYearOne)}</b><span class="muted">${esc(best.input.label)}</span></div>
  <div class="card"><span>Highest monthly net</span><b>${formatCurrency(offers.reduce((a, b) => (b.totals.netMonthly > a.totals.netMonthly ? b : a)).totals.netMonthly)}</b></div>
  <div class="card"><span>Lowest deductions</span><b>${formatCurrency(offers.reduce((a, b) => (b.totals.totalDeductions < a.totals.totalDeductions ? b : a)).totals.totalDeductions)}</b></div>
</div>

<h2>Offer-by-offer breakdown</h2>
<table><thead><tr><th>Metric</th>${offers.map((o) => `<th>${esc(o.input.label || "Offer")}</th>`).join("")}</tr></thead>
<tbody>
${offerTableRows.map((row) => `<tr${row[0] === "Estimated annual net income" ? ' class="hl"' : ""}><td>${esc(row[0])}</td>${row.slice(1).map((c) => `<td>${esc(c)}</td>`).join("")}</tr>`).join("")}
</tbody></table>

<h2>Estimated net income comparison</h2>
${offers.map((o) => {
    const maxNet = Math.max(...offers.map((x) => x.totals.netYearOne));
    const pct = maxNet > 0 ? (o.totals.netYearOne / maxNet) * 100 : 0;
    return `<p style="margin:6px 0"><span style="display:inline-block;width:130px">${esc(o.input.label)}</span> <b>${formatCurrency(o.totals.netYearOne)}</b><span class="barwrap" style="display:inline-block;width:55%;vertical-align:middle;margin-left:8px"><span class="bar" style="width:${pct.toFixed(0)}%"></span></span></p>`;
  }).join("")}

<h2>Financial insights</h2>
<ul>${insights.map((i) => `<li><b>${esc(i[0])}</b> — ${esc(i[1])}</li>`).join("")}</ul>

<h2>Calculation assumptions &amp; limitations</h2>
<ul>
  <li>Tax year ${results.taxYear}: confirmed CRA and provincial parameters; single employee claiming the basic personal amount and standard credits only.</li>
  <li>Provincial/territorial tax uses the province or territory of residence on December 31 (annual income tax rule). Actual payroll withholding uses the province of employment instead and is not modelled here.</li>
  <li>Figures are annual T1-style liability estimates, not actual CRA payroll withholding amounts (T4127 per-period formulas may differ due to rounding and timing).</li>
  <li>Recurring bonuses are part of employment income; the one-time signing bonus is taxed once at the marginal rate and included only in first-year figures.</li>
  <li>Additional taxable vacation pay entered is added to employment income and taxed. Do not re-enter vacation pay already included in the salary figure.</li>
  <li>Employer pension and benefits are employer costs — shown separately, never added to take-home pay.</li>
  <li>Work-related expenses are after-tax personal costs, shown only in the "net after work expenses" line.</li>
  <li>Other credits (RRSP, childcare, tuition, disability) are not modelled.</li>
</ul>

<footer>
  <p>Disclaimer: these estimates are informational only. Actual payroll results may differ. This report is not tax advice and carries no official CRA certification.</p>
  <p>References: <a href="https://www.canada.ca/en/revenue-agency/services/tax/individuals/topics/about-your-tax-return/tax-return/completing-a-tax-return/personal-address-information/your-province-territory-residence.html">CRA — province or territory of residence</a> · <a href="https://www.canada.ca/en/revenue-agency/services/tax/businesses/topics/payroll/set-up-new-employee/determine-province-employment.html">CRA — determine the province of employment</a> · <a href="https://www.canada.ca/en/revenue-agency/services/forms-publications/payroll/payroll-deductions-t4127-payroll-deductions-formulas.html">CRA T4127 payroll deductions formulas</a></p>
  <p>Generated with Canada Take-Home Pay Calculators.</p>
</footer>
</body></html>`;

  const iframe = document.createElement("iframe");
  iframe.style.position = "fixed";
  iframe.style.right = "0";
  iframe.style.bottom = "0";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.border = "0";
  document.body.appendChild(iframe);
  const doc = iframe.contentDocument;
  if (!doc) return;
  doc.open();
  doc.write(html);
  doc.close();
  iframe.onload = () => {
    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    } finally {
      setTimeout(() => iframe.remove(), 1000);
    }
  };
}

/** Row builder extracted for unit testing. Accepts calculated offers. */
export function buildReportRowsForTest(offers: ComparisonResult["offers"]): string[][] {
  return [
    ["Province or territory of residence (Dec 31)", ...offers.map((o) => getProvinceName(o.input.province))],
    ["Gross annual salary", ...offers.map((o) => formatCurrency(o.input.annualSalary))],
    ["Annual bonus (recurring)", ...offers.map((o) => formatCurrency(o.input.annualBonus))],
    ["Additional taxable vacation pay", ...offers.map((o) => formatCurrency(o.input.vacationAllowance))],
    ["Recurring gross employment income", ...offers.map((o) => formatCurrency(o.totals.grossEmploymentIncome))],
    ["Signing bonus (one-time, year 1)", ...offers.map((o) => formatCurrency(o.input.signingBonus))],
    ["First-year gross (incl. signing bonus)", ...offers.map((o) => formatCurrency(o.totals.grossYearOne))],
    ["Federal income tax (recurring)", ...offers.map((o) => `-${formatCurrency(o.base.federal.effectiveAbatedTax, { decimals: 2 })}`)],
    ["Provincial/territorial tax (recurring)", ...offers.map((o) => `-${formatCurrency(o.base.provincial.totalPayable, { decimals: 2 })}`)],
    [`${offers[0].base.payroll.pensionName} (incl. CPP2/QPP2, recurring)`, ...offers.map((o) => `-${formatCurrency(o.base.payroll.pensionTotal, { decimals: 2 })}`)],
    [offers[0].base.payroll.eiName === "QPIP" ? "EI + QPIP (recurring)" : "EI premiums (recurring)", ...offers.map((o) => `-${formatCurrency(o.base.payroll.ei, { decimals: 2 })}`)],
    ["Provincial payroll tax (recurring)", ...offers.map((o) => (o.base.payroll.provincialPayrollTax > 0 ? `-${formatCurrency(o.base.payroll.provincialPayrollTax, { decimals: 2 })}` : "—"))],
    ["Total estimated deductions (recurring)", ...offers.map((o) => `-${formatCurrency(o.totals.totalDeductions)}`)],
    ["Tax on signing bonus (one-time)", ...offers.map((o) => (o.totals.totalDeductionsYearOne > o.totals.totalDeductions ? `-${formatCurrency(o.totals.totalDeductionsYearOne - o.totals.totalDeductions, { decimals: 2 })}` : "—"))],
    ["Total first-year deductions", ...offers.map((o) => `-${formatCurrency(o.totals.totalDeductionsYearOne)}`)],
    ["Estimated annual net (recurring)", ...offers.map((o) => formatCurrency(o.totals.netAnnualIncome))],
    ["Net from signing bonus (one-time)", ...offers.map((o) => (o.input.signingBonus > 0 ? formatCurrency(o.signingBonusNet) : "—"))],
    ["Estimated first-year net", ...offers.map((o) => formatCurrency(o.totals.netYearOne))],
    ["Estimated monthly net (recurring)", ...offers.map((o) => formatCurrency(o.totals.netMonthly))],
    ["Estimated biweekly net (recurring)", ...offers.map((o) => formatCurrency(o.totals.netBiweekly))],
    ["Employer pension (employer cost)", ...offers.map((o) => (o.totals.employerPension > 0 ? formatCurrency(o.totals.employerPension) : "—"))],
    ["Other employer benefits", ...offers.map((o) => (o.totals.employerBenefits > 0 ? formatCurrency(o.totals.employerBenefits) : "—"))],
    ["Annual work-related expenses", ...offers.map((o) => (o.totals.workExpenses > 0 ? formatCurrency(o.totals.workExpenses) : "—"))],
    ["Net after work expenses (recurring)", ...offers.map((o) => formatCurrency(o.totals.netAfterWorkExpenses))],
    ["First-year total compensation value", ...offers.map((o) => formatCurrency(o.totals.totalCompensation))],
  ];
}

export function buildInsightLinesForTest(offers: ComparisonResult["offers"]): [string, string][] {
  return buildInsightLines(offers);
}

function buildInsightLines(offers: ComparisonResult["offers"]): [string, string][] {
  const out: [string, string][] = [];
  const bestNet = offers.reduce((a, b) => (b.totals.netYearOne > a.totals.netYearOne ? b : a));
  const bestComp = offers.reduce((a, b) => (b.totals.totalCompensation > a.totals.totalCompensation ? b : a));
  const bestGross = offers.reduce((a, b) => (b.totals.grossYearOne > a.totals.grossYearOne ? b : a));
  const lowestRate = offers.reduce((a, b) => (b.totals.effectiveDeductionRate < a.totals.effectiveDeductionRate ? b : a));
  out.push([
    "Highest first-year take-home pay",
    `${bestNet.input.label}: ${formatCurrency(bestNet.totals.netYearOne)} first-year net (${formatCurrency(bestNet.totals.netMonthly)}/mo recurring) after ${formatPercent(bestNet.totals.effectiveDeductionRate, 1)} average deductions. Tax is based on residence on December 31, not province of employment.`,
  ]);
  if (bestComp.input.id !== bestNet.input.id) {
    out.push([
      "Highest total compensation value",
      `${bestComp.input.label}: ${formatCurrency(bestComp.totals.totalCompensation)} including employer pension and benefits.`,
    ]);
  }
  if (bestGross.input.id !== bestNet.input.id) {
    out.push([
      "Gross pay is not the whole story",
      `${bestGross.input.label} has the highest first-year gross but ${bestNet.input.label} keeps more after deductions.`,
    ]);
  }
  out.push([
    "Lowest average deduction rate",
    `${lowestRate.input.label}: ${formatPercent(lowestRate.totals.effectiveDeductionRate, 1)} of gross (${formatCurrency(lowestRate.totals.totalDeductionsYearOne)} per year). Lower total deductions do not necessarily mean a better offer — rates depend on income level and province or territory of residence.`,
  ]);
  out.push([
    "Expenses and limitations",
    "Comparison excludes career growth, security, commute and culture; other personal credits are not modelled. It shows rankings, not a single verdict. Not tax advice.",
  ]);
  const withExp = offers.filter((o) => o.totals.workExpenses > 0);
  if (withExp.length > 0) {
    const bestAfter = offers.reduce((a, b) => (b.totals.netAfterWorkExpenses > a.totals.netAfterWorkExpenses ? b : a));
    out.push([
      "Net after work-related expenses",
      `${bestAfter.input.label} keeps the most after estimated work expenses (${formatCurrency(bestAfter.totals.netAfterWorkExpenses)}).`,
    ]);
  }
  return out;
}
