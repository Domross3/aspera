// Canonical "Aspera day" — the single source of truth for what calendar day a
// moment belongs to.
//
// Two bugs motivated this:
//   1. Day keys were computed with `new Date().toISOString().split("T")[0]`,
//      which is UTC. For a user west of UTC (e.g. US), an evening log lands on
//      *tomorrow's* UTC date — so "today" rolled over before local midnight and
//      the same wall-clock day could resolve to two different ids.
//   2. A day that ends at midnight splits late-night activity from the day it
//      psychologically belongs to.
//
// Fix: a LOCAL-time day with a 4am cutoff. Anything from 00:00–03:59 local is
// counted as the previous day. This matches human "periods of consciousness"
// better than the clock and makes evening + late-night logging land together.
//
// IMPORTANT: every place that asks "what day is it?" (today's log id, the
// selected day) AND every place that buckets a timestamped event (mood
// check-ins, moments, plays) must use this same cutoff, or an event logged at
// 1am will bucket to a different day than `asperaDayId()` returns — which is
// exactly the mismatch we're removing.

/** Hour (local) at which a new Aspera day begins. 00:00–03:59 → previous day. */
export const DAY_CUTOFF_HOUR = 4;

function pad2(n: number): string {
  return n.toString().padStart(2, "0");
}

/** Format a Date as a local-time YYYY-MM-DD (no timezone conversion). */
function localYMD(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

/**
 * The Aspera-day id for a given instant, honoring the 4am local cutoff.
 * Shift the clock back by the cutoff, then take the local calendar date —
 * so 2026-06-02 01:30 local → "2026-06-01".
 */
export function asperaDayIdForTs(timestampMs: number): string {
  const shifted = new Date(timestampMs - DAY_CUTOFF_HOUR * 60 * 60 * 1000);
  return localYMD(shifted);
}

/** The Aspera-day id for right now (or an optional reference Date). */
export function asperaDayId(now: Date = new Date()): string {
  return asperaDayIdForTs(now.getTime());
}
