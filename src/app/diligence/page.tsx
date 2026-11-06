"use client";
import { useCallback, useState, useSyncExternalStore } from "react";
import { Card, PageTitle, Pill } from "@/components/ui";
import { DILIGENCE, RISK_CATEGORIES } from "@/lib/research";
import { REF, REF_A } from "@/lib/reference";
import { fmtX } from "@/lib/format";

const KEY = "nfs-demo-diligence-tracking";
const listeners = new Set<() => void>();
const subscribe = (cb: () => void) => { listeners.add(cb); return () => { listeners.delete(cb); }; };
const snapshot = () => localStorage.getItem(KEY) ?? "{}";
const serverSnapshot = () => "{}";
const STATES = ["Not started", "Demo: in progress", "Demo: marked reviewed"] as const;

export default function Diligence() {
  const raw = useSyncExternalStore(subscribe, snapshot, serverSnapshot);
  const track: Record<string, string> = JSON.parse(raw);
  const setTrack = useCallback((id: string, v: string) => {
    localStorage.setItem(KEY, JSON.stringify({ ...JSON.parse(localStorage.getItem(KEY) ?? "{}"), [id]: v }));
    listeners.forEach((l) => l());
  }, []);
  const clear = () => { localStorage.removeItem(KEY); listeners.forEach((l) => l()); };
  const [filter, setFilter] = useState<"ALL" | "CRITICAL" | "HIGH">("ALL");
  const qs = DILIGENCE.filter((q) => filter === "ALL" || q.priority === filter);
  const byId = Object.fromEntries(DILIGENCE.map((q) => [q.id, q]));

  return (
    <>
      <PageTitle kicker="Module 7 | Risk and diligence" title="Research-backed risk register and diligence checklist">
        Priorities and required evidence are taken as supplied in the research handoff. Every item is <strong>unresolved</strong>: no management data has been received.
      </PageTitle>

      <Card title="Risk register (read-only)" className="mb-6">
        <ul className="grid gap-4 md:grid-cols-2">
          {RISK_CATEGORIES.map((c) => (
            <li key={c.id} className="border-l-2 border-teal-500 pl-3" data-testid="risk-item">
              <h3 className="text-base font-semibold">{c.title}</h3>
              <ul className="mt-1 space-y-1 text-sm">
                {c.qs.map((id) => (
                  <li key={id}>
                    <span className="num mr-1 font-semibold">{id}</span>
                    <Pill tone={byId[id].priority === "CRITICAL" ? "bad" : "warn"}>{byId[id].priority}</Pill>{" "}
                    {byId[id].rationale}. <span className="text-muted">Evidence needed: {byId[id].evidence_needed}.</span>
                  </li>
                ))}
              </ul>
              {c.modelLink && (
                <p className="mt-1 text-xs text-muted">Model reference: downside-case minimum FCCR is {fmtX(REF.downside.minFccr)} vs. the {fmtX(REF_A.minFccr)} analyst test (illustrative inputs).</p>
              )}
            </li>
          ))}
        </ul>
      </Card>

      <Card title="Diligence checklist">
        <div className="mb-3 rounded-sm border border-warn bg-amber-50 p-2 text-sm" role="note">
          <strong>Demonstration only.</strong> The tracking selector below is saved in this browser and is <strong>not management diligence</strong>. Checking an item off never changes its research status: every item stays <strong>OPEN / NOT VERIFIED</strong> until real evidence is received.
        </div>
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <span className="text-sm" id="flt">Priority:</span>
          <div role="group" aria-labelledby="flt" className="inline-flex border border-navy-900">
            {(["ALL", "CRITICAL", "HIGH"] as const).map((f) => (
              <button key={f} type="button" aria-pressed={filter === f} onClick={() => setFilter(f)} className={`px-3 py-1 text-sm font-semibold ${filter === f ? "bg-navy-900 text-white" : "hover:bg-navy-100"}`}>{f}</button>
            ))}
          </div>
          <button type="button" onClick={clear} className="ml-auto text-sm underline">Clear local tracking</button>
        </div>
        <div className="relative overflow-x-auto" role="region" aria-label="Diligence checklist" tabIndex={0}>
          <table className="w-full min-w-[46rem] text-sm">
            <caption className="sr-only">Diligence checklist</caption>
            <thead><tr className="border-b-2 border-navy-900 text-left text-xs uppercase text-muted">
              <th scope="col" className="py-2 pr-2">ID</th><th scope="col" className="pr-2">Workstream</th><th scope="col" className="pr-2">Required evidence</th>
              <th scope="col" className="pr-2">Priority</th><th scope="col" className="pr-2">Research status</th><th scope="col">Local demo tracking</th>
            </tr></thead>
            <tbody>
              {qs.map((q) => (
                <tr key={q.id} className="border-b border-rule align-top" data-testid="dd-row">
                  <th scope="row" className="num py-2 pr-2 text-left">{q.id}</th>
                  <td className="pr-2">{q.workstream}</td>
                  <td className="pr-2">{q.evidence_needed}<div className="text-xs text-muted">{q.rationale}</div></td>
                  <td className="pr-2"><Pill tone={q.priority === "CRITICAL" ? "bad" : "warn"}>{q.priority}</Pill></td>
                  <td className="pr-2"><Pill tone="bad">OPEN / NOT VERIFIED</Pill></td>
                  <td>
                    <label className="sr-only" htmlFor={`t-${q.id}`}>Demo tracking for {q.id}</label>
                    <select id={`t-${q.id}`} value={track[q.id] ?? STATES[0]} onChange={(e) => setTrack(q.id, e.target.value)} className="rounded-sm border border-rule bg-white px-1 py-0.5 text-sm">
                      {STATES.map((s) => <option key={s}>{s}</option>)}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}
