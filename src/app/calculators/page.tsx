import Link from "next/link";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "All Canadian Financial Calculators (2026)",
  description:
    "Take-home pay, hourly to salary, bonus tax and salary comparison calculators for all Canadian provinces and territories, 2026 tax year.",
  path: "/calculators",
});

const calculators = [
  {
    href: "/calculators/take-home-pay",
    title: "Take-Home Pay Calculator",
    description:
      "Estimate net annual, monthly, semi-monthly, bi-weekly and weekly pay after federal tax, provincial tax, CPP/QPP, CPP2/QPP2 and EI/QPIP.",
  },
  {
    href: "/job-offer-comparison",
    title: "Job Offer Comparison Studio",
    description:
      "Compare up to three job offers side by side: net pay, bonuses, employer pension and work costs — the full financial picture.",
  },
  {
    href: "/job-offer-comparison",
    title: "Job Offer Comparison Studio",
    description: "Compare up to three offers on net pay, bonuses, employer pension and real costs — not just gross salary.",
  },
  {
    href: "/calculators/hourly-to-salary",
    title: "Hourly to Salary Calculator",
    description: "Convert an hourly wage into an annual, monthly and weekly salary — then see the take-home amount.",
  },
  {
    href: "/calculators/bonus-tax",
    title: "Bonus Tax Calculator",
    description: "See how much of a bonus you keep after income tax, CPP and EI, at your marginal rate.",
  },
  {
    href: "/calculators/salary-comparison",
    title: "Salary Comparison by Province",
    description: "Compare the same gross salary across all 13 provinces and territories.",
  },
];

export default function CalculatorsPage() {
  return (
    <div className="space-y-8">
      <h1 className="sfx-h1">Calculators</h1>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {calculators.map((c) => (
          <Link
            key={c.href}
            href={c.href}
            className="sfx-card p-6 sfx-link hover:border-[var(--color-border-hover)] transition-colors h-full flex flex-col"
          >
            <h2 className="text-lg font-semibold text-[var(--color-text-primary)] tracking-tight">
              {c.title}
            </h2>
            <p className="mt-2 text-sm text-[var(--color-text-muted)] leading-relaxed">
              {c.description}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
