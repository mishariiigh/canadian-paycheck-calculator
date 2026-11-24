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
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Hourly to Salary Calculator</h1>
        <p className="mt-2 text-gray-600">Convert hourly pay to annual salary, then estimate take-home pay.</p>
      </div>
      <HourlyToSalaryCalculator />
    </div>
  );
}
