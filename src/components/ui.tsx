"use client";
import { useEffect, useId, useState, type ReactNode } from "react";
import { useSandbox } from "@/lib/sandbox";
import { LABEL_STYLE, type Label } from "@/lib/research";
import { Headline, Reveal, Rule } from "./motion";
import { motion } from "motion/react";
import type { ScenarioKey } from "@/lib/engine";
import { SCN_LABEL } from "@/lib/reference";

export const Card = ({ title, children, className = "", id }: { title?: ReactNode; children: ReactNode; className?: string; id?: string }) => (
  <section id={id} className={`surface border border-rule bg-card p-4 sm:p-6 ${className}`}>
    {title && <h2 className="mb-4 text-2xl">{title}</h2>}
    {children}
  </section>
);

export const PageTitle = ({ kicker, title, children }: { kicker: string; title: string; children?: ReactNode }) => (
  <header className="dark-surface bg-grid relative overflow-hidden border-b border-white/10">
    <div className="mx-auto max-w-[88rem] px-4 pb-10 pt-12 sm:px-8 sm:pb-14 sm:pt-16">
      <p className="eyebrow !text-champagne">{kicker}</p>
      <Rule className="mt-3 text-white" onMount />
      <Headline as="h1" onMount className="mt-6 max-w-5xl text-4xl sm:text-6xl lg:text-7xl" lines={[title]} />
      {children && <Reveal delay={0.35} className="mt-5 max-w-3xl text-sm leading-relaxed text-muted sm:text-base">{children}</Reveal>}
    </div>
  </header>
);

/** Content container that sits below the dark PageTitle band. */
export const Body = ({ children }: { children: ReactNode }) => (
  <div className="mx-auto max-w-[88rem] px-4 py-8 sm:px-8 sm:py-12">{children}</div>
);

export const Stat = ({ label, value, sub, tone }: { label: string; value: ReactNode; sub?: ReactNode; tone?: "bad" | "ok" }) => (
  <div className="border-l-2 border-teal-500 pl-3">
    <div className="font-mono text-[0.68rem] uppercase tracking-[0.12em] text-muted">{label}</div>
    <div className={`num text-xl font-semibold ${tone === "bad" ? "text-bad" : "text-navy-900"}`}>{value}</div>
    {sub && <div className="text-xs text-muted">{sub}</div>}
  </div>
);

export const Pill = ({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "bad" | "ok" | "warn" }) => {
  const t = { neutral: "bg-navy-100 text-navy-900", bad: "bg-bad/12 text-bad", ok: "bg-teal-500/15 text-teal-700", warn: "bg-warn/15 text-warn" }[tone];
  return <span className={`inline-block px-2 py-0.5 font-mono text-[0.68rem] font-semibold uppercase tracking-wider ${t}`}>{children}</span>;
};

export const LabelTag = ({ label }: { label: Label }) => (
  <span className={`inline-block whitespace-nowrap border px-1.5 py-0.5 font-mono text-[10px] font-bold tracking-wide ${LABEL_STYLE[label]}`}>{label}</span>
);

export const SourceTags = ({ ids }: { ids: string[] }) => (
  <>
    {ids.map((id) => (
      <a key={id} href={`/evidence?q=${id}`} className="num mr-1 bg-navy-100 px-1.5 py-0.5 text-[11px] font-semibold no-underline transition-colors hover:bg-teal-500/25" aria-label={`Source ${id}`}>
        {id}
      </a>
    ))}
  </>
);

/** Horizontally scrollable data table wrapper with caption for screen readers. */
export const DataTable = ({ caption, head, rows, rowHeader = true }: { caption: string; head: ReactNode[]; rows: ReactNode[][]; rowHeader?: boolean }) => (
  <div data-lenis-prevent className="relative overflow-x-auto" tabIndex={0} role="region" aria-label={caption}>
    <table className="num w-full min-w-[34rem] text-sm">
      <caption className="sr-only">{caption}</caption>
      <thead>
        <tr className="border-b border-navy-900/60 text-left font-mono text-[0.68rem] uppercase tracking-[0.1em] text-muted">
          {head.map((h, i) => (
            <th key={i} scope="col" className={`py-2 pr-3 font-semibold ${i > 0 ? "text-right" : ""}`}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={i} className="border-b border-rule transition-colors hover:bg-teal-500/10 focus-within:bg-teal-500/10">
            {r.map((c, j) =>
              j === 0 && rowHeader ? (
                <th key={j} scope="row" className="py-1.5 pr-3 text-left font-normal">{c}</th>
              ) : (
                <td key={j} className={`py-1.5 pr-3 ${j > 0 ? "text-right" : ""}`}>{c}</td>
              ),
            )}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

type Kind = "money" | "pct" | "x" | "int";
const toText = (v: number, k: Kind) => (Number.isFinite(v) ? String(Number(((k === "pct" ? v * 100 : v)).toPrecision(10))) : "");
const parse = (t: string, k: Kind) => (t.trim() === "" ? NaN : k === "pct" ? Number(t) / 100 : Number(t));

/** Labeled numeric input. Percent fields are typed as percent (11 = 11%). Model value is a decimal. */
export function NumField({ label, value, onChange, kind, error, hint, step = "any", className = "" }: {
  label: string; value: number; onChange: (v: number) => void; kind: Kind; error?: string; hint?: string; step?: string; className?: string;
}) {
  const id = useId();
  const [text, setText] = useState(toText(value, kind));
  useEffect(() => {
    // Sync when the model changes externally (e.g. Reset) without clobbering partial typing.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setText((t) => (parse(t, kind) === value ? t : Number.isNaN(value) && Number.isNaN(parse(t, kind)) ? t : toText(value, kind)));
  }, [value, kind]);
  const unit = { money: "$m", pct: "%", x: "x", int: "" }[kind];
  return (
    <div className={className}>
      <label htmlFor={id} className="block text-xs font-medium text-muted">{label}{unit && <span> ({unit})</span>}</label>
      <input
        id={id} inputMode="decimal" type="text" step={step} value={text} aria-invalid={!!error}
        aria-describedby={error ? `${id}-e` : hint ? `${id}-h` : undefined}
        onChange={(e) => { setText(e.target.value); onChange(parse(e.target.value, kind)); }}
        className={`num mt-1 w-full border bg-white px-2 py-1.5 text-sm text-ink-950 transition-[border-color,box-shadow] focus:border-teal-500 focus:shadow-[0_0_0_3px_rgba(79,157,147,.25)] focus:outline-none ${error ? "border-bad" : "border-rule"}`}
      />
      {error ? <p id={`${id}-e`} role="alert" className="mt-0.5 text-xs text-bad">{error}</p> : hint ? <p id={`${id}-h`} className="mt-0.5 text-xs text-muted">{hint}</p> : null}
    </div>
  );
}

export function SandboxBar() {
  const { modified, reset, issues, stale } = useSandbox();
  return (
    <div className={`mb-6 border p-3 text-sm transition-colors ${modified ? "border-warn bg-warn/10" : "border-rule bg-card"}`} role="status">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p>
          <strong>{modified ? "SANDBOX: edited assumptions" : "Sandbox: matches reference model"}</strong>
          <span className="text-muted"> Edits live only in this browser tab. The research files and the Excel model are never modified.</span>
        </p>
        <button type="button" onClick={reset} disabled={!modified} className="border border-navy-900/60 px-3 py-1 text-sm font-semibold text-navy-900 transition-colors hover:bg-navy-100 disabled:opacity-40">
          Reset to baseline
        </button>
      </div>
      {issues.length > 0 && (
        <div role="alert" className="mt-2 text-bad">
          {issues.length} invalid input{issues.length > 1 ? "s" : ""}{stale ? ": showing last valid results" : ""}. Fix the highlighted fields.
        </div>
      )}
    </div>
  );
}

export const ScreenPill = ({ pass, passText, failText }: { pass: boolean; passText: string; failText: string }) => (
  <Pill tone={pass ? "ok" : "bad"}>{pass ? passText : failText}</Pill>
);

export function ScenarioTabs({ value, onChange, className = "mb-4" }: { value: ScenarioKey; onChange: (k: ScenarioKey) => void; className?: string }) {
  const uid = useId();
  return (
    <div role="radiogroup" aria-label="Scenario" className={`${className} inline-flex border border-navy-900/50 bg-card p-0.5`}>
      {(["downside", "base", "upside"] as const).map((k) => (
        <button key={k} type="button" role="radio" aria-checked={value === k} onClick={() => onChange(k)}
          className={`relative px-5 py-2 font-mono text-xs font-semibold uppercase tracking-[0.12em] transition-colors ${value === k ? "text-white" : "text-navy-900 hover:text-teal-700"}`}>
          {value === k && <motion.span layoutId={`seg-${uid}`} className="absolute inset-0 bg-ink-900" transition={{ type: "spring", stiffness: 400, damping: 34 }} />}
          <span className="relative">{SCN_LABEL[k]}</span>
        </button>
      ))}
    </div>
  );
}
