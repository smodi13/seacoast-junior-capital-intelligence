/**
 * Pure, deterministic port of Seacoast_NFS_Formula_Driven_Underwriting.xlsx
 * (sheets: Assumptions, Scenario Drivers, Base/Downside/Upside Case, Pricing Sensitivity).
 * No I/O, no randomness, no hardcoded outputs. Full precision internally; round only for display.
 * All values are $ millions unless noted; rates are decimals (0.11 = 11%).
 */

export const YEARS = 5;

export interface Assumptions {
  fy0Revenue: number; // Assumptions!B6
  fy0Margin: number; // B7
  daPct: number; // B8
  capexPct: number; // B9
  nwcPct: number; // B10
  taxRate: number; // B11
  openingCash: number; // B12
  seniorDebt: number; // B13
  seniorRate: number; // B14
  seniorAmort: number; // B15
  subDebt: number; // B16
  subCoupon: number; // B17
  pref: number; // B18
  prefCash: number; // B19
  prefPik: number; // B20
  warrant: number; // B21
  holdYears: number; // B22 (projection is fixed at 5 columns; used by required-warrant formula)
  useExpansion: number; // B23
  useNwc: number; // B24
  useQuality: number; // B25
  useFees: number; // B26
  minCash: number; // B27
  minFccr: number; // B28
  targetIrr: number; // B29 (analyst assumption, NOT a Seacoast disclosed hurdle)
  minRevenue: number; // B30 (published criterion)
  minEbitda: number; // B31
  maxLeverage: number; // B32
  minYield: number; // B33
}

export interface Scenario {
  growth: number[]; // 5 values, FY1..FY5
  margin: number[]; // 5 values, FY1..FY5
  exitMultiple: number;
}

export type ScenarioKey = "base" | "downside" | "upside";

/** Year-indexed arrays have length 6 (FY0..FY5); FY0 slot is NaN-free 0 where the workbook is blank. */
export interface CaseResult {
  revenueGrowth: number[];
  revenue: number[];
  margin: number[];
  ebitda: number[];
  da: number[];
  ebit: number[];
  capex: number[];
  nwc: number[];
  seniorOpen: number[];
  seniorInterest: number[];
  seniorAmort: number[];
  seniorClose: number[];
  subPrincipal: number[];
  subCoupon: number[];
  prefOpen: number[];
  prefPikAccretion: number[];
  prefClose: number[];
  prefCashDiv: number[];
  cashTaxes: number[];
  cashPreFixed: number[];
  fixedCharges: number[];
  seniorDebtService: number[];
  freeCash: number[];
  openCash: number[];
  closeCash: number[];
  fccr: number[];
  debtEquivFunding: number[];
  debtEquivLeverage: number[];
  investorYieldReceipts: number[];
  investorCashFlow: number[]; // length 6, index 0 = -invested
  exit: {
    enterpriseValue: number;
    closingCash: number;
    seniorClaim: number;
    subClaim: number;
    prefClaim: number;
    /** EV + cash - claims before the MAX(0, ...) floor. Negative => claims are not covered. */
    rawResidual: number;
    commonResidual: number;
    warrantProceeds: number;
    investorExitRepayment: number;
    claimsCovered: boolean;
  };
  irr: number;
  moic: number;
  minLiquidity: number;
  minFccr: number;
  initialLeverage: number;
  blendedYield: number;
  initialEbitda: number;
  fundingScreen: boolean;
  returnCoverageScreen: boolean;
  liquidityOk: boolean;
  coverageOk: boolean;
  returnOk: boolean;
}

export interface SourcesUses {
  invested: number;
  uses: number;
  difference: number;
  balanced: boolean;
  initialEbitda: number;
  leverage: number;
  blendedYield: number;
  thresholdPass: boolean;
}

export interface ValidationIssue {
  field: string;
  message: string;
}

export class InputError extends Error {
  issues: ValidationIssue[];
  constructor(issues: ValidationIssue[]) {
    super(issues.map((i) => `${i.field}: ${i.message}`).join("; "));
    this.name = "InputError";
    this.issues = issues;
  }
}

const EPS = 1e-9;

const NON_NEG: (keyof Assumptions)[] = [
  "fy0Revenue", "openingCash", "seniorDebt", "seniorAmort", "subDebt", "pref",
  "useExpansion", "useNwc", "useQuality", "useFees", "minCash", "minFccr",
  "minRevenue", "minEbitda", "maxLeverage",
];
const PCT: (keyof Assumptions)[] = [
  "fy0Margin", "daPct", "capexPct", "nwcPct", "taxRate", "seniorRate", "subCoupon",
  "prefCash", "prefPik", "warrant", "targetIrr", "minYield",
];

export function validate(a: Assumptions, scenarios: Scenario[] = []): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const num = (field: string, v: unknown) => {
    if (typeof v !== "number" || !Number.isFinite(v)) {
      issues.push({ field, message: "Enter a valid number." });
      return false;
    }
    return true;
  };
  for (const k of NON_NEG) if (num(k, a[k]) && a[k] < 0) issues.push({ field: k, message: "Must be zero or greater." });
  for (const k of PCT) if (num(k, a[k]) && (a[k] < 0 || a[k] > 1)) issues.push({ field: k, message: "Enter a percentage between 0% and 100%." });
  if (num("holdYears", a.holdYears) && a.holdYears <= 0) issues.push({ field: "holdYears", message: "Must be greater than zero." });
  scenarios.forEach((s, i) => {
    if (s.growth.length !== YEARS || s.margin.length !== YEARS) issues.push({ field: `scenario${i}`, message: `Requires ${YEARS} annual values.` });
    s.growth.forEach((g, y) => {
      // growth may be negative (revenue decline) but must stay above -100%
      if (num(`scenario${i}.growth${y + 1}`, g) && g <= -1) issues.push({ field: `scenario${i}.growth${y + 1}`, message: "Growth must be above -100%." });
    });
    s.margin.forEach((m, y) => {
      if (num(`scenario${i}.margin${y + 1}`, m) && (m < 0 || m > 1)) issues.push({ field: `scenario${i}.margin${y + 1}`, message: "Enter a margin between 0% and 100%." });
    });
    if (num(`scenario${i}.exitMultiple`, s.exitMultiple) && s.exitMultiple < 0) issues.push({ field: `scenario${i}.exitMultiple`, message: "Must be zero or greater." });
  });
  return issues;
}

/** Assumptions!B37:B43 linked closing checks. */
export function sourcesAndUses(a: Assumptions): SourcesUses {
  const invested = a.subDebt + a.pref;
  const uses = a.useExpansion + a.useNwc + a.useQuality + a.useFees;
  const difference = invested - uses;
  const initialEbitda = a.fy0Revenue * a.fy0Margin;
  const leverage = initialEbitda === 0 ? Infinity : (a.seniorDebt + a.subDebt + a.pref) / initialEbitda;
  const blendedYield = invested === 0 ? 0 : (a.subDebt * a.subCoupon + a.pref * a.prefCash) / invested;
  const balanced = Math.abs(difference) < EPS;
  const thresholdPass =
    a.fy0Revenue > a.minRevenue && initialEbitda > a.minEbitda && leverage <= a.maxLeverage &&
    blendedYield >= a.minYield && balanced;
  return { invested, uses, difference, balanced, initialEbitda, leverage, blendedYield, thresholdPass };
}

/** NPV helper for IRR. */
function npv(rate: number, flows: number[]): number {
  let s = 0;
  for (let t = 0; t < flows.length; t++) s += flows[t] / Math.pow(1 + rate, t);
  return s;
}

/**
 * Annual-period IRR. Bisection on a sign-change bracket: monotone for the
 * conventional (-, +, +, ...) investor profile, no divergence like Newton.
 * Mirrors the workbook's IFERROR(IRR(...), 0): returns 0 when no root exists.
 */
export function irr(flows: number[]): number {
  if (!flows.every(Number.isFinite)) return 0;
  let lo = -0.9999;
  let hi = 10;
  let fLo = npv(lo, flows);
  const fHi = npv(hi, flows);
  if (!Number.isFinite(fLo) || !Number.isFinite(fHi) || fLo * fHi > 0) return 0;
  for (let i = 0; i < 300; i++) {
    const mid = (lo + hi) / 2;
    const fMid = npv(mid, flows);
    if (fMid === 0) return mid;
    if (fLo * fMid < 0) hi = mid;
    else {
      lo = mid;
      fLo = fMid;
    }
    if (hi - lo < 1e-15) break;
  }
  return (lo + hi) / 2;
}

const zeros = () => new Array<number>(YEARS + 1).fill(0);

/** One scenario tab (Base/Downside/Upside Case). Throws InputError on invalid input. */
export function runCase(a: Assumptions, s: Scenario): CaseResult {
  const issues = validate(a, [s]);
  if (issues.length) throw new InputError(issues);

  const r = {
    revenueGrowth: zeros(), revenue: zeros(), margin: zeros(), ebitda: zeros(), da: zeros(), ebit: zeros(),
    capex: zeros(), nwc: zeros(), seniorOpen: zeros(), seniorInterest: zeros(), seniorAmort: zeros(),
    seniorClose: zeros(), subPrincipal: zeros(), subCoupon: zeros(), prefOpen: zeros(), prefPikAccretion: zeros(),
    prefClose: zeros(), prefCashDiv: zeros(), cashTaxes: zeros(), cashPreFixed: zeros(), fixedCharges: zeros(),
    seniorDebtService: zeros(), freeCash: zeros(), openCash: zeros(), closeCash: zeros(), fccr: zeros(),
    debtEquivFunding: zeros(), debtEquivLeverage: zeros(), investorYieldReceipts: zeros(), investorCashFlow: zeros(),
  };

  r.revenue[0] = a.fy0Revenue;
  r.margin[0] = a.fy0Margin;
  r.ebitda[0] = r.revenue[0] * r.margin[0];

  for (let t = 1; t <= YEARS; t++) {
    r.revenueGrowth[t] = s.growth[t - 1];
    r.revenue[t] = r.revenue[t - 1] * (1 + r.revenueGrowth[t]);
    r.margin[t] = s.margin[t - 1];
    r.ebitda[t] = r.revenue[t] * r.margin[t];
    r.da[t] = r.revenue[t] * a.daPct;
    r.ebit[t] = r.ebitda[t] - r.da[t];
    r.capex[t] = r.revenue[t] * a.capexPct;
    r.nwc[t] = Math.max(0, (r.revenue[t] - r.revenue[t - 1]) * a.nwcPct);

    r.seniorOpen[t] = t === 1 ? a.seniorDebt : r.seniorClose[t - 1];
    r.seniorInterest[t] = r.seniorOpen[t] * a.seniorRate;
    r.seniorAmort[t] = Math.min(r.seniorOpen[t], a.seniorAmort);
    r.seniorClose[t] = r.seniorOpen[t] - r.seniorAmort[t];
    r.subPrincipal[t] = a.subDebt;
    r.subCoupon[t] = r.subPrincipal[t] * a.subCoupon;

    r.prefOpen[t] = t === 1 ? a.pref : r.prefClose[t - 1];
    r.prefPikAccretion[t] = r.prefOpen[t] * a.prefPik;
    r.prefClose[t] = r.prefOpen[t] + r.prefPikAccretion[t];
    r.prefCashDiv[t] = a.pref * a.prefCash;

    // Taxable operating profit reflects deductible senior + sub interest (pref dividends are not deductible).
    r.cashTaxes[t] = Math.max(0, (r.ebit[t] - r.seniorInterest[t] - r.subCoupon[t]) * a.taxRate);
    r.cashPreFixed[t] = r.ebitda[t] - r.cashTaxes[t] - r.capex[t] - r.nwc[t];
    r.seniorDebtService[t] = r.seniorInterest[t] + r.seniorAmort[t];
    r.fixedCharges[t] = r.seniorInterest[t] + r.seniorAmort[t] + r.subCoupon[t] + r.prefCashDiv[t];
    r.freeCash[t] = r.cashPreFixed[t] - r.fixedCharges[t];
    r.openCash[t] = t === 1 ? a.openingCash : r.closeCash[t - 1];
    r.closeCash[t] = r.freeCash[t] + r.openCash[t];
    r.fccr[t] = r.fixedCharges[t] === 0 ? 0 : r.cashPreFixed[t] / r.fixedCharges[t]; // IFERROR(x/0,0)
    r.debtEquivFunding[t] = r.seniorClose[t] + r.subPrincipal[t] + r.prefClose[t];
    r.debtEquivLeverage[t] = r.ebitda[t] === 0 ? 0 : r.debtEquivFunding[t] / r.ebitda[t];
    r.investorYieldReceipts[t] = r.subCoupon[t] + r.prefCashDiv[t];
  }

  const T = YEARS;
  const invested = a.subDebt + a.pref;
  const enterpriseValue = r.ebitda[T] * s.exitMultiple;
  const claims = r.seniorClose[T] + r.subPrincipal[T] + r.prefClose[T];
  const rawResidual = enterpriseValue + r.closeCash[T] - claims;
  const commonResidual = Math.max(0, rawResidual);
  const warrantProceeds = commonResidual * a.warrant;
  const investorExitRepayment = r.subPrincipal[T] + r.prefClose[T] + warrantProceeds;

  r.investorCashFlow[0] = -invested;
  for (let t = 1; t < T; t++) r.investorCashFlow[t] = r.investorYieldReceipts[t];
  r.investorCashFlow[T] = investorExitRepayment + r.investorYieldReceipts[T];

  const flowsIrr = irr(r.investorCashFlow);
  const received = r.investorCashFlow.slice(1).reduce((x, y) => x + y, 0);
  const moic = invested === 0 ? 0 : received / invested;
  const minLiquidity = Math.min(...r.closeCash.slice(1));
  const minFccr = Math.min(...r.fccr.slice(1));
  const su = sourcesAndUses(a);
  const fundingScreen =
    a.fy0Revenue > a.minRevenue && r.ebitda[0] > a.minEbitda && su.leverage <= a.maxLeverage &&
    su.blendedYield >= a.minYield && su.balanced;
  const returnOk = flowsIrr >= a.targetIrr;
  const liquidityOk = minLiquidity >= a.minCash;
  const coverageOk = minFccr >= a.minFccr;

  return {
    ...r,
    exit: {
      enterpriseValue, closingCash: r.closeCash[T], seniorClaim: r.seniorClose[T], subClaim: r.subPrincipal[T],
      prefClaim: r.prefClose[T], rawResidual, commonResidual, warrantProceeds, investorExitRepayment,
      claimsCovered: rawResidual >= 0,
    },
    irr: flowsIrr, moic, minLiquidity, minFccr, initialLeverage: su.leverage, blendedYield: su.blendedYield,
    initialEbitda: r.ebitda[0], fundingScreen, liquidityOk, coverageOk, returnOk,
    returnCoverageScreen: returnOk && liquidityOk && coverageOk,
  };
}

export interface WarrantRow {
  warrant: number;
  warrantExit: number;
  moic: number;
  irr: number;
  hurdlePass: boolean;
  irrDeltaVsBase: number;
}

/** Pricing Sensitivity sheet rows: base operating case held constant, warrant varied. */
export function warrantSensitivity(a: Assumptions, base: CaseResult, fractions: number[]): WarrantRow[] {
  const T = YEARS;
  const invested = a.subDebt + a.pref;
  return fractions.map((w) => {
    const warrantExit = base.exit.commonResidual * w;
    const flows = base.investorCashFlow.slice();
    flows[T] = base.investorYieldReceipts[T] + base.subPrincipal[T] + base.prefClose[T] + warrantExit;
    const received = flows.slice(1).reduce((x, y) => x + y, 0);
    const i = irr(flows);
    return {
      warrant: w, warrantExit, moic: invested === 0 ? 0 : received / invested, irr: i,
      hurdlePass: i >= a.targetIrr, irrDeltaVsBase: i - base.irr,
    };
  });
}

/**
 * Pricing Sensitivity!B15 — warrant participation required to reach the analyst target IRR.
 * Uses the workbook's closed form (final-year cash yield treated as a level annuity).
 * Returns null when there is no common residual to participate in.
 */
export function requiredWarrant(a: Assumptions, base: CaseResult): number | null {
  const r = a.targetIrr;
  const n = a.holdYears;
  const invested = a.subDebt + a.pref;
  const annuity = r === 0 ? n : (1 - Math.pow(1 + r, -n)) / r;
  const cash = base.investorYieldReceipts[YEARS];
  const resid = base.exit.commonResidual;
  if (resid <= 0) return null;
  const need =
    (invested - cash * annuity) * Math.pow(1 + r, n) - base.subPrincipal[YEARS] - base.prefClose[YEARS];
  return Math.max(0, need / resid);
}

export function runAll(a: Assumptions, scenarios: Record<ScenarioKey, Scenario>): Record<ScenarioKey, CaseResult> {
  return {
    base: runCase(a, scenarios.base),
    downside: runCase(a, scenarios.downside),
    upside: runCase(a, scenarios.upside),
  };
}
