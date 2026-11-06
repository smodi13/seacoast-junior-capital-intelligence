"use client";
import { useMemo, useState } from "react";
import { Body, Card, DataTable, NumField, PageTitle, Pill, ScenarioTabs } from "@/components/ui";
import { PALETTE, SensitivityLine, SeriesChart } from "@/components/charts";
import { AnimatedNumber } from "@/components/motion";
import { fmtM, fmtMn, fmtPct, fmtPct2, fmtX } from "@/lib/format";
import { REF, REF_A, REF_S, SCN_LABEL } from "@/lib/reference";
import { WARRANT_GRID } from "@/lib/baseline";
import { requiredWarrant, runAll, validate, warrantSensitivity, type Assumptions, type Scenario, type ScenarioKey } from "@/lib/engine";

interface Lab { warrant: number; subCoupon: number; prefCash: number; prefPik: number; growthShift: number; marginShift: number; exitMultiple: number }
const INIT: Lab = { warrant: REF_A.warrant, subCoupon: REF_A.subCoupon, prefCash: REF_A.prefCash, prefPik: REF_A.prefPik, growthShift: 0, marginShift: 0, exitMultiple: REF_S.base.exitMultiple };

function verdict(dIrr: number, dFccr: number): string {
  const eps = 1e-9;
  if (Math.abs(dIrr) < eps && Math.abs(dFccr) < eps) return "No change from the reference terms.";
  if (dIrr > eps && Math.abs(dFccr) < eps) return "Investor-only improvement: IRR rises but the company's coverage and liquidity are unchanged. Extra equity upside does not fix downside debt service.";
  if (dIrr > eps && dFccr < -eps) return "Trade-off: investor return improves while the company's coverage worsens (more cash cost to the borrower).";
  if (dIrr > eps && dFccr > eps) return "Both improve: operating assumptions are doing the work, not pricing alone.";
  if (dIrr < -eps && dFccr > eps) return "Credit improves at the cost of investor return.";
  return "Both investor return and credit profile weaken.";
}

const Delta = ({ v, f, goodUp = true }: { v: number; f: (x: number) => string; goodUp?: boolean }) =>
  Math.abs(v) < 1e-9 ? <span className="text-muted">unchanged</span> : (
    <span className={(v > 0) === goodUp ? "text-pos" : "text-bad"}>{v > 0 ? "▲ " : "▼ "}{f(Math.abs(v))}</span>
  );

/** Validated numeric input + slider bound to the same value. */
function Lever({ label, kind, value, onChange, error, hint, min, max, step }: {
  label: string; kind: "pct" | "x"; value: number; onChange: (v: number) => void; error?: string; hint?: string; min: number; max: number; step: number;
}) {
  const shown = kind === "pct" ? value * 100 : value;
  return (
    <div className="border-b border-rule pb-4">
      <NumField label={label} kind={kind} value={value} onChange={onChange} error={error} hint={hint} />
      <input type="range" aria-label={`Slider: ${label}`} min={min} max={max} step={step} value={Number.isFinite(shown) ? Math.min(max, Math.max(min, shown)) : 0}
        onChange={(e) => onChange(kind === "pct" ? Number(e.target.value) / 100 : Number(e.target.value))} className="mt-2 h-1 w-full cursor-pointer accent-[#1f6a63]" />
    </div>
  );
}

export default function Pricing() {
  const [lab, setLab] = useState<Lab>(INIT);
  const [k, setK] = useState<ScenarioKey>("base");
  const set = (p: Partial<Lab>) => setLab((l) => ({ ...l, ...p }));
  const idx = ["base", "downside", "upside"].indexOf(k);

  const { a, issues, res } = useMemo(() => {
    const a: Assumptions = { ...REF_A, warrant: lab.warrant, subCoupon: lab.subCoupon, prefCash: lab.prefCash, prefPik: lab.prefPik };
    const mk = (s: Scenario, exit?: number): Scenario => ({
      growth: s.growth.map((g) => g + lab.growthShift), margin: s.margin.map((m) => m + lab.marginShift), exitMultiple: exit ?? s.exitMultiple,
    });
    // the exit-multiple lever drives the selected scenario; others keep their reference multiple
    const scn = { base: mk(REF_S.base), downside: mk(REF_S.downside), upside: mk(REF_S.upside) };
    scn[k] = mk(REF_S[k], lab.exitMultiple);
    const issues = validate(a, [scn.base, scn.downside, scn.upside]);
    return { a, issues, res: issues.length ? null : runAll(a, scn) };
  }, [lab, k]);

  const changeScenario = (nk: ScenarioKey) => { setK(nk); set({ exitMultiple: REF_S[nk].exitMultiple }); };
  const bad = (f: string) => issues.find((i) => i.field === f)?.message;
  const shiftErr = issues.find((i) => i.field.startsWith("scenario") && !i.field.endsWith("exitMultiple"))
    ? "Resulting growth or margin is out of range (margin 0-100%, growth above -100%)." : undefined;
  const reset = () => setLab({ ...INIT, exitMultiple: REF_S[k].exitMultiple });
  const dirty = JSON.stringify(lab) !== JSON.stringify({ ...INIT, exitMultiple: REF_S[k].exitMultiple });

  const r = res?.[k];
  const ref = REF[k];
  const sens = useMemo(() => (r ? warrantSensitivity(a, r, WARRANT_GRID) : []), [a, r]);
  const req = r ? requiredWarrant(a, r) : null;
  const refReq = requiredWarrant(REF_A, REF[k]);
  const yrs = [1, 2, 3, 4, 5];

  return (
    <>
      <PageTitle kicker="Module 6 | Pricing sensitivity" title="Pricing lab">
        Reprice the illustrative terms and operating assumptions. The lab always starts from the reference model and never changes the research files or the Excel workbook. The target return is an <strong>analyst assumption ({fmtPct(REF_A.targetIrr)}), not Seacoast&apos;s disclosed hurdle</strong>.
      </PageTitle>
      <Body>
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <ScenarioTabs value={k} onChange={changeScenario} className="" />
          <div className="flex items-center gap-3">
            {dirty && <Pill tone="warn">Lab edited</Pill>}
            <button type="button" onClick={reset} className="btn btn-solid !px-4 !py-2 font-mono text-xs uppercase tracking-widest">Reset to reference case</button>
          </div>
        </div>
        <p className="mb-8 text-xs text-muted">Illustrative assumptions only: nothing on this page is an NFS result, an offered term or a verified fact.</p>

        <div className="grid gap-8 xl:grid-cols-[17.5rem_minmax(0,1fr)_17rem]">
          {/* LEFT: controls */}
          <Card title="Levers">
            <div className="space-y-4">
              <Lever label="Warrant participation" kind="pct" value={lab.warrant} onChange={(v) => set({ warrant: v })} error={bad("warrant")} min={0} max={20} step={0.5} />
              <Lever label="Sub cash coupon" kind="pct" value={lab.subCoupon} onChange={(v) => set({ subCoupon: v })} error={bad("subCoupon")} min={0} max={20} step={0.25} />
              <Lever label="Preferred cash dividend" kind="pct" value={lab.prefCash} onChange={(v) => set({ prefCash: v })} error={bad("prefCash")} min={0} max={15} step={0.25} />
              <Lever label="Preferred PIK" kind="pct" value={lab.prefPik} onChange={(v) => set({ prefPik: v })} error={bad("prefPik")} min={0} max={15} step={0.25} />
              <Lever label="Revenue growth shift, all years (pp)" kind="pct" value={lab.growthShift} onChange={(v) => set({ growthShift: v })} error={shiftErr} hint="Added to every year's growth" min={-10} max={10} step={0.5} />
              <Lever label="EBITDA margin shift, all years (pp)" kind="pct" value={lab.marginShift} onChange={(v) => set({ marginShift: v })} error={shiftErr} hint="Added to every year's margin" min={-10} max={10} step={0.5} />
              <Lever label={`${SCN_LABEL[k]} exit EV / EBITDA`} kind="x" value={lab.exitMultiple} onChange={(v) => set({ exitMultiple: v })} error={bad(`scenario${idx}.exitMultiple`)} min={2} max={10} step={0.25} />
            </div>
            <p className="mt-4 text-xs text-muted">Package: {fmtM(REF_A.subDebt)} sub debt + {fmtM(REF_A.pref)} preferred (fixed).</p>
            {issues.length > 0 && <p role="alert" className="mt-2 text-sm text-bad">Fix the highlighted inputs to recalculate.</p>}
          </Card>

          {/* CENTER: live visualization */}
          <div className="space-y-8" aria-live="polite">
            {r && res && (
              <>
                <Card>
                  <p className="font-serif text-2xl leading-snug sm:text-3xl">{verdict(r.irr - ref.irr, r.minFccr - ref.minFccr)}</p>
                  <p className="mt-2 text-xs text-muted">Improving investor returns and improving the company&apos;s credit profile are separate questions. Compare the panels on the right.</p>
                </Card>
                <Card><SensitivityLine target={a.targetIrr} data={sens.map((s) => ({ w: fmtPct(s.warrant), irr: s.irr }))} /></Card>
                <Card>
                  <SeriesChart title={`${SCN_LABEL[k]}: cash available vs fixed charges ($m), coverage (x)`} fmt={(v) => `$${v.toFixed(2)}m`} fmtR={(v) => `${v.toFixed(2)}x`}
                    refLine={{ y: a.minFccr, axis: "r", label: `Analyst test ${a.minFccr.toFixed(2)}x` }}
                    data={yrs.map((y) => ({ name: `FY${y}`, "Cash available": r.cashPreFixed[y], "Fixed charges": r.fixedCharges[y], FCCR: r.fccr[y] }))}
                    series={[{ key: "Cash available", label: "Cash before fixed charges", color: PALETTE.INK, kind: "bar" }, { key: "Fixed charges", label: "Fixed charges", color: PALETTE.SLATE, kind: "bar" }, { key: "FCCR", label: "FCCR", color: PALETTE.CHAMP, kind: "line", axis: "r" }]} />
                </Card>
              </>
            )}
          </div>

          {/* RIGHT: metrics */}
          {r && res && (
            <div className="space-y-6 xl:sticky xl:top-20 xl:self-start">
              <Card title="Investor returns">
                <div className="space-y-4">
                  <div><div className="font-mono text-[0.68rem] uppercase tracking-[0.12em] text-muted">Gross IRR</div>
                    <div className="num text-3xl text-navy-900"><AnimatedNumber value={r.irr} format={fmtPct} /></div>
                    <div className="text-xs text-muted">vs reference {fmtPct(ref.irr)} <Delta v={r.irr - ref.irr} f={fmtPct2} /></div></div>
                  <div><div className="font-mono text-[0.68rem] uppercase tracking-[0.12em] text-muted">Gross MOIC</div>
                    <div className="num text-2xl text-navy-900"><AnimatedNumber value={r.moic} format={fmtX} /></div>
                    <div className="text-xs text-muted">vs {fmtX(ref.moic)} <Delta v={r.moic - ref.moic} f={fmtX} /></div></div>
                  <div><div className="font-mono text-[0.68rem] uppercase tracking-[0.12em] text-muted">Return threshold (analyst assumption {fmtPct(a.targetIrr)})</div>
                    <Pill tone={r.returnOk ? "ok" : "bad"}>{r.returnOk ? "HURDLE PASS" : "BELOW HURDLE"}</Pill></div>
                </div>
              </Card>
              <Card title="Company credit profile">
                <div className="space-y-4">
                  <div><div className="font-mono text-[0.68rem] uppercase tracking-[0.12em] text-muted">Minimum FCCR</div>
                    <div className={`num text-3xl ${r.coverageOk ? "text-navy-900" : "text-bad"}`}><AnimatedNumber value={r.minFccr} format={fmtX} /></div>
                    <div className="text-xs text-muted">vs {fmtX(ref.minFccr)} <Delta v={r.minFccr - ref.minFccr} f={fmtX} /> · test {fmtX(a.minFccr)}</div></div>
                  <div><div className="font-mono text-[0.68rem] uppercase tracking-[0.12em] text-muted">FY5 closing cash</div>
                    <div className="num text-2xl text-navy-900"><AnimatedNumber value={r.closeCash[5]} format={fmtM} /></div>
                    <div className="text-xs text-muted">min {fmtM(r.minLiquidity)} <Delta v={r.minLiquidity - ref.minLiquidity} f={fmtM} /></div></div>
                  <div><div className="font-mono text-[0.68rem] uppercase tracking-[0.12em] text-muted">Coverage test (analyst assumption)</div>
                    <Pill tone={r.coverageOk ? "ok" : "bad"}>{r.coverageOk ? "COVERAGE PASS" : "COVERAGE FAIL"}</Pill></div>
                </div>
              </Card>
            </div>
          )}
        </div>

        {r && res && (
          <div className="mt-10 grid gap-8 lg:grid-cols-2 lg:gap-12">
            <Card title="Annual debt service and cash ($m)">
              <DataTable caption="Annual fixed charges and closing cash" head={["$m", "FY1", "FY2", "FY3", "FY4", "FY5"]} rows={[
                ["Senior debt service", ...yrs.map((y) => fmtMn(r.seniorDebtService[y]))],
                ["Subordinated cash coupon", ...yrs.map((y) => fmtMn(r.subCoupon[y]))],
                ["Preferred cash dividend", ...yrs.map((y) => fmtMn(r.prefCashDiv[y]))],
                [<strong key="a">Total fixed charges</strong>, ...yrs.map((y) => <strong key={y}>{fmtMn(r.fixedCharges[y])}</strong>)],
                ["Fixed-charge coverage (x)", ...yrs.map((y) => fmtX(r.fccr[y]))],
                ["Closing cash", ...yrs.map((y) => fmtMn(r.closeCash[y]))],
              ]} />
            </Card>
            <Card title="All scenarios at these terms">
              <DataTable caption="Scenario outcomes at lab terms" head={["Scenario", "IRR", "MOIC", "Min FCCR", "Hurdle", "Coverage"]} rows={(["downside", "base", "upside"] as const).map((s) => [
                SCN_LABEL[s], fmtPct(res[s].irr), fmtX(res[s].moic), fmtX(res[s].minFccr),
                res[s].returnOk ? "PASS" : "BELOW", res[s].coverageOk ? "PASS" : "FAIL",
              ])} />
              <p className="mt-2 text-xs text-muted">The exit-multiple lever applies to the selected scenario only; shifts apply to all three.</p>
            </Card>
            <Card title={`Warrant repricing grid (${SCN_LABEL[k]} operating case, other lab terms held)`} className="lg:col-span-2">
              <DataTable caption="Warrant sensitivity" head={["Warrant", "Exit warrant $m", "MOIC", "IRR", "Test"]} rows={sens.map((s) => [
                fmtPct(s.warrant), fmtMn(s.warrantExit), fmtX(s.moic), fmtPct(s.irr), s.hurdlePass ? "HURDLE PASS" : "BELOW HURDLE",
              ])} />
              <p className="mt-3 text-sm">
                Warrant participation required for the {fmtPct(a.targetIrr)} analyst IRR: <strong className="num">{req === null ? "n/a (no common residual)" : fmtPct2(req)}</strong>
                <span className="text-muted"> (reference model: {refReq === null ? "n/a" : fmtPct2(refReq)}). Not a recommended term.</span>
              </p>
            </Card>
          </div>
        )}
      </Body>
    </>
  );
}
