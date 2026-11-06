/** Display-only formatting. Calculations never pass through these. */

/** Excel renders at ~15 significant digits; strip float noise (3.1249999999999996 -> 3.125) before rounding. */
const clean = (v: number) => Number(v.toPrecision(12));

export const fmtM = (v: number) => (Number.isFinite(v) ? `$${clean(v).toFixed(2)}m` : "n/a");
export const fmtMn = (v: number) => (Number.isFinite(v) ? clean(v).toFixed(2) : "n/a"); // no unit
export const fmtPct = (v: number) => (Number.isFinite(v) ? `${(clean(v) * 100).toFixed(1)}%` : "n/a");
export const fmtPct2 = (v: number) => (Number.isFinite(v) ? `${(clean(v) * 100).toFixed(2)}%` : "n/a");
export const fmtX = (v: number) => (Number.isFinite(v) ? `${clean(v).toFixed(2)}x` : "n/a");
