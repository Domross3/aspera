// Bootstrap-based two-group comparison engine for experiments + the
// ad-hoc Compare surface (Phase 8 sub-phases 8e + 8g).
//
// Given two arrays of daily values (control + treatment), produce a
// ComparisonResult: the observed effect, an 80% bootstrap range (10th–90th
// percentile of resampled effect estimates), a qualitative confidence
// label, and the bootstrap-derived probability the effect is positive.
//
// We use bootstrap rather than a parametric t-test because:
//   1. Sample sizes are tiny (typical 7–30 daily values per group), where
//      Welch's-t assumptions about normality break easily.
//   2. The 80% percentile range we surface to users is exactly the band
//      computed from the bootstrap distribution — no formula needed.
//   3. It works identically across all outcome shapes (focus rating
//      1–10, sleep hours, screen-time minutes) without per-shape tuning.

import type { ComparisonResult } from "../../types";
import { computeConfidenceLabel } from "./confidence";
import type { CompareOpts, DayMetric, RandomFn } from "./types";

const DEFAULT_ITERATIONS = 5000;

function mean(values: number[]): number {
  if (values.length === 0) return 0;
  let sum = 0;
  for (const v of values) sum += v;
  return sum / values.length;
}

// Filter out NaN / Infinity values that could poison the bootstrap. A
// `value: null` should already be excluded by the caller, but we belt-
// and-suspenders it here.
function finiteValues(days: DayMetric[]): number[] {
  const out: number[] = [];
  for (const d of days) {
    if (typeof d.value === "number" && Number.isFinite(d.value)) {
      out.push(d.value);
    }
  }
  return out;
}

function bootstrapResample(values: number[], rand: RandomFn): number[] {
  const n = values.length;
  const out = new Array<number>(n);
  for (let i = 0; i < n; i++) {
    out[i] = values[Math.floor(rand() * n)];
  }
  return out;
}

// Build a degenerate "no signal" result. Used when one of the input
// groups is empty — there's literally no comparison to make, but we
// want the caller to get a well-typed object back rather than throw.
function emptyResult(sampleSize: number): ComparisonResult {
  return {
    effect: 0,
    range: { low: 0, high: 0 },
    confidenceLabel: "low",
    probabilityPositive: 0.5,
    sampleSize,
    computedAt: Date.now(),
  };
}

/**
 * Compare a treatment group's daily values to a control group's. Returns
 * a ComparisonResult with the observed effect, an 80% bootstrap range,
 * a qualitative confidence label, and the probability the true effect
 * is positive.
 *
 * The bootstrap resamples both groups with replacement `iterations`
 * times; each resample produces a `mean(treatment') - mean(control')`
 * difference; we take the 10th and 90th percentile of those differences
 * as the reported range.
 *
 * `confidenceLabel` is force-capped to "low" when `treatment.length < 7`
 * — see `confidence.ts` for why.
 */
export function compareDays(
  control: DayMetric[],
  treatment: DayMetric[],
  opts: CompareOpts = {},
): ComparisonResult {
  const iterations = opts.iterations ?? DEFAULT_ITERATIONS;
  const rand: RandomFn = opts.random ?? Math.random;

  const controlValues = finiteValues(control);
  const treatmentValues = finiteValues(treatment);

  if (controlValues.length === 0 || treatmentValues.length === 0) {
    return emptyResult(treatmentValues.length);
  }

  const controlMean = mean(controlValues);
  const treatmentMean = mean(treatmentValues);
  const observedEffect = treatmentMean - controlMean;

  // Zero-variance fast path: if both groups are perfectly homogeneous
  // (every day the same value), the bootstrap distribution is a single
  // point. probabilityPositive becomes deterministic. Sidestep the
  // resampling loop entirely.
  const controlConstant = controlValues.every((v) => v === controlValues[0]);
  const treatmentConstant = treatmentValues.every(
    (v) => v === treatmentValues[0],
  );
  if (controlConstant && treatmentConstant) {
    const probPositive =
      observedEffect > 0 ? 1 : observedEffect < 0 ? 0 : 0.5;
    return {
      effect: observedEffect,
      range: { low: observedEffect, high: observedEffect },
      confidenceLabel: computeConfidenceLabel(
        probPositive,
        treatmentValues.length,
      ),
      probabilityPositive: probPositive,
      sampleSize: treatmentValues.length,
      computedAt: Date.now(),
    };
  }

  // Main bootstrap loop. For each iteration, resample both groups with
  // replacement and store the difference of means.
  const effects = new Array<number>(iterations);
  let positiveCount = 0;
  for (let i = 0; i < iterations; i++) {
    const resampleControl = bootstrapResample(controlValues, rand);
    const resampleTreatment = bootstrapResample(treatmentValues, rand);
    const e = mean(resampleTreatment) - mean(resampleControl);
    effects[i] = e;
    if (e > 0) positiveCount++;
  }

  // Sort once to read percentiles. ~5000 entries → ~1ms.
  effects.sort((a, b) => a - b);
  const p10 = effects[Math.floor(iterations * 0.1)];
  const p90 = effects[Math.floor(iterations * 0.9)];
  const probabilityPositive = positiveCount / iterations;

  return {
    effect: observedEffect,
    range: { low: p10, high: p90 },
    confidenceLabel: computeConfidenceLabel(
      probabilityPositive,
      treatmentValues.length,
    ),
    probabilityPositive,
    sampleSize: treatmentValues.length,
    computedAt: Date.now(),
  };
}
