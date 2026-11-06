import { Body, Card, LabelTag, PageTitle, SourceTags } from "@/components/ui";
import { PROFILE, type Label } from "@/lib/research";
import { loadSources } from "@/lib/sources";

const LEGEND: Label[] = ["VERIFIED PUBLIC FACT", "COMPANY SELF-REPORT", "ANALYST INTERPRETATION", "NOT VERIFIED"];

export default function Company() {
  const ids = new Set(loadSources().map((s) => s.id));
  return (
    <>
      <PageTitle kicker="Module 2 | Company profile" title="National Fleet Services: what the evidence supports">
        Built only from the supplied source register (S01-S13). Each claim is labeled by evidence quality and linked to its source ID. No financial performance is stated or implied.
      </PageTitle>
      <Body>
      <div className="mb-6 flex flex-wrap items-center gap-2 text-xs" aria-label="Label legend">
        {LEGEND.map((l) => <LabelTag key={l} label={l} />)}
      </div>
      <div className="space-y-5">
        {PROFILE.map((sec) => (
          <Card key={sec.id} title={sec.title} id={sec.id}>
            <ul className="divide-y divide-rule">
              {sec.claims.map((c, i) => (
                <li key={i} className="grid gap-1 py-2.5 sm:grid-cols-[11rem_1fr]">
                  <div><LabelTag label={c.label} /></div>
                  <div className="text-sm leading-relaxed">
                    {c.text}
                    {c.sources.length > 0 && <span className="ml-2"><SourceTags ids={c.sources.filter((s) => ids.has(s))} /></span>}
                    {c.note && <p className="mt-0.5 text-xs text-muted">Limit: {c.note}</p>}
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        ))}
      </div>
      </Body>
    </>
  );
}
