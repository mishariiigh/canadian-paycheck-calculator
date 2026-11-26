import { notFound } from "next/navigation";
import Link from "next/link";
import { ALL_PROVINCES, getFederalData, getProvincialData, getTaxYear } from "@/engine/tax-data";
import { calculateAnnualTax } from "@/engine/annual-tax";
import { buildMetadata, takeHomePayUrl } from "@/lib/seo";
import { formatCurrency, formatPercent } from "@/lib/formatting";

interface Props {
  params: Promise<{ province: string }>;
}

export function generateStaticParams() {
  return ALL_PROVINCES.map((p) => ({ province: p.code.toLowerCase() }));
}

export async function generateMetadata({ params }: Props) {
  const { province } = await params;
  const code = province.toUpperCase();
  if (!ALL_PROVINCES.some((p) => p.code === code)) return {};
  const name = ALL_PROVINCES.find((p) => p.code === code)!.name;
  return buildMetadata({
    title: `${name} Income Tax Rates & Take-Home Pay ${getTaxYear()}`,
    description: `${getTaxYear()} ${name} provincial tax brackets and rates, basic personal amount, and estimated take-home pay examples. Includes federal tax, CPP/QPP and EI deductions.`,
    path: `/province/${province}`,
    keywords: [`${name} tax brackets ${getTaxYear()}`, `${name} take home pay`, `${name} income tax rates`],
  });
}

export default async function ProvincePage({ params }: Props) {
  const { province } = await params;
  const code = province.toUpperCase() as Parameters<typeof getProvincialData>[0];
  if (!ALL_PROVINCES.some((p) => p.code === code)) notFound();

  const data = getProvincialData(code);
  const fed = getFederalData();
  const name = data.provinceName;

  const examples = [40000, 60000, 80000, 100000, 150000].map((salary) => ({
    salary,
    result: calculateAnnualTax({ grossAnnualIncome: salary, province: code, taxYear: getTaxYear() }),
  }));

  return (
    <div className="space-y-8">
      <header>
        <h1 className="sfx-h2">{name} Tax Rates &amp; Take-Home Pay ({getTaxYear()})</h1>
        <p className="mt-2 text-sm text-[var(--color-text-muted)] leading-relaxed">
          {getTaxYear()} {name} provincial/territorial tax brackets, basic personal amount and
          take-home pay examples. Rates verified against CRA-confirmed sources — see the
          data validation report for details.
        </p>
      </header>

      <section className="grid gap-6 md:grid-cols-2">
        <div className="sfx-card p-6">
          <h2 className="sfx-h3 mb-4">{name} tax brackets ({getTaxYear()})</h2>
          <table className="sfx-table w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--color-border)]">
                <th className="px-4 py-3">Taxable income</th>
                <th className="px-4 py-3 text-right">Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {data.taxBrackets.map((b, i) => {
                const lower = i === 0 ? 0 : data.taxBrackets[i - 1].upTo!;
                return (
                  <tr key={i}>
                    <td className="px-4 py-3">
                      {b.upTo === null
                        ? `Over ${formatCurrency(lower)}`
                        : `${formatCurrency(lower)} – ${formatCurrency(b.upTo)}`}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">{formatPercent(b.rate)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <p className="mt-4 text-sm text-[var(--color-text-muted)]">
            Basic personal amount:{" "}
            <span className="font-semibold text-[var(--color-text-primary)]">
              {formatCurrency(data.basicPersonalAmount.amount)}
            </span>{" "}
            (credit at {formatPercent(data.basicPersonalAmount.creditRate)})
          </p>
          {data.notes && (
            <ul className="mt-3 list-disc pl-5 text-xs text-[var(--color-text-muted)] space-y-1">
              {data.notes.map((n, i) => <li key={i}>{n}</li>)}
            </ul>
          )}
        </div>

        <div className="sfx-card p-6">
          <h2 className="sfx-h3 mb-4">Federal brackets ({getTaxYear()})</h2>
          <table className="sfx-table w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--color-border)]">
                <th className="px-4 py-3">Taxable income</th>
                <th className="px-4 py-3 text-right">Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {fed.taxBrackets.map((b, i) => {
                const lower = i === 0 ? 0 : fed.taxBrackets[i - 1].upTo!;
                return (
                  <tr key={i}>
                    <td className="px-4 py-3">
                      {b.upTo === null
                        ? `Over ${formatCurrency(lower)}`
                        : `${formatCurrency(lower)} – ${formatCurrency(b.upTo)}`}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">{formatPercent(b.rate)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <p className="mt-4 text-sm text-[var(--color-text-muted)]">
            Federal basic personal amount: up to{" "}
            <span className="font-semibold text-[var(--color-text-primary)]">
              {formatCurrency(fed.basicPersonalAmount.maximum)}
            </span>{" "}
            (reduced to {formatCurrency(fed.basicPersonalAmount.minimum)} for high incomes).
          </p>
        </div>
      </section>

      <section className="sfx-card">
        <div className="px-6 py-5 border-b border-[var(--color-border)]">
          <h2 className="sfx-h3 mb-0">Take-home pay examples in {name}</h2>
        </div>
        <div className="sfx-table-scroll">
            <table className="sfx-table sfx-table--fixed w-full text-sm">
              <colgroup>
                <col style={{ width: "17%" }} />
                <col style={{ width: "21%" }} />
                <col style={{ width: "18%" }} />
                <col style={{ width: "16%" }} />
                <col style={{ width: "13%" }} />
                <col style={{ width: "15%" }} />
              </colgroup>
              <thead>
                <tr className="border-b border-[var(--color-border)]">
                  <th className="px-4 py-3">Gross salary</th>
                  <th className="px-4 py-3 text-right">Total deductions</th>
                  <th className="px-4 py-3 text-right">Net annual</th>
                  <th className="px-4 py-3 text-right">Net monthly</th>
                  <th className="px-4 py-3 text-right">Avg. rate</th>
                  <th className="px-4 py-3" aria-hidden="true" />
                </tr>
              </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {examples.map(({ salary, result }) => (
                <tr key={salary}>
                  <td className="px-4 py-3 font-semibold money">{formatCurrency(salary)}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-[var(--color-text-muted)]">
                    {formatCurrency(result.totals.totalTaxAndDeductions)}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold tabular-nums text-[var(--color-success)] money">
                    {formatCurrency(result.totals.netAnnualIncome)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {formatCurrency(result.totals.netAnnualIncome / 12)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-[var(--color-text-muted)]">
                    {formatPercent(result.totals.averageTaxRate, 1)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link href={takeHomePayUrl(code, salary)} className="sfx-link whitespace-nowrap">
                      Details →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
