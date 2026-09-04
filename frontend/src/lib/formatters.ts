/**
 * Standardized Fintech Data & Currency Formatters (Indian Rupee / Lakhs / Crores)
 */

export function formatINR(amount: number): string {
  if (isNaN(amount) || amount === null || amount === undefined) return "₹0";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatCompactINR(amount: number): string {
  if (isNaN(amount) || amount === null || amount === undefined) return "₹0";
  if (amount >= 10000000) {
    const cr = amount / 10000000;
    return `₹${cr.toFixed(cr >= 10 ? 1 : 2)} Cr`;
  }
  if (amount >= 100000) {
    const lk = amount / 100000;
    return `₹${lk.toFixed(lk >= 10 ? 1 : 2)} Lakh`;
  }
  if (amount >= 1000) {
    const k = amount / 1000;
    return `₹${k.toFixed(1)}k`;
  }
  return formatINR(amount);
}

export function formatPercent(ratio: number, decimals: number = 1): string {
  if (isNaN(ratio) || ratio === null || ratio === undefined) return "0.0%";
  return `${(ratio * 100).toFixed(decimals)}%`;
}

export function formatMs(ms: number): string {
  if (isNaN(ms) || ms === null || ms === undefined) return "0 ms";
  if (ms >= 1000) {
    return `${(ms / 1000).toFixed(1)} s`;
  }
  return `${Math.round(ms)} ms`;
}

export function formatIndianNumber(num: number): string {
  if (isNaN(num) || num === null || num === undefined) return "0";
  return new Intl.NumberFormat("en-IN").format(num);
}
