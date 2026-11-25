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
    <div className="space-y-12">
      <section>
        <div className="sfx-card sfx-card--elevated p-8 md:p-12">
          <div className="sfx-section-head sm:grid sm:grid-cols-2 sm:items-center sm:gap-6">
            <div>
              <span className="sfx-kicker">Canadian Paycheck Calculator</span>
              <h1 className="sfx-h1 mt-2 mb-4 sm:mb-6 sm:text-4xl md:text-5xl">
                Estimate your take-home pay for 2026 / 2027
              </h1>
              <p className="sfx-text-muted max-w-lg sm:max-w-none sm:text-lg leading-relaxed">
                Calculate net pay after federal tax, provincial tax, CPP/QPP,
                CPP2/QPP2 and EI/QPIP — for all 13 provinces and territories.
                Built on confirmed 2026 tax parameters from the CRA and provincial
                finance ministries.
              </p>
            </div>
            <div className="mt-6 sm:mt-0 grid gap-3 sm:grid-cols-2">
              <Link
                href="/calculators/take-home-pay"
                className="sfx-button sfx-button--primary w-full py-3 text-center"
              >
                Calculate my take-home pay
              </Link>
              <Link
                href="/calculators"
                className="sfx-button sfx-button--secondary w-full py-3 text-center"
              >
                All calculators
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="sfx-section">
        <div className="sfx-section-head">
          <span className="sfx-kicker">Compare across Canada</span>
          <h2 className="sfx-h2 mb-0">Net pay across Canada</h2>
        </div>
        <div className="sfx-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="sfx-table sfx-table--zebra w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--color-border)] text-left">
                  <th className="px-4 py-3 font-medium">Gross salary</th>
                  <th className="px-4 py-3 text-right font-medium">Highest net pay</th>
                  <th className="px-4 py-3 text-right font-medium">Lowest net pay</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)]">
                {comparison.map(({ salary, best, worst }) => (
                  <tr key={salary}>
                    <td className="px-4 py-3 font-semibold money">{formatCurrency(salary)}</td>
                    <td className="px-4 py-3 text-right">
                      <span className="money">{formatCurrency(best.net)}</span>{" "}
                      <span className="text-xs text-[var(--color-text-muted)]">
                        ({best.province.name})
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="money">{formatCurrency(worst.net)}</span>{" "}
                      <span className="text-xs text-[var(--color-text-muted)]">
                        ({worst.province.name})
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={takeHomePayUrl(best.province.code, salary)}
                        className="sfx-link"
                      >
                        View →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="sfx-section">
        <div className="sfx-section-head">
          <span className="sfx-kicker">Province &amp; territory</span>
          <h2 className="sfx-h2 mb-0">Browse by province or territory</h2>
        </div>
        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {ALL_PROVINCES.map((p) => (
            <Link
              key={p.code}
              href={`/province/${p.code.toLowerCase()}`}
              className="sfx-card p-5 text-center hover:border-[var(--color-border-hover)] transition-border"
            >
              <span className="block font-semibold text-[var(--color-text-primary)] tracking-tight">
                {p.name}
              </span>
              <span className="mt-1 block text-xs text-[var(--color-text-muted)]">
                {p.code}
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="sfx-section">
        <div className="sfx-card bg-[#F5F7FB] p-8 md:p-12">
          <h2 className="sfx-h2 mb-4">How the calculation works</h2>
          <p className="sfx-text-muted leading-relaxed max-w-2xl">
            Using confirmed 2026 brackets, the enhanced basic personal amount (including the
            federal income-based phase-out), the Canada employment amount, CPP/EI credits,
            the Ontario surtax and health premium, the Quebec federal abatement (16.5%),
            QPP and QPIP for Quebec residents, and the 2% payroll tax in the Northwest
            Territories and Nunavut. Per-period amounts (weekly, bi-weekly, semi-monthly,
            monthly) divide the annual result evenly.
          </p>
          <p className="mt-4 sfx-text-muted">
            Source data and verification status are documented in{" "}
            <code className="rounded bg-[var(--color-card)] px-1 py-0.5 border border-[var(--color-border)]">
              docs/DATA-VALIDATION-REPORT.md
            </code>
            . Figures are estimates for a single employee claiming only the basic personal
            amount and standard credits — not tax advice.
          </p>
        </div>
      </section>
    </div>
  );
}
