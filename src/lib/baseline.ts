import handoff from "../../data/Seacoast_NFS_Research_and_Engineering_Handoff.json";
import type { Assumptions, Scenario, ScenarioKey } from "./engine";

export const H = handoff;

const byRow = (row: number): number => {
  const f = H.assumption_inputs.find((x) => x.excel_row === row);
  if (!f) throw new Error(`Missing assumption row ${row}`);
  return f.value as number;
};

/** Workbook rows -> engine inputs (Assumptions!B6:B33). */
export const baselineAssumptions = (): Assumptions => ({
  fy0Revenue: byRow(6), fy0Margin: byRow(7), daPct: byRow(8), capexPct: byRow(9), nwcPct: byRow(10),
  taxRate: byRow(11), openingCash: byRow(12), seniorDebt: byRow(13), seniorRate: byRow(14),
  seniorAmort: byRow(15), subDebt: byRow(16), subCoupon: byRow(17), pref: byRow(18), prefCash: byRow(19),
  prefPik: byRow(20), warrant: byRow(21), holdYears: byRow(22), useExpansion: byRow(23), useNwc: byRow(24),
  useQuality: byRow(25), useFees: byRow(26), minCash: byRow(27), minFccr: byRow(28), targetIrr: byRow(29),
  minRevenue: byRow(30), minEbitda: byRow(31), maxLeverage: byRow(32), minYield: byRow(33),
});

/** Exit EV/EBITDA multiples: workbook 'Scenario Drivers'!B9 / B16 / B23 (analyst assumptions). */
const EXIT_MULTIPLE: Record<ScenarioKey, number> = { base: 6, downside: 5, upside: 7 };
export const CASE_NAME: Record<ScenarioKey, "Base Case" | "Downside Case" | "Upside Case"> = {
  base: "Base Case", downside: "Downside Case", upside: "Upside Case",
};

const rowValues = (key: ScenarioKey, metric: string): number[] => {
  const row = H.scenario_cases[CASE_NAME[key]].operating_rows.find((r) => r.metric === metric);
  if (!row) throw new Error(`Missing ${metric}`);
  return (row.values as (number | null)[]).slice(1, 6) as number[];
};

export const baselineScenarios = (): Record<ScenarioKey, Scenario> => {
  const mk = (k: ScenarioKey): Scenario => ({
    growth: rowValues(k, "Revenue growth %"),
    margin: rowValues(k, "EBITDA margin %"),
    exitMultiple: EXIT_MULTIPLE[k],
  });
  return { base: mk("base"), downside: mk("downside"), upside: mk("upside") };
};

/** Warrant grid: workbook 'Scenario Drivers'!B27:H27. */
export const WARRANT_GRID = H.warrant_pricing_sensitivity.map((w) => w.warrant_fraction);
