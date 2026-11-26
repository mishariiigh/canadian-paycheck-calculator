import { notFound } from "next/navigation";
import Link from "next/link";
import { ALL_PROVINCES } from "@/engine/tax-data";
import { buildMetadata } from "@/lib/seo";

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
    title: `${name} Take-Home Pay Calculator 2026`,
    description: `Take-home pay calculator for ${name}: estimate net salary after tax, CPP/QPP, CPP2 and EI for the 2026 tax year.`,
    path: `/take-home-pay/${province}`,
  });
}

export default async function TakeHomePayProvinceIndex({ params }: Props) {
  const { province } = await params;
  const code = province.toUpperCase();
  if (!ALL_PROVINCES.some((p) => p.code === code)) notFound();
  const name = ALL_PROVINCES.find((p) => p.code === code)!.name;

  return (
    <div className="space-y-6">
      <h1 className="sfx-h1">{name} Take-Home Pay</h1>
      <p className="sfx-text-muted">Pick a salary to see a detailed net pay breakdown:</p>
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
        {[30000, 40000, 50000, 60000, 70000, 80000, 90000, 100000, 120000, 150000, 200000, 250000].map((s) => (
          <Link
            key={s}
            href={`/take-home-pay/${province.toLowerCase()}/${s}`}
            className="sfx-card p-4 text-center font-semibold text-[var(--color-text-primary)] hover:border-[var(--color-border-hover)] transition-colors"
          >
            ${s.toLocaleString("en-CA")}
          </Link>
        ))}
      </div>
    </div>
  );
}
