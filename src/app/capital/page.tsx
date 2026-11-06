"use client";
import { Body, Card, DataTable, NumField, PageTitle, Pill, SandboxBar, ScreenPill, Stat } from "@/components/ui";
import CapitalStack from "@/components/CapitalStack";
import { ClaimsStack, Waterfall } from "@/components/charts";
import { AnimatedNumber, Reveal } from "@/components/motion";
import { fmtM, fmtPct, fmtX } from "@/lib/format";
import { useSandbox } from "@/lib/sandbox";
import type { Assumptions } from "@/lib/engine";
import { SCN_LABEL } from "@/lib/reference";

export default function Capital() {
  const { a, setA, errFor, su, results } = useSandbox();
  const f = (k: keyof Assumptions, label: string, kind: "money" | "pct" | "x", hint?: string) => (
    <NumField key={k} label={label} kind={kind} value={a[k]} onChange={(v) => setA(k, v)} error={errFor(k)} hint={hint} />
  );
  const keys = ["downside", "base", "upside"] as const;
  const b = results.base;
  const cashToInvestor = a.subDebt * a.subCoupon + a.pref * a.prefCash;
  return (
    <>
      <PageTitle kicker="Module 3 | Capital structure" title="The $12 million package, claim by claim">
        Default: $8.00m subordinated debt plus $4.00m preferred equity with a 5% penny warrant. Every term is an analyst assumption, not a negotiated or proposed term.
      </PageTitle>
      <Body>
        <SandboxBar />

        <div className="mb-10 grid gap-8 lg:grid-cols-[1fr_1.05fr] lg:gap-12">
          <Card title="Claims by seniority">
            <CapitalStack a={a} r={b} heightRem={22} />
          </Card>
          <div className="space-y-8">
            <div className="grid grid-cols-2 gap-x-6 gap-y-6 sm:grid-cols-3" aria-label="Live structure metrics" role="group">
              <Stat label="Total new capital" value={<AnimatedNumber value={su.invested} format={fmtM} />} />
              <Stat label="Blended cash yield" value={<AnimatedNumber value={su.blendedYield} format={fmtPct} />} sub={`Min ${fmtPct(a.minYield)} (published)`} />
              <Stat label="Pro forma leverage" value={<AnimatedNumber value={su.leverage} format={fmtX} />} sub="Senior + sub + pref ÷ FY0 EBITDA" />
              <Stat label="Annual cash to investor" value={<AnimatedNumber value={cashToInvestor} format={fmtM} />} sub="Sub coupon + pref dividend" />
              <Stat label="Base gross IRR" value={<AnimatedNumber value={b.irr} format={fmtPct} />} tone={b.returnOk ? undefined : "bad"} sub={`Target ${fmtPct(a.targetIrr)} (assumption)`} />
              <Stat label="Sources − uses" value={fmtM(su.difference)} tone={su.balanced ? undefined : "bad"} sub={su.balanced ? "Balanced" : "Does not balance"} />
            </div>
            <Card title="Edit assumptions (sandbox)">
              <fieldset className="mb-4"><legend className="mb-2 font-mono text-[0.68rem] uppercase tracking-[0.12em] text-muted">Junior capital terms</legend>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {f("subDebt", "Subordinated debt", "money")}
                  {f("subCoupon", "Sub cash coupon", "pct")}
                  {f("pref", "Preferred equity", "money")}
                  {f("prefCash", "Preferred cash dividend", "pct")}
                  {f("prefPik", "Preferred PIK", "pct")}
                  {f("warrant", "Warrant participation", "pct", "Share of common residual")}
                </div>
              </fieldset>
              <fieldset className="mb-4"><legend className="mb-2 font-mono text-[0.68rem] uppercase tracking-[0.12em] text-muted">Existing senior debt</legend>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {f("seniorDebt", "Opening senior debt", "money")}
                  {f("seniorRate", "Senior cash interest", "pct")}
                  {f("seniorAmort", "Annual amortization", "money")}
                </div>
              </fieldset>
              <fieldset><legend className="mb-2 font-mono text-[0.68rem] uppercase tracking-[0.12em] text-muted">Uses of funds</legend>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {f("useExpansion", "Facility expansion", "money")}
                  {f("useNwc", "Working capital", "money")}
                  {f("useQuality", "Quality / tech", "money")}
                  {f("useFees", "Fees / contingency", "money")}
                </div>
              </fieldset>
            </Card>
          </div>
        </div>

        <div className="mb-10 grid gap-8 lg:grid-cols-2 lg:gap-12">
          <Reveal>
            <Card>
              <Waterfall title="Where FY1 cash goes: EBITDA to free cash flow, base case ($m)" h={320} steps={[
                { name: "EBITDA", value: b.ebitda[1], kind: "total" },
                { name: "− Cash taxes", value: b.cashTaxes[1], kind: "down" },
                { name: "− Capex", value: b.capex[1], kind: "down" },
                { name: "− Working capital", value: b.nwc[1], kind: "down" },
                { name: "− Senior service", value: b.seniorDebtService[1], kind: "down" },
                { name: "− Sub coupon", value: b.subCoupon[1], kind: "down" },
                { name: "− Pref dividend", value: b.prefCashDiv[1], kind: "down" },
                { name: "Free cash flow", value: b.freeCash[1], kind: "total" },
              ]} />
              <p className="mt-2 text-xs text-muted">Fixed charges are paid in order of seniority; whatever remains accumulates as cash. Fixed-charge coverage = cash available before fixed charges ÷ fixed charges ({fmtX(b.fccr[1])} in FY1).</p>
            </Card>
          </Reveal>
          <Reveal delay={0.08}>
            <Card><ClaimsStack data={keys.map((k) => ({
              name: SCN_LABEL[k], Senior: results[k].exit.seniorClaim, Subordinated: results[k].exit.subClaim,
              "Preferred (accreted)": results[k].exit.prefClaim, Common: results[k].exit.commonResidual,
            }))} /></Card>
          </Reveal>
        </div>

        <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
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
            <p className="mt-3 text-sm">Closing threshold screen (published criteria vs these assumed inputs): <ScreenPill pass={su.thresholdPass} passText="SCENARIO THRESHOLDS PASS" failText="SCENARIO FAIL" /></p>
            <p className="mt-1 text-xs text-muted">A pass screens assumed numbers only and cannot verify NFS eligibility.</p>
          </Card>
          <Card title="Distribution waterfall at exit (sandbox base case)">
            <DataTable caption="Exit distribution waterfall, base case ($m)" head={["Step", "$m", "Note"]} rows={[
              ["Exit enterprise value", b.exit.enterpriseValue.toFixed(2), "FY5 EBITDA × exit multiple"],
              ["+ Closing cash", b.exit.closingCash.toFixed(2), ""],
              ["1. Senior debt repaid", b.exit.seniorClaim.toFixed(2), "Outstanding principal at FY5"],
              ["2. Subordinated debt repaid", b.exit.subClaim.toFixed(2), "Principal"],
              ["3. Preferred redeemed", b.exit.prefClaim.toFixed(2), "Original + accumulated PIK"],
              ["4. Common equity residual", b.exit.commonResidual.toFixed(2), b.exit.claimsCovered ? "EV + cash − claims" : "Claims exceed value: residual floored at zero"],
              ["   of which investor warrant", b.exit.warrantProceeds.toFixed(2), `${fmtPct(a.warrant)} participation`],
            ]} />
            {!b.exit.claimsCovered && <p role="alert" className="mt-2 text-sm text-bad"><Pill tone="bad">SHORTFALL</Pill> Exit value does not cover senior, subordinated and preferred claims by {fmtM(-b.exit.rawResidual)}.</p>}
          </Card>
        </div>
      </Body>
    </>
  );
}
