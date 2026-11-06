"use client";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { fmtM, fmtPct } from "@/lib/format";
import type { Assumptions, CaseResult } from "@/lib/engine";

export type LayerKey = "common" | "pref" | "sub" | "senior";

const HATCH = "repeating-linear-gradient(135deg, rgba(255,255,255,.16) 0 2px, transparent 2px 7px)";
const EASE = [0.16, 1, 0.3, 1] as const;

interface Props {
  a: Assumptions;
  /** Base-case result from the validated engine (used for FY5 accreted preferred and exit residual). */
  r: CaseResult;
  selected?: LayerKey;
  onSelect?: (k: LayerKey) => void;
  heightRem?: number;
}

export default function CapitalStack({ a, r, selected, onSelect, heightRem = 24 }: Props) {
  const [inner, setInner] = useState<LayerKey>("sub");
  const sel = selected ?? inner;
  const pick = (k: LayerKey) => { setInner(k); onSelect?.(k); };
  const total = a.seniorDebt + a.subDebt + a.pref;
  const pct = (v: number) => (total > 0 ? Math.max(0, (v / total) * 100) : 0);
  const newCap = a.subDebt + a.pref;

  const layers: { key: LayerKey; name: string; amt: number; label: string; bar: string; rank: number; delay: number }[] = [
    { key: "pref", name: "Preferred equity", amt: a.pref, label: "New capital", bar: "#4f9d93", rank: 3, delay: 0.45 },
    { key: "sub", name: "Subordinated debt", amt: a.subDebt, label: "New capital", bar: "#c8ad7a", rank: 2, delay: 0.3 },
    { key: "senior", name: "Senior debt", amt: a.seniorDebt, label: "Existing, rolled over", bar: "#6b7c93", rank: 1, delay: 0.15 },
  ];

  const detail: Record<LayerKey, { title: string; body: string }> = {
    senior: {
      title: "1 · Senior debt: existing, not part of the new commitment",
      body: `Paid first. ${fmtPct(a.seniorRate)} cash interest on the opening balance and ${fmtM(a.seniorAmort)} of scheduled principal a year, taking ${fmtM(a.seniorDebt)} to ${fmtM(r.seniorClose[5])} by FY5. Illustrative: the actual senior facility is unverified (Q04).`,
    },
    sub: {
      title: "2 · Subordinated debt: new capital",
      body: `Ranks behind senior debt, ahead of equity. Current cash pay: ${fmtPct(a.subCoupon)} = ${fmtM(a.subDebt * a.subCoupon)} a year. No PIK. The ${fmtM(a.subDebt)} principal is repaid at exit, after senior debt.`,
    },
    pref: {
      title: "3 · Preferred equity: new capital",
      body: `Ranks behind all debt, ahead of common. Cash dividend ${fmtPct(a.prefCash)} on the original ${fmtM(a.pref)} (${fmtM(a.pref * a.prefCash)} a year), plus ${fmtPct(a.prefPik)} PIK accrual on the beginning claim, so the redemption claim accretes to ${fmtM(r.prefClose[5])} by FY5.`,
    },
    common: {
      title: "4 · Common equity: residual claim",
      body: `Last in line; value is not verified. In the modeled base case, FY5 exit value less senior, subordinated and accreted preferred claims leaves ${fmtM(r.exit.commonResidual)}. The investor's penny warrant takes ${fmtPct(a.warrant)} of it (${fmtM(r.exit.warrantProceeds)}).`,
    },
  };

  return (
    <div>
      <div className="relative" style={{ ["--h" as string]: `${heightRem}rem` }}>
        {/* common equity: unsized residual claim */}
        <motion.button type="button" aria-pressed={sel === "common"} onClick={() => pick("common")} onMouseEnter={() => pick("common")}
          initial={{ opacity: 0, y: -16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.7, delay: 0.6, ease: EASE }}
          className={`mb-2 flex w-full items-center gap-3 border border-dashed px-3 py-3 text-left transition-colors ${sel === "common" ? "border-champagne bg-champagne/10" : "border-rule hover:border-teal-500"}`}>
          <span className="num text-xs text-muted">4</span>
          <span className="text-sm"><strong>Common equity</strong> <span className="text-muted">· residual, unsized at close · investor warrant {fmtPct(a.warrant)}</span></span>
        </motion.button>

        <div className="relative flex" style={{ height: "var(--h)" }}>
          {/* bracket: new capital */}
          <div className="relative mr-2 w-5 shrink-0" aria-hidden="true">
            <motion.div className="absolute left-2 top-0 w-2 border-y border-l border-champagne" animate={{ height: `${pct(newCap)}%` }} transition={{ duration: 0.7, ease: EASE }} />
          </div>
          <div className="flex min-w-0 flex-1 flex-col">
            {layers.map((l) => (
              <motion.button key={l.key} type="button" aria-pressed={sel === l.key} onClick={() => pick(l.key)} onMouseEnter={() => pick(l.key)}
                aria-label={`${l.name}, ${fmtM(l.amt)}, seniority rank ${l.rank}`}
                initial={{ opacity: 0, y: -26 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                animate={{ height: `${pct(l.amt)}%` }} transition={{ duration: 0.7, delay: l.delay, ease: EASE }}
                className="group relative flex w-full items-center gap-3 text-left" style={{ minHeight: l.amt > 0 ? "2.6rem" : 0 }}>
                <span className="relative block h-[calc(100%-3px)] w-[42%] shrink-0 transition-[filter,box-shadow] group-hover:brightness-110"
                  style={{ background: l.bar, boxShadow: sel === l.key ? `0 0 0 2px var(--color-card), 0 0 0 3px ${l.bar}` : "none" }}>
                  {l.key === "senior" && <span className="absolute inset-0" style={{ background: HATCH }} />}
                </span>
                <motion.span aria-hidden="true" className="hidden h-px flex-1 origin-left bg-current opacity-40 sm:block" initial={{ scaleX: 0 }} whileInView={{ scaleX: 1 }} viewport={{ once: true }} transition={{ duration: 0.8, delay: l.delay + 0.4, ease: EASE }} />
                <span className="min-w-0 text-sm leading-tight">
                  <span className="num mr-1 text-xs text-muted">{l.rank}</span>
                  <strong>{l.name}</strong>
                  <span className="num block text-base">{fmtM(l.amt)}</span>
                  <span className="block text-[0.7rem] text-muted">{l.label}</span>
                </span>
              </motion.button>
            ))}
          </div>
        </div>
        <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[0.7rem] text-muted">
          <span className="flex items-center gap-1.5"><i className="inline-block h-2.5 w-2.5" style={{ background: "#6b7c93" }} />Existing senior</span>
          <span className="flex items-center gap-1.5"><i className="inline-block h-2.5 w-2.5" style={{ background: "#c8ad7a" }} />Sub debt</span>
          <span className="flex items-center gap-1.5"><i className="inline-block h-2.5 w-2.5" style={{ background: "#4f9d93" }} />Preferred</span>
          <span className="flex items-center gap-1.5"><i className="inline-block h-2.5 w-2.5 border border-champagne" />New capital {fmtM(newCap)}</span>
          <span>Seniority 1 (paid first) → 4 (paid last)</span>
        </p>
      </div>

      <div className="mt-4 min-h-[7.5rem] border-t border-rule pt-3" aria-live="polite">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div key={sel} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.22 }}>
            <p className="font-mono text-[0.7rem] uppercase tracking-[0.12em] text-teal-700">{detail[sel].title}</p>
            <p className="mt-1 text-sm leading-relaxed">{detail[sel].body}</p>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
