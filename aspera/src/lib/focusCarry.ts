// Focus carry-forward (Home P3).
//
// "Today's Focus" should persist across days without re-typing: opening a
// fresh day pre-fills the most recent prior day's focus. But a default nobody
// curates goes stale and starts reminding the user of last week's goals — so
// after a stretch of untouched days we surface a gentle "still these?"
// re-affirmation. Relevance, never completion.
//
// Pure helpers (no React, no storage) so they're trivially testable.

import type { DailyLog } from "../types";

const MAX_FOCUS = 3;

/** Day-count after which an unchanged focus earns a "still these?" prompt. */
export const FOCUS_REAFFIRM_AFTER_DAYS = 5;

function nonEmpty(rocks: string[] | undefined): string[] {
  return (rocks ?? []).map((r) => r.trim()).filter((r) => r.length > 0);
}

/**
 * The focus to pre-fill for today, taken from the most recent prior day that
 * had a non-empty focus. `recentLogs` is newest-first (see getRecentLogs).
 * `todayId` is excluded so we never echo today back onto itself.
 * Returns [] when there's nothing to carry.
 */
export function carryForwardFocus(
  recentLogs: DailyLog[],
  todayId: string,
): string[] {
  const prior = recentLogs.find(
    (l) => l.id !== todayId && nonEmpty(l.bigRocks).length > 0,
  );
  return prior ? nonEmpty(prior.bigRocks).slice(0, MAX_FOCUS) : [];
}

/** Order-insensitive set equality on trimmed, non-empty focus strings. */
function sameFocus(a: string[], b: string[]): boolean {
  const sa = nonEmpty(a);
  const sb = nonEmpty(b);
  if (sa.length !== sb.length) return false;
  const setB = new Set(sb);
  return sa.every((x) => setB.has(x));
}

/**
 * How many consecutive most-recent logged days share today's exact focus set.
 * Walks newest-first while the focus matches `current`, stopping at the first
 * day that differs or has no focus. Used to decide when the focus has gone
 * stale enough to ask "still these?".
 *
 * Example: current=[A,B], logs (newest-first) all [A,B] for 6 days → 6.
 */
export function consecutiveUnchangedFocusDays(
  recentLogs: DailyLog[],
  current: string[],
): number {
  const cur = nonEmpty(current);
  if (cur.length === 0) return 0;
  let count = 0;
  for (const log of recentLogs) {
    if (sameFocus(log.bigRocks, cur)) count++;
    else break;
  }
  return count;
}

/**
 * Whether to show the "still these?" re-affirmation: the same focus has ridden
 * untouched for at least FOCUS_REAFFIRM_AFTER_DAYS logged days.
 */
export function shouldReaffirmFocus(
  recentLogs: DailyLog[],
  current: string[],
): boolean {
  return (
    consecutiveUnchangedFocusDays(recentLogs, current) >=
    FOCUS_REAFFIRM_AFTER_DAYS
  );
}
