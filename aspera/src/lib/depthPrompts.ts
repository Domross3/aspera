// Eudaimonic depth prompts (Home P5).
//
// The state track (mood/energy/sleep) is hedonic and daily. The depth track is
// eudaimonic and OCCASIONAL — meaning / connection / growth — surfaced as a
// single 3-way tap on the evening reflection, never daily, never stacked. Some
// evenings show none, by design: a depth question only lands when there's a
// reason to reflect, and asking every day grinds a profound question into
// noise.
//
// selectDepthPrompt rotates the three pillars so each lands ~2×/week, shows at
// most one per evening, and skips when the user hasn't done their core
// reflection (don't pile on). Pure + deterministic given inputs → testable.

import type { DailyLog, DepthPillar, DepthValue } from "../types";

export const DEPTH_PILLARS: DepthPillar[] = [
  "meaning",
  "connection",
  "growth",
];

// Explicit, literal copy (the design grill rejected metaphorical phrasing).
export const DEPTH_PROMPTS: Record<DepthPillar, string> = {
  meaning: "Did today feel meaningful?",
  connection: "Did you feel close to someone today?",
  growth: "Did you learn or get better at something today?",
};

export const DEPTH_OPTIONS: { value: DepthValue; label: string }[] = [
  { value: "yes", label: "Yes" },
  { value: "somewhat", label: "Somewhat" },
  { value: "no", label: "No" },
];

// Minimum days between asking the SAME pillar again (≈2×/week per pillar).
const PILLAR_COOLDOWN_DAYS = 3;

function hasDepth(log: DailyLog, pillar: DepthPillar): boolean {
  return log.depth?.[pillar] != null;
}

/**
 * Pick at most one depth pillar to ask tonight, or null (show nothing).
 *
 * Rules:
 *  - Skip entirely if today's core reflection isn't underway (no reflection
 *    note and no focus set) — don't pile a profound question onto an empty day.
 *  - Never re-ask a pillar already answered today (≤1 per evening overall).
 *  - Among pillars not asked within the cooldown window, pick the one least
 *    recently asked (longest gap), so the three rotate evenly.
 *
 * `recentLogs` is newest-first. `todayLog` is today's in-progress log (may be
 * null if nothing logged yet → returns null).
 */
export function selectDepthPrompt(
  recentLogs: DailyLog[],
  todayLog: DailyLog | null,
): DepthPillar | null {
  if (!todayLog) return null;

  // Already tapped a depth pillar today → done for the evening.
  if (DEPTH_PILLARS.some((p) => hasDepth(todayLog, p))) return null;

  // Require some core reflection in progress before asking.
  const coreStarted =
    (todayLog.reflectionNote?.trim().length ?? 0) > 0 ||
    (todayLog.bigRocks?.length ?? 0) > 0;
  if (!coreStarted) return null;

  // Days since each pillar was last answered (Infinity if never).
  const lastAsked: Record<DepthPillar, number> = {
    meaning: Infinity,
    connection: Infinity,
    growth: Infinity,
  };
  recentLogs.forEach((log, idx) => {
    for (const p of DEPTH_PILLARS) {
      if (hasDepth(log, p) && lastAsked[p] === Infinity) {
        lastAsked[p] = idx; // newest-first → idx is age in logged days
      }
    }
  });

  // Eligible = not asked within the cooldown window.
  const eligible = DEPTH_PILLARS.filter(
    (p) => lastAsked[p] >= PILLAR_COOLDOWN_DAYS,
  );
  if (eligible.length === 0) return null;

  // Of the eligible, the one asked least recently (largest gap); ties break by
  // the fixed pillar order for determinism.
  return eligible.reduce((best, p) =>
    lastAsked[p] > lastAsked[best] ? p : best,
  );
}
