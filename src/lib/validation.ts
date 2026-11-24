export function validateSalary(value: unknown): number | null {
  const n = typeof value === "string" ? Number(value.replace(/[^0-9.-]/g, "")) : value;
  if (typeof n !== "number" || !Number.isFinite(n)) return null;
  if (n < 0 || n > 10_000_000) return null;
  return Math.round(n * 100) / 100;
}

export function validateHoursPerWeek(value: unknown): number | null {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0 || n > 100) return null;
  return n;
}

export function slugToSalary(slug: string): number | null {
  const m = slug.match(/^(\d+(?:[-_]\d+)*)$/);
  if (!m) return null;
  const value = Number(m[1].replace(/[-_]/g, ""));
  return validateSalary(value);
}
