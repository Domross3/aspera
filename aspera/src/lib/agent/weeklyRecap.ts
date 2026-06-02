// Weekly-recap assembly + freshness (Home P4).
//
// composeWeeklyRecap (recap.ts) is a pure composer; it had no path that
// actually computed a recap from raw inputs, decided the week window, or
// tracked whether the user has already seen this week's recap. This module is
// that missing glue — still pure (no React, no storage I/O) so it's testable.
// The hook (useWeeklyRecap) wires it to storage + the sweep engines.

import type { DailyLog, MoodCheckIn, Moment, EventTypeDef } from "../../types";
import { runSweep, type SweepInputs } from "./runSweep";
import { runLagSweep } from "./lag";
import { dailyMoodEnergy } from "./aggregate";
import { composeWeeklyRecap, type WeeklyRecap } from "./recap";
import { asperaDayIdForTs } from "../day";

/** Local Monday (start) of the week containing `now`, as an Aspera-day id. */
export function weekStartId(now: Date = new Date()): string {
  const d = new Date(now);
  const day = d.getDay(); // 0=Sun..6=Sat
  const diff = day === 0 ? 6 : day - 1; // days since Monday
  d.setDate(d.getDate() - diff);
  return asperaDayIdForTs(d.getTime());
}

/** Local Sunday (end) of the week containing `now`. */
export function weekEndId(now: Date = new Date()): string {
  const d = new Date(now);
  const day = d.getDay();
  const addToSunday = day === 0 ? 0 : 7 - day;
  d.setDate(d.getDate() + addToSunday);
  return asperaDayIdForTs(d.getTime());
}

export interface RecapBuildInputs {
  logs: DailyLog[];
  moodCheckIns: MoodCheckIn[];
  moments: Moment[];
  eventTypes: EventTypeDef[];
  now?: Date;
}

function mean(values: number[]): number | null {
  if (values.length === 0) return null;
  return +(values.reduce((s, v) => s + v, 0) / values.length).toFixed(1);
}

/**
 * Run the on-device sweeps and compose this week's recap. Pure given inputs
 * (no storage, no network). Ambient context (days logged, avg mood/energy) is
 * computed over the current week window only.
 */
export function buildWeeklyRecap(input: RecapBuildInputs): WeeklyRecap {
  const now = input.now ?? new Date();
  const start = weekStartId(now);
  const end = weekEndId(now);

  const sweepInputs: SweepInputs = {
    logs: input.logs,
    moodCheckIns: input.moodCheckIns,
    moments: input.moments,
    eventTypes: input.eventTypes,
  };
  const sameDayFindings = runSweep(sweepInputs);
  const lagFindings = runLagSweep(sweepInputs);

  // Ambient context — this week only. Quiet, never a score to optimize.
  const { mood, energy } = dailyMoodEnergy(input.moodCheckIns);
  const inWeek = (date: string) => date >= start && date <= end;
  const weekLogDays = new Set(
    input.logs.map((l) => l.id).filter((id) => inWeek(id)),
  );

  return composeWeeklyRecap({
    weekStart: start,
    weekEnd: end,
    sameDayFindings,
    lagFindings,
    daysLogged: weekLogDays.size,
    avgMood: mean(mood.filter((m) => inWeek(m.date)).map((m) => m.value)),
    avgEnergy: mean(energy.filter((e) => inWeek(e.date)).map((e) => e.value)),
  });
}

/**
 * Whether to surface the recap on Today: only when it has real content
 * (`!isQuiet`) AND the user hasn't already seen this week's recap. Quiet weeks
 * never interrupt; a given week shows at most once.
 */
export function shouldShowRecap(
  recap: WeeklyRecap,
  lastShownWeek: string | null,
): boolean {
  if (recap.isQuiet) return false;
  return recap.weekStart !== lastShownWeek;
}
