// Daily aggregation for the confidence-gated sweep (Engine A).
//
// The richest, densest signal in the app is the momentary MoodCheckIn stream
// (mood + energy, multiple per day). The sweep engine compares *daily* values,
// so we collapse the momentary stream into per-day means here. Daily-log focus
// ratings are a sparser secondary outcome.

import type { DailyLog, MoodCheckIn } from "../../types";
import type { DayMetric } from "../experiments/types";
import {
  SCREEN_TIME_CATEGORIES,
  type ScreenTimeCategory,
} from "../screenTime/constants";
import type { ScreenTimeDayTotals } from "../screenTime/types";

/** Local-time YYYY-MM-DD key for a ms-epoch timestamp. */
export function localDateKey(timestampMs: number): string {
  const d = new Date(timestampMs);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

interface DayMeanAccumulator {
  moodSum: number;
  energySum: number;
  count: number;
}

/**
 * Collapse momentary mood/energy check-ins into per-day mean series (the two
 * circumplex axes). A day is included only if it has ≥1 finite check-in.
 * Returns date-sorted DayMetric arrays ready for `compareDays`.
 */
export function dailyMoodEnergy(checkIns: MoodCheckIn[]): {
  mood: DayMetric[];
  energy: DayMetric[];
} {
  const byDate = new Map<string, DayMeanAccumulator>();
  for (const c of checkIns) {
    if (!Number.isFinite(c.mood) || !Number.isFinite(c.energy)) continue;
    const key = localDateKey(c.timestamp);
    const acc = byDate.get(key) ?? { moodSum: 0, energySum: 0, count: 0 };
    acc.moodSum += c.mood;
    acc.energySum += c.energy;
    acc.count += 1;
    byDate.set(key, acc);
  }

  const dates = Array.from(byDate.keys()).sort();
  const mood: DayMetric[] = [];
  const energy: DayMetric[] = [];
  for (const date of dates) {
    const acc = byDate.get(date)!;
    mood.push({ date, value: acc.moodSum / acc.count });
    energy.push({ date, value: acc.energySum / acc.count });
  }
  return { mood, energy };
}

/**
 * Collapse per-day screen-time totals into `DayMetric` series for Engine A.
 * Days with `totalMinutes === 0` are dropped (no data collected). Series are
 * sorted ascending by date. `total` maps to `totalMinutes`; each
 * `byCategory[cat]` maps to `byCategory[cat] ?? 0`.
 */
export function dailyScreenTime(totals: ScreenTimeDayTotals[]): {
  total: DayMetric[];
  byCategory: Record<ScreenTimeCategory, DayMetric[]>;
} {
  const filtered = totals
    .filter((t) => t.totalMinutes !== 0)
    .sort((a, b) => a.date.localeCompare(b.date));

  const total: DayMetric[] = filtered.map((t) => ({
    date: t.date,
    value: t.totalMinutes,
  }));

  const byCategory = {} as Record<ScreenTimeCategory, DayMetric[]>;
  for (const cat of SCREEN_TIME_CATEGORIES) {
    byCategory[cat] = filtered.map((t) => ({
      date: t.date,
      value: t.byCategory[cat] ?? 0,
    }));
  }

  return { total, byCategory };
}

/**
 * Daily focus rating from logs. Only days the user *explicitly* rated output
 * are included — `outputRated === false` days carry a default 5 we must not
 * treat as a real rating (mirrors the exclusion logic in experiments/adhoc.ts).
 */
export function dailyFocus(logs: DailyLog[]): DayMetric[] {
  const out: DayMetric[] = [];
  for (const log of logs) {
    if (log.outputRated === false) continue;
    const f = log.output?.focusRating;
    if (typeof f === "number" && Number.isFinite(f)) {
      out.push({ date: log.date, value: f });
    }
  }
  return out.sort((a, b) => a.date.localeCompare(b.date));
}
