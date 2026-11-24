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
        <h1 className="text-2xl font-bold text-gray-900">{name} Tax Rates &amp; Take-Home Pay ({getTaxYear()})</h1>
        <p className="mt-2 text-gray-600">
          {getTaxYear()} {name} provincial/territorial tax brackets, basic personal amount and
          take-home pay examples. Rates verified against CRA-confirmed sources — see the
          data validation report for details.
        </p>
      </header>

      <section className="grid gap-6 md:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-3 text-lg font-semibold">{name} tax brackets ({getTaxYear()})</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left text-gray-500">
                <th className="py-2 font-medium">Taxable income</th>
                <th className="py-2 text-right font-medium">Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.taxBrackets.map((b, i) => {
                const lower = i === 0 ? 0 : data.taxBrackets[i - 1].upTo!;
                return (
                  <tr key={i}>
                    <td className="py-2">
                      {b.upTo === null
                        ? `Over ${formatCurrency(lower)}`
                        : `${formatCurrency(lower)} – ${formatCurrency(b.upTo)}`}
                    </td>
                    <td className="py-2 text-right tabular-nums">{formatPercent(b.rate)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <p className="mt-3 text-sm text-gray-500">
            Basic personal amount: <strong>{formatCurrency(data.basicPersonalAmount.amount)}</strong>{" "}
            (credit at {formatPercent(data.basicPersonalAmount.creditRate)})
          </p>
          {data.notes && (
            <ul className="mt-2 list-disc pl-5 text-xs text-gray-500">
              {data.notes.map((n, i) => <li key={i}>{n}</li>)}
            </ul>
          )}
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-3 text-lg font-semibold">Federal brackets ({getTaxYear()})</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left text-gray-500">
                <th className="py-2 font-medium">Taxable income</th>
                <th className="py-2 text-right font-medium">Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {fed.taxBrackets.map((b, i) => {
                const lower = i === 0 ? 0 : fed.taxBrackets[i - 1].upTo!;
                return (
                  <tr key={i}>
                    <td className="py-2">
                      {b.upTo === null
                        ? `Over ${formatCurrency(lower)}`
                        : `${formatCurrency(lower)} – ${formatCurrency(b.upTo)}`}
                    </td>
                    <td className="py-2 text-right tabular-nums">{formatPercent(b.rate)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <p className="mt-3 text-sm text-gray-500">
            Federal basic personal amount: up to {formatCurrency(fed.basicPersonalAmount.maximum)}
            (reduced to {formatCurrency(fed.basicPersonalAmount.minimum)} for high incomes).
          </p>
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-xl font-semibold text-gray-900">
          Take-home pay examples in {name}
        </h2>
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left text-gray-500">
                <th className="px-4 py-3 font-medium">Gross salary</th>
                <th className="px-4 py-3 text-right font-medium">Total deductions</th>
                <th className="px-4 py-3 text-right font-medium">Net annual</th>
                <th className="px-4 py-3 text-right font-medium">Net monthly</th>
                <th className="px-4 py-3 text-right font-medium">Avg. rate</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {examples.map(({ salary, result }) => (
                <tr key={salary}>
                  <td className="px-4 py-3 font-semibold">{formatCurrency(salary)}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{formatCurrency(result.totals.totalTaxAndDeductions)}</td>
                  <td className="px-4 py-3 text-right font-semibold tabular-nums text-green-700">{formatCurrency(result.totals.netAnnualIncome)}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{formatCurrency(result.totals.netAnnualIncome / 12)}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-gray-500">{formatPercent(result.totals.averageTaxRate, 1)}</td>
                  <td className="px-4 py-3 text-right">
                    <Link href={takeHomePayUrl(code, salary)} className="text-blue-700 hover:underline">Details →</Link>
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
