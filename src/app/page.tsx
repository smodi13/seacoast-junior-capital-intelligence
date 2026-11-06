"use client";
import { Card, DataTable, PageTitle, Pill, ScreenPill, Stat } from "@/components/ui";
import { IrrBars } from "@/components/charts";
import { fmtM, fmtPct, fmtX } from "@/lib/format";
import { DILIGENCE } from "@/lib/research";
import { H } from "@/lib/baseline";
import { REF, REF_A, SCN_LABEL } from "@/lib/reference";
import { useSandbox } from "@/lib/sandbox";
import { sourcesAndUses } from "@/lib/engine";
import Link from "next/link";

export default function Executive() {
  const { modified } = useSandbox();
  const su = sourcesAndUses(REF_A);
  const keys = ["downside", "base", "upside"] as const;
  const critical = DILIGENCE.filter((q) => q.priority === "CRITICAL");
  return (
    <>
      <PageTitle kicker="Module 1 | Executive screen" title="National Fleet Services: illustrative junior-capital screen">
        Preliminary desktop screen of a hypothetical non-control junior-capital package. NFS is a real, privately held operating business; no financial results, financing request or capital structure has been verified.
      </PageTitle>

      {modified && (
        <p role="status" className="mb-4 rounded-sm border border-warn bg-amber-50 p-2 text-sm">
          Your sandbox has unsaved edits. This screen always shows the <strong>reference model</strong>. See the other modules for sandbox results.
        </p>
      )}

      <section className="mb-6 rounded-sm bg-navy-900 p-5 text-white" aria-labelledby="rec">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-teal-50/80">Investment recommendation</p>
        <h2 id="rec" className="mt-1 text-white text-3xl font-semibold sm:text-4xl">DO NOT INVEST AS PRICED</h2>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-white/90">
          This refers <strong>only to the illustrative structure</strong> modeled here ($8.00m subordinated debt + $4.00m preferred equity + 5% penny warrant). It is not a finding about NFS&apos;s actual creditworthiness, and no investment, term sheet or management approach is proposed. Analyst position: <em>{H.research_decision.position}</em>
        </p>
        <p className="mt-2 max-w-3xl text-sm text-white/80"><strong>Why:</strong> {H.research_decision.why}.</p>
        <p className="mt-1 max-w-3xl text-sm text-white/80"><strong>Possible response:</strong> {H.research_decision.possible_response}</p>
      </section>

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card><Stat label="Assumed investment" value={fmtM(su.invested)} sub="$8.00m sub debt + $4.00m preferred (illustrative)" /></Card>
        <Card><Stat label="Blended current cash yield" value={fmtPct(su.blendedYield)} sub={`Screen minimum ${fmtPct(REF_A.minYield)} (published criterion)`} /></Card>
        <Card><Stat label="Pro forma leverage" value={fmtX(su.leverage)} sub={`Debt-equivalent, preferred counted. Limit ${fmtX(REF_A.maxLeverage)}`} /></Card>
        <Card><Stat label="Warrant participation" value={fmtPct(REF_A.warrant)} sub="Penny warrant, share of common residual" /></Card>
      </div>

      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        <Card title="Three-scenario comparison">
          <DataTable
            caption="Scenario comparison, reference model"
            head={["Metric", ...keys.map((k) => SCN_LABEL[k])]}
            rows={[
              ["Gross investor IRR", ...keys.map((k) => fmtPct(REF[k].irr))],
              ["Gross investor MOIC", ...keys.map((k) => fmtX(REF[k].moic))],
              ["Minimum annual FCCR", ...keys.map((k) => fmtX(REF[k].minFccr))],
              ["Minimum closing cash", ...keys.map((k) => fmtM(REF[k].minLiquidity))],
              ["FY5 exit EV", ...keys.map((k) => fmtM(REF[k].exit.enterpriseValue))],
              ["Analyst return/coverage screen", ...keys.map((k) => <ScreenPill key={k} pass={REF[k].returnCoverageScreen} passText="PASS" failText="FAIL" />)],
            ]}
          />
          <p className="mt-2 text-xs text-muted">
            Target return {fmtPct(REF_A.targetIrr)} and the {fmtX(REF_A.minFccr)} coverage test are <strong>analyst assumptions</strong>, not Seacoast&apos;s disclosed hurdle or a covenant. Gross returns exclude fund fees, carry and investor taxes.
          </p>
        </Card>
        <Card>
          <IrrBars data={keys.map((k) => ({ name: SCN_LABEL[k], irr: REF[k].irr }))} target={REF_A.targetIrr} />
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Target company profile">
          <dl className="space-y-1 text-sm">
            <div><dt className="inline font-semibold">Subject: </dt><dd className="inline">National Fleet Services (NFS), commercial vehicle upfitting, Detroit, Michigan</dd></div>
            <div><dt className="inline font-semibold">Operations: </dt><dd className="inline">Four operating regions; founded 1996; family-operated (company and trade-association sources). <Link href="/company">Full profile</Link></dd></div>
            <div><dt className="inline font-semibold">Research status: </dt><dd className="inline"><Pill tone="warn">Preliminary desktop screen</Pill> Financials, ownership and financing need: <Pill tone="bad">NOT VERIFIED</Pill></dd></div>
            <div><dt className="inline font-semibold">Illustrative inputs: </dt><dd className="inline">FY0 revenue {fmtM(REF_A.fy0Revenue)}, EBITDA {fmtM(REF[`base`].initialEbitda)} are <strong>analyst assumptions, not NFS results</strong>.</dd></div>
          </dl>
        </Card>
        <Card title={`Critical unresolved diligence items (${critical.length})`}>
          <ul className="space-y-2 text-sm">
            {critical.map((q) => (
              <li key={q.id}><span className="num mr-2 font-semibold">{q.id}</span><strong>{q.workstream}:</strong> {q.evidence_needed}. <span className="text-muted">({q.rationale})</span></li>
            ))}
          </ul>
          <p className="mt-2 text-sm"><Link href="/diligence">All {DILIGENCE.length} diligence items</Link></p>
        </Card>
      </div>
    </>
  );
}
