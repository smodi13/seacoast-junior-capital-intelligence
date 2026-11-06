import { Suspense } from "react";
import { Body, PageTitle } from "@/components/ui";
import EvidenceTable from "@/components/EvidenceTable";
import { loadSources } from "@/lib/sources";

export default function Evidence() {
  return (
    <>
      <PageTitle kicker="Module 8 | Evidence library" title="Public source register">
        The supplied register is the only source database used by this application. Links open the original public pages; nothing is fetched or browsed automatically. Check each limitation before relying on a claim.
      </PageTitle>
      <Body>
      <Suspense fallback={<p>Loading sources…</p>}>
        <EvidenceTable sources={loadSources()} />
      </Suspense>
      </Body>
    </>
  );
}
