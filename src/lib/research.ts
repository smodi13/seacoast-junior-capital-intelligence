/**
 * Presentation-layer content transcribed from the supplied package (handoff JSON, memo, brief, README).
 * No new research. Every claim carries the source IDs the package attaches to it.
 */
import { H } from "./baseline";

export type Label = "VERIFIED PUBLIC FACT" | "COMPANY SELF-REPORT" | "ANALYST INTERPRETATION" | "NOT VERIFIED";

export interface Claim { text: string; label: Label; sources: string[]; note?: string }
export interface Section { id: string; title: string; claims: Claim[] }

export const PROFILE: Section[] = [
  {
    id: "history", title: "Operating history",
    claims: [
      { text: "Founded in Detroit in 1996 by Timothy P. LaRiviere, who is still named as founder and CEO.", label: "COMPANY SELF-REPORT", sources: ["S05"], note: "Ownership amount unverified." },
      { text: "Described as family-owned and operated, marking its 30th anniversary in 2026.", label: "VERIFIED PUBLIC FACT", sources: ["S09"], note: "Trade association item / search excerpt. Ownership percentages remain unknown." },
    ],
  },
  {
    id: "locations", title: "Locations",
    claims: [
      { text: "Company-operated locations: Detroit, Kansas City/Liberty, Avon Lake, and St. Louis (four operating regions).", label: "COMPANY SELF-REPORT", sources: ["S05", "S06"] },
      { text: "The Avon Lake, Ohio flagship facility advertises capacity for up to 25,000 vehicle modifications per year.", label: "COMPANY SELF-REPORT", sources: ["S06"], note: "Stated capacity, not realized volume or throughput." },
    ],
  },
  {
    id: "services", title: "Business services",
    claims: [
      { text: "Provides fleet upfit services with a quality-control (QIP inspection) program, customization and related vehicle modifications.", label: "COMPANY SELF-REPORT", sources: ["S07"] },
      { text: "Memo summary: Ford, GM and RAM vehicle modifications, ship-through programs, quality inspection and other fleet upfit services; lists complex chassis modifications, safety packages, field modifications, inspection and fleet branding.", label: "COMPANY SELF-REPORT", sources: ["S05", "S07"] },
    ],
  },
  {
    id: "management", title: "Management information available in the package",
    claims: [
      { text: "Timothy P. LaRiviere is named as founder and CEO. No other management information is in the package.", label: "COMPANY SELF-REPORT", sources: ["S05"] },
      { text: "Seacoast's published philosophy values continued and incentivized management; this is context for the screen, not a statement about NFS management.", label: "ANALYST INTERPRETATION", sources: ["S03"] },
      { text: "Management incentives, option rights, succession and any appetite for outside capital.", label: "NOT VERIFIED", sources: [], note: "Diligence Q03, Q05." },
    ],
  },
  {
    id: "oem", title: "OEM-adjacent operations",
    claims: [
      { text: "Performs OEM-adjacent vehicle upfitting, QIP inspection and customization.", label: "COMPANY SELF-REPORT", sources: ["S07"] },
      { text: "Industry context only: an OEM technical upfitting summit and industry trends were published in 2026; not an NFS forecast.", label: "VERIFIED PUBLIC FACT", sources: ["S11"] },
      { text: "OEM allocations, lead times, shipment schedules, cancellation history and degree of OEM dependency.", label: "NOT VERIFIED", sources: [], note: "Diligence Q08." },
    ],
  },
  {
    id: "customers", title: "Documented public customer testimonials",
    claims: [
      { text: "The NFS website shows a public testimonial from U-Haul.", label: "COMPANY SELF-REPORT", sources: ["S07"], note: "Customer concentration and revenues not confirmed." },
      { text: "The NFS website names Sunbelt Rentals in a client testimonial and references certified installers.", label: "COMPANY SELF-REPORT", sources: ["S08"], note: "A testimonial does not prove contract size, exclusivity or retention." },
      { text: "Company workforce category 51-200 and privately held, per a LinkedIn company directory.", label: "COMPANY SELF-REPORT", sources: ["S12"], note: "Self-reported directory; not verified company financials." },
    ],
  },
  {
    id: "characteristics", title: "Potential investment characteristics",
    claims: [
      { text: "Operating continuity (founded 1996, family-operated) is a positive screening indicator for a junior-capital growth case.", label: "ANALYST INTERPRETATION", sources: ["S05", "S09"] },
      { text: "Multiple OEM-adjacent upfit locations and an advertised plant capacity suggest a potential expansion platform; capacity is not utilization or revenue.", label: "ANALYST INTERPRETATION", sources: ["S06"] },
      { text: "Central hypothesis: an established operator can convert OEM proximity, quality controls and repeat commercial relationships into pricing durability, low rework, positive cash conversion and attractive incremental returns on expansion. No public evidence is sufficient to establish this today.", label: "ANALYST INTERPRETATION", sources: ["S07"] },
      { text: "Industry demand is not immune to volatility: a published Q2 2026 analysis showed a quarter-on-quarter rebound in dealer sales movement but a year-on-year decline in new work-truck and van movement. Directional context, not a prediction of NFS sales.", label: "VERIFIED PUBLIC FACT", sources: ["S10"] },
      { text: "Seacoast's published criteria: junior capital $5-$30m; revenue > $10m; EBITDA > $2m; up to 4x leverage; at least 8% blended current yield; non-control structures using subordinated debt, preferred or common equity.", label: "VERIFIED PUBLIC FACT", sources: ["S01", "S02"], note: "Firm criteria, not a statement about NFS eligibility." },
      { text: "October 2026 Seacoast BSI recapitalization and acquisition financed with subordinated debt and preferred equity: structure precedent only.", label: "VERIFIED PUBLIC FACT", sources: ["S04"], note: "Amounts undisclosed." },
    ],
  },
  {
    id: "unverified", title: "Unverified financial and ownership information",
    claims: [
      { text: "NFS revenue, EBITDA, margins, cash flow, balance sheet and any financial statements.", label: "NOT VERIFIED", sources: [], note: "Not disclosed to this project. Model revenue of $32.00m and 17% margin are analyst assumptions." },
      { text: "Ownership percentages, capitalization table and management equity.", label: "NOT VERIFIED", sources: [], note: "Family-operated does not prove % ownership (Q05)." },
      { text: "Whether NFS seeks outside financing, and any financing request or capital structure.", label: "NOT VERIFIED", sources: [], note: "No evidence of a financing mandate (Q03)." },
      { text: "Existing senior debt, collateral and liens ($5.00m in the model is illustrative).", label: "NOT VERIFIED", sources: [], note: "Q04." },
      { text: "Customer-level revenue, contract terms, backlog, plant utilization, warranty and liability exposure.", label: "NOT VERIFIED", sources: [], note: "Q06-Q09, Q13." },
    ],
  },
];

export const LABEL_STYLE: Record<Label, string> = {
  "VERIFIED PUBLIC FACT": "bg-teal-50 text-teal-900 border-teal-700/40",
  "COMPANY SELF-REPORT": "bg-sky-50 text-sky-900 border-sky-700/40",
  "ANALYST INTERPRETATION": "bg-amber-50 text-amber-900 border-amber-700/40",
  "NOT VERIFIED": "bg-rose-50 text-rose-900 border-rose-700/40",
};

export const DILIGENCE = H.diligence_questions;
export type Q = (typeof DILIGENCE)[number];

/** Risk register: categories requested by the brief -> diligence IDs already in the handoff JSON. */
export const RISK_CATEGORIES: { id: string; title: string; qs: string[]; modelLink?: string }[] = [
  { id: "concentration", title: "Customer concentration", qs: ["Q06"] },
  { id: "oem", title: "OEM dependencies", qs: ["Q08"] },
  { id: "utilization", title: "Plant utilization", qs: ["Q07", "Q10"] },
  { id: "cash", title: "Cash conversion", qs: ["Q12", "Q11"] },
  { id: "quality", title: "Financial quality", qs: ["Q01", "Q02", "Q03"] },
  { id: "senior", title: "Senior debt obligations", qs: ["Q04"] },
  { id: "legal", title: "Legal and governance questions", qs: ["Q05", "Q14", "Q18"] },
  { id: "warranty", title: "Warranty and liability exposure", qs: ["Q09", "Q13"] },
  { id: "exit", title: "Exit and refinancing risk", qs: ["Q15", "Q16", "Q17"], modelLink: "downside-fccr" },
];
