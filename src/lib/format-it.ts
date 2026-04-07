/**
 * Italian-style number formatting without relying on runtime locale data.
 * Node and browsers can disagree on `toLocaleString("it-IT")` (e.g. grouping),
 * which causes React hydration mismatches.
 */
export function formatItDecimal(n: number, fractionDigits = 2): string {
  if (!Number.isFinite(n)) return String(n);
  const sign = n < 0 || Object.is(n, -0) ? "-" : "";
  const abs = Math.abs(n);
  const [intRaw, frac = ""] = abs.toFixed(fractionDigits).split(".");
  const intPart = intRaw.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  const dec = frac.padEnd(fractionDigits, "0").slice(0, fractionDigits);
  return `${sign}${intPart},${dec}`;
}

/** Whole numbers with thousands separators (e.g. presenze). */
export function formatItInteger(n: number): string {
  if (!Number.isFinite(n)) return String(n);
  const sign = n < 0 || Object.is(n, -0) ? "-" : "";
  const abs = Math.round(Math.abs(n));
  const intPart = String(abs).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${sign}${intPart}`;
}
