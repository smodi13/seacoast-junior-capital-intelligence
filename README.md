# Seacoast Junior Capital Intelligence

An interactive underwriting and investment-intelligence application for an **illustrative, non-control junior-capital screen** of National Fleet Services (NFS), built as an independent analyst portfolio project.

> **Disclaimer.** Independent illustrative project. **Not affiliated with, endorsed by, or connected to Seacoast Capital or National Fleet Services.** NFS has not disclosed financial statements to this project and has not solicited an investment. Every financial figure (revenue, EBITDA, debt, terms, returns) is an **analyst assumption**, not an NFS result, management forecast, offer, term sheet, or actual Seacoast investment. The 16% return target and 1.20x coverage test are analyst assumptions, not Seacoast's disclosed hurdle or a covenant. Default recommendation, for the illustrative structure only: **DO NOT INVEST AS PRICED.**

## Purpose

Demonstrates financial modeling, diligence, structured-capital analysis and portfolio-monitoring skills relevant to a private-equity analyst role. This repository is **engineering only**: research, assumptions and conclusions come from the supplied package and are not modified here.

## Modules

Executive Screen · Company Profile · Capital Structure · Operating Underwriting · Investor Returns · Pricing Lab · Risk & Diligence · Evidence Library · Documents (original files, downloadable).

## Architecture

| Path | Role |
|---|---|
| `data/` | Supplied research package, verbatim (JSON handoff, source register CSV, workbook, PDFs, README). Ingested at build time. |
| `public/downloads/` | Byte-identical copies served by the Documents page. |
| `src/lib/engine.ts` | **Pure, deterministic calculation engine**: a TypeScript port of the workbook formulas (operating waterfall, debt/preferred mechanics, exit waterfall, IRR, pricing sensitivity, required-warrant closed form, validation). No I/O, no hardcoded outputs. |
| `src/lib/baseline.ts` | Maps the JSON assumption rows and scenario drivers to engine inputs. |
| `src/lib/engine.test.ts` | Vitest suite (see below). |
| `src/lib/sandbox.tsx` | In-memory client sandbox (edits never touch `data/`). Keeps last valid results while inputs are invalid. |
| `src/lib/research.ts` | Presentation content transcribed from the package, each claim labeled and tied to source IDs. |
| `src/app/*` | Next.js App Router pages; `src/components/*` UI, charts (Recharts). |
| `tests/e2e/` | Playwright: navigation, downloads, evidence links, scenario editing, mobile, axe accessibility. |

Inputs, formulas and displayed results are kept separate: inputs live in `Assumptions`/`Scenario` objects, formulas in `engine.ts`, and rounding happens only in `format.ts` (full precision internally; $ to 2 d.p. in millions, % to 1 d.p., multiples to 2 d.p.).

## Research provenance

Source of truth is `data/Seacoast_NFS_Formula_Driven_Underwriting.xlsx` (formulas govern every output). `data/Seacoast_NFS_Research_and_Engineering_Handoff.json` is the as-of snapshot used as the baseline fixture and test oracle. Research date: **6 Nov 2026**. The only source database is `Seacoast_NFS_Public_Source_Register.csv` (S01-S13). The application performs no web research and fetches nothing at runtime.

## Modeling notes

- Revenue, EBITDA, D&A, EBIT, taxes, NWC, capex, senior/junior/preferred mechanics and the exit waterfall follow the workbook cell-for-cell (see `engine.ts` comments).
- Cash taxes = max(0, (EBIT − senior interest − sub coupon) × tax rate). Incremental NWC = max(0, Δrevenue × NWC %). Preferred PIK accretes on the beginning claim; the cash dividend is on original invested preferred.
- Exit EV = FY5 EBITDA × scenario multiple; common residual = max(0, EV + cash − senior − sub − accreted preferred); warrant = residual × participation. As in the workbook, investor principal and accreted preferred are repaid in full; when claims exceed value the app **flags a shortfall** but does not alter the workbook economics.
- IRR uses annual periods and a bisection root-finder. Like Excel's `IFERROR(IRR(),0)`, it returns 0 when no root exists. Excel's iterative IRR agrees to ~1e-10.
- Exit multiples (6x/5x/7x) are the workbook's Scenario Drivers inputs; the JSON does not carry them, so a test cross-checks them against the JSON's frozen exit EVs.
- Display rounding cleans float noise first (3.1249999999999996 → 3.13x), matching the Excel-rendered PDFs.
- Diligence tracking is a local browser demo only. Research status stays **OPEN / NOT VERIFIED** regardless of user input.

## Local setup

```bash
npm install
npx playwright install chromium   # first time, for e2e
npm run dev                       # http://localhost:3000
```

## Tests

```bash
npm test            # Vitest: engine reconciliation + edge cases
npm run typecheck
npm run lint
npm run build
npm run test:e2e    # Playwright (builds and serves on port 3417; desktop + mobile projects)
npm run verify      # everything above
```

The Vitest suite reconciles every operating row of all three scenarios, the investor cash flows, exit distributions, IRR/MOIC, min liquidity/FCCR, the warrant sensitivity grid and the required-warrant formula against the JSON to 1e-9 (IRR 1e-9), plus edge cases: zero growth, EBITDA decline, insufficient cash, negative residual equity, fully amortized senior debt, zero warrant, higher PIK, rate changes, downside coverage failure, invalid input, reset-to-baseline, and sources-and-uses balance.

## Deployment (Vercel)

No environment variables or secrets are needed. Static export of all routes.

```bash
npm i -g vercel
vercel login        # one-time, interactive
vercel --prod
```

Or push to GitHub and import the repository at vercel.com/new (framework preset: Next.js, defaults).
