"use client";
import { Card, DataTable, NumField, PageTitle, Pill, SandboxBar, ScreenPill, Stat } from "@/components/ui";
import { ClaimsStack } from "@/components/charts";
import { fmtM, fmtPct, fmtX } from "@/lib/format";
import { useSandbox } from "@/lib/sandbox";
import type { Assumptions } from "@/lib/engine";
import { SCN_LABEL } from "@/lib/reference";

export default function Capital() {
  const { a, setA, errFor, su, results } = useSandbox();
  const f = (k: keyof Assumptions, label: string, kind: "money" | "pct" | "x", hint?: string) => (
    <NumField key={k} label={label} kind={kind} value={a[k]} onChange={(v) => setA(k, v)} error={errFor(k)} hint={hint} />
  );
  const ladder = [
    { name: "Senior debt (existing, rolled over)", amt: a.seniorDebt, note: `${fmtPct(a.seniorRate)} cash interest; $${a.seniorAmort.toFixed(2)}m/yr amortization`, cls: "bg-slate-400" },
    { name: "Subordinated debt (new)", amt: a.subDebt, note: `${fmtPct(a.subCoupon)} cash coupon; principal repaid at exit`, cls: "bg-navy-900" },
    { name: "Preferred equity (new)", amt: a.pref, note: `${fmtPct(a.prefCash)} cash + ${fmtPct(a.prefPik)} PIK; redeemed at accreted claim`, cls: "bg-teal-500" },
  ];
  const max = Math.max(...ladder.map((l) => l.amt), 1);
  const keys = ["downside", "base", "upside"] as const;
  const b = results.base;
  return (
    <>
      <PageTitle kicker="Module 3 | Capital structure" title="Illustrative $12 million junior-capital package">
        Default: $8.00m subordinated debt plus $4.00m preferred equity with a 5% penny warrant. Every term is an analyst assumption, not a negotiated or proposed term.
      </PageTitle>
      <SandboxBar />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card><Stat label="Total new capital" value={fmtM(su.invested)} /></Card>
        <Card><Stat label="Blended current cash yield" value={fmtPct(su.blendedYield)} sub={`Min ${fmtPct(a.minYield)} (published)`} /></Card>
        <Card><Stat label="Pro forma leverage" value={fmtX(su.leverage)} sub="Senior + sub + pref ÷ FY0 EBITDA" /></Card>
        <Card><Stat label="Sources − uses" value={fmtM(su.difference)} tone={su.balanced ? undefined : "bad"} sub={su.balanced ? "Balanced" : "Does not balance"} /></Card>
      </div>

      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        <Card title="Edit assumptions (sandbox)">
          <fieldset className="mb-4"><legend className="mb-1 text-sm font-semibold">Junior capital terms</legend>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {f("subDebt", "Subordinated debt", "money")}
              {f("subCoupon", "Sub cash coupon", "pct")}
              {f("pref", "Preferred equity", "money")}
              {f("prefCash", "Preferred cash dividend", "pct")}
              {f("prefPik", "Preferred PIK", "pct")}
              {f("warrant", "Warrant participation", "pct", "Share of common residual")}
            </div>
          </fieldset>
          <fieldset className="mb-4"><legend className="mb-1 text-sm font-semibold">Existing senior debt</legend>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {f("seniorDebt", "Opening senior debt", "money")}
              {f("seniorRate", "Senior cash interest", "pct")}
              {f("seniorAmort", "Annual amortization", "money")}
            </div>
          </fieldset>
          <fieldset><legend className="mb-1 text-sm font-semibold">Uses of funds</legend>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {f("useExpansion", "Facility expansion", "money")}
              {f("useNwc", "Working capital", "money")}
              {f("useQuality", "Quality / tech", "money")}
              {f("useFees", "Fees / contingency", "money")}
            </div>
          </fieldset>
        </Card>

        <div className="space-y-6">
          <Card title="Sources and uses">
            <DataTable caption="Sources and uses ($m)" head={["Item", "$m"]} rows={[
              ["Source: subordinated debt", a.subDebt.toFixed(2)],
              ["Source: preferred equity", a.pref.toFixed(2)],
              [<strong key="s">Total sources</strong>, <strong key="s2">{su.invested.toFixed(2)}</strong>],
              ["Use: facility expansion", a.useExpansion.toFixed(2)],
              ["Use: working capital funding", a.useNwc.toFixed(2)],
              ["Use: quality / technology", a.useQuality.toFixed(2)],
              ["Use: fees and contingency", a.useFees.toFixed(2)],
              [<strong key="u">Total uses</strong>, <strong key="u2">{su.uses.toFixed(2)}</strong>],
              ["Difference", su.difference.toFixed(2)],
            ]} />
            <p className="mt-2 text-sm">Closing threshold screen (published criteria vs. these assumed inputs): <ScreenPill pass={su.thresholdPass} passText="SCENARIO THRESHOLDS PASS" failText="SCENARIO FAIL" /></p>
            <p className="mt-1 text-xs text-muted">A pass screens assumed numbers only and cannot verify NFS eligibility.</p>
          </Card>
        </div>
      </div>

      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        <Card title="Seniority of claims (at close, most senior first)">
          <ol className="space-y-3" aria-label="Claims ranked by seniority">
            {ladder.map((l, i) => (
              <li key={l.name}>
                <div className="flex justify-between text-sm"><span><span className="num mr-1 font-semibold">{i + 1}.</span>{l.name}</span><span className="num font-semibold">{fmtM(l.amt)}</span></div>
                <div className="mt-1 h-5 w-full bg-navy-100" aria-hidden="true"><div className={`h-5 ${l.cls}`} style={{ width: `${(l.amt / max) * 100}%` }} /></div>
                <p className="text-xs text-muted">{l.note}</p>
              </li>
            ))}
            <li>
              <div className="flex justify-between text-sm"><span><span className="num mr-1 font-semibold">4.</span>Common equity (residual; investor warrant takes {fmtPct(a.warrant)})</span><span className="text-muted">last claim</span></div>
              <div className="mt-1 h-5 w-full border border-dashed border-navy-700" aria-hidden="true" />
              <p className="text-xs text-muted">Receives value only after all claims above are paid. Not sized at close.</p>
            </li>
          </ol>
        </Card>
        <Card><ClaimsStack data={keys.map((k) => ({
          name: SCN_LABEL[k], Senior: results[k].exit.seniorClaim, Subordinated: results[k].exit.subClaim,
          "Preferred (accreted)": results[k].exit.prefClaim, Common: results[k].exit.commonResidual,
        }))} /></Card>
      </div>

      <Card title="Distribution waterfall at exit (sandbox base case)">
        <DataTable caption="Exit distribution waterfall, base case ($m)" head={["Step", "$m", "Note"]} rows={[
          ["Exit enterprise value", b.exit.enterpriseValue.toFixed(2), `FY5 EBITDA × exit multiple`],
          ["+ Closing cash", b.exit.closingCash.toFixed(2), ""],
          ["1. Senior debt repaid", b.exit.seniorClaim.toFixed(2), "Outstanding principal at FY5"],
          ["2. Subordinated debt repaid", b.exit.subClaim.toFixed(2), "Principal"],
          ["3. Preferred redeemed", b.exit.prefClaim.toFixed(2), "Original + accumulated PIK"],
          ["4. Common equity residual", b.exit.commonResidual.toFixed(2), b.exit.claimsCovered ? "EV + cash − claims" : "Claims exceed value: residual floored at zero"],
          ["   of which investor warrant", b.exit.warrantProceeds.toFixed(2), `${fmtPct(a.warrant)} participation`],
        ]} />
        {!b.exit.claimsCovered && <p role="alert" className="mt-2 text-sm text-bad"><Pill tone="bad">SHORTFALL</Pill> Exit value does not cover senior, subordinated and preferred claims by {fmtM(-b.exit.rawResidual)}.</p>}
      </Card>
    </>
  );
}
