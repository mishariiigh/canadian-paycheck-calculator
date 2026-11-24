# Canada Take-Home Pay & Financial Calculators

Production-quality Canadian salary/payroll calculator platform for the **2026 tax year**, covering all 13 provinces and territories.

## Stack

- Next.js (App Router) + TypeScript (strict) + Tailwind CSS
- Recharts for visualisation
- Vitest for engine & integration tests
- No database — tax parameters live in version-controlled JSON under `data/`

## Architecture

```
data/2026/            # single source of truth for all tax parameters (per tax year)
  federal.json        # federal brackets, enhanced BPA, employment amount
  payroll.json        # CPP, CPP2, EI, QPP, QPIP
  provinces/*.json    # 13 jurisdictions incl. ON surtax/health premium, NT/NU payroll tax
src/engine/           # pure calculation engine (framework-agnostic, no Next.js/React imports)
src/lib/              # formatting, validation, SEO helpers
src/components/       # UI (layout, calculators, charts)
src/app/              # Next.js routes incl. SEO landing pages
tests/                # engine fixtures + integration tests (Vitest)
scripts/gen-provinces.mjs  # generator used to create the province JSON files
docs/DATA-VALIDATION-REPORT.md  # per-parameter source, verification status, effective date
```

### Tax-year upgrade process

1. Create `data/<new-year>/` — **never** modify a previous year's directory.
2. Copy forward and update values; every change must have a documented source (see the validation report's re-verification checklist).
3. Update `TAX_YEAR` in `src/engine/tax-data.ts` and test fixtures.
4. Run `npm test` — fixture tests assert exact bracket boundaries and maximums, so silent data changes fail loudly.

## Accuracy model

Annual T1-style calculation: progressive federal + provincial tax, enhanced basic
personal amount (with federal income-based phase-out), Canada employment amount,
CPP/EI non-refundable credits, Ontario surtax + health premium, Quebec 16.5%
federal abatement with QPP/QPIP, and 2% employee payroll tax in NT/NU. Bonus
calculations apply marginal rates with CPP/EI only on remaining annual room.

Per-period results divide annual amounts evenly across pay periods. They are
estimates, not actual CRA payroll withholding calculations (T4127). Actual payroll
deductions may differ due to per-period rounding, cumulative averaging, and
mid-year legislative changes.

Known simplifications and unverified values are documented in
`docs/DATA-VALIDATION-REPORT.md`, including the NL low-income tax reduction and
SK low-income tax credit which are not modelled.

## Development

```bash
npm install
npm run dev        # http://localhost:3000
npm test           # Vitest: engine + integration tests
npm run lint
npm run build      # static generation of calculator & SEO pages
```

## Routes

- `/` — overview with cross-Canada net pay comparison
- `/calculators` — index
- `/calculators/take-home-pay` — interactive calculator
- `/calculators/hourly-to-salary`, `/calculators/bonus-tax`, `/calculators/salary-comparison`
- `/province/[province]` — provincial tax rates landing pages
- `/take-home-pay/[province]/[salary]` — salary-specific SEO pages (e.g. `/take-home-pay/on/80000`)
- `/sitemap.xml`, `/robots.txt`

## Disclaimer

Estimates for informational purposes only, for a single employee claiming the
basic personal amount and standard credits. Not tax advice.
