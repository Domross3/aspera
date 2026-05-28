import {
  SCREEN_TIME_CATEGORIES,
  type ScreenTimeCategory,
} from "./constants";
import { isScreenTimeCategory } from "./categories";
import type {
  ScreenTimeCategoryTotals,
  ScreenTimeCollectionSummary,
  ScreenTimeDayTotals,
} from "./types";

export const SCREEN_TIME_WARMUP_DAYS = 7;

function emptyCategoryTotals(): ScreenTimeCategoryTotals {
  return SCREEN_TIME_CATEGORIES.reduce((acc, category) => {
    acc[category] = 0;
    return acc;
  }, {} as ScreenTimeCategoryTotals);
}

function cleanMinutes(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.max(0, Math.round(value))
    : 0;
}

function isDateKey(value: unknown): value is string {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

export function normalizeScreenTimeDayTotals(
  raw: unknown,
): ScreenTimeDayTotals[] {
  if (!Array.isArray(raw)) return [];

  const byDate = new Map<string, ScreenTimeDayTotals>();

  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const entry = item as Record<string, unknown>;
    if (!isDateKey(entry.date)) continue;

    const byCategory = emptyCategoryTotals();
    const rawCategories =
      entry.byCategory && typeof entry.byCategory === "object"
        ? (entry.byCategory as Record<string, unknown>)
        : {};

    for (const [key, value] of Object.entries(rawCategories)) {
      const category: ScreenTimeCategory = isScreenTimeCategory(key)
        ? key
        : "other";
      byCategory[category] += cleanMinutes(value);
    }

    const explicitTotal = cleanMinutes(entry.totalMinutes);
    const categoryTotal = SCREEN_TIME_CATEGORIES.reduce(
      (sum, category) => sum + byCategory[category],
      0,
    );

    const normalized: ScreenTimeDayTotals = {
      date: entry.date,
      byCategory,
      totalMinutes: explicitTotal > 0 ? explicitTotal : categoryTotal,
    };

    const existing = byDate.get(normalized.date);
    if (!existing) {
      byDate.set(normalized.date, normalized);
      continue;
    }

    const merged = emptyCategoryTotals();
    for (const category of SCREEN_TIME_CATEGORIES) {
      merged[category] =
        existing.byCategory[category] + normalized.byCategory[category];
    }
    byDate.set(normalized.date, {
      date: normalized.date,
      byCategory: merged,
      totalMinutes: existing.totalMinutes + normalized.totalMinutes,
    });
  }

  return Array.from(byDate.values()).sort((a, b) =>
    a.date.localeCompare(b.date),
  );
}

export function summarizeScreenTimeCollection(
  totals: ScreenTimeDayTotals[],
): ScreenTimeCollectionSummary {
  const nonEmpty = totals.filter((day) => day.totalMinutes > 0);
  return {
    daysCollected: nonEmpty.length,
    latestDay: nonEmpty.at(-1) ?? null,
    hasWarmup: nonEmpty.length >= SCREEN_TIME_WARMUP_DAYS,
  };
}

export function formatMinutesLabel(minutes: number): string {
  const clean = cleanMinutes(minutes);
  if (clean < 60) return `${clean}m`;
  const hours = Math.floor(clean / 60);
  const mins = clean % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}
