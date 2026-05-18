// Engine-local types for the comparison + experiment lifecycle layer.
// Re-exports ComparisonResult from the global types/index.ts so the engine
// stays decoupled from the larger Experiment entity shape but the persisted
// payload uses the same definition.

export type { ComparisonResult } from "../../types";

// One day's value for a single metric. `date` is "YYYY-MM-DD" — included
// for potential future autocorrelation / time-series corrections, but v1's
// engine only reads `value`.
export interface DayMetric {
  date: string;
  value: number;
}

// PRNG signature for tests that need deterministic bootstrap output.
// Defaults to Math.random in production callers.
export type RandomFn = () => number;

export interface CompareOpts {
  // Number of bootstrap resamples. 5000 is enough for stable percentile
  // estimates at the 10/90 boundaries we report; 1000 is fine for tests.
  iterations?: number;
  // Seedable PRNG for reproducible tests. Production code omits this.
  random?: RandomFn;
}
