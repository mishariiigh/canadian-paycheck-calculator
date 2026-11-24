import Link from "next/link";
import { ALL_PROVINCES } from "@/engine/tax-data";
import { calculateAnnualTax } from "@/engine/annual-tax";
import { takeHomePayUrl } from "@/lib/seo";
import { formatCurrency } from "@/lib/formatting";

const SAMPLE_SALARIES = [40000, 60000, 80000, 100000, 120000, 150000];

export default function Home() {
  const comparison = SAMPLE_SALARIES.map((salary) => {
    const results = ALL_PROVINCES.map((p) => ({
      province: p,
      net: calculateAnnualTax({ grossAnnualIncome: salary, province: p.code, taxYear: 2026 }).totals.netAnnualIncome,
    }));
    results.sort((a, b) => b.net - a.net);
    return { salary, best: results[0], worst: results[results.length - 1] };
  });

  return (
    <div className="space-y-10">
      <section className="rounded-2xl bg-white p-8 shadow-sm">
        <h1 className="text-3xl font-bold text-gray-900">
          Canadian Take-Home Pay Calculator — 2026
        </h1>
        <p className="mt-3 max-w-3xl text-gray-600">
          Estimate your net pay after federal tax, provincial tax, CPP/QPP, CPP2/QPP2,
          EI/QPIP and provincial payroll taxes — for every province and territory in Canada.
          Based on confirmed 2026 tax year parameters from the CRA and provincial finance ministries.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/calculators/take-home-pay"
            className="rounded-lg bg-blue-700 px-5 py-3 font-semibold text-white hover:bg-blue-800"
          >
            Calculate my take-home pay
          </Link>
          <Link
            href="/calculators"
            className="rounded-lg border border-gray-300 px-5 py-3 font-semibold text-gray-700 hover:bg-gray-100"
          >
            All calculators
          </Link>
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-xl font-semibold text-gray-900">Net pay across Canada</h2>
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left text-gray-500">
                <th className="px-4 py-3 font-medium">Gross salary</th>
                <th className="px-4 py-3 font-medium">Highest net pay</th>
                <th className="px-4 py-3 font-medium">Lowest net pay</th>
                <th className="px-4 py-3 font-medium">Compare</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {comparison.map(({ salary, best, worst }) => (
                <tr key={salary}>
                  <td className="px-4 py-3 font-semibold">{formatCurrency(salary)}</td>
                  <td className="px-4 py-3">
                    {best.province.name}: <span className="text-green-700">{formatCurrency(best.net)}</span>
                  </td>
                  <td className="px-4 py-3">
                    {worst.province.name}: <span className="text-red-700">{formatCurrency(worst.net)}</span>
                  </td>
                  <td className="px-4 py-3">
                    <Link href={takeHomePayUrl(best.province.code, salary)} className="text-blue-700 hover:underline">
                      View →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-xl font-semibold text-gray-900">Browse by province or territory</h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {ALL_PROVINCES.map((p) => (
            <Link
              key={p.code}
              href={`/province/${p.code.toLowerCase()}`}
              className="rounded-lg border border-gray-200 bg-white p-4 text-center shadow-sm hover:border-blue-400"
            >
              <span className="font-semibold text-gray-900">{p.name}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="rounded-xl bg-blue-50 p-6 text-sm text-gray-700">
        <h2 className="mb-2 font-semibold text-gray-900">How the calculation works</h2>
        <p>
          using confirmed 2026 brackets, the enhanced basic personal amount (including the
          federal income-based phase-out), the Canada employment amount, CPP/EI credits,
          the Ontario surtax and health premium, the Quebec federal abatement (16.5%),
          QPP and QPIP for Quebec residents, and the 2% payroll tax in the Northwest
          Territories and Nunavut. Per-period amounts (weekly, bi-weekly, semi-monthly,
          monthly) divide the annual result evenly.
        </p>
        <p className="mt-2">
          Source data and verification status are documented in{" "}
          <code className="rounded bg-white px-1">docs/DATA-VALIDATION-REPORT.md</code>.
          Figures are estimates for a single employee claiming only the basic personal
          amount and standard credits — not tax advice.
        </p>
      </section>
    </div>
  );
}
