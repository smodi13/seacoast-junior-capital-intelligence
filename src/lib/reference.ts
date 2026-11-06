import { baselineAssumptions, baselineScenarios } from "./baseline";
import { runAll } from "./engine";

/** Reference model: the supplied baseline run through the engine. Independent of sandbox edits. */
export const REF_A = baselineAssumptions();
export const REF_S = baselineScenarios();
export const REF = runAll(REF_A, REF_S);
export const SCN_LABEL = { base: "Base", downside: "Downside", upside: "Upside" } as const;
