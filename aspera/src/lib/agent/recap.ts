// Weekly recap composer — the calm "soul" surface.
//
// Turns the agent's findings into a single quiet weekly readout. No live
// dashboard, no score, no streak: silence between recaps is a feature, and an
// empty week is a valid, gentle outcome ("nothing stood out — that's fine").
// Pure data → presentation; delivery (push / email / screen) lives elsewhere.

import type { SweepFinding } from "./runSweep";

export interface RecapInput {
  weekStart: string; // YYYY-MM-DD
  weekEnd: string;
  sameDayFindings: SweepFinding[];
  lagFindings: SweepFinding[];
  // Optional ambient context — shown lightly, never as a score to optimize.
  daysLogged?: number;
  avgMood?: number | null;
  avgEnergy?: number | null;
  // Optional Engine B headline, pre-summarized to a sentence by the caller.
  substitutionNote?: string | null;
}

export interface RecapItem {
  kind: "same-day" | "next-day" | "substitution";
  text: string; // hypothesis-framed headline
  strength: number; // 1 − pValue, for ordering/emphasis (0..1)
}

export interface WeeklyRecap {
  weekStart: string;
  weekEnd: string;
  isQuiet: boolean; // true when nothing cleared the bar
  summary: string; // one calm sentence
  items: RecapItem[]; // capped, strongest first
  context: {
    daysLogged?: number;
    avgMood?: number | null;
    avgEnergy?: number | null;
  };
}

// Keep a recap glanceable: at most a few patterns, never a wall.
const MAX_ITEMS = 3;

export function composeWeeklyRecap(input: RecapInput): WeeklyRecap {
  const items: RecapItem[] = [
    ...input.sameDayFindings.map((f) => ({
      kind: "same-day" as const,
      text: f.headline,
      strength: 1 - f.pValue,
    })),
    ...input.lagFindings.map((f) => ({
      kind: "next-day" as const,
      text: f.headline,
      strength: 1 - f.pValue,
    })),
  ]
    .sort((a, b) => b.strength - a.strength)
    .slice(0, MAX_ITEMS);

  // A substitution pattern isn't p-valued; append it only if there's room.
  if (input.substitutionNote && items.length < MAX_ITEMS) {
    items.push({
      kind: "substitution",
      text: input.substitutionNote,
      strength: 0,
    });
  }

  const isQuiet = items.length === 0;
  const summary = isQuiet
    ? "A quiet week — nothing stood out strongly enough to flag. That's a fine outcome, not a failure."
    : items.length === 1
      ? "One pattern worth a quiet glance this week."
      : `${items.length} patterns worth a quiet glance this week.`;

  return {
    weekStart: input.weekStart,
    weekEnd: input.weekEnd,
    isQuiet,
    summary,
    items,
    context: {
      daysLogged: input.daysLogged,
      avgMood: input.avgMood ?? null,
      avgEnergy: input.avgEnergy ?? null,
    },
  };
}
