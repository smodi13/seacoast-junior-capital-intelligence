"use client";
import { useMemo, useState } from "react";
import { Card, DataTable, NumField, PageTitle, Pill, ScenarioTabs, Stat } from "@/components/ui";
import { SensitivityLine } from "@/components/charts";
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
    <span className={(v > 0) === goodUp ? "text-teal-700" : "text-bad"}>{v > 0 ? "▲ " : "▼ "}{f(Math.abs(v))}</span>
  );

export default function Pricing() {
  const [lab, setLab] = useState<Lab>(INIT);
  const [k, setK] = useState<ScenarioKey>("base");
  const set = (p: Partial<Lab>) => setLab((l) => ({ ...l, ...p }));

  const { a, issues, res } = useMemo(() => {
    const a: Assumptions = { ...REF_A, warrant: lab.warrant, subCoupon: lab.subCoupon, prefCash: lab.prefCash, prefPik: lab.prefPik };
    const mk = (s: Scenario, exit?: number): Scenario => ({
      growth: s.growth.map((g) => g + lab.growthShift), margin: s.margin.map((m) => m + lab.marginShift),
      exitMultiple: exit ?? s.exitMultiple,
    });
    // the exit multiple control drives the selected scenario; others keep their reference multiple
    const scn = { base: mk(REF_S.base), downside: mk(REF_S.downside), upside: mk(REF_S.upside) };
    scn[k] = mk(REF_S[k], lab.exitMultiple);
    const issues = validate(a, [scn.base, scn.downside, scn.upside]);
    return { a, issues, res: issues.length ? null : runAll(a, scn) };
  }, [lab, k]);

  const changeScenario = (nk: ScenarioKey) => { setK(nk); set({ exitMultiple: REF_S[nk].exitMultiple }); };
  const bad = (f: string) => issues.find((i) => i.field === f)?.message;
  const shiftErr = issues.find((i) => i.field.startsWith("scenario") && !i.field.endsWith("exitMultiple"))
    ? "Resulting growth or margin is out of range (margin 0-100%, growth above -100%)." : undefined;
  const reset = () => { setLab({ ...INIT, exitMultiple: REF_S[k].exitMultiple }); };

  const r = res?.[k];
  const ref = REF[k];
  const sens = useMemo(() => (r ? warrantSensitivity(a, r, WARRANT_GRID) : []), [a, r]);
  const req = r ? requiredWarrant(a, r) : null;
  const refReq = requiredWarrant(REF_A, REF[k]);

  return (
    <>
      <PageTitle kicker="Module 6 | Pricing sensitivity" title="Pricing lab">
        Reprice the illustrative terms and operating assumptions. The lab always starts from the reference model; it never changes the research files. The target return is an <strong>analyst assumption ({fmtPct(REF_A.targetIrr)}), not Seacoast&apos;s disclosed hurdle</strong>.
      </PageTitle>
      <ScenarioTabs value={k} onChange={changeScenario} />
      <div className="mb-6 grid gap-6 lg:grid-cols-[1fr_1.3fr]">
        <Card title="Levers">
          <div className="grid grid-cols-2 gap-3">
            <NumField label="Warrant participation" kind="pct" value={lab.warrant} onChange={(v) => set({ warrant: v })} error={bad("warrant")} />
            <NumField label="Sub cash coupon" kind="pct" value={lab.subCoupon} onChange={(v) => set({ subCoupon: v })} error={bad("subCoupon")} />
            <NumField label="Preferred cash dividend" kind="pct" value={lab.prefCash} onChange={(v) => set({ prefCash: v })} error={bad("prefCash")} />
            <NumField label="Preferred PIK" kind="pct" value={lab.prefPik} onChange={(v) => set({ prefPik: v })} error={bad("prefPik")} />
            <NumField label="Revenue growth shift, all years (pp)" kind="pct" value={lab.growthShift} onChange={(v) => set({ growthShift: v })} error={shiftErr} hint="Added to every year's growth" />
            <NumField label="EBITDA margin shift, all years (pp)" kind="pct" value={lab.marginShift} onChange={(v) => set({ marginShift: v })} error={shiftErr} hint="Added to every year's margin" />
            <NumField label={`${SCN_LABEL[k]} exit EV / EBITDA`} kind="x" value={lab.exitMultiple} onChange={(v) => set({ exitMultiple: v })} error={bad(`scenario${["base", "downside", "upside"].indexOf(k)}.exitMultiple`)} />
          </div>
          <button type="button" onClick={reset} className="mt-4 rounded-sm border border-navy-900 px-3 py-1 text-sm font-semibold text-navy-900 hover:bg-navy-100">Reset to baseline</button>
          {issues.length > 0 && <p role="alert" className="mt-2 text-sm text-bad">Fix the highlighted inputs to recalculate.</p>}
        </Card>

        {r && (
          <div className="space-y-4" aria-live="polite">
            <Card>
              <p className="text-sm font-semibold text-navy-900">{verdict(r.irr - ref.irr, r.minFccr - ref.minFccr)}</p>
              <p className="mt-1 text-xs text-muted">Improving investor returns and improving the company&apos;s credit profile are separate questions. Compare the two panels below.</p>
            </Card>
            <div className="grid gap-4 sm:grid-cols-2">
              <Card title="Investor returns">
                <div className="space-y-3">
                  <Stat label="Gross IRR" value={fmtPct(r.irr)} sub={<>vs reference {fmtPct(ref.irr)} <Delta v={r.irr - ref.irr} f={fmtPct2} /></>} />
                  <Stat label="Gross MOIC" value={fmtX(r.moic)} sub={<>vs {fmtX(ref.moic)} <Delta v={r.moic - ref.moic} f={fmtX} /></>} />
                  <div><span className="text-xs uppercase text-muted">Return threshold (analyst assumption)</span><br />
                    <Pill tone={r.returnOk ? "ok" : "bad"}>{r.returnOk ? "HURDLE PASS" : "BELOW HURDLE"}</Pill></div>
                </div>
              </Card>
              <Card title="Company credit profile">
                <div className="space-y-3">
                  <Stat label="Minimum FCCR" value={fmtX(r.minFccr)} tone={r.coverageOk ? undefined : "bad"} sub={<>vs {fmtX(ref.minFccr)} <Delta v={r.minFccr - ref.minFccr} f={fmtX} /> | test {fmtX(a.minFccr)}</>} />
                  <Stat label="FY5 closing cash" value={fmtM(r.closeCash[5])} sub={<>min {fmtM(r.minLiquidity)} <Delta v={r.minLiquidity - ref.minLiquidity} f={fmtM} /></>} />
                  <div><span className="text-xs uppercase text-muted">Coverage test (analyst assumption)</span><br />
                    <Pill tone={r.coverageOk ? "ok" : "bad"}>{r.coverageOk ? "COVERAGE PASS" : "COVERAGE FAIL"}</Pill></div>
                </div>
              </Card>
            </div>
          </div>
        )}
      </div>

      {r && res && (
        <>
          <div className="mb-6 grid gap-6 lg:grid-cols-2">
            <Card title="Annual debt service and cash ($m)">
              <DataTable caption="Annual fixed charges and closing cash" head={["$m", "FY1", "FY2", "FY3", "FY4", "FY5"]} rows={[
                ["Senior debt service", ...[1, 2, 3, 4, 5].map((y) => fmtMn(r.seniorDebtService[y]))],
                ["Subordinated cash coupon", ...[1, 2, 3, 4, 5].map((y) => fmtMn(r.subCoupon[y]))],
                ["Preferred cash dividend", ...[1, 2, 3, 4, 5].map((y) => fmtMn(r.prefCashDiv[y]))],
                [<strong key="a">Total fixed charges</strong>, ...[1, 2, 3, 4, 5].map((y) => <strong key={y}>{fmtMn(r.fixedCharges[y])}</strong>)],
                ["Fixed-charge coverage (x)", ...[1, 2, 3, 4, 5].map((y) => fmtX(r.fccr[y]))],
                ["Closing cash", ...[1, 2, 3, 4, 5].map((y) => fmtMn(r.closeCash[y]))],
              ]} />
            </Card>
            <Card title="All scenarios at these terms">
              <DataTable caption="Scenario outcomes at lab terms" head={["Scenario", "IRR", "MOIC", "Min FCCR", "Hurdle", "Coverage"]} rows={(["downside", "base", "upside"] as const).map((s) => [
                SCN_LABEL[s], fmtPct(res[s].irr), fmtX(res[s].moic), fmtX(res[s].minFccr),
                res[s].returnOk ? "PASS" : "BELOW", res[s].coverageOk ? "PASS" : "FAIL",
              ])} />
              <p className="mt-2 text-xs text-muted">The exit-multiple lever applies to the selected scenario only; shifts apply to all three.</p>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card title={`Warrant repricing grid (${SCN_LABEL[k]} operating case, other lab terms held)`}>
              <DataTable caption="Warrant sensitivity" head={["Warrant", "Exit warrant $m", "MOIC", "IRR", "Test"]} rows={sens.map((s) => [
                fmtPct(s.warrant), fmtMn(s.warrantExit), fmtX(s.moic), fmtPct(s.irr), s.hurdlePass ? "HURDLE PASS" : "BELOW HURDLE",
              ])} />
              <p className="mt-3 text-sm">
                Warrant participation required for the {fmtPct(a.targetIrr)} analyst IRR: <strong className="num">{req === null ? "n/a (no common residual)" : fmtPct2(req)}</strong>
                <span className="text-muted"> (reference model: {refReq === null ? "n/a" : fmtPct2(refReq)}). Not a recommended term.</span>
              </p>
            </Card>
            <Card><SensitivityLine target={a.targetIrr} data={sens.map((s) => ({ w: fmtPct(s.warrant), irr: s.irr }))} /></Card>
          </div>
        </>
      )}
    </>
  );
}
