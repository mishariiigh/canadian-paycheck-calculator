# Release Report — 2026 Canadian Tax Engine Audit

**Date:** 2026-11-24
**Branch:** main
**Build:** Production build successful (Next.js 15.5.29, Turbopack)
**Tests:** 79 passed (6 test files)
**Lint:** ESLint clean
**TypeScript:** `tsc --noEmit` clean

---

## Changes

### Corrections

| File | Parameter | Old | New | Source |
|------|-----------|-----|-----|--------|
| `data/2026/federal.json` | Canada employment amount | $1,561 | $1,501 | CRA T4032 (2025, unchanged for 2026) |
| `data/2026/provinces/NL.json` | NL Basic Personal Amount | $15,000 | $13,094 | NL Dept of Finance (2026), $15,000 takes effect 2027 |

### New functionality

- **NL Low-Income Tax Reduction (LITR)** implemented per Income Tax Act, 2000 s.21.1 and NL Regulation 18/26:
  - Amount A: $842 (Reg 18/26 s.3(b)(i), 21.1(2.1)(a))
  - Amount B: $563 (Reg 18/26 s.3(b)(ii), 21.1(2.1)(b) — qualified relation / 9(1)(b) only)
  - Threshold individual: $18,547 (Act s.21.1(2)(b))
  - Threshold family: $31,362 (Act s.21.1(2)(c))
  - Clawback rate: 16% (Act s.21.1(2))
  - Non-refundable: cannot exceed NL provincial tax payable (Act s.21.1(2), (5))
  - Verified by `tests/engine/nl-litr.test.ts` (15 tests)

### Payroll clarification

- Fixed per-period net derivation in `src/engine/payroll.ts`: per-period `net` now derives from annual net (`roundToCents(annual.totals.netAnnualIncome / periods)`), and `totalDeductions = roundToCents(gross - net)`
- Added UI disclaimers in `src/components/calculators/result-cards.tsx` and `src/app/calculators/take-home-pay/page.tsx` clarifying annual results are T1-style estimates, not actual CRA payroll withholding (T4127)
- Updated README accuracy model section to document the annual vs payroll distinction

### Documentation

- `docs/DATA-VALIDATION-REPORT.md` updated: corrected parameter values, documented NL LITR implementation, removed NL LITR from missing credits list, added payroll distinction notes
- `docs/RELEASE-REPORT-2026.md` (this file)

---

## Verification results

| Check | Status |
|-------|--------|
| All 79 tests pass (6 files) | ✅ |
| ESLint clean | ✅ |
| TypeScript `tsc --noEmit` clean | ✅ |
| Production build (`next build --turbopack`) | ✅ |
| Sitemap + robots.txt generated | ✅ |
| Playwright | Not installed in project |

---

## Remaining gaps (documented, not modelled)

1. **Saskatchewan Low-Income Tax Credit (SLITC)** — refundable benefit administered by CRA, not a tax reduction. Out of scope for tax liability engine.
2. **Ontario LIFT / Ontario trillium components** — not modelled, out of scope per simplified credit model.
3. **Alternative Minimum Tax (AMT)** — not modelled.
4. **Per-period payroll formulas (T4127)** — per-period results divide annual amounts evenly; not actual CRA payroll withholding.
5. **Quebec abatement** — applied as 16.5% of net federal tax (approximation; technically applies to basic federal tax).

---

## Files changed

- `README.md` — accuracy model documentation
- `data/2026/federal.json` — CEA corrected to 1501
- `data/2026/provinces/NL.json` — BPA corrected to 13094, LITR data added
- `docs/DATA-VALIDATION-REPORT.md` — updated validation report
- `src/app/calculators/take-home-pay/page.tsx` — added payroll disclaimer
- `src/components/calculators/result-cards.tsx` — added annual vs payroll labels/disclaimers
- `src/engine/annual-tax.ts` — outputs `lowIncomeReduction` in provincial result
- `src/engine/payroll.ts` — fixed per-period net derivation from annual net
- `src/engine/provincial-tax.ts` — NL LITR calculation logic
- `src/engine/types.ts` — added `lowIncomeReduction` to types
- `tests/engine/audit.test.ts` — new 26-test audit suite (untracked)
- `tests/engine/nl-litr.test.ts` — NL LITR verification tests (untracked)

Changes are uncommitted. Ready for review and approval.