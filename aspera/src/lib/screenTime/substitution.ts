// Engine B — substitution / filler / leak analysis over screen-time history.
//
// Engine A asks "does lever X move outcome Y?". Engine B asks the compositional
// question the two-group engine can't: when time in one category drops, where
// does it GO? It runs on the per-category daily history (ScreenTimeDayTotals)
// the report extension populates — so it's only meaningful once that pipeline
// is live and warmed up (≥ ~2 weeks), but it's fully testable now on synthetic
// data. Pure TS, ships OTA.

import { SCREEN_TIME_CATEGORIES, type ScreenTimeCategory } from "./constants";
import type { ScreenTimeDayTotals } from "./types";

/**
 * Pearson correlation of two equal-length series. Returns 0 for degenerate
 * (constant or <2-point) inputs instead of NaN, so callers can rank safely.
 */
export function pearson(xs: number[], ys: number[]): number {
  const n = Math.min(xs.length, ys.length);
  if (n < 2) return 0;
  let sx = 0;
  let sy = 0;
  for (let i = 0; i < n; i++) {
    sx += xs[i];
    sy += ys[i];
  }
  const mx = sx / n;
  const my = sy / n;
  let cov = 0;
  let vx = 0;
  let vy = 0;
  for (let i = 0; i < n; i++) {
    const dx = xs[i] - mx;
    const dy = ys[i] - my;
    cov += dx * dy;
    vx += dx * dx;
    vy += dy * dy;
  }
  if (vx === 0 || vy === 0) return 0;
  return cov / Math.sqrt(vx * vy);
}

/** Day-over-day change in each category's minutes, in date order. */
export function dailyDeltas(
  days: ScreenTimeDayTotals[],
): Record<ScreenTimeCategory, number[]> {
  const sorted = [...days].sort((a, b) => a.date.localeCompare(b.date));
  const out = {} as Record<ScreenTimeCategory, number[]>;
  for (const cat of SCREEN_TIME_CATEGORIES) out[cat] = [];
  for (let i = 1; i < sorted.length; i++) {
    for (const cat of SCREEN_TIME_CATEGORIES) {
      out[cat].push(
        (sorted[i].byCategory[cat] ?? 0) - (sorted[i - 1].byCategory[cat] ?? 0),
      );
    }
  }
  return out;
}

export interface SubstitutionPair {
  a: ScreenTimeCategory;
  b: ScreenTimeCategory;
  /** Pearson of daily deltas; negative ⇒ when one falls the other rises. */
  correlation: number;
}

/**
 * Pairwise delta-correlation across categories, most-substituting (most
 * negative) first. A strongly negative pair is the "block A → B rises" signal,
 * recovered observationally from natural day-to-day variation.
 */
export function substitutionMatrix(
  days: ScreenTimeDayTotals[],
): SubstitutionPair[] {
  const deltas = dailyDeltas(days);
  const cats = SCREEN_TIME_CATEGORIES;
  const pairs: SubstitutionPair[] = [];
  for (let i = 0; i < cats.length; i++) {
    for (let j = i + 1; j < cats.length; j++) {
      pairs.push({
        a: cats[i],
        b: cats[j],
        correlation: pearson(deltas[cats[i]], deltas[cats[j]]),
      });
    }
  }
  return pairs.sort((x, y) => x.correlation - y.correlation);
}

export interface FillerScore {
  category: ScreenTimeCategory;
  /** Mean delta-correlation with the other categories; more negative ⇒ stronger filler. */
  score: number;
}

/**
 * A "filler" absorbs displaced time: its minutes rise when others fall, so its
 * average delta-correlation with the rest is the most negative. Sorted
 * strongest-filler first.
 */
export function fillerScores(days: ScreenTimeDayTotals[]): FillerScore[] {
  const deltas = dailyDeltas(days);
  const cats = SCREEN_TIME_CATEGORIES;
  const scores: FillerScore[] = cats.map((cat) => {
    const others = cats.filter((c) => c !== cat);
    const mean =
      others.reduce((s, o) => s + pearson(deltas[cat], deltas[o]), 0) /
      others.length;
    return { category: cat, score: mean };
  });
  return scores.sort((x, y) => x.score - y.score);
}

export interface SubstitutionAnalysis {
  matrix: SubstitutionPair[];
  topSubstitution: SubstitutionPair | null;
  fillers: FillerScore[];
  topFiller: FillerScore | null;
  daysAnalyzed: number;
}

// Need a warmed-up history before any of this means anything (matches the
// 7-day warmup the screen-time collection layer already enforces).
const MIN_DAYS = 7;
// Heuristic floors for calling something a real substitution / filler.
const SUBSTITUTION_FLOOR = -0.3;
const FILLER_FLOOR = -0.2;

/**
 * Full substitution read for a screen-time history. Returns empty (with the
 * day count) below the warmup floor so callers can stay silent until there's
 * enough data — the same "surface nothing until it's credible" discipline as
 * the confidence-gated sweep.
 */
export function analyzeSubstitution(
  days: ScreenTimeDayTotals[],
): SubstitutionAnalysis {
  const usable = days.filter((d) => d.totalMinutes > 0);
  if (usable.length < MIN_DAYS) {
    return {
      matrix: [],
      topSubstitution: null,
      fillers: [],
      topFiller: null,
      daysAnalyzed: usable.length,
    };
  }
  const matrix = substitutionMatrix(usable);
  const fillers = fillerScores(usable);
  const top = matrix[0] ?? null;
  const topFiller = fillers[0] ?? null;
  return {
    matrix,
    topSubstitution: top && top.correlation <= SUBSTITUTION_FLOOR ? top : null,
    fillers,
    topFiller: topFiller && topFiller.score <= FILLER_FLOOR ? topFiller : null,
    daysAnalyzed: usable.length,
  };
}
