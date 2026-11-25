"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ALL_PROVINCES } from "@/engine/tax-data";

const NAV_LINKS = [
  { href: "/calculators", label: "Calculators" },
  { href: "/province/on", label: "Ontario" },
  { href: "/take-home-pay/on/80000", label: "$80K Example" },
];

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="border-b border-[var(--color-border)] bg-[var(--color-card)] sticky top-0 z-40">
      <div className="mx-auto sfx-container flex h-16 items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-2"
          aria-label="Canada Take-Home Pay Calculators home"
        >
          <Image
            src="/images/canada-maple-leaf.png"
            alt="Canadian maple leaf"
            width={32}
            height={32}
            className="object-contain"
          />
          <span className="font-bold text-[var(--color-primary)] tracking-tight">
            Canada Take-Home Pay
          </span>
        </Link>

        <div className="flex items-center gap-4">
          <nav className="hidden md:flex gap-6 text-sm text-[var(--color-text-muted)] font-medium">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="sfx-link hover:text-[var(--color-accent)]"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <button
            className="md:hidden sfx-button sfx-button--ghost p-1.5"
            aria-label="Open navigation menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              {menuOpen ? (
                <>
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </>
              ) : (
                <>
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <line x1="3" y1="18" x2="21" y2="18" />
                </>
              )}
            </svg>
          </button>
        </div>
      </div>

      {menuOpen && (
        <div
          className="fixed inset-0 z-50 flex flex-col"
          role="dialog"
          aria-modal="true"
          aria-label="Navigation menu"
          onClick={() => setMenuOpen(false)}
        >
          <div
            className="absolute inset-0 bg-[var(--color-background)]/80 backdrop-blur-sm"
            aria-hidden="true"
          />
          <div className="relative z-10 flex h-full w-full max-w-xs flex-col border-l border-[var(--color-border)] bg-[var(--color-card)] shadow-[var(--shadow-lg)]">
            <div className="flex h-16 items-center justify-between px-6 border-b border-[var(--color-border)]">
              <h2 className="font-bold text-[var(--color-primary)]">Menu</h2>
              <button
                className="sfx-button sfx-button--ghost p-1.5"
                aria-label="Close navigation menu"
                onClick={() => setMenuOpen(false)}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto px-6 py-4 space-y-2 text-sm text-[var(--color-text-muted)] font-medium">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="block px-3 py-2.5 rounded-[var(--radius-md)] sfx-link hover:bg-[var(--color-background)]"
                  onClick={() => setMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
            <div className="border-t border-[var(--color-border)] bg-[var(--color-background)] p-6">
              <div className="flex items-center gap-2">
                <Image
                  src="/images/canada-maple-leaf.png"
                  alt="Canadian maple leaf"
                  width={24}
                  height={24}
                  className="object-contain"
                />
                <span className="font-semibold text-[var(--color-primary)] tracking-tight">
                  Canada Take-Home Pay
                </span>
              </div>
              <p className="mt-2 text-xs text-[var(--color-text-muted)]">
                Estimated take-home pay for all Canadian provinces and territories.
              </p>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-[var(--color-border)] bg-[var(--color-card)] mt-auto">
      <div className="mx-auto sfx-container border-y border-[var(--color-border)] py-10">
        <div className="grid gap-8 md:grid-cols-4">
          <div className="col-span-4 md:col-span-1">
            <div className="flex items-center gap-2">
              <Image
                src="/images/canada-maple-leaf.png"
                alt="Canadian maple leaf"
                width={28}
                height={28}
                className="object-contain"
              />
              <span className="font-bold text-[var(--color-primary)] tracking-tight">
                Canada Take-Home Pay
              </span>
            </div>
            <p className="mt-3 text-sm text-[var(--color-text-muted)] max-w-xs">
              Estimated take-home pay after federal and provincial tax, CPP/QPP,
              CPP2/QPP2 and EI/QPIP. For every province and territory in Canada.
            </p>
          </div>

          <div>
            <h3 className="mb-4 font-semibold text-[var(--color-text-primary)] tracking-tight">
              Calculators
            </h3>
            <ul className="space-y-2.5 text-sm text-[var(--color-text-muted)]">
              <li><Link href="/calculators/take-home-pay" className="sfx-link">Take-Home Pay Calculator</Link></li>
              <li><Link href="/calculators/hourly-to-salary" className="sfx-link">Hourly to Salary</Link></li>
              <li><Link href="/calculators/bonus-tax" className="sfx-link">Bonus Tax Calculator</Link></li>
              <li><Link href="/calculators/salary-comparison" className="sfx-link">Salary Comparison</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="mb-4 font-semibold text-[var(--color-text-primary)] tracking-tight">
              Provinces &amp; Territories
            </h3>
            <ul className="grid grid-cols-2 gap-3 text-sm text-[var(--color-text-muted)]">
              {ALL_PROVINCES.map((p) => (
                <li key={p.code}>
                  <Link href={`/province/${p.code.toLowerCase()}`} className="sfx-link">
                    {p.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-4 font-semibold text-[var(--color-text-primary)] tracking-tight">
              About
            </h3>
            <ul className="space-y-2.5 text-sm text-[var(--color-text-muted)]">
              <li>
                2026 tax year estimates based on CRA and provincial published rates.
              </li>
              <li>Not tax advice — verify with a qualified professional.</li>
              <li>
                Informational use only. Actual payroll deductions may vary.
              </li>
            </ul>
          </div>
        </div>
      </div>
      <div className="border-t border-[var(--color-border)] bg-[#F5F7FB] py-6">
        <div className="mx-auto sfx-container flex flex-col items-center justify-between gap-2 px-4 sm:flex-row sm:items-center">
          <p className="text-xs text-[var(--color-text-muted)]">
            © {new Date().getFullYear()} Canada Take-Home Pay Calculators.
          </p>
          <p className="text-xs text-[var(--color-text-muted)]">
            Informational use only — not tax advice.
          </p>
        </div>
      </div>
    </footer>
  );
}
