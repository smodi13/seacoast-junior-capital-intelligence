"use client";
import { useState } from "react";
import { Body, Card, DataTable, PageTitle, SandboxBar, ScenarioTabs, ScreenPill, Stat } from "@/components/ui";
import { FlowBars, PALETTE, SeriesChart, Waterfall } from "@/components/charts";
import { fmtM, fmtMn, fmtPct, fmtX } from "@/lib/format";
import { useSandbox } from "@/lib/sandbox";
import type { ScenarioKey } from "@/lib/engine";
import { SCN_LABEL } from "@/lib/reference";

export default function Returns() {
  const { a, results, su } = useSandbox();
  const [k, setK] = useState<ScenarioKey>("base");
  const r = results[k];
  const T = 5;
  const yrs = [0, 1, 2, 3, 4, 5];
  const at = (arr: number[], exitOnly = false) => yrs.map((y) => (exitOnly ? (y === T ? arr[T] : 0) : arr[y] ?? 0));
  const cell = (v: number, y: number) => (y === 0 && v === 0 ? "" : fmtMn(v));
  const sub = yrs.map((y) => (y ? r.subCoupon[y] : 0));
  const prefCash = yrs.map((y) => (y ? r.prefCashDiv[y] : 0));
  const subRepay = yrs.map((y) => (y === T ? r.exit.subClaim : 0));
  const prefRedeem = yrs.map((y) => (y === T ? r.exit.prefClaim : 0));
  const warrant = yrs.map((y) => (y === T ? r.exit.warrantProceeds : 0));
  const init = yrs.map((y) => (y === 0 ? -su.invested : 0));
  const rows: React.ReactNode[][] = [
    ["Initial investment", ...init.map((v, y) => cell(v, y))],
    ["Subordinated cash interest", ...sub.map(cell)],
    ["Preferred cash dividend", ...prefCash.map(cell)],
    ["Junior principal repayment", ...subRepay.map(cell)],
    ["Preferred redemption (original + PIK)", ...prefRedeem.map(cell)],
    ["Warrant participation (share of common residual)", ...warrant.map(cell)],
    [<strong key="t">Total investor cash flow</strong>, ...r.investorCashFlow.map((v) => <strong key={v}>{fmtMn(v)}</strong>)],
    [<em key="m1" className="text-muted">Memo: preferred PIK accrual (non-cash)</em>, ...yrs.map((y) => (y ? fmtMn(r.prefPikAccretion[y]) : ""))],
    [<em key="m2" className="text-muted">Memo: company senior principal amortization</em>, ...yrs.map((y) => (y ? fmtMn(r.seniorAmort[y]) : ""))],
    [<em key="m3" className="text-muted">Memo: total common equity residual at exit</em>, ...at([0, 0, 0, 0, 0, r.exit.commonResidual], true).map((v, y) => (y === T ? fmtMn(v) : ""))],
  ];
  const e = r.exit;
  return (
    <>
      <PageTitle kicker="Module 5 | Investor returns" title="Investor cash flows, exit waterfall and gross returns">
        Mirrors the Excel model: interest and preferred cash dividends annually; preferred PIK accretes to the exit claim; senior debt amortizes before exit; at FY5 senior, subordinated and accreted preferred claims rank ahead of common equity, in which the penny warrant participates.
      </PageTitle>
      <Body>
      <SandboxBar />
      <ScenarioTabs value={k} onChange={setK} />
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card><Stat label="Gross investor IRR" value={fmtPct(r.irr)} tone={r.returnOk ? undefined : "bad"} sub={`Analyst target ${fmtPct(a.targetIrr)} (assumption)`} /></Card>
        <Card><Stat label="Gross investor MOIC" value={fmtX(r.moic)} sub="Total receipts ÷ invested" /></Card>
        <Card><Stat label="FY5 exit proceeds to investor" value={fmtM(e.investorExitRepayment)} sub={`incl. ${fmtM(e.warrantProceeds)} warrant`} /></Card>
        <Card><Stat label="Return / coverage screen" value={<ScreenPill pass={r.returnCoverageScreen} passText="PASS" failText="FAIL" />} sub="Analyst test, not a Seacoast hurdle" /></Card>
      </div>

      <Card title={`${SCN_LABEL[k]} case: annual investor cash flows ($m)`} className="mb-6">
        <DataTable caption="Annual investor cash flows" head={["$m", ...yrs.map((y) => `FY${y}`)]} rows={rows} />
        <p className="mt-2 text-xs text-muted">IRR uses dated annual periods (FY0 close = t0; flows at each year-end). Gross: excludes fund expenses, carried interest and investor taxes. The model repays investor principal and accreted preferred in full at exit; it does not haircut them if exit value is insufficient.</p>
      </Card>

      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <Waterfall title={`${SCN_LABEL[k]} exit waterfall: EV to common residual ($m)`} steps={[
            { name: "Exit EV", value: e.enterpriseValue, kind: "total" },
            { name: "+ Cash", value: e.closingCash, kind: "up" },
            { name: "− Senior", value: e.seniorClaim, kind: "down" },
            { name: "− Sub debt", value: e.subClaim, kind: "down" },
            { name: "− Pref (accreted)", value: e.prefClaim, kind: "down" },
            { name: "Common residual", value: e.commonResidual, kind: "total" },
          ]} />
          {!e.claimsCovered && <p role="alert" className="text-sm text-bad">Claims exceed exit value by {fmtM(-e.rawResidual)}; residual shown as zero.</p>}
        </Card>
        <Card>
          <FlowBars data={yrs.map((y) => ({
            name: `FY${y}`, Outflow: init[y], Coupon: sub[y], "Pref cash": prefCash[y],
            "Exit proceeds": y === T ? e.investorExitRepayment : 0,
          }))} />
        </Card>
      </div>

      <Card className="mb-6">
        <SeriesChart title={`${SCN_LABEL[k]}: preferred claim accreting through PIK ($m)`} fmt={(v) => `$${v.toFixed(2)}m`}
          data={yrs.map((y) => ({ name: `FY${y}`, "Preferred claim": y === 0 ? a.pref : r.prefClose[y], "Cumulative PIK": y === 0 ? 0 : r.prefClose[y] - a.pref }))}
          series={[{ key: "Preferred claim", label: "Preferred claim (accreted)", color: PALETTE.TEAL, kind: "area" }, { key: "Cumulative PIK", label: "Cumulative PIK accrual", color: PALETTE.CHAMP, kind: "line" }]} h={220} />
      </Card>

      <Card title="Exit distribution detail">
        <DataTable caption="Exit distribution" head={["Component", "$m"]} rows={[
          ["Exit enterprise value (FY5 EBITDA × multiple)", fmtMn(e.enterpriseValue)],
          ["Senior debt outstanding repaid", fmtMn(e.seniorClaim)],
          ["Junior principal repayment", fmtMn(e.subClaim)],
          ["Preferred redemption", fmtMn(e.prefClaim)],
          ["Residual common equity", fmtMn(e.commonResidual)],
          ["Warrant participation", fmtMn(e.warrantProceeds)],
          ["Investor debt + preferred + warrant at exit", fmtMn(e.investorExitRepayment)],
        ]} />
      </Card>
      </Body>
    </>
  );
}
