// Engine C — temporal / lag sweep.
//
// Engine A tests same-day association (lever and outcome on the same day);
// Engine C tests the more causally-suggestive direction: does a lever TODAY
// predict the outcome TOMORROW? (e.g. alcohol tonight → tomorrow's energy).
// Same curated levers, same FDR + effect-floor gate — only the date alignment
// shifts forward by one day. Lagged associations dodge same-day reverse
// causation, but they're still observational: hypotheses, not proof.
//
// (Shares the gate shape with runSweep.ts intentionally rather than coupling to
// its internals; the duplicated loop is ~15 lines and keeps this module
// standalone.)

import type { ComparisonResult } from "../../types";
import { compareDaysBlocked } from "../experiments/blockBootstrap";
import type { DayMetric, CompareOpts } from "../experiments/types";
import { dailyFocus, dailyMoodEnergy, localDateKey } from "./aggregate";
import { buildLevers, type Lever } from "./candidates";
import {
  benjaminiHochberg,
  DEFAULT_FDR_Q,
  passesEffectFloor,
  pseudoPValue,
  type FdrInput,
} from "./fdr";
import type { SweepFinding, SweepInputs } from "./runSweep";

export interface LagSweepOpts extends CompareOpts {
  q?: number;
  minGroupDays?: number;
}

const DEFAULT_MIN_GROUP_DAYS = 7;

interface Outcome {
  id: string;
  label: string;
  series: DayMetric[];
  minEffect: number;
}

/** The calendar day after a YYYY-MM-DD key (handles month/year rollover). */
function nextDay(dateKey: string): string {
  const d = new Date(`${dateKey}T12:00:00`);
  d.setDate(d.getDate() + 1);
  return localDateKey(d.getTime());
}

function shiftForward(dates: Set<string>): Set<string> {
  const out = new Set<string>();
  for (const d of dates) out.add(nextDay(d));
  return out;
}

function buildOutcomes(inputs: SweepInputs): Outcome[] {
  const { mood, energy } = dailyMoodEnergy(inputs.moodCheckIns);
  return [
    { id: "mood", label: "mood", series: mood, minEffect: 0.5 },
    { id: "energy", label: "energy", series: energy, minEffect: 0.5 },
    { id: "focus", label: "focus", series: dailyFocus(inputs.logs), minEffect: 1 },
  ];
}

interface Pending {
  lever: Lever;
  outcome: Outcome;
  result: ComparisonResult;
}

/**
 * Sweep every curated lever's NEXT-DAY effect on each outcome, gated by FDR +
 * effect-size floor. A lever active on day t is treatment for the outcome on
 * day t+1.
 */
export function runLagSweep(
  inputs: SweepInputs,
  opts: LagSweepOpts = {},
): SweepFinding[] {
  const q = opts.q ?? DEFAULT_FDR_Q;
  const minGroup = opts.minGroupDays ?? DEFAULT_MIN_GROUP_DAYS;
  const outcomes = buildOutcomes(inputs);
  const levers = buildLevers(inputs.logs, inputs.moments, inputs.eventTypes);

  const pending: Pending[] = [];
  for (const lever of levers) {
    const lagged = shiftForward(lever.treatmentDates);
    for (const outcome of outcomes) {
      const control: DayMetric[] = [];
      const treatment: DayMetric[] = [];
      for (const d of outcome.series) {
        (lagged.has(d.date) ? treatment : control).push(d);
      }
      if (treatment.length < minGroup || control.length < minGroup) continue;
      pending.push({
        lever,
        outcome,
        result: compareDaysBlocked(control, treatment, opts),
      });
    }
  }
  if (pending.length === 0) return [];

  const fdrInputs: FdrInput<Pending>[] = pending.map((p) => ({
    item: p,
    pValue: pseudoPValue(p.result),
  }));
  const findings: SweepFinding[] = [];
  for (const g of benjaminiHochberg(fdrInputs, q)) {
    if (!g.passed) continue;
    const { lever, outcome, result } = g.item;
    if (!passesEffectFloor(result, outcome.minEffect)) continue;
    const dir = result.effect >= 0 ? "higher" : "lower";
    findings.push({
      leverId: lever.id,
      leverLabel: lever.label,
      outcomeId: outcome.id,
      outcomeLabel: outcome.label,
      result,
      pValue: g.pValue,
      headline: `The day after "${lever.label}", your ${outcome.label} tends to run ~${Math.abs(result.effect).toFixed(1)} ${dir} — worth noticing, not proven.`,
    });
  }
  findings.sort((a, b) => a.pValue - b.pValue);
  return findings;
}
