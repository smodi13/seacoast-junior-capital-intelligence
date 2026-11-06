"use client";
import {
  Bar, BarChart, CartesianGrid, ComposedChart, Legend, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import type { ReactNode } from "react";

const NAVY = "#0b1f3a", TEAL = "#3f7f7a", SLATE = "#8a97a8", SAND = "#c9b98a", BAD = "#9b2c2c";
const axis = { fontSize: 12, fill: "#566274" };

export const ChartFrame = ({ title, children, h = 260 }: { title: string; children: ReactNode; h?: number }) => (
  <figure className="min-w-0" aria-label={title}>
    <figcaption className="mb-1 text-sm font-semibold text-navy-900">{title}</figcaption>
    <div style={{ height: h }}>
      <ResponsiveContainer width="100%" height="100%" minWidth={0}>{children as React.ReactElement}</ResponsiveContainer>
    </div>
  </figure>
);

export function IrrBars({ data, target }: { data: { name: string; irr: number }[]; target: number }) {
  return (
    <ChartFrame title="Gross investor IRR by scenario vs. analyst-assumed target">
      <BarChart data={data} margin={{ top: 16, right: 16, left: 0, bottom: 0 }}>
        <CartesianGrid stroke="#e4dfd2" vertical={false} />
        <XAxis dataKey="name" tick={axis} />
        <YAxis tick={axis} tickFormatter={(v) => `${(v * 100).toFixed(0)}%`} domain={[0, Math.max(0.2, target * 1.15)]} />
        <Tooltip formatter={(v) => `${(Number(v) * 100).toFixed(1)}%`} />
        <ReferenceLine y={target} stroke={BAD} strokeDasharray="5 4" label={{ value: `Analyst target ${(target * 100).toFixed(0)}% (assumption)`, position: "insideTopLeft", fontSize: 11, fill: BAD }} />
        <Bar isAnimationActive={false} dataKey="irr" name="Gross IRR" fill={NAVY} />
      </BarChart>
    </ChartFrame>
  );
}

/** Claims at exit, stacked by seniority, vs. enterprise value. */
export function ClaimsStack({ data }: { data: { name: string; Senior: number; Subordinated: number; "Preferred (accreted)": number; Common: number }[] }) {
  return (
    <ChartFrame title="FY5 exit: claims by seniority ($m)">
      <BarChart data={data} layout="vertical" margin={{ left: 8, right: 16 }}>
        <CartesianGrid stroke="#e4dfd2" horizontal={false} />
        <XAxis type="number" tick={axis} />
        <YAxis type="category" dataKey="name" tick={axis} width={70} />
        <Tooltip formatter={(v) => `$${Number(v).toFixed(2)}m`} />
        <Legend />
        <Bar isAnimationActive={false} dataKey="Senior" stackId="a" fill={SLATE} />
        <Bar isAnimationActive={false} dataKey="Subordinated" stackId="a" fill={NAVY} />
        <Bar isAnimationActive={false} dataKey="Preferred (accreted)" stackId="a" fill={TEAL} />
        <Bar isAnimationActive={false} dataKey="Common" stackId="a" fill={SAND} />
      </BarChart>
    </ChartFrame>
  );
}

export interface WfStep { name: string; value: number; kind: "total" | "up" | "down" }
/** Floating-bar waterfall using native range bars ([low, high] per step). */
export function Waterfall({ steps, title }: { steps: WfStep[]; title: string }) {
  const data = steps.reduce<{ name: string; range: [number, number]; v: number; fill: string; end: number }[]>((acc, s) => {
    const run = acc.length ? acc[acc.length - 1].end : 0;
    if (s.kind === "total") return [...acc, { name: s.name, range: [0, s.value], v: s.value, fill: NAVY, end: s.value }];
    if (s.kind === "up") return [...acc, { name: s.name, range: [run, run + s.value], v: s.value, fill: TEAL, end: run + s.value }];
    return [...acc, { name: s.name, range: [Math.max(0, run - s.value), run], v: s.value, fill: SLATE, end: run - s.value }];
  }, []);
  return (
    <ChartFrame title={title} h={300}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 28 }}>
        <CartesianGrid stroke="#e4dfd2" vertical={false} />
        <XAxis dataKey="name" tick={{ ...axis, fontSize: 11 }} interval={0} angle={-25} textAnchor="end" height={60} />
        <YAxis tick={axis} />
        <Tooltip formatter={(_v, _n, item) => `$${Number((item.payload as { v: number }).v).toFixed(2)}m`} />
        <Bar isAnimationActive={false} dataKey="range" name="$m" />
      </BarChart>
    </ChartFrame>
  );
}

export function FlowBars({ data }: { data: { name: string; Coupon: number; "Pref cash": number; "Exit proceeds": number; Outflow: number }[] }) {
  return (
    <ChartFrame title="Annual investor cash flows ($m)">
      <BarChart data={data} margin={{ left: 0, right: 8 }} stackOffset="sign">
        <CartesianGrid stroke="#e4dfd2" vertical={false} />
        <XAxis dataKey="name" tick={axis} />
        <YAxis tick={axis} />
        <Tooltip formatter={(v) => `$${Number(v).toFixed(2)}m`} />
        <Legend />
        <Bar isAnimationActive={false} dataKey="Outflow" stackId="f" fill={BAD} />
        <Bar isAnimationActive={false} dataKey="Coupon" stackId="f" fill={NAVY} />
        <Bar isAnimationActive={false} dataKey="Pref cash" stackId="f" fill={TEAL} />
        <Bar isAnimationActive={false} dataKey="Exit proceeds" stackId="f" fill={SAND} />
      </BarChart>
    </ChartFrame>
  );
}

export function OperatingChart({ data }: { data: { name: string; Revenue: number; EBITDA: number; "FCCR (x)": number }[] }) {
  return (
    <ChartFrame title="Revenue, EBITDA ($m) and fixed-charge coverage (x)">
      <ComposedChart data={data} margin={{ left: 0, right: 8 }}>
        <CartesianGrid stroke="#e4dfd2" vertical={false} />
        <XAxis dataKey="name" tick={axis} />
        <YAxis yAxisId="l" tick={axis} />
        <YAxis yAxisId="r" orientation="right" tick={axis} domain={[0, "auto"]} />
        <Tooltip formatter={(v) => Number(v).toFixed(2)} />
        <Legend />
        <Bar isAnimationActive={false} yAxisId="l" dataKey="Revenue" fill={SLATE} />
        <Bar isAnimationActive={false} yAxisId="l" dataKey="EBITDA" fill={NAVY} />
        <Line isAnimationActive={false} yAxisId="r" dataKey="FCCR (x)" stroke={TEAL} strokeWidth={2} dot />
      </ComposedChart>
    </ChartFrame>
  );
}

export function SensitivityLine({ data, target }: { data: { w: string; irr: number }[]; target: number }) {
  return (
    <ChartFrame title="Gross IRR vs. warrant participation">
      <LineChart data={data} margin={{ top: 12, left: 0, right: 16 }}>
        <CartesianGrid stroke="#e4dfd2" vertical={false} />
        <XAxis dataKey="w" tick={axis} />
        <YAxis tick={axis} tickFormatter={(v) => `${(v * 100).toFixed(0)}%`} domain={["auto", "auto"]} />
        <Tooltip formatter={(v) => `${(Number(v) * 100).toFixed(1)}%`} />
        <ReferenceLine y={target} stroke={BAD} strokeDasharray="5 4" label={{ value: "Analyst target (assumption)", fontSize: 11, fill: BAD, position: "insideBottomRight" }} />
        <Line isAnimationActive={false} dataKey="irr" name="Gross IRR" stroke={NAVY} strokeWidth={2} dot />
      </LineChart>
    </ChartFrame>
  );
}
