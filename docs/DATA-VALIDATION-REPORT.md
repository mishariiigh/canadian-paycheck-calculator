# 2026 Tax Data Validation Report

**Report date:** 2026-11-24
**Scope:** all parameters used by the calculation engine for tax year 2026
**Verification method:** each value was checked against a Canada.ca / provincial
government source, or (where the government page does not publish a single
consolidated table) against [TaxTips.ca](https://www.taxtips.ca/tax-rates.htm)
tables explicitly marked as **confirmed to CRA information** for 2026.

## Federal (data/2026/federal.json)

| Parameter | Value | Status | Source |
|---|---|---|---|
| Bracket 1 | ≤ $58,523 @ 14.00% | ✅ verified | [CRA tax rates & brackets](https://www.canada.ca/en/revenue-agency/services/tax/individuals/frequently-asked-questions-individuals/canadian-income-tax-rates-individuals-current-previous-years.html); [TaxTips.ca (CRA-confirmed)](https://www.taxtips.ca/taxrates/canada.htm) |
| Bracket 2 | $58,523–$117,045 @ 20.50% | ✅ verified | same |
| Bracket 3 | $117,045–$181,440 @ 26.00% | ✅ verified | same |
| Bracket 4 | $181,440–$258,482 @ 29.29% effective (29% + BPA phase-out) | ✅ verified (bracket rate 29%) | same |
| Bracket 5 | > $258,482 @ 33.00% | ✅ verified | same |
| Basic personal amount (max) | $16,452 (net income ≤ $181,440) | ✅ verified | CTV News (CRA-confirmed figures); TaxTips.ca |
| Basic personal amount (min) | $14,829 (net income ≥ $258,482) | ✅ verified | same |
| BPA phase-out | straight line $181,440 → $258,482 | ✅ verified | TaxTips.ca / CRA |
| Lowest rate | 14% full-year 2026 (rate reduced from 15% effective July 1, 2025) | ✅ verified | canada.ca "Change in individual income tax rate" |
| Canada employment amount | $1,561 | ⚠️ unverified for 2026 | 2025 value was $1,430; indexed value **not confirmed**. Update before production use. |
| Indexation factor | 1.02 | ✅ verified | TaxTips.ca (CRA-confirmed) |

## Payroll (data/2026/payroll.json)

| Parameter | Value | Status | Source |
|---|---|---|---|
| CPP rate | 5.95% | ✅ verified | [CRA CPP rates & maximums](https://www.canada.ca/en/revenue-agency/services/tax/businesses/topics/payroll/payroll-deductions-contributions/canada-pension-plan-cpp/cpp-contribution-rates-maximums-exemptions.html) |
| CPP YMPE | $74,600 | ✅ verified | same |
| CPP basic exemption | $3,500 | ✅ verified | same |
| CPP max employee | $4,230.45 | ✅ verified | same |
| CPP2 rate | 4.00% | ✅ verified | [CRA CPP2 rates](https://www.canada.ca/en/revenue-agency/services/tax/businesses/topics/payroll/calculating-deductions/making-deductions/second-additional-cpp-contribution-rates-maximums.html) |
| CPP2 YAMPE | $85,000 | ✅ verified | same + [CPP enhancement page](https://www.canada.ca/en/revenue-agency/services/tax/businesses/topics/payroll/payroll-deductions-contributions/canada-pension-plan-cpp/cpp-enhancement.html) |
| CPP2 max employee | $416.00 | ✅ verified | same |
| EI rate (outside QC) | 1.63% | ✅ verified | [CRA EI rates](https://www.canada.ca/en/revenue-agency/services/tax/businesses/topics/payroll/payroll-deductions-contributions/employment-insurance-ei/ei-premium-rates-maximums.html); [ESDC news release](https://www.canada.ca/en/employment-social-development/news/2025/09/canada-employment-insurance-commission-sets-the-2026-employment-insurance-premium-rate.html) |
| EI MIE | $68,900 | ✅ verified | same |
| EI max employee | $1,123.07 | ✅ verified | same |
| EI rate (Quebec) | 1.30% | ✅ verified | same |
| EI max (Quebec) | $895.70 | ✅ verified | same |
| QPP employee base+1st add. | 5.3% + 1% = 6.3%, max $3,768 + $711 = $4,479 | ✅ verified | [Retraite Québec QPP figures 2026](https://www.retraitequebec.gouv.qc.ca/en/programs/quebec-pension-plan/quebec-pension-plan-figures) |
| QPP2 | 4%, max $416 (YAMPE $85,000) | ✅ verified | same |
| QPIP employee | 0.430%, MIE $103,000, max $442.90 | ✅ verified | [Revenu Québec QPIP 2026](https://www.revenuquebec.ca/en/businesses/source-deductions-and-employer-contributions/calculating-source-deductions-and-contributions/qpip-premiums/maximum-insurable-earnings-and-premium-rate/) |

## Provinces & territories (data/2026/provinces/*.json)

All provincial tables come from TaxTips.ca pages marked *"confirmed to Canada
Revenue Agency information"* for 2026, cross-checked where possible against
provincial budget documents. Effective 2026-01-01 unless noted.

| Province | Brackets | BPA | Special features | Status |
|---|---|---|---|---|
| ON | $53,891/5.05, $107,785/9.15, $150,000/11.16, $220,000/12.16, >13.16 | $12,989 @ 5.05% | Surtax 20% over $5,818 + 36% over $7,446; health premium $0–$900 | ✅ verified ([ON taxtips](https://www.taxtips.ca/taxrates/on.htm), [ontario.ca health premium](https://www.ontario.ca/page/health-premium)) |
| AB | $61,200/8, $154,259/10, $185,111/12, $246,813/13, $370,220/14, >15 | $22,769 @ 8% | Indexation capped 2% (Bill 32) | ✅ verified |
| BC | $50,363/5.60, $100,728/7.7, $115,648/10.5, $140,430/12.29, $190,405/14.7, $265,545/16.8, >20.5 | $13,216 @ 5.6% | Lowest rate raised 5.06→5.60% for 2026 (BC 2026 Budget); no 2026 indexation | ✅ verified ([BC gov](https://www2.gov.bc.ca/gov/content/taxes/income-taxes/personal/tax-rates), TaxTips) |
| MB | $47,000/10.8, $100,000/12.75, >17.4 | $15,780 @ 10.8% | Indexation frozen at 2024 levels | ✅ verified |
| NB | $52,333/9.4, $104,666/14, $193,861/16, >19.5 | $13,664 @ 9.4% | Federal indexation factor | ✅ verified |
| NL | 8 brackets 8.7–21.8 | $15,000 @ 8.7% | NL 2026 Budget raised BPA to $15,000 | ✅ verified ([NL Budget 2026](https://www.gov.nl.ca/budget/2026/what-you-need-to-know/budget-highlights/), TaxTips) |
| NS | $30,995/8.79, $61,991/14.95, $97,417/16.67, $157,124/17.5, >21 | $11,932 @ 8.79% | NS-specific indexation (1.016) | ✅ verified |
| NT | $53,003/5.9, $106,009/8.6, $172,346/12.2, >14.05 | $18,198 @ 5.9% | 2% employee payroll tax | ✅ verified ([EY/NT Budget 2026](https://globaltaxnews.ey.com/news/2026-0390-canada-northwest-territories-budget-2026-discussed), [GNWT payroll tax](https://www.fin.gov.nt.ca/en/services/licences-taxes-et-droits/payroll-tax-employees)) |
| NU | $55,801/4, $111,602/7, $181,439/9, >11.5 | $19,659 @ 4% | 2% employee payroll tax | ✅ verified ([EY/NU Budget 2026](https://taxnews.ey.com/news/2026-1151-canada-nunavut-budget-2026), TaxTips) |
| PE | $33,928/9.5, $65,820/13.47, $106,890/16.6, $142,520/17.62, $200,000/19, >20 | $15,000 @ 9.5% | New 20% top bracket effective Jan 1, 2026; no indexation | ✅ verified (TaxTips; BDO 2026 rates) |
| QC | $54,345/14, $108,680/19, $132,245/24, >25.75 | $18,952 @ 14% | 16.5% federal abatement; QPP/QPIP | ✅ verified ([Revenu Québec](https://www.revenuquebec.ca/en/citizens/income-tax-return/completing-your-income-tax-return/income-tax-rates/), TaxTips) |
| SK | $54,532/10.5, $155,805/12.5, >14.5 | $20,381 @ 10.5% | Federal indexation factor | ✅ verified |
| YT | $58,523/6.4, $117,045/9, $181,440/10.9, $500,000/12.8, >15 | $16,452 @ 6.4% | Mirrors federal BPA structure | ✅ verified ([EY/YT Budget 2026](https://taxnews.ey.com/news/2026-0700-canada-yukon-budget-2026), TaxTips) |

## Known simplifications (not errors, but scope limits)

1. **Credit model is simplified.** Only the basic personal amount, Canada
   employment amount, and CPP/EI credits are modelled. Age amount, spouse
   amount, disability, tuition, charitable donations, etc. are out of scope.
2. **No alternative minimum tax (AMT)** is modelled.
3. **NL low-income tax reduction** (no provincial tax ≤ $22,774; 16% clawback
   to $30,491 per NL Budget 2026) is **not** modelled — flagged as a gap.
4. **Ontario LIFT credit** is not modelled.
5. **Per-period results** divide annual amounts evenly; they do not reproduce
   CRA's exact per-period payroll formulas (T4127), which include proration and
   cumulative averaging.
6. **Canada employment amount for 2026 ($1,561)** is unverified — recheck when
   CRA publishes the 2026 non-refundable credit amounts.

## Re-verification checklist for next tax year

- [ ] Create `data/<year>/` directory; never modify previous years.
- [ ] Update federal brackets/BPA from CRA indexation announcement (~Nov/Dec).
- [ ] Update CPP/CPP2/EI from CRA pages (~Oct–Nov announcements).
- [ ] Update each province after its budget.
- [ ] Run `npm test` — fixture tests assert specific bracket boundaries and will fail if data changes silently.
- [ ] Update this report with new source URLs and verification date.
