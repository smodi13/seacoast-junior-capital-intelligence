import "server-only";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

export interface Source {
  id: string; entity: string; claim: string; source_type: string; url: string; limitations: string; research_date: string;
}

/** Minimal RFC-4180 parser (quoted fields, escaped quotes). */
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [], f = "", q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"' && text[i + 1] === '"') { f += '"'; i++; }
      else if (c === '"') q = false;
      else f += c;
    } else if (c === '"') q = true;
    else if (c === ",") { row.push(f); f = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(f); f = "";
      if (row.some((x) => x !== "")) rows.push(row);
      row = [];
    } else f += c;
  }
  if (f || row.length) { row.push(f); rows.push(row); }
  return rows;
}

export function loadSources(): Source[] {
  const raw = fs.readFileSync(path.join(process.cwd(), "data", "Seacoast_NFS_Public_Source_Register.csv"), "utf8");
  const [head, ...rows] = parseCsv(raw);
  return rows.map((r) => Object.fromEntries(head.map((h, i) => [h, r[i]])) as unknown as Source);
}

export interface DocInfo { file: string; title: string; kind: string; bytes: number; sha256: string }

const DOCS: Omit<DocInfo, "bytes" | "sha256">[] = [
  { file: "Seacoast_NFS_Investment_Committee_Memo.pdf", title: "Investment Committee Memorandum", kind: "PDF" },
  { file: "Seacoast_NFS_Executive_Investment_Brief.pdf", title: "Executive Investment Brief", kind: "PDF" },
  { file: "Seacoast_NFS_Formula_Driven_Underwriting.xlsx", title: "Formula-Driven Excel Model", kind: "XLSX" },
  { file: "Seacoast_NFS_Public_Source_Register.csv", title: "Public Source Register", kind: "CSV" },
];

export function loadDocs(): DocInfo[] {
  return DOCS.map((d) => {
    const buf = fs.readFileSync(path.join(process.cwd(), "public", "downloads", d.file));
    return { ...d, bytes: buf.length, sha256: crypto.createHash("sha256").update(buf).digest("hex") };
  });
}
