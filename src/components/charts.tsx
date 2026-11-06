"use client";
import { useReducedMotion } from "motion/react";
import { useId, type ReactNode } from "react";
import {
  Area, Bar, BarChart, CartesianGrid, ComposedChart, Legend, Line, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";

const INK = "#0a1628", TEAL = "#4f9d93", SLATE = "#8493a8", CHAMP = "#b8995a", BAD = "#a43a32", POS = "#2f7d5b";
export const PALETTE = { INK, TEAL, SLATE, CHAMP, BAD, POS };
const tick = { fontSize: 11, fill: "#566171", fontFamily: "var(--font-data), ui-monospace, monospace" };
const grid = <CartesianGrid stroke="rgba(16,24,38,.09)" strokeWidth={1} vertical={false} />;

function useAnim() {
  const reduce = useReducedMotion();
  return { isAnimationActive: !reduce, animationDuration: 900, animationEasing: "ease-out" as const };
}

type TipItem = { name?: string; value?: unknown; color?: string; dataKey?: string; payload?: Record<string, unknown> };
/** Institutional tooltip: hairline box, mono numbers, formatted by the caller (never raw). */
function Tip({ active, payload, label, fmt }: { active?: boolean; payload?: TipItem[]; label?: string; fmt: (v: number, key?: string) => string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="border border-ink-900/40 bg-[#fbfaf6] px-3 py-2 text-xs shadow-lg">
      {label && <p className="mb-1 font-mono text-[0.65rem] uppercase tracking-wider text-muted">{label}</p>}
      {payload.map((p, i) => {
        const raw = p.payload?.__v;
        const v = typeof raw === "number" ? raw : Array.isArray(p.value) ? NaN : Number(p.value);
        return Number.isNaN(v) ? null : (
          <p key={i} className="flex items-center gap-2"><i className="inline-block h-2 w-2" style={{ background: p.color }} /><span className="text-muted">{p.name}</span><span className="num ml-auto pl-3 text-ink-950">{fmt(v, p.dataKey)}</span></p>
        );
      })}
    </div>
  );
}

/** Keyboard-reachable text alternative for every chart. */
function DataDetails({ cols, rows }: { cols: string[]; rows: ReactNode[][] }) {
  return (
    <details className="mt-2 text-xs">
      <summary className="inline-block cursor-pointer font-mono uppercase tracking-wider text-teal-700 hover:underline">View chart data</summary>
      <div data-lenis-prevent className="relative mt-2 overflow-x-auto" tabIndex={0} role="region" aria-label="Chart data table">
        <table className="num w-full min-w-[20rem]">
          <thead><tr className="border-b border-rule text-left text-muted">{cols.map((c, i) => <th key={i} scope="col" className={`py-1 pr-3 font-normal ${i ? "text-right" : ""}`}>{c}</th>)}</tr></thead>
          <tbody>{rows.map((r, i) => <tr key={i} className="border-b border-rule/60">{r.map((c, j) => (j === 0 ? <th key={j} scope="row" className="py-1 pr-3 text-left font-normal">{c}</th> : <td key={j} className="py-1 pr-3 text-right">{c}</td>))}</tr>)}</tbody>
        </table>
      </div>
    </details>
  );
}

export function ChartFrame({ title, summary, children, h = 260, details }: { title: string; summary?: string; children: ReactNode; h?: number; details?: ReactNode }) {
  const id = useId();
  return (
    <figure className="min-w-0" aria-labelledby={id}>
      <figcaption id={id} className="mb-2 font-mono text-[0.68rem] uppercase tracking-[0.12em] text-muted">{title}</figcaption>
      <div style={{ height: h }} role="img" aria-label={summary ? `${title}. ${summary}` : title}>
        <ResponsiveContainer width="100%" height="100%" minWidth={0}>{children as React.ReactElement}</ResponsiveContainer>
      </div>
      {details}
    </figure>
  );
}

const pct0 = (v: number) => `${(v * 100).toFixed(0)}%`;
const pct1 = (v: number) => `${(v * 100).toFixed(1)}%`;
const usd = (v: number) => `$${v.toFixed(2)}m`;
const xf = (v: number) => `${v.toFixed(2)}x`;

export function IrrBars({ data, target, selected }: { data: { name: string; irr: number }[]; target: number; selected?: string }) {
  const a = useAnim();
  const rows = data.map((d) => ({ ...d, __v: d.irr, fill: selected && d.name !== selected ? "#b9c1cd" : INK }));
  return (
    <ChartFrame title="Gross investor IRR vs analyst-assumed target" summary={`Gross IRR: ${data.map((d) => `${d.name} ${pct1(d.irr)}`).join(", ")}. Analyst target ${pct1(target)} (assumption).`}
      details={<DataDetails cols={["Scenario", "Gross IRR"]} rows={data.map((d) => [d.name, pct1(d.irr)])} />}>
      <BarChart data={rows} margin={{ top: 22, right: 8, left: 0, bottom: 0 }}>
        {grid}
        <XAxis dataKey="name" tick={tick} axisLine={{ stroke: "rgba(16,24,38,.4)" }} tickLine={false} />
        <YAxis tick={tick} tickFormatter={pct0} domain={[0, Math.max(0.2, target * 1.15)]} axisLine={false} tickLine={false} width={40} />
        <Tooltip cursor={{ fill: "rgba(16,24,38,.05)" }} content={<Tip fmt={pct1} />} />
        <ReferenceLine y={target} stroke={BAD} strokeDasharray="4 4" label={{ value: `Analyst target ${pct0(target)} (assumption)`, position: "insideTopLeft", fontSize: 10, fill: BAD, fontFamily: "var(--font-data)" }} />
        <Bar dataKey="irr" name="Gross IRR" maxBarSize={72} {...a} />
      </BarChart>
    </ChartFrame>
  );
}

export function ClaimsStack({ data }: { data: { name: string; Senior: number; Subordinated: number; "Preferred (accreted)": number; Common: number }[] }) {
  const a = useAnim();
  const keys = ["Senior", "Subordinated", "Preferred (accreted)", "Common"] as const;
  const col = [SLATE, INK, TEAL, CHAMP];
  return (
    <ChartFrame title="FY5 exit: claims by seniority ($m)" summary={data.map((d) => `${d.name}: senior ${usd(d.Senior)}, subordinated ${usd(d.Subordinated)}, preferred ${usd(d["Preferred (accreted)"])}, common ${usd(d.Common)}`).join(". ")}
      details={<DataDetails cols={["Scenario", ...keys]} rows={data.map((d) => [d.name, ...keys.map((k) => usd(d[k]))])} />}>
      <BarChart data={data} layout="vertical" margin={{ left: 8, right: 16 }}>
        <CartesianGrid stroke="rgba(16,24,38,.09)" horizontal={false} />
        <XAxis type="number" tick={tick} axisLine={false} tickLine={false} />
        <YAxis type="category" dataKey="name" tick={tick} width={72} axisLine={false} tickLine={false} />
        <Tooltip cursor={{ fill: "rgba(16,24,38,.05)" }} content={<Tip fmt={usd} />} />
        <Legend wrapperStyle={{ fontSize: 11 }} />
        {keys.map((k, i) => <Bar key={k} dataKey={k} stackId="a" fill={col[i]} {...a} />)}
      </BarChart>
    </ChartFrame>
  );
}

export interface WfStep { name: string; value: number; kind: "total" | "up" | "down" }
/** Floating-bar waterfall using native range bars ([low, high] per step). */
export function Waterfall({ steps, title, h = 300 }: { steps: WfStep[]; title: string; h?: number }) {
  const a = useAnim();
  const data = steps.reduce<{ name: string; range: [number, number]; __v: number; fill: string; end: number }[]>((acc, s) => {
    const run = acc.length ? acc[acc.length - 1].end : 0;
    if (s.kind === "total") return [...acc, { name: s.name, range: [0, s.value], __v: s.value, fill: INK, end: s.value }];
    if (s.kind === "up") return [...acc, { name: s.name, range: [run, run + s.value], __v: s.value, fill: TEAL, end: run + s.value }];
    return [...acc, { name: s.name, range: [Math.max(0, run - s.value), run], __v: -s.value, fill: SLATE, end: run - s.value }];
  }, []);
  return (
    <ChartFrame title={title} h={h} summary={steps.map((s) => `${s.name} ${usd(s.value)}`).join(", ")}
      details={<DataDetails cols={["Step", "$m"]} rows={steps.map((s) => [s.name, `${s.kind === "down" ? "−" : ""}${s.value.toFixed(2)}`])} />}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 28 }}>
        {grid}
        <XAxis dataKey="name" tick={{ ...tick, fontSize: 10 }} interval={0} angle={-25} textAnchor="end" height={64} axisLine={{ stroke: "rgba(16,24,38,.4)" }} tickLine={false} />
        <YAxis tick={tick} axisLine={false} tickLine={false} width={40} />
        <Tooltip cursor={{ fill: "rgba(16,24,38,.05)" }} content={<Tip fmt={(v) => `${v < 0 ? "−" : ""}${usd(Math.abs(v))}`} />} />
        <Bar dataKey="range" name="$m" maxBarSize={56} {...a} />
      </BarChart>
    </ChartFrame>
  );
}

export interface Series { key: string; label: string; color: string; kind: "bar" | "line" | "area"; stack?: string; axis?: "l" | "r" }
/** Generic institutional series chart (bars, lines, areas; optional right axis and reference line). */
export function SeriesChart({ title, data, series, fmt, fmtR, refLine, h = 260, summary, xKey = "name", domainR }: {
  title: string; data: Record<string, string | number>[]; series: Series[]; fmt: (v: number) => string; fmtR?: (v: number) => string;
  refLine?: { y: number; label: string; axis?: "l" | "r" }; h?: number; summary?: string; xKey?: string; domainR?: [number | string, number | string];
}) {
  const a = useAnim();
  const hasR = series.some((s) => s.axis === "r");
  const f = (v: number, key?: string) => (series.find((s) => s.key === key)?.axis === "r" ? (fmtR ?? fmt)(v) : fmt(v));
  const auto = summary ?? `${data.map((d) => `${d[xKey]}: ${series.map((s) => `${s.label} ${f(Number(d[s.key]), s.key)}`).join("; ")}`).join(". ")}`;
  return (
    <ChartFrame title={title} h={h} summary={auto}
      details={<DataDetails cols={["Period", ...series.map((s) => s.label)]} rows={data.map((d) => [String(d[xKey]), ...series.map((s) => f(Number(d[s.key]), s.key))])} />}>
      <ComposedChart data={data} margin={{ top: 12, right: hasR ? 4 : 12, left: 0, bottom: 0 }}>
        {grid}
        <XAxis dataKey={xKey} tick={tick} axisLine={{ stroke: "rgba(16,24,38,.4)" }} tickLine={false} />
        <YAxis yAxisId="l" tick={tick} tickFormatter={(v) => fmt(v).replace(/m$/, "")} axisLine={false} tickLine={false} width={46} />
        {hasR && <YAxis yAxisId="r" orientation="right" tick={tick} tickFormatter={(v) => (fmtR ?? fmt)(v)} axisLine={false} tickLine={false} width={42} domain={domainR ?? [0, "auto"]} />}
        <Tooltip cursor={{ fill: "rgba(16,24,38,.05)" }} content={<Tip fmt={f} />} />
        <Legend wrapperStyle={{ fontSize: 11, fontFamily: "var(--font-ui)" }} />
        {refLine && <ReferenceLine yAxisId={refLine.axis ?? "l"} y={refLine.y} stroke={BAD} strokeDasharray="4 4" label={{ value: refLine.label, position: "insideTopRight", fontSize: 10, fill: BAD, fontFamily: "var(--font-data)" }} />}
        {series.map((s) => {
          const id = s.axis ?? "l";
          if (s.kind === "bar") return <Bar key={s.key} yAxisId={id} dataKey={s.key} name={s.label} fill={s.color} stackId={s.stack} maxBarSize={44} {...a} />;
          if (s.kind === "area") return <Area key={s.key} yAxisId={id} dataKey={s.key} name={s.label} stroke={s.color} fill={s.color} fillOpacity={0.18} strokeWidth={2} type="monotone" {...a} />;
          return <Line key={s.key} yAxisId={id} dataKey={s.key} name={s.label} stroke={s.color} strokeWidth={2} dot={{ r: 3, fill: s.color }} type="monotone" {...a} />;
        })}
      </ComposedChart>
    </ChartFrame>
  );
}

export function FlowBars({ data }: { data: { name: string; Coupon: number; "Pref cash": number; "Exit proceeds": number; Outflow: number }[] }) {
  return (
    <SeriesChart title="Annual investor cash flows ($m)" data={data} fmt={usd}
      series={[
        { key: "Outflow", label: "Investment", color: BAD, kind: "bar", stack: "f" },
        { key: "Coupon", label: "Sub coupon", color: INK, kind: "bar", stack: "f" },
        { key: "Pref cash", label: "Pref cash", color: TEAL, kind: "bar", stack: "f" },
        { key: "Exit proceeds", label: "Exit proceeds", color: CHAMP, kind: "bar", stack: "f" },
      ]} />
  );
}

export function OperatingChart({ data }: { data: { name: string; Revenue: number; EBITDA: number; "FCCR (x)": number }[] }) {
  return (
    <SeriesChart title="Revenue and EBITDA ($m), fixed-charge coverage (x)" data={data} fmt={usd} fmtR={xf}
      series={[
        { key: "Revenue", label: "Revenue", color: SLATE, kind: "bar" },
        { key: "EBITDA", label: "EBITDA", color: INK, kind: "bar" },
        { key: "FCCR (x)", label: "FCCR", color: CHAMP, kind: "line", axis: "r" },
      ]} />
  );
}

export function SensitivityLine({ data, target }: { data: { w: string; irr: number }[]; target: number }) {
  return (
    <SeriesChart title="Gross IRR vs warrant participation" xKey="w" data={data.map((d) => ({ ...d }))} fmt={pct1}
      series={[{ key: "irr", label: "Gross IRR", color: INK, kind: "line" }]}
      refLine={{ y: target, label: "Analyst target (assumption)" }} />
  );
}
