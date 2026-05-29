// Moving-block bootstrap — autocorrelation-aware analogue of compareDays.
//
// compareDays resamples single days i.i.d., which assumes each day is
// independent. Daily well-being / usage series are positively autocorrelated
// (today ≈ yesterday), so the i.i.d. bootstrap UNDER-states variance and
// OVER-states confidence. The circular moving-block bootstrap (Politis–Romano)
// resamples contiguous blocks instead of single days, so short-range
// dependence widens the range honestly. Same ComparisonResult shape and same
// 7-day confidence floor — a drop-in alternative for the sweep's inference.
//
// (Helpers are duplicated from compare.ts rather than imported so this stays a
// purely additive file that never touches the shared engine. Caveat: each
// group's values are its in-order subsequence, so blocks span the gaps left by
// the other group — a reasonable approximation, not a full joint-series model.)

import type { ComparisonResult } from "../../types";
import { computeConfidenceLabel } from "./confidence";
import type { CompareOpts, DayMetric, RandomFn } from "./types";

const DEFAULT_ITERATIONS = 5000;

function mean(values: number[]): number {
  if (values.length === 0) return 0;
  let s = 0;
  for (const v of values) s += v;
  return s / values.length;
}

function finiteValues(days: DayMetric[]): number[] {
  const out: number[] = [];
  for (const d of days) {
    if (typeof d.value === "number" && Number.isFinite(d.value)) out.push(d.value);
  }
  return out;
}

/** Rule-of-thumb block length ≈ n^(1/3), at least 1. */
export function defaultBlockLength(n: number): number {
  return Math.max(1, Math.round(Math.cbrt(n)));
}

/** Circular moving-block resample: stitch random length-`blockLen` runs to length n. */
function blockResample(values: number[], blockLen: number, rand: RandomFn): number[] {
  const n = values.length;
  const out = new Array<number>(n);
  let i = 0;
  while (i < n) {
    const start = Math.floor(rand() * n);
    for (let k = 0; k < blockLen && i < n; k++, i++) {
      out[i] = values[(start + k) % n];
    }
  }
  return out;
}

export interface BlockCompareOpts extends CompareOpts {
  /** Block length; defaults to ≈ n^(1/3) per group. */
  blockLength?: number;
}

/**
 * Autocorrelation-aware analogue of compareDays. Resamples contiguous blocks
 * rather than single days; otherwise identical contract (observed effect, 80%
 * range, confidence label with the 7-day floor, P(effect > 0)).
 */
export function compareDaysBlocked(
  control: DayMetric[],
  treatment: DayMetric[],
  opts: BlockCompareOpts = {},
): ComparisonResult {
  const iterations = opts.iterations ?? DEFAULT_ITERATIONS;
  const rand: RandomFn = opts.random ?? Math.random;
  const c = finiteValues(control);
  const t = finiteValues(treatment);

  if (c.length === 0 || t.length === 0) {
    return {
      effect: 0,
      range: { low: 0, high: 0 },
      confidenceLabel: "low",
      probabilityPositive: 0.5,
      sampleSize: t.length,
      computedAt: Date.now(),
    };
  }

  const observedEffect = mean(t) - mean(c);

  // Zero-variance fast path (matches compareDays).
  const cConst = c.every((v) => v === c[0]);
  const tConst = t.every((v) => v === t[0]);
  if (cConst && tConst) {
    const p = observedEffect > 0 ? 1 : observedEffect < 0 ? 0 : 0.5;
    return {
      effect: observedEffect,
      range: { low: observedEffect, high: observedEffect },
      confidenceLabel: computeConfidenceLabel(p, t.length),
      probabilityPositive: p,
      sampleSize: t.length,
      computedAt: Date.now(),
    };
  }

  const cBlock = opts.blockLength ?? defaultBlockLength(c.length);
  const tBlock = opts.blockLength ?? defaultBlockLength(t.length);

  const effects = new Array<number>(iterations);
  let positive = 0;
  for (let i = 0; i < iterations; i++) {
    const e =
      mean(blockResample(t, tBlock, rand)) - mean(blockResample(c, cBlock, rand));
    effects[i] = e;
    if (e > 0) positive++;
  }
  effects.sort((a, b) => a - b);
  const probabilityPositive = positive / iterations;

  return {
    effect: observedEffect,
    range: {
      low: effects[Math.floor(iterations * 0.1)],
      high: effects[Math.floor(iterations * 0.9)],
    },
    confidenceLabel: computeConfidenceLabel(probabilityPositive, t.length),
    probabilityPositive,
    sampleSize: t.length,
    computedAt: Date.now(),
  };
}
