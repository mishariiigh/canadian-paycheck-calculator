import { notFound } from "next/navigation";
import Link from "next/link";
import { ALL_PROVINCES, getProvinceName, isProvinceCode, getTaxYear } from "@/engine/tax-data";
import { calculateFull } from "@/engine/payroll";
import { TakeHomeSummary, PerPeriodTable } from "@/components/calculators/result-cards";
import { TakeHomeBarChart } from "@/components/charts/take-home-chart";
import { buildMetadata, takeHomePayUrl } from "@/lib/seo";
import { formatCurrency } from "@/lib/formatting";
import type { ProvinceCode } from "@/engine/types";

interface Props {
  params: Promise<{ province: string; salary: string }>;
}

const COMMON_SALARIES = [30000, 40000, 50000, 60000, 70000, 80000, 90000, 100000, 120000, 150000];

export function generateStaticParams() {
  const params: { province: string; salary: string }[] = [];
  for (const p of ALL_PROVINCES) {
    for (const s of COMMON_SALARIES) {
      params.push({ province: p.code.toLowerCase(), salary: String(s) });
    }
  }
  return params;
}

export const dynamicParams = true;

export async function generateMetadata({ params }: Props) {
  const { province, salary } = await params;
  const code = province.toUpperCase();
  if (!isProvinceCode(code)) return {};
  const parsed = Number(salary.replace(/[^0-9]/g, ""));
  if (!Number.isFinite(parsed)) return {};
  const name = getProvinceName(code);
  return buildMetadata({
    title: `$${parsed.toLocaleString("en-CA")} Take-Home Pay in ${name} (${getTaxYear()})`,
    description: `Estimated take-home pay on a $${parsed.toLocaleString("en-CA")} salary in ${name} for ${getTaxYear()}: federal tax, ${name} tax, CPP/QPP, CPP2 and EI/QPIP deductions, monthly and bi-weekly net pay.`,
    path: `/take-home-pay/${province}/${salary}`,
    keywords: [`take home pay ${name}`, `$${parsed} salary ${name}`, `net pay ${name} ${getTaxYear()}`],
  });
}

export default async function TakeHomePaySalaryPage({ params }: Props) {
  const { province, salary } = await params;
  const code = province.toUpperCase() as ProvinceCode;
  if (!isProvinceCode(code)) notFound();
  const parsed = Number(salary.replace(/[^0-9]/g, ""));
  if (!Number.isFinite(parsed) || parsed <= 0 || parsed > 10_000_000) notFound();

  const name = getProvinceName(code);
  const result = calculateFull({ grossAnnualIncome: parsed, province: code, taxYear: getTaxYear() });

  return (
    <div className="space-y-8">
      <header>
        <h1 className="sfx-h2">
          {formatCurrency(parsed)} Take-Home Pay in {name} ({getTaxYear()})
        </h1>
        <p className="mt-2 text-sm text-[var(--color-text-muted)] leading-relaxed">
          Estimated net pay on a {formatCurrency(parsed)} gross salary in {name}, after federal
          tax, {name} tax, {result.annual.payroll.pensionName}, {result.annual.payroll.eiName}
          {result.annual.payroll.provincialPayrollTax > 0 ? " and provincial payroll tax" : ""}.
          For a single employee claiming the basic personal amount and standard credits.
        </p>
      </header>

      <TakeHomeSummary result={result.annual} />
      <TakeHomeBarChart result={result.annual} />
      <PerPeriodTable periods={result.perPeriod} />

      <section className="sfx-card">
        <div className="px-6 py-5 border-b border-[var(--color-border)]">
          <h2 className="sfx-h3 mb-0">Nearby salaries in {name}</h2>
        </div>
        <div className="px-6 pb-6">
          <div className="flex flex-wrap gap-2">
            {COMMON_SALARIES.map((s) => (
              <Link
                key={s}
                href={takeHomePayUrl(code, s)}
                className={`rounded-[var(--radius-md)] border px-3 py-2 text-sm font-medium transition-all ${
                  s === parsed
                    ? "border-[var(--color-primary)] bg-[var(--color-primary)] text-[var(--color-text-on-primary)]"
                    : "border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-[var(--color-border-hover)] hover:bg-[#F5F7FB]"
                }`}
              >
                ${s.toLocaleString("en-CA")}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">
        These are estimates based on {getTaxYear()} CRA and provincial parameters and a simplified
        credit model (basic personal amount, Canada employment amount, CPP/EI credits). Other
        deductions or credits will change your actual results. Not tax advice.
      </p>
    </div>
  );
}
