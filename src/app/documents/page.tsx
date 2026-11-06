import { Body, Card, PageTitle } from "@/components/ui";
import { loadDocs } from "@/lib/sources";
import { H } from "@/lib/baseline";

export default function Documents() {
  const docs = loadDocs();
  return (
    <>
      <PageTitle kicker="Module 9 | Investment documents" title="Document library">
        Original, unmodified files from the research package. Investment conclusions and workbook formulas are exactly as supplied.
      </PageTitle>
      <Body>
      <ul className="grid gap-4 md:grid-cols-2">
        {docs.map((d) => (
          <li key={d.file}>
            <Card title={d.title}>
              <dl className="mb-3 grid grid-cols-[7rem_1fr] gap-y-1 text-sm">
                <dt className="text-muted">Format</dt><dd>{d.kind}, {(d.bytes / 1024).toFixed(1)} KB</dd>
                <dt className="text-muted">Research date</dt><dd className="num">{H.research_date}</dd>
                <dt className="text-muted">Version</dt><dd>Package as supplied, {H.research_date}</dd>
                <dt className="text-muted">SHA-256</dt><dd className="num break-all text-xs">{d.sha256}</dd>
              </dl>
              <a href={`/downloads/${d.file}`} download={d.file} data-testid={`dl-${d.file}`}
                className="btn btn-solid">
                Download {d.kind} <span className="arrow" aria-hidden="true">↓</span>
              </a>
            </Card>
          </li>
        ))}
      </ul>
      </Body>
    </>
  );
}
