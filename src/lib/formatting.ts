export function formatCurrency(value: number, options?: { decimals?: number }): string {
  const decimals = options?.decimals ?? 0;
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

export function formatPercent(value: number, decimals = 2): string {
  return `${(value * 100).toFixed(decimals)}%`;
}

export function formatFrequency(frequency: string): string {
  switch (frequency) {
    case "weekly": return "Weekly";
    case "biweekly": return "Bi-weekly";
    case "semiMonthly": return "Semi-monthly";
    case "monthly": return "Monthly";
    case "annual": return "Annual";
    default: return frequency;
  }
}
