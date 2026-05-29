// Confidence-gated sweep orchestrator (Engine A).
//
// Composes the existing primitives into the differentiated bet: automatically
// sweep every curated lever×outcome pair, then surface ONLY the survivors of a
// multiple-comparisons gate — silent unless a pattern is glaring and credible.
//
// Pipeline:
//   1. Build outcome series (daily mood/energy means + daily focus).
//   2. Build curated levers (alcohol, event toggles/presence, Moment labels).
//   3. For each pair with adequate power (≥ minGroupDays on BOTH sides), run
//      the bootstrap `compareDays`. Only powered pairs enter the family.
//   4. Gate the family with Benjamini-Hochberg FDR (bound false-discovery rate)
//      then an effect-size floor (must be glaring, not merely distinguishable).
//   5. Return survivors as HYPOTHESES, strongest first.

import type {
  ComparisonResult,
  DailyLog,
  EventTypeDef,
  MoodCheckIn,
  Moment,
} from "../../types";
import { compareDays } from "../experiments/compare";
import type { CompareOpts, DayMetric } from "../experiments/types";
import { dailyFocus, dailyMoodEnergy } from "./aggregate";
import { buildLevers, type Lever } from "./candidates";
import {
  benjaminiHochberg,
  DEFAULT_FDR_Q,
  passesEffectFloor,
  pseudoPValue,
  type FdrInput,
} from "./fdr";

export interface Outcome {
  id: string;
  label: string;
  series: DayMetric[];
  /** Minimum |effect|, in this outcome's own units, to count as glaring. */
  minEffect: number;
}

export interface SweepInputs {
  logs: DailyLog[];
  moodCheckIns: MoodCheckIn[];
  moments: Moment[];
  eventTypes: EventTypeDef[];
}

export interface SweepOpts extends CompareOpts {
  q?: number;
  minGroupDays?: number;
}

export interface SweepFinding {
  leverId: string;
  leverLabel: string;
  outcomeId: string;
  outcomeLabel: string;
  result: ComparisonResult;
  pValue: number;
  /** Plain-language hypothesis copy — "worth noticing," never a verdict. */
  headline: string;
}

// Both groups must clear this floor before a pair is even compared, so m (the
// FDR family size) counts only testable pairs. Matches the 7-day confidence
// floor baked into confidence.ts.
const DEFAULT_MIN_GROUP_DAYS = 7;

// Effect floors per outcome scale: mood/energy on 1–5 → 0.5 pt; focus on
// 1–10 → 1 pt. A shift smaller than this is noise to lived experience.
function buildOutcomes(inputs: SweepInputs): Outcome[] {
  const { mood, energy } = dailyMoodEnergy(inputs.moodCheckIns);
  const focus = dailyFocus(inputs.logs);
  return [
    { id: "mood", label: "mood", series: mood, minEffect: 0.5 },
    { id: "energy", label: "energy", series: energy, minEffect: 0.5 },
    { id: "focus", label: "focus", series: focus, minEffect: 1 },
  ];
}

function splitByLever(
  series: DayMetric[],
  lever: Lever,
): { control: DayMetric[]; treatment: DayMetric[] } {
  const control: DayMetric[] = [];
  const treatment: DayMetric[] = [];
  for (const d of series) {
    if (lever.treatmentDates.has(d.date)) treatment.push(d);
    else control.push(d);
  }
  return { control, treatment };
}

function headline(lever: Lever, outcome: Outcome, r: ComparisonResult): string {
  const dir = r.effect >= 0 ? "higher" : "lower";
  const mag = Math.abs(r.effect).toFixed(1);
  return `On days with "${lever.label}", your ${outcome.label} tends to run ~${mag} ${dir} — worth noticing, not proven.`;
}

interface Pending {
  lever: Lever;
  outcome: Outcome;
  result: ComparisonResult;
}

export function runSweep(
  inputs: SweepInputs,
  opts: SweepOpts = {},
): SweepFinding[] {
  const q = opts.q ?? DEFAULT_FDR_Q;
  const minGroup = opts.minGroupDays ?? DEFAULT_MIN_GROUP_DAYS;
  const outcomes = buildOutcomes(inputs);
  const levers = buildLevers(inputs.logs, inputs.moments, inputs.eventTypes);

  // 1–3. Sweep every adequately-powered pair into the family.
  const pending: Pending[] = [];
  for (const lever of levers) {
    for (const outcome of outcomes) {
      const { control, treatment } = splitByLever(outcome.series, lever);
      if (treatment.length < minGroup || control.length < minGroup) continue;
      const result = compareDays(control, treatment, opts);
      pending.push({ lever, outcome, result });
    }
  }
  if (pending.length === 0) return [];

  // 4a. FDR gate across the family.
  const fdrInputs: FdrInput<Pending>[] = pending.map((p) => ({
    item: p,
    pValue: pseudoPValue(p.result),
  }));
  const gated = benjaminiHochberg(fdrInputs, q);

  // 4b. Survivors must also clear the effect-size floor.
  const findings: SweepFinding[] = [];
  for (const g of gated) {
    if (!g.passed) continue;
    const { lever, outcome, result } = g.item;
    if (!passesEffectFloor(result, outcome.minEffect)) continue;
    findings.push({
      leverId: lever.id,
      leverLabel: lever.label,
      outcomeId: outcome.id,
      outcomeLabel: outcome.label,
      result,
      pValue: g.pValue,
      headline: headline(lever, outcome, result),
    });
  }

  // 5. Strongest (smallest p) first.
  findings.sort((a, b) => a.pValue - b.pValue);
  return findings;
}
