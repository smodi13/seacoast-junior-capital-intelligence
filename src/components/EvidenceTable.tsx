"use client";
import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { Source } from "@/lib/sources";

export default function EvidenceTable({ sources }: { sources: Source[] }) {
  const sp = useSearchParams();
  const [q, setQ] = useState(sp.get("q") ?? "");
  const [type, setType] = useState("All");
  const [entity, setEntity] = useState("All");
  const types = ["All", ...Array.from(new Set(sources.map((s) => s.source_type)))];
  const entities = ["All", ...Array.from(new Set(sources.map((s) => s.entity)))];
  const rows = useMemo(() => {
    const n = q.trim().toLowerCase();
    return sources.filter((s) =>
      (type === "All" || s.source_type === type) && (entity === "All" || s.entity === entity) &&
      (!n || [s.id, s.entity, s.claim, s.limitations, s.url].join(" ").toLowerCase().includes(n)));
  }, [sources, q, type, entity]);
  const sel = "mt-0.5 block rounded-sm border border-rule bg-white px-2 py-1 text-sm";
  return (
    <>
      <div className="mb-4 flex flex-wrap items-end gap-3">
        <div className="min-w-[14rem] flex-1">
          <label htmlFor="ev-q" className="block text-xs font-medium text-muted">Search sources</label>
          <input id="ev-q" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="ID, claim, limitation, URL…" className={`${sel} w-full`} />
        </div>
        <div><label htmlFor="ev-t" className="block text-xs font-medium text-muted">Classification</label>
          <select id="ev-t" value={type} onChange={(e) => setType(e.target.value)} className={sel}>{types.map((t) => <option key={t}>{t}</option>)}</select></div>
        <div><label htmlFor="ev-e" className="block text-xs font-medium text-muted">Entity</label>
          <select id="ev-e" value={entity} onChange={(e) => setEntity(e.target.value)} className={sel}>{entities.map((t) => <option key={t}>{t}</option>)}</select></div>
      </div>
      <p className="mb-2 text-sm text-muted" role="status" aria-live="polite">{rows.length} of {sources.length} sources</p>
      <div data-lenis-prevent className="relative overflow-x-auto" role="region" aria-label="Source register" tabIndex={0}>
        <table className="w-full min-w-[56rem] text-sm">
          <caption className="sr-only">Public source register</caption>
          <thead><tr className="border-b-2 border-navy-900 text-left text-xs uppercase text-muted">
            <th scope="col" className="py-2 pr-2">ID</th><th scope="col" className="pr-2">Entity</th><th scope="col" className="pr-2">Claim</th>
            <th scope="col" className="pr-2">Classification</th><th scope="col" className="pr-2">Verification limitations</th><th scope="col" className="pr-2">Researched</th><th scope="col">Source</th>
          </tr></thead>
          <tbody>
            {rows.map((s) => (
              <tr key={s.id} id={s.id} className="border-b border-rule align-top" data-testid="source-row">
                <th scope="row" className="num py-2 pr-2 text-left">{s.id}</th>
                <td className="pr-2">{s.entity}</td>
                <td className="pr-2">{s.claim}</td>
                <td className="pr-2">{s.source_type}</td>
                <td className="pr-2 text-muted">{s.limitations}</td>
                <td className="num whitespace-nowrap pr-2">{s.research_date}</td>
                <td><a href={s.url} target="_blank" rel="noopener noreferrer" aria-label={`Open ${s.id} source (opens in new tab)`}>Open ↗</a></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {rows.length === 0 && <p className="py-6 text-center text-sm text-muted">No sources match.</p>}
    </>
  );
}
