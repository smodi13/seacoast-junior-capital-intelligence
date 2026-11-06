import { describe, it, expect } from "vitest";
import {
  InputError, irr, requiredWarrant, runAll, runCase, sourcesAndUses, validate, warrantSensitivity,
  type CaseResult, type ScenarioKey,
} from "./engine";
import { fmtM, fmtPct, fmtX } from "./format";
import { baselineAssumptions, baselineScenarios, CASE_NAME, H, WARRANT_GRID } from "./baseline";

const TOL = 1e-9;
const KEYS: ScenarioKey[] = ["base", "downside", "upside"];
const A = baselineAssumptions;
const S = baselineScenarios;

/** JSON operating_rows metric -> engine field. */
const ROW_MAP: Record<string, (r: CaseResult) => number[]> = {
  "Revenue growth %": (r) => r.revenueGrowth,
  "Revenue ($m)": (r) => r.revenue,
  "EBITDA margin %": (r) => r.margin,
  "EBITDA ($m)": (r) => r.ebitda,
  "Depreciation & amortization ($m)": (r) => r.da,
  "EBIT ($m)": (r) => r.ebit,
  "Recurring capex ($m)": (r) => r.capex,
  "Incremental net working capital ($m)": (r) => r.nwc,
  "Senior opening principal ($m)": (r) => r.seniorOpen,
  "Senior cash interest ($m)": (r) => r.seniorInterest,
  "Senior principal amortization ($m)": (r) => r.seniorAmort,
  "Senior closing principal ($m)": (r) => r.seniorClose,
  "Subordinated debt principal ($m)": (r) => r.subPrincipal,
  "Subordinated cash coupon ($m)": (r) => r.subCoupon,
  "Preferred opening claim ($m)": (r) => r.prefOpen,
  "Preferred PIK accretion ($m)": (r) => r.prefPikAccretion,
  "Preferred closing claim ($m)": (r) => r.prefClose,
  "Preferred cash dividend ($m)": (r) => r.prefCashDiv,
  "Cash taxes ($m)": (r) => r.cashTaxes,
  "Cash available pre-fixed charges ($m)": (r) => r.cashPreFixed,
  "Total senior/junior fixed cash charges ($m)": (r) => r.fixedCharges,
  "Annual free cash after charges ($m)": (r) => r.freeCash,
  "Opening cash ($m)": (r) => r.openCash,
  "Closing cash ($m)": (r) => r.closeCash,
  "Fixed charge coverage numerator ($m)": (r) => r.cashPreFixed,
  "Fixed charge coverage ratio (x)": (r) => r.fccr,
  "Debt-equivalent closing funding ($m)": (r) => r.debtEquivFunding,
  "Debt-equivalent leverage (x)": (r) => r.debtEquivLeverage,
  "Current cash yield receipts ($m)": (r) => r.investorYieldReceipts,
  "Investor cash flow ($m)": (r) => r.investorCashFlow,
};
/** Scalar rows live in the FY5 column. */
const SCALAR_MAP: Record<string, (r: CaseResult) => number> = {
  "Exit enterprise value ($m)": (r) => r.exit.enterpriseValue,
  "Common equity residual ($m)": (r) => r.exit.commonResidual,
  "Warrant proceeds to junior investor ($m)": (r) => r.exit.warrantProceeds,
  "Investor debt + preferred exit repayment ($m)": (r) => r.exit.investorExitRepayment,
  "Five-year gross investor IRR": (r) => r.irr,
  "Investor gross MOIC (x)": (r) => r.moic,
  "Minimum closing liquidity ($m)": (r) => r.minLiquidity,
  "Minimum annual FCCR (x)": (r) => r.minFccr,
  "Initial debt-equivalent PF leverage (x)": (r) => r.initialLeverage,
  "Blended current investor yield": (r) => r.blendedYield,
  "Illustrative initial EBITDA ($m)": (r) => r.initialEbitda,
};

describe("reconciliation to frozen workbook outputs (JSON fixture)", () => {
  const results = runAll(A(), S());
  for (const k of KEYS) {
    const json = H.scenario_cases[CASE_NAME[k]];
    describe(CASE_NAME[k], () => {
      it("every operating row matches within tolerance", () => {
        const covered = new Set<string>();
        for (const row of json.operating_rows) {
          const vals = row.values as (number | string | null)[];
          if (ROW_MAP[row.metric]) {
            covered.add(row.metric);
            const got = ROW_MAP[row.metric](results[k]);
            vals.forEach((v, i) => {
              if (v === null) return; // workbook blank (FY0 for flow rows)
              expect(got[i], `${row.metric} FY${i}`).toBeCloseTo(v as number, 9);
            });
          } else if (SCALAR_MAP[row.metric]) {
            covered.add(row.metric);
            expect(SCALAR_MAP[row.metric](results[k]), row.metric).toBeCloseTo(vals[5] as number, 9);
          }
        }
        // Only the two text screens are intentionally outside the numeric map.
        const uncovered = json.operating_rows.map((r) => r.metric).filter((m) => !covered.has(m));
        expect(uncovered.sort()).toEqual(["Illustrative funding screen", "Illustrative return/coverage screen"]);
      });

      it("headline stats equal JSON", () => {
        // IRR: workbook IRR() is iterative (~1e-8..1e-10); our bisection root agrees to 9 d.p.
        expect(results[k].irr).toBeCloseTo(json.investor_irr, 9);
        expect(results[k].moic).toBeCloseTo(json.gross_moic, 10);
        expect(results[k].minFccr).toBeCloseTo(json.min_fccr, 10);
        expect(results[k].minLiquidity).toBeCloseTo(json.min_cash, 10);
      });

      it("text screens equal workbook outputs", () => {
        const text = (m: string) => json.operating_rows.find((r) => r.metric === m)!.values[5];
        expect(results[k].fundingScreen ? "SCREEN PASS*" : "SCREEN FAIL*").toBe(text("Illustrative funding screen"));
        expect(results[k].returnCoverageScreen ? "RETURN/COVERAGE PASS" : "RETURN/COVERAGE FAIL").toBe(
          text("Illustrative return/coverage screen"),
        );
      });
    });
  }

  it("published reference values: IRR 13.8/12.0/15.1%, yield 10.0%, leverage ~3.13x", () => {
    expect(results.base.irr).toBeCloseTo(0.138, 3);
    expect(results.downside.irr).toBeCloseTo(0.12, 2);
    expect(results.upside.irr).toBeCloseTo(0.151, 3);
    expect(results.base.blendedYield).toBeCloseTo(0.1, 12);
    expect(results.base.initialLeverage).toBeCloseTo(3.125, 12);
    expect(fmtX(results.base.initialLeverage)).toBe("3.13x"); // matches PDFs; raw toFixed would give 3.12
  });

  it("scenario exit multiples reproduce the JSON exit EV (cross-check of workbook cells)", () => {
    for (const k of KEYS) {
      const ev = H.scenario_cases[CASE_NAME[k]].operating_rows.find((r) => r.metric === "Exit enterprise value ($m)")!.values[5] as number;
      expect(results[k].exit.enterpriseValue).toBeCloseTo(ev, 9);
    }
  });

  it("all three cases FAIL the analyst return/coverage screen (conclusion preserved)", () => {
    for (const k of KEYS) expect(results[k].returnCoverageScreen).toBe(false);
    expect(results.downside.coverageOk).toBe(false);
    expect(results.base.returnOk).toBe(false);
  });
});

describe("pricing sensitivity", () => {
  const a = A();
  const base = runCase(a, S().base);
  it("matches warrant grid rows", () => {
    const rows = warrantSensitivity(a, base, WARRANT_GRID);
    expect(rows).toHaveLength(H.warrant_pricing_sensitivity.length);
    rows.forEach((r, i) => {
      const j = H.warrant_pricing_sensitivity[i];
      expect(r.warrantExit).toBeCloseTo(j.warrant_exit_m, 9);
      expect(r.moic).toBeCloseTo(j.moic, 9);
      expect(r.irr).toBeCloseTo(j.irr, 9);
      expect(r.hurdlePass ? "HURDLE PASS" : "BELOW HURDLE").toBe(j.test);
    });
  });
  it("required warrant participation matches workbook closed form", () => {
    expect(requiredWarrant(a, base)).toBeCloseTo(H.minimum_base_case_warrant_for_assumed_16_pct_IRR, 9);
  });
  it("required warrant, plugged back into the model, reaches approximately the target IRR", () => {
    const w = requiredWarrant(a, base)!;
    // closed form treats final-year yield as annuity; yields are level here so it is exact
    const r = runCase({ ...a, warrant: w }, S().base);
    expect(r.irr).toBeCloseTo(a.targetIrr, 8);
  });
  it("returns null when no residual equity exists", () => {
    const r = runCase(a, { ...S().base, exitMultiple: 0 });
    expect(requiredWarrant(a, r)).toBeNull();
  });
});

describe("irr()", () => {
  it("simple known case", () => expect(irr([-100, 110])).toBeCloseTo(0.1, 12));
  it("multi-period known case", () => expect(irr([-1000, 0, 0, 1331])).toBeCloseTo(0.1, 12));
  it("negative IRR", () => expect(irr([-100, 50])).toBeCloseTo(-0.5, 12));
  it("no sign change returns 0 like IFERROR(IRR(),0)", () => expect(irr([-100, -5])).toBe(0));
  it("non-finite input returns 0", () => expect(irr([-100, NaN])).toBe(0));
});

describe("edge cases", () => {
  it("zero revenue growth: flat revenue, no NWC drag, still solvent", () => {
    const s = { ...S().base, growth: [0, 0, 0, 0, 0] };
    const r = runCase(A(), s);
    r.revenue.forEach((v) => expect(v).toBe(32));
    r.nwc.forEach((v) => expect(v).toBe(0));
  });
  it("revenue contraction: NWC never releases cash (MAX(0, ...))", () => {
    const r = runCase(A(), { ...S().base, growth: [-0.1, -0.1, -0.1, -0.1, -0.1] });
    r.nwc.forEach((v) => expect(v).toBe(0));
    expect(r.revenue[5]).toBeCloseTo(32 * 0.9 ** 5, 12);
  });
  it("EBITDA decline: lower coverage, taxes floor at zero", () => {
    const r = runCase(A(), { ...S().base, margin: [0.03, 0.03, 0.03, 0.03, 0.03] });
    r.cashTaxes.slice(1).forEach((v) => expect(v).toBe(0));
    expect(r.minFccr).toBeLessThan(1);
    expect(r.coverageOk).toBe(false);
  });
  it("insufficient cash: closing cash goes negative and liquidity test fails", () => {
    const r = runCase(A(), { ...S().base, margin: [0.03, 0.03, 0.03, 0.03, 0.03], growth: [0, 0, 0, 0, 0] });
    expect(r.minLiquidity).toBeLessThan(0);
    expect(r.liquidityOk).toBe(false);
    expect(r.returnCoverageScreen).toBe(false);
  });
  it("negative residual common equity: floored at zero, warrant worthless, flagged uncovered", () => {
    const r = runCase(A(), { ...S().downside, exitMultiple: 0.5 });
    expect(r.exit.rawResidual).toBeLessThan(0);
    expect(r.exit.commonResidual).toBe(0);
    expect(r.exit.warrantProceeds).toBe(0);
    expect(r.exit.claimsCovered).toBe(false);
  });
  it("senior debt fully amortized and capped at outstanding principal", () => {
    const r = runCase({ ...A(), seniorAmort: 3 }, S().base);
    expect(r.seniorClose.slice(1)).toEqual([2, 0, 0, 0, 0]);
    expect(r.seniorAmort.slice(1)).toEqual([3, 2, 0, 0, 0]);
    expect(r.seniorInterest[3]).toBe(0);
  });
  it("zero warrant participation equals first grid row", () => {
    const r = runCase({ ...A(), warrant: 0 }, S().base);
    expect(r.exit.warrantProceeds).toBe(0);
    expect(r.irr).toBeCloseTo(H.warrant_pricing_sensitivity[0].irr, 9);
    expect(r.moic).toBeCloseTo(H.warrant_pricing_sensitivity[0].moic, 9);
  });
  it("higher preferred PIK accretes a larger claim, raises investor return, shrinks residual", () => {
    const base = runCase(A(), S().base);
    const r = runCase({ ...A(), prefPik: 0.08 }, S().base);
    expect(r.prefClose[5]).toBeCloseTo(4 * 1.08 ** 5, 12);
    expect(r.irr).toBeGreaterThan(base.irr);
    expect(r.exit.commonResidual).toBeLessThan(base.exit.commonResidual);
    expect(r.cashTaxes).toEqual(base.cashTaxes); // PIK is non-cash, non-deductible here
  });
  it("interest rate changes flow through yield, taxes, coverage and IRR", () => {
    const base = runCase(A(), S().base);
    const s = runCase({ ...A(), seniorRate: 0.1 }, S().base);
    expect(s.seniorInterest[1]).toBeCloseTo(0.5, 12);
    expect(s.minFccr).toBeLessThan(base.minFccr);
    const j = runCase({ ...A(), subCoupon: 0.13 }, S().base);
    expect(j.blendedYield).toBeCloseTo((8 * 0.13 + 4 * 0.08) / 12, 12);
    expect(j.irr).toBeGreaterThan(base.irr);
    expect(j.minFccr).toBeLessThan(base.minFccr); // better for investor, worse for credit
    expect(j.cashTaxes[1]).toBeLessThan(base.cashTaxes[1]); // deductible interest shield
  });
  it("downside covenant failure: FCCR below 1.20x analyst test", () => {
    const r = runCase(A(), S().downside);
    expect(r.minFccr).toBeLessThan(1.2);
    expect(r.coverageOk).toBe(false);
    expect(r.liquidityOk).toBe(true);
  });
  it("sources and uses balance and detect imbalance", () => {
    const su = sourcesAndUses(A());
    expect(su.invested).toBe(12);
    expect(su.uses).toBe(12);
    expect(su.balanced).toBe(true);
    expect(su.thresholdPass).toBe(true);
    const off = sourcesAndUses({ ...A(), subDebt: 9 });
    expect(off.balanced).toBe(false);
    expect(off.thresholdPass).toBe(false);
    expect(runCase({ ...A(), subDebt: 9 }, S().base).fundingScreen).toBe(false);
  });
  it("invalid numeric input is rejected with field-level messages", () => {
    expect(() => runCase({ ...A(), subDebt: NaN }, S().base)).toThrow(InputError);
    expect(() => runCase({ ...A(), subDebt: -1 }, S().base)).toThrow(/subDebt/);
    expect(() => runCase({ ...A(), warrant: 1.5 }, S().base)).toThrow(/warrant/);
    expect(() => runCase({ ...A(), taxRate: -0.1 }, S().base)).toThrow(/taxRate/);
    expect(() => runCase(A(), { ...S().base, growth: [0, 0, 0, 0] })).toThrow(InputError);
    expect(() => runCase(A(), { ...S().base, growth: [-1, 0, 0, 0, 0] })).toThrow(InputError);
    expect(() => runCase(A(), { ...S().base, exitMultiple: Infinity })).toThrow(InputError);
    const issues = validate({ ...A(), pref: -4, prefCash: 2 });
    expect(issues.map((i) => i.field).sort()).toEqual(["pref", "prefCash"]);
  });
  it("zero invested capital is allowed but yields zero MOIC rather than NaN", () => {
    const r = runCase({ ...A(), subDebt: 0, pref: 0 }, S().base);
    expect(Number.isFinite(r.moic)).toBe(true);
    expect(r.moic).toBe(0);
  });
  it("reset to baseline: fresh baseline is independent of mutated copies", () => {
    const edited = A();
    edited.warrant = 0.2;
    const edScn = S();
    edScn.base.growth[0] = 0.5;
    const reset = runAll(A(), S());
    expect(reset.base.irr).toBeCloseTo(H.scenario_cases["Base Case"].investor_irr, 9);
    expect(A().warrant).toBe(0.05);
    expect(S().base.growth[0]).toBe(0.06);
  });
  it("engine is deterministic and pure (no input mutation)", () => {
    const a = A(), s = S();
    const a0 = JSON.stringify(a), s0 = JSON.stringify(s);
    const x = runCase(a, s.base), y = runCase(a, s.base);
    expect(x).toEqual(y);
    expect(JSON.stringify(a)).toBe(a0);
    expect(JSON.stringify(s)).toBe(s0);
  });
  it("investor cash flows reconcile to exit waterfall", () => {
    for (const k of KEYS) {
      const r = runAll(A(), S())[k];
      const received = r.investorCashFlow.slice(1).reduce((x, y) => x + y, 0);
      expect(received).toBeCloseTo(r.investorYieldReceipts.slice(1).reduce((x, y) => x + y, 0) + r.exit.investorExitRepayment, 12);
      expect(r.exit.investorExitRepayment).toBeCloseTo(8 + r.prefClose[5] + r.exit.warrantProceeds, 12);
    }
  });
  it("tolerance constant sanity", () => expect(TOL).toBeLessThan(1e-6));
});

describe("display formatting", () => {
  it("rounds for display only, with Excel-like float cleaning", () => {
    expect(fmtX(3.1249999999999996)).toBe("3.13x");
    expect(fmtX(1.408745098039216)).toBe("1.41x");
    expect(fmtM(3.0423)).toBe("$3.04m");
    expect(fmtPct(0.13835274911)).toBe("13.8%");
    expect(fmtPct(0.09999999999999999)).toBe("10.0%");
    expect(fmtPct(NaN)).toBe("n/a");
  });
});
