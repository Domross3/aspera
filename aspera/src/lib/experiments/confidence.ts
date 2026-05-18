// Confidence-label computation for ComparisonResult.
//
// The engine reports two complementary signals:
//   - `probabilityPositive` — fraction of bootstrap resamples where the
//     effect was > 0. Surfaced to users as "Likely positive 78%."
//   - `confidenceLabel` — qualitative `"low" | "moderate" | "high" | "strong"`,
//     derived from the *directional* probability (whichever direction is
//     more likely) plus a hard floor on sample size.
//
// **Hard floor:** below 7 days of intervention data, confidence is force-
// capped to "low" regardless of effect size. This is non-negotiable —
// small samples produce wildly variable point estimates even when the
// bootstrap distribution looks tight, and we'd rather under-claim than
// have users act on a 5-day "high confidence" effect that's noise.

import type { ComparisonResult } from "../../types";

export type ConfidenceLabel = ComparisonResult["confidenceLabel"];

export const MIN_INTERVENTION_DAYS_FOR_NON_LOW = 7;

// Calibrated to feel like sane qualitative bins around the directional
// probability. 0.5 is a coin flip → "low." 0.95+ means the bootstrap
// almost always agrees on direction → "strong."
const STRONG_THRESHOLD = 0.95;
const HIGH_THRESHOLD = 0.85;
const MODERATE_THRESHOLD = 0.7;

/**
 * Map `probabilityPositive` + sample size to a qualitative label.
 *
 * - sampleSize < 7 → "low" (hard floor, overrides any computed value)
 * - directional probability ≥ 0.95 → "strong"
 * - ≥ 0.85 → "high"
 * - ≥ 0.70 → "moderate"
 * - otherwise → "low"
 *
 * "Directional probability" = max(P(positive), 1 - P(positive)). This way
 * a strongly *negative* effect ("treatment made you worse") still earns a
 * "strong" label — the qualitative readout is about how consistent the
 * direction is, not which direction.
 */
export function computeConfidenceLabel(
  probabilityPositive: number,
  sampleSize: number,
): ConfidenceLabel {
  if (sampleSize < MIN_INTERVENTION_DAYS_FOR_NON_LOW) return "low";

  const directional = Math.max(probabilityPositive, 1 - probabilityPositive);
  if (directional >= STRONG_THRESHOLD) return "strong";
  if (directional >= HIGH_THRESHOLD) return "high";
  if (directional >= MODERATE_THRESHOLD) return "moderate";
  return "low";
}
