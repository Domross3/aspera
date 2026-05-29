// Multiple-comparisons gate for the confidence-gated sweep (Engine A).
//
// The existing `compareDays` engine reports a per-pair confidence label with
// NO correction for multiple comparisons. Run it across many lever×outcome
// pairs and ~q·m of the "strong" labels will be chance artifacts. This module
// adds the missing layer: a Benjamini-Hochberg FDR gate (bound the expected
// FALSE-DISCOVERY fraction among surfaced findings) plus an effect-size floor
// (a finding must be large enough to matter, not merely distinguishable).
//
// Outputs of this gate are HYPOTHESES ("worth noticing"), never verdicts: the
// FDR framing is only valid for a screening tool, and the values below are
// bootstrap tail-probabilities used as APPROXIMATE p-values. Causal claims
// require the randomized n-of-1 confirmation path, not this observational sweep.

import type { ComparisonResult } from "../../types";

// Default false-discovery rate. q = 0.10 → on average at most ~10% of surfaced
// findings are expected to be false. Conventional for discovery/screening.
export const DEFAULT_FDR_Q = 0.1;

/**
 * Approximate two-sided p-value from a ComparisonResult's bootstrap output.
 *
 * `directional = max(P+, 1−P+)` measures how consistently the bootstrap agrees
 * on the SIGN of the effect (the same quantity `confidence.ts` labels). The
 * two-sided tail probability is `2·(1 − directional)`: directional 0.95 → 0.10,
 * 0.975 → 0.05, 0.5 (coin-flip) → 1.0. Clamped to [0, 1]. Two-sided because the
 * sweep does not pre-specify the direction of each lever's effect.
 */
export function pseudoPValue(result: ComparisonResult): number {
  const directional = Math.max(
    result.probabilityPositive,
    1 - result.probabilityPositive,
  );
  const p = 2 * (1 - directional);
  return Math.min(1, Math.max(0, p));
}

export interface FdrInput<T> {
  item: T;
  pValue: number;
}

export interface FdrResult<T> {
  item: T;
  pValue: number;
  passed: boolean;
  // The BH threshold (rank/m)·q this item's p-value was compared against.
  // Exposed for debugging and recap copy ("cleared the bar at p ≤ …").
  threshold: number;
}

/**
 * Benjamini-Hochberg step-up procedure. Controls the false-discovery rate at
 * level `q` across the family of `inputs`.
 *
 * Sort p-values ascending; with rank k (1-based) and family size m, find the
 * LARGEST k whose p(k) ≤ (k/m)·q; every item up to that rank passes (step-up:
 * a high-ranked survivor rescues lower-ranked ones whose individual threshold
 * was exceeded). Results are returned in the original input order.
 */
export function benjaminiHochberg<T>(
  inputs: FdrInput<T>[],
  q: number = DEFAULT_FDR_Q,
): FdrResult<T>[] {
  const m = inputs.length;
  if (m === 0) return [];

  // Original indices sorted by ascending p-value.
  const order = inputs
    .map((_, i) => i)
    .sort((a, b) => inputs[a].pValue - inputs[b].pValue);

  // Largest rank k where p(k) ≤ (k/m)·q.
  let maxRank = 0;
  for (let rank = 1; rank <= m; rank++) {
    const p = inputs[order[rank - 1]].pValue;
    if (p <= (rank / m) * q) maxRank = rank;
  }

  const out = new Array<FdrResult<T>>(m);
  order.forEach((origIdx, sortedIdx) => {
    const rank = sortedIdx + 1;
    out[origIdx] = {
      item: inputs[origIdx].item,
      pValue: inputs[origIdx].pValue,
      passed: rank <= maxRank,
      threshold: (rank / m) * q,
    };
  });
  return out;
}

/**
 * Effect-size floor: a finding must move the outcome by at least
 * `minAbsEffect` (in the outcome's own units) to count as "glaring."
 * Significance ≠ meaning — a tiny-but-consistent shift can clear FDR yet be
 * irrelevant to lived experience, so the caller supplies a per-outcome floor.
 */
export function passesEffectFloor(
  result: ComparisonResult,
  minAbsEffect: number,
): boolean {
  return Math.abs(result.effect) >= minAbsEffect;
}
