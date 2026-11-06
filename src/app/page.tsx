"use client";
import Link from "next/link";
import { motion, useScroll, useTransform } from "motion/react";
import { useMemo, useState } from "react";
import CapitalStack, { type LayerKey } from "@/components/CapitalStack";
import { IrrBars } from "@/components/charts";
import { AnimatedNumber, Headline, Reveal, Rule, SectionHead } from "@/components/motion";
import { DataTable, LabelTag, Pill, ScenarioTabs, SourceTags } from "@/components/ui";
import { H } from "@/lib/baseline";
import { runCase, sourcesAndUses, warrantSensitivity, type ScenarioKey } from "@/lib/engine";
import { fmtM, fmtPct, fmtX } from "@/lib/format";
import { DILIGENCE } from "@/lib/research";
import { REF, REF_A, REF_S, SCN_LABEL } from "@/lib/reference";

const su = sourcesAndUses(REF_A);
const peakLev = (k: ScenarioKey) => Math.max(REF[k].initialLeverage, ...REF[k].debtEquivLeverage.slice(1));
const EASE = [0.16, 1, 0.3, 1] as const;

/** Dark→light / light→dark fade between narrative sections. */
const Fade = ({ to }: { to: "light" | "dark" }) => (
  <div aria-hidden="true" className={`h-20 sm:h-28 ${to === "light" ? "bg-gradient-to-b from-[#060d1a] to-[#f4f1ea]" : "bg-gradient-to-b from-[#f4f1ea] to-[#060d1a]"}`} />
);

function Hero() {
  const { scrollY } = useScroll();
  const glowY = useTransform(scrollY, [0, 700], [0, 90]);
  const stats: [string, string][] = [
    ["Assumed investment", fmtM(su.invested)], ["Blended cash yield", fmtPct(su.blendedYield)],
    ["Pro forma leverage", fmtX(su.leverage)], ["Base gross IRR", fmtPct(REF.base.irr)],
  ];
  return (
    <section className="dark-surface bg-grid relative overflow-hidden" aria-labelledby="hero-title">
      <motion.div aria-hidden="true" style={{ y: glowY }} className="pointer-events-none absolute -right-40 top-10 hidden h-[40rem] w-[40rem] rounded-full bg-teal-500/10 blur-3xl lg:block" />
      <div className="relative mx-auto grid max-w-[88rem] gap-12 px-4 pb-10 pt-10 sm:px-8 sm:pt-16 lg:min-h-[calc(100svh-5.5rem)] lg:grid-cols-[1.2fr_1fr] lg:items-center lg:gap-16 lg:pb-12">
        <div>
          <Rule onMount className="mb-6 text-white" />
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35, duration: 0.7 }} className="eyebrow !text-champagne">
            Independent private capital research · National Fleet Services
          </motion.p>
          <Headline as="h1" onMount className="mt-5 text-[clamp(2.9rem,6.3vw,6.6rem)]" lines={["The structure", <em key="e">is the investment.</em>]} />
          <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.95, duration: 0.8, ease: EASE }} className="mt-7 max-w-xl text-base leading-relaxed text-muted sm:text-lg">
            A five-year underwriting of non-control capital, credit protection, management ownership, and risk-adjusted investor returns, built on an illustrative $12 million junior-capital package.
          </motion.p>
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.1, duration: 0.8, ease: EASE }} className="mt-8 flex flex-wrap gap-3">
            <a href="#opportunity" className="btn btn-primary">Explore the Investment Case <span className="arrow" aria-hidden="true">↓</span></a>
            <Link href="/operating" className="btn btn-ghost">Open the Underwriting Model <span className="arrow" aria-hidden="true">→</span></Link>
          </motion.div>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.35, duration: 0.8 }} className="mt-6 flex max-w-xl flex-wrap items-center gap-2 text-xs text-muted">
            <Pill tone="bad">Reference decision</Pill> Do not invest as priced: refers only to the illustrative structure. Financials are analyst assumptions.
          </motion.p>
        </div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5, duration: 0.6 }} className="border border-rule bg-card/70 p-4 backdrop-blur-sm sm:p-6">
          <div className="mb-4 flex items-baseline justify-between gap-3">
            <p className="eyebrow !text-champagne">Illustrative capital stack</p>
            <p className="num text-xs text-muted">$m · reference model</p>
          </div>
          <CapitalStack a={REF_A} r={REF.base} heightRem={21} />
        </motion.div>
      </div>

      <div className="relative border-t border-white/10">
        <dl className="mx-auto grid max-w-[88rem] grid-cols-2 px-4 sm:px-8 lg:grid-cols-4">
          {stats.map(([l, v], i) => (
            <motion.div key={l} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.4 + i * 0.07, duration: 0.6 }} className="border-b border-white/10 py-4 pr-4 sm:py-5 lg:border-b-0 lg:border-r lg:pl-6 lg:first:pl-0 lg:last:border-r-0">
              <dt className="font-mono text-[0.65rem] uppercase tracking-[0.14em] text-muted">{l}</dt>
              <dd className="num mt-1 text-2xl text-[#f4f1ea] sm:text-3xl">{v}</dd>
            </motion.div>
          ))}
        </dl>
        <motion.a href="#opportunity" aria-label="Scroll to the investment case" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.8 }}
          className="absolute -top-14 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-1 no-underline lg:flex">
          <span className="font-mono text-[0.6rem] uppercase tracking-[0.2em] text-muted">Scroll</span>
          <motion.span animate={{ y: [0, 7, 0] }} transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }} className="block h-8 w-px bg-champagne" />
        </motion.a>
      </div>
    </section>
  );
}

function Opportunity() {
  const rows: { label: Parameters<typeof LabelTag>[0]["label"]; text: string; src: string[] }[] = [
    { label: "COMPANY SELF-REPORT", text: "Founded in Detroit in 1996; four operating regions.", src: ["S05", "S06"] },
    { label: "COMPANY SELF-REPORT", text: "Avon Lake advertises capacity of up to 25,000 vehicle modifications a year: stated capacity, not realized volume.", src: ["S06"] },
    { label: "COMPANY SELF-REPORT", text: "OEM-adjacent upfit and inspection services; public testimonials name U-Haul and Sunbelt Rentals.", src: ["S07", "S08"] },
    { label: "VERIFIED PUBLIC FACT", text: "Described as family-owned and operated in a 2026 trade-association item.", src: ["S09"] },
    { label: "NOT VERIFIED", text: "Revenue, EBITDA, ownership percentages, existing debt, and any appetite for outside capital.", src: [] },
  ];
  return (
    <section id="opportunity" className="bg-paper scroll-mt-16">
      <div className="mx-auto max-w-[88rem] px-4 py-16 sm:px-8 sm:py-24">
        <SectionHead no="01" label="The opportunity" title={["A real operator,", <em key="e">a hypothetical raise.</em>]}>
          National Fleet Services is a real, privately held commercial-vehicle upfitter. This project asks a narrow question: could non-control junior capital fund an expansion while preserving management control and delivering acceptable yield, downside protection and return?
        </SectionHead>
        <div className="grid gap-10 lg:grid-cols-[1fr_1.25fr] lg:gap-16">
          <Reveal className="space-y-5 text-base leading-relaxed">
            <p>The structure under test is the kind Seacoast publishes it uses: subordinated debt, preferred or common equity, with a non-control stance and an emphasis on cash flow. <SourceTags ids={["S01", "S02"]} /></p>
            <p className="border-l-2 border-teal-500 pl-4 text-muted">Seacoast&apos;s published screen: junior capital of $5m to $30m, revenue above $10m, EBITDA above $2m, leverage up to 4x and at least 8% blended current yield. The model&apos;s illustrative inputs are built to meet it. That tells us about the arithmetic, not about NFS.</p>
            <Link href="/company" className="font-mono text-xs uppercase tracking-widest">Read the full company profile →</Link>
          </Reveal>
          <ul className="divide-y divide-rule border-y border-rule" aria-label="Evidence ledger">
            {rows.map((r, i) => (
              <Reveal as="li" key={i} delay={i * 0.06} className="grid gap-2 py-4 sm:grid-cols-[11rem_1fr]">
                <span><LabelTag label={r.label} /></span>
                <span className="text-sm leading-relaxed">{r.text} {r.src.length > 0 && <SourceTags ids={r.src} />}</span>
              </Reveal>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

function Package() {
  const [sel, setSel] = useState<LayerKey>("senior");
  const steps: { key: LayerKey; kicker: string; title: string; body: string }[] = [
    { key: "senior", kicker: "Starting point", title: `${fmtM(REF_A.seniorDebt)} of existing senior debt`, body: `The model assumes ${fmtM(REF_A.seniorDebt)} of senior debt is rolled over at ${fmtPct(REF_A.seniorRate)} and amortizes ${fmtM(REF_A.seniorAmort)} a year. It is illustrative and not part of the new commitment. Counting everything at close gives ${fmtX(su.leverage)} debt-equivalent leverage.` },
    { key: "sub", kicker: "New capital · layer one", title: `${fmtM(REF_A.subDebt)} subordinated debt`, body: `An ${fmtPct(REF_A.subCoupon)} cash coupon (${fmtM(REF_A.subDebt * REF_A.subCoupon)} a year) with principal repaid at exit. It ranks behind the senior lender and ahead of every form of equity.` },
    { key: "pref", kicker: "New capital · layer two", title: `${fmtM(REF_A.pref)} preferred equity`, body: `An ${fmtPct(REF_A.prefCash)} cash dividend plus ${fmtPct(REF_A.prefPik)} PIK accretion. The redemption claim grows from ${fmtM(REF_A.pref)} to ${fmtM(REF.base.prefClose[5])} by year five. Together the two layers pay ${fmtPct(su.blendedYield)} in current cash.` },
    { key: "common", kicker: "Equity kicker", title: `A ${fmtPct(REF_A.warrant)} penny warrant`, body: `The investor also shares ${fmtPct(REF_A.warrant)} of the common residual at exit, worth ${fmtM(REF.base.exit.warrantProceeds)} in the base case. The $12.00m funds ${fmtM(REF_A.useExpansion)} of expansion, ${fmtM(REF_A.useNwc)} of working capital, ${fmtM(REF_A.useQuality)} of quality and technology, and ${fmtM(REF_A.useFees)} of fees and contingency.` },
  ];
  return (
    <section className="dark-surface bg-grid">
      <div className="mx-auto max-w-[88rem] px-4 py-16 sm:px-8 sm:py-24">
        <SectionHead no="02" label="Capital structure" title={["Four claims,", <em key="e">one order of payment.</em>]}>
          Scroll through the package. The stack responds. Every balance and rate comes from the validated model.
        </SectionHead>
        <div className="grid gap-10 lg:grid-cols-2 lg:gap-20">
          <div className="space-y-6 lg:space-y-0">
            {steps.map((s) => (
              <motion.div key={s.key} viewport={{ margin: "-45% 0px -45% 0px" }} onViewportEnter={() => setSel(s.key)} onClick={() => setSel(s.key)}
                className={`border-t py-6 transition-opacity duration-500 lg:flex lg:min-h-[42vh] lg:flex-col lg:justify-center ${sel === s.key ? "border-champagne" : "border-rule lg:opacity-70"}`}>
                <p className="eyebrow">{s.kicker}</p>
                <h3 className="mt-2 text-3xl sm:text-4xl">{s.title}</h3>
                <p className="mt-3 max-w-md text-sm leading-relaxed text-muted sm:text-base">{s.body}</p>
              </motion.div>
            ))}
            <p className="border-t border-rule pt-4 text-sm text-muted">Sources {fmtM(su.invested)} = uses {fmtM(su.uses)}: balanced by construction.</p>
          </div>
          <div className="lg:sticky lg:top-24 lg:self-start">
            <div className="border border-rule bg-card/70 p-4 sm:p-6">
              <CapitalStack a={REF_A} r={REF.base} selected={sel} onSelect={setSel} heightRem={22} />
            </div>
            <Link href="/capital" className="mt-4 inline-block font-mono text-xs uppercase tracking-widest">Edit the structure in the sandbox →</Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function Scenarios() {
  const [k, setK] = useState<ScenarioKey>("base");
  const r = REF[k];
  const tgt = REF_A.targetIrr;
  const metrics = [
    { label: "Gross investor IRR", v: r.irr, f: fmtPct, ok: r.returnOk, note: `Target ${fmtPct(tgt)} (analyst assumption)` },
    { label: "Gross MOIC", v: r.moic, f: fmtX, ok: null, note: "Total receipts ÷ invested" },
    { label: "Minimum FCCR", v: r.minFccr, f: fmtX, ok: r.coverageOk, note: `Analyst test ${fmtX(REF_A.minFccr)}` },
    { label: "Peak leverage", v: peakLev(k), f: fmtX, ok: peakLev(k) <= REF_A.maxLeverage, note: `Published max ${fmtX(REF_A.maxLeverage)}, incl. close` },
    { label: "Exit proceeds to investor", v: r.exit.investorExitRepayment, f: fmtM, ok: null, note: `incl. ${fmtM(r.exit.warrantProceeds)} warrant` },
    { label: "FY5 ending cash", v: r.closeCash[5], f: fmtM, ok: r.liquidityOk, note: `Min ${fmtM(r.minLiquidity)} · test ${fmtM(REF_A.minCash)}` },
  ];
  const allFail = (["downside", "base", "upside"] as const).every((x) => !REF[x].returnCoverageScreen);
  const keys = ["downside", "base", "upside"] as const;
  return (
    <section className="bg-paper">
      <div className="mx-auto max-w-[88rem] px-4 py-16 sm:px-8 sm:py-24">
        <SectionHead no="03" label="Scenario analysis" title={["What the model says,", <em key="e">scenario by scenario.</em>]}>
          Switching scenarios changes the evidence, not the verdict. Each tile is marked against the analyst test, with the assumption stated.
        </SectionHead>
        <ScenarioTabs value={k} onChange={setK} className="mb-8" />
        <div className="grid gap-10 lg:grid-cols-[1.3fr_1fr] lg:gap-14">
          <div>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-3">
              {metrics.map((m) => (
                <div key={m.label} className="border-t border-navy-900/40 pt-3">
                  <dt className="font-mono text-[0.65rem] uppercase tracking-[0.12em] text-muted">{m.label}</dt>
                  <dd className="num mt-1 text-3xl text-navy-900 sm:text-4xl"><AnimatedNumber value={m.v} format={m.f} /></dd>
                  <dd className="mt-1 flex flex-wrap items-center gap-2 text-[0.7rem] text-muted">
                    {m.ok !== null && <Pill tone={m.ok ? "ok" : "bad"}>{m.ok ? "✓ Pass" : "✕ Below"}</Pill>}
                    <span>{m.note}</span>
                  </dd>
                </div>
              ))}
            </dl>
            <p className="mt-8 max-w-xl border-l-2 border-teal-500 pl-4 text-sm leading-relaxed" aria-live="polite">
              <strong>{SCN_LABEL[k]} case:</strong> investor IRR of {fmtPct(r.irr)} is {r.returnOk ? "at or above" : "below"} the {fmtPct(tgt)} analyst target; minimum coverage of {fmtX(r.minFccr)} {r.coverageOk ? "clears" : "falls short of"} the {fmtX(REF_A.minFccr)} test. {allFail && "No scenario clears both the return target and the coverage test."}
            </p>
          </div>
          <IrrBars selected={SCN_LABEL[k]} data={keys.map((x) => ({ name: SCN_LABEL[x], irr: REF[x].irr }))} target={tgt} />
        </div>
        <div className="mt-12">
          <DataTable caption="Scenario comparison, reference model" head={["Metric", ...keys.map((x) => SCN_LABEL[x])]} rows={[
            ["Gross investor IRR", ...keys.map((x) => fmtPct(REF[x].irr))],
            ["Gross investor MOIC", ...keys.map((x) => fmtX(REF[x].moic))],
            ["Minimum annual FCCR", ...keys.map((x) => fmtX(REF[x].minFccr))],
            ["Peak debt-equivalent leverage", ...keys.map((x) => fmtX(peakLev(x)))],
            ["Minimum closing cash", ...keys.map((x) => fmtM(REF[x].minLiquidity))],
            ["FY5 exit EV", ...keys.map((x) => fmtM(REF[x].exit.enterpriseValue))],
            ["Analyst return/coverage screen", ...keys.map((x) => <Pill key={x} tone={REF[x].returnCoverageScreen ? "ok" : "bad"}>{REF[x].returnCoverageScreen ? "PASS" : "FAIL"}</Pill>)],
          ]} />
          <p className="mt-3 text-xs text-muted">Target return {fmtPct(tgt)} and the {fmtX(REF_A.minFccr)} coverage test are <strong>analyst assumptions</strong>, not Seacoast&apos;s disclosed hurdle or a covenant. Gross returns exclude fund fees, carry and investor taxes.</p>
        </div>
      </div>
    </section>
  );
}

function Track({ label, min, max, value, marker, markerLabel, fmt, extra }: { label: string; min: number; max: number; value: number; marker: number; markerLabel: string; fmt: (v: number) => string; extra?: { v: number; text: string } }) {
  const pos = (v: number) => `${Math.min(100, Math.max(0, ((v - min) / (max - min)) * 100))}%`;
  return (
    <div className="mb-10">
      <div className="flex items-baseline justify-between">
        <span className="font-mono text-[0.68rem] uppercase tracking-[0.14em] text-muted">{label}</span>
        <span className="num text-3xl text-navy-900"><AnimatedNumber value={value} format={fmt} /></span>
      </div>
      <div className="relative mt-5 h-px bg-white/25">
        <span className="absolute -top-3 h-6 w-px bg-bad" style={{ left: pos(marker) }} />
        <span className="num absolute top-4 -translate-x-1/2 whitespace-nowrap text-[0.65rem] text-bad" style={{ left: pos(marker) }}>{markerLabel}</span>
        {extra && <span className="num absolute -top-6 -translate-x-1/2 whitespace-nowrap text-[0.65rem] text-muted" style={{ left: pos(extra.v) }}>{extra.text}</span>}
        {extra && <span className="absolute -top-[3px] h-[7px] w-[7px] -translate-x-1/2 rounded-full bg-muted" style={{ left: pos(extra.v) }} />}
        <motion.span className="absolute -top-[7px] h-[15px] w-[15px] -translate-x-1/2 rounded-full bg-champagne shadow-[0_0_0_4px_rgba(200,173,122,.2)]" animate={{ left: pos(value) }} transition={{ duration: 0.5, ease: EASE }} />
      </div>
    </div>
  );
}

function Tradeoff() {
  const [w, setW] = useState(REF_A.warrant * 100);
  const { irr, downFccr, baseFccr } = useMemo(() => {
    const wf = w / 100;
    return {
      irr: warrantSensitivity(REF_A, REF.base, [wf])[0].irr,
      downFccr: runCase({ ...REF_A, warrant: wf }, REF_S.downside).minFccr,
      baseFccr: runCase({ ...REF_A, warrant: wf }, REF_S.base).minFccr,
    };
  }, [w]);
  return (
    <section className="dark-surface bg-grid relative overflow-hidden">
      <div className="mx-auto max-w-[88rem] px-4 py-16 sm:px-8 sm:py-24">
        <SectionHead no="04" label="The central tradeoff" title={["More warrant lifts the return.", <em key="e">It does not lift the coverage.</em>]}>
          Equity participation pays out at exit. Fixed charges are paid every year. Move the slider: only one of the two gauges responds.
        </SectionHead>
        <div className="grid gap-12 lg:grid-cols-[1fr_1.1fr] lg:gap-20">
          <div>
            <label htmlFor="w-slider" className="font-mono text-[0.68rem] uppercase tracking-[0.14em] text-muted">Warrant participation</label>
            <div className="mt-2 flex items-center gap-4">
              <input id="w-slider" type="range" min={0} max={12} step={0.5} value={w} onChange={(e) => setW(Number(e.target.value))} className="h-1 flex-1 cursor-pointer accent-[#c8ad7a]" />
              <span className="num w-16 text-right text-2xl text-navy-900">{w.toFixed(1)}%</span>
            </div>
            <p className="mt-6 text-sm leading-relaxed text-muted" aria-live="polite">
              At {w.toFixed(1)}% the base-case gross IRR is <strong className="text-navy-900">{fmtPct(irr)}</strong>, {irr >= REF_A.targetIrr ? "above" : "below"} the {fmtPct(REF_A.targetIrr)} analyst target. The downside case still posts a minimum coverage of <strong className="text-navy-900">{fmtX(downFccr)}</strong>, {downFccr >= REF_A.minFccr ? "above" : "below"} the {fmtX(REF_A.minFccr)} test. Both figures are recalculated by the model engine.
            </p>
            <Link href="/pricing" className="btn btn-ghost mt-8">Open the Pricing Lab <span className="arrow" aria-hidden="true">→</span></Link>
          </div>
          <div className="border border-rule bg-card/60 p-5 sm:p-8">
            <Track label="Investor return · base gross IRR" min={0.1} max={0.18} value={irr} marker={REF_A.targetIrr} markerLabel={`${fmtPct(REF_A.targetIrr)} target`} fmt={fmtPct} />
            <Track label="Company credit · downside min FCCR" min={1.0} max={1.6} value={downFccr} marker={REF_A.minFccr} markerLabel={`${fmtX(REF_A.minFccr)} test`} fmt={fmtX} extra={{ v: baseFccr, text: `base ${fmtX(baseFccr)}` }} />
            <p className="text-xs text-muted">Analyst assumptions throughout; neither is a Seacoast hurdle or a covenant.</p>
          </div>
        </div>
      </div>
    </section>
  );
}

function Decision() {
  const critical = DILIGENCE.filter((q) => q.priority === "CRITICAL");
  const reasons = [
    `Upside-case gross IRR of ${fmtPct(REF.upside.irr)} is below the ${fmtPct(REF_A.targetIrr)} analyst target, so all three cases fall short.`,
    `Downside-case minimum fixed-charge coverage of ${fmtX(REF.downside.minFccr)} is below the ${fmtX(REF_A.minFccr)} analyst test.`,
    "NFS financials, ownership and financing need are unverified; every input is an analyst assumption.",
  ];
  return (
    <section className="bg-paper">
      <div className="mx-auto max-w-[88rem] px-4 py-16 sm:px-8 sm:py-28">
        <SectionHead no="05" label="Investment decision" title={["DO NOT INVEST", <em key="e">AS PRICED.</em>]}>
          This refers <strong>only to the illustrative structure</strong> modeled here. It is not a finding about NFS&apos;s actual creditworthiness, and no investment, term sheet or management approach is proposed.
        </SectionHead>
        <div className="grid gap-10 lg:grid-cols-2 lg:gap-20">
          <Reveal>
            <p className="eyebrow">Analyst position</p>
            <p className="mt-2 font-serif text-2xl leading-snug sm:text-3xl">{H.research_decision.position}</p>
            <ol className="mt-6 space-y-3 text-sm leading-relaxed">
              {reasons.map((t, i) => <li key={i} className="flex gap-3"><span className="num text-accent">{String(i + 1).padStart(2, "0")}</span><span>{t}</span></li>)}
            </ol>
            <p className="mt-6 border-l-2 border-champagne-700 pl-4 text-sm leading-relaxed text-muted"><strong className="text-ink">Possible response:</strong> {H.research_decision.possible_response}</p>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="eyebrow">Critical unresolved diligence ({critical.length})</p>
            <ul className="mt-3 divide-y divide-rule border-y border-rule text-sm">
              {critical.map((q) => (
                <li key={q.id} className="flex gap-3 py-3"><span className="num font-semibold">{q.id}</span><span><strong>{q.workstream}:</strong> {q.evidence_needed}. <span className="text-muted">{q.rationale}.</span></span></li>
              ))}
            </ul>
            <Link href="/diligence" className="mt-4 inline-block font-mono text-xs uppercase tracking-widest">All {DILIGENCE.length} diligence items →</Link>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

function Explore() {
  const items = [
    ["/operating", "Operating underwriting", "Five-year projections, scenario drivers, coverage and leverage."],
    ["/capital", "Capital structure", "Edit the package in a sandbox; the stack and waterfall respond."],
    ["/returns", "Investor returns", "Annual cash flows, exit waterfall, gross IRR and MOIC."],
    ["/pricing", "Pricing lab", "Reprice terms and see returns and credit move separately."],
    ["/diligence", "Risk and diligence", "Register and checklist of what must be proven."],
    ["/evidence", "Evidence library", "Every source, its classification and its limits."],
    ["/documents", "Documents", "The original memo, brief, workbook and register."],
  ];
  return (
    <section className="dark-surface bg-grid">
      <div className="mx-auto max-w-[88rem] px-4 py-16 sm:px-8 sm:py-24">
        <SectionHead no="06" label="Explore the analysis" title={["Go behind", <em key="e">the numbers.</em>]} />
        <nav aria-label="Explore modules">
          {items.map(([href, t, d], i) => (
            <Reveal key={href} delay={i * 0.04} y={12}>
              <Link href={href} className="row-link">
                <span className="num text-xs text-muted">{String(i + 1).padStart(2, "0")}</span>
                <span className="font-serif text-2xl sm:text-4xl">{t}</span>
                <span className="hidden max-w-sm text-sm text-muted md:block">{d}</span>
                <span className="arrow" aria-hidden="true">→</span>
              </Link>
            </Reveal>
          ))}
          <div className="border-t border-rule" />
        </nav>
      </div>
    </section>
  );
}

export default function Landing() {
  return (
    <>
      <Hero />
      <Fade to="light" />
      <Opportunity />
      <Fade to="dark" />
      <Package />
      <Fade to="light" />
      <Scenarios />
      <Fade to="dark" />
      <Tradeoff />
      <Fade to="light" />
      <Decision />
      <Fade to="dark" />
      <Explore />
    </>
  );
}
