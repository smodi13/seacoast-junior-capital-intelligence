"use client";
import { useState } from "react";
import { Body, Card, DataTable, NumField, PageTitle, SandboxBar, ScenarioTabs, ScreenPill, Stat } from "@/components/ui";
import { OperatingChart, PALETTE, SeriesChart } from "@/components/charts";
import { Reveal } from "@/components/motion";
import { fmtM, fmtMn, fmtPct, fmtX } from "@/lib/format";
import { useSandbox } from "@/lib/sandbox";
import type { Assumptions, ScenarioKey } from "@/lib/engine";
import { SCN_LABEL } from "@/lib/reference";

export default function Operating() {
  const { a, scn, setA, setScn, errFor, scnField, results } = useSandbox();
  const [k, setK] = useState<ScenarioKey>("base");
  const r = results[k];
  const s = scn[k];
  const yrs = [1, 2, 3, 4, 5];
  const op = (key: keyof Assumptions, label: string, kind: "money" | "pct") => (
    <NumField key={key} label={label} kind={kind} value={a[key]} onChange={(v) => setA(key, v)} error={errFor(key)} />
  );
  const row = (label: string, arr: number[], fmt: (v: number) => string = fmtMn, from = 1): React.ReactNode[] => [
    label, ...arr.slice(from).map(fmt),
  ];
  const head = ["$m", ...yrs.map((y) => `FY${y}`)];
  const neg = (arr: number[]) => arr.map((v) => -v);

  return (
    <>
      <PageTitle kicker="Module 4 | Operating underwriting" title="Five-year operating projections">
        Scenario-defined growth and margin assumptions drive revenue through free cash flow. They are analyst assumptions, not NFS results or management guidance.
      </PageTitle>
      <Body>
      <SandboxBar />
      <ScenarioTabs value={k} onChange={setK} />

      <div className="mb-6 grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        <Card title={`${SCN_LABEL[k]} drivers (editable)`}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[30rem] text-sm">
              <caption className="sr-only">Scenario drivers by year</caption>
              <thead><tr className="text-left text-xs text-muted"><th scope="col" className="py-1">Driver</th>{yrs.map((y) => <th key={y} scope="col" className="px-1">FY{y}</th>)}</tr></thead>
              <tbody>
                {(["growth", "margin"] as const).map((f) => (
                  <tr key={f}>
                    <th scope="row" className="py-1 pr-2 text-left font-normal">{f === "growth" ? "Revenue growth (%)" : "EBITDA margin (%)"}</th>
                    {yrs.map((y) => (
                      <td key={y} className="px-1 align-top">
                        <NumField label={`${SCN_LABEL[k]} FY${y} ${f === "growth" ? "revenue growth" : "EBITDA margin"}`} kind="pct" value={s[f][y - 1]}
                          error={errFor(scnField(k, `${f}${y}`))}
                          onChange={(v) => setScn(k, (p) => ({ ...p, [f]: p[f].map((x, i) => (i === y - 1 ? v : x)) }))} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-3 max-w-[12rem]">
            <NumField label={`${SCN_LABEL[k]} exit EV / EBITDA`} kind="x" value={s.exitMultiple} error={errFor(scnField(k, "exitMultiple"))}
              onChange={(v) => setScn(k, (p) => ({ ...p, exitMultiple: v }))} hint="Assumed, not an observed comp" />
          </div>
          <h3 className="mb-1 mt-4 text-sm font-semibold">Operating assumptions (all scenarios)</h3>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {op("fy0Revenue", "FY0 revenue (illustrative)", "money")}
            {op("fy0Margin", "FY0 EBITDA margin", "pct")}
            {op("daPct", "D&A / revenue", "pct")}
            {op("capexPct", "Capex / revenue", "pct")}
            {op("nwcPct", "NWC / revenue growth", "pct")}
            {op("taxRate", "Cash tax rate", "pct")}
            {op("openingCash", "Opening cash", "money")}
          </div>
        </Card>
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <Card><Stat label="Minimum fixed-charge coverage" value={fmtX(r.minFccr)} tone={r.coverageOk ? undefined : "bad"} sub={`Analyst test ${fmtX(a.minFccr)}`} /></Card>
            <Card><Stat label="Minimum closing cash" value={fmtM(r.minLiquidity)} tone={r.liquidityOk ? undefined : "bad"} sub={`Analyst test ${fmtM(a.minCash)}`} /></Card>
          </div>
          <Card><OperatingChart data={yrs.map((y) => ({ name: `FY${y}`, Revenue: r.revenue[y], EBITDA: r.ebitda[y], "FCCR (x)": r.fccr[y] }))} /></Card>
        </div>
      </div>

      <Card title={`${SCN_LABEL[k]} case projections ($m unless noted)`}>
        <DataTable caption={`${SCN_LABEL[k]} case projections`} head={head} rows={[
          row("Revenue", r.revenue),
          row("Revenue growth", r.revenueGrowth, fmtPct),
          row("EBITDA", r.ebitda),
          row("EBITDA margin", r.margin, fmtPct),
          row("Depreciation & amortization", neg(r.da)),
          row("EBIT", r.ebit),
          row("Cash taxes", neg(r.cashTaxes)),
          row("Recurring capex", neg(r.capex)),
          row("Incremental working capital", neg(r.nwc)),
          row("Cash available before fixed charges", r.cashPreFixed),
          row("Senior debt service (interest + principal)", neg(r.seniorDebtService)),
          row("Junior (subordinated) cash coupon", neg(r.subCoupon)),
          row("Preferred cash distributions", neg(r.prefCashDiv)),
          row("Annual free cash flow", r.freeCash),
          row("Closing cash", r.closeCash),
          row("Fixed-charge coverage (x)", r.fccr, fmtX),
          row("Debt-equivalent leverage (x)", r.debtEquivLeverage, fmtX),
        ]} />
        <p className="mt-2 text-sm">
          Analyst screens (sandbox): coverage <ScreenPill pass={r.coverageOk} passText="PASS" failText="FAIL" /> liquidity <ScreenPill pass={r.liquidityOk} passText="PASS" failText="FAIL" />
        </p>
        <p className="mt-1 text-xs text-muted">D&amp;A is shown for the EBIT bridge only; it is non-cash and not deducted from free cash flow. Cash taxes reflect deductible senior and subordinated interest. Preferred dividends are not deductible.</p>
      </Card>
        <div className="mt-10 grid gap-8 lg:grid-cols-2 lg:gap-12">
          <Reveal><Card>
            <SeriesChart title={`${SCN_LABEL[k]}: annual free cash flow and closing cash ($m)`} fmt={(v) => `$${v.toFixed(2)}m`}
              data={yrs.map((y) => ({ name: `FY${y}`, "Free cash flow": r.freeCash[y], "Closing cash": r.closeCash[y] }))}
              series={[{ key: "Free cash flow", label: "Free cash flow", color: PALETTE.INK, kind: "bar" }, { key: "Closing cash", label: "Closing cash", color: PALETTE.CHAMP, kind: "line" }]} />
          </Card></Reveal>
          <Reveal delay={0.08}><Card>
            <SeriesChart title={`${SCN_LABEL[k]}: fixed-charge coverage and debt-equivalent leverage (x)`} fmt={(v) => `${v.toFixed(2)}x`}
              refLine={{ y: a.minFccr, label: `Analyst coverage test ${a.minFccr.toFixed(2)}x` }}
              data={yrs.map((y) => ({ name: `FY${y}`, FCCR: r.fccr[y], Leverage: r.debtEquivLeverage[y] }))}
              series={[{ key: "FCCR", label: "Fixed-charge coverage", color: PALETTE.TEAL, kind: "line" }, { key: "Leverage", label: "Debt-equivalent leverage", color: PALETTE.INK, kind: "line" }]} />
          </Card></Reveal>
          <Reveal><Card>
            <SeriesChart title={`${SCN_LABEL[k]}: debt and preferred balances, close to FY5 ($m)`} fmt={(v) => `$${v.toFixed(2)}m`}
              data={[{ name: "Close", Senior: r.seniorOpen[1], Subordinated: r.subPrincipal[1], "Preferred (accreted)": r.prefOpen[1] }, ...yrs.map((y) => ({ name: `FY${y}`, Senior: r.seniorClose[y], Subordinated: r.subPrincipal[y], "Preferred (accreted)": r.prefClose[y] }))]}
              series={[{ key: "Senior", label: "Senior debt", color: PALETTE.SLATE, kind: "bar", stack: "d" }, { key: "Subordinated", label: "Subordinated debt", color: PALETTE.CHAMP, kind: "bar", stack: "d" }, { key: "Preferred (accreted)", label: "Preferred (accreted)", color: PALETTE.TEAL, kind: "bar", stack: "d" }]} />
          </Card></Reveal>
        </div>
      </Body>
    </>
  );
}
