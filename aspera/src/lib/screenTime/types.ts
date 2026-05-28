import type { ScreenTimeCategory } from "./constants";

export type ScreenTimeCategoryTotals = Record<ScreenTimeCategory, number>;

export interface ScreenTimeDayTotals {
  date: string;
  byCategory: ScreenTimeCategoryTotals;
  totalMinutes: number;
}

export interface ScreenTimeCollectionSummary {
  daysCollected: number;
  latestDay: ScreenTimeDayTotals | null;
  hasWarmup: boolean;
}
