"use client";
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { baselineAssumptions, baselineScenarios } from "./baseline";
import {
  runAll, sourcesAndUses, validate, type Assumptions, type CaseResult, type Scenario, type ScenarioKey,
  type SourcesUses, type ValidationIssue,
} from "./engine";

const ORDER: ScenarioKey[] = ["base", "downside", "upside"];
type Results = Record<ScenarioKey, CaseResult>;

interface Ctx {
  a: Assumptions;
  scn: Record<ScenarioKey, Scenario>;
  setA: (k: keyof Assumptions, v: number) => void;
  setScn: (key: ScenarioKey, f: (s: Scenario) => Scenario) => void;
  reset: () => void;
  modified: boolean;
  issues: ValidationIssue[];
  /** Latest valid results (kept while current inputs are invalid). */
  results: Results;
  stale: boolean;
  su: SourcesUses;
  errFor: (field: string) => string | undefined;
  scnField: (key: ScenarioKey, f: string) => string;
}

const SandboxCtx = createContext<Ctx | null>(null);

interface State { a: Assumptions; scn: Record<ScenarioKey, Scenario>; results: Results; stale: boolean }

const initial = (): State => {
  const a = baselineAssumptions(), scn = baselineScenarios();
  return { a, scn, results: runAll(a, scn), stale: false };
};
const issuesOf = (a: Assumptions, scn: Record<ScenarioKey, Scenario>) => validate(a, ORDER.map((k) => scn[k]));
/** Recompute only when inputs are valid; otherwise keep the last valid results and flag stale. */
const next = (prev: State, a: Assumptions, scn: Record<ScenarioKey, Scenario>): State =>
  issuesOf(a, scn).length ? { ...prev, a, scn, stale: true } : { a, scn, results: runAll(a, scn), stale: false };

export function SandboxProvider({ children }: { children: ReactNode }) {
  const [st, setSt] = useState<State>(initial);
  const { a, scn, results, stale } = st;
  const issues = useMemo(() => issuesOf(a, scn), [a, scn]);

  const setA = useCallback((k: keyof Assumptions, v: number) => setSt((p) => next(p, { ...p.a, [k]: v }, p.scn)), []);
  const setScn = useCallback((key: ScenarioKey, f: (s: Scenario) => Scenario) => setSt((p) => next(p, p.a, { ...p.scn, [key]: f(p.scn[key]) })), []);
  const reset = useCallback(() => setSt(initial()), []);

  const modified = useMemo(
    () => JSON.stringify([a, scn]) !== JSON.stringify([baselineAssumptions(), baselineScenarios()]),
    [a, scn],
  );
  const su = useMemo(() => sourcesAndUses(a), [a]);
  const scnField = (key: ScenarioKey, f: string) => `scenario${ORDER.indexOf(key)}.${f}`;
  const errFor = (field: string) => issues.find((i) => i.field === field)?.message;

  return (
    <SandboxCtx.Provider value={{ a, scn, setA, setScn, reset, modified, issues, results, stale, su, errFor, scnField }}>
      {children}
    </SandboxCtx.Provider>
  );
}

export function useSandbox() {
  const c = useContext(SandboxCtx);
  if (!c) throw new Error("useSandbox outside provider");
  return c;
}
