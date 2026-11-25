import { buildMetadata } from "@/lib/seo";
import { HourlyToSalaryCalculator } from "@/components/calculators/hourly-to-salary-calculator";

export const metadata = buildMetadata({
  title: "Hourly to Salary Calculator (Canada, 2026)",
  description:
    "Convert an hourly wage to an annual salary in Canada and estimate the take-home amount after tax, CPP and EI for any province.",
  path: "/calculators/hourly-to-salary",
  keywords: ["hourly to salary calculator canada", "wage to annual salary"],
});

export default function HourlyToSalaryPage() {
  return (
    <div className="space-y-6">
      <div className="sfx-card p-6 md:p-8">
        <h1 className="sfx-h2 mb-3">Hourly to Salary Calculator</h1>
        <p className="text-sm text-[var(--color-text-muted)] leading-relaxed">
          Convert hourly pay to annual salary, then estimate take-home pay.
        </p>
      </div>
      <HourlyToSalaryCalculator />
    </div>
  );
}
