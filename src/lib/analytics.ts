/**
 * Privacy-conscious event tracking via the existing GTM container.
 *
 * GTM auto-tracks GA4 events for dataLayer pushes that include an `event`
 * key (GA4 custom events). The existing GTM id is loaded once in the root
 * layout — this module never creates a second tag.
 *
 * PRIVACY RULE: never pass salary values, employer names, financial amounts,
 * tax details or any personal identifiers into these events. Only
 * non-sensitive interaction metadata (counts, indices, feature names) is
 * allowed. Enforced at runtime by buildEventPayload.
 */

const ALLOWED_KEYS = new Set(["offer_count", "offer_index", "metric", "format", "feature", "reason", "result"]);

export const JOB_COMPARISON_EVENTS = [
  "job_comparison_started",
  "job_offer_added",
  "job_offer_removed",
  "job_comparison_completed",
  "job_comparison_reset",
  "comparison_report_downloaded",
  "comparison_summary_copied",
] as const;

/** Testable sanitizer: keeps only allow-listed, non-sensitive keys. */
export function validateOfferPayload(params?: Record<string, unknown>): Record<string, unknown> | undefined {
  if (!params) return undefined;
  const safe: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(params)) {
    if (!ALLOWED_KEYS.has(key)) continue;
    if (typeof value === "number" || typeof value === "boolean") safe[key] = value;
    else if (typeof value === "string" && value.length <= 64 && !/\d{4,}|\d{1,3},\d{3}/.test(value)) safe[key] = value;
  }
  return Object.keys(safe).length > 0 ? safe : undefined;
}

export function trackEvent(event: string, params?: Record<string, unknown>): void {
  if (typeof window === "undefined") return;
  const w = window as typeof window & { dataLayer?: unknown[] };
  // GTM creates window.dataLayer when its script loads; create the array if it
  // has not loaded yet so events queue up and are consumed when GTM arrives.
  if (!Array.isArray(w.dataLayer)) w.dataLayer = [];
  w.dataLayer.push({ event, ...validateOfferPayload(params) });
}
