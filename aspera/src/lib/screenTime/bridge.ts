import {
  readDailyTotals as readNativeDailyTotals,
  refreshDailyTotals as refreshNativeDailyTotals,
} from "../../../modules/screen-time/src";
import {
  normalizeScreenTimeDayTotals,
  summarizeScreenTimeCollection,
} from "./storage";
import type { ScreenTimeCollectionSummary, ScreenTimeDayTotals } from "./types";

export async function readScreenTimeTotals(): Promise<ScreenTimeDayTotals[]> {
  const nativeTotals = await readNativeDailyTotals();
  return normalizeScreenTimeDayTotals(nativeTotals);
}

export async function refreshScreenTimeTotals(): Promise<ScreenTimeDayTotals[]> {
  const nativeTotals = await refreshNativeDailyTotals();
  return normalizeScreenTimeDayTotals(nativeTotals);
}

export async function readScreenTimeSummary(): Promise<ScreenTimeCollectionSummary> {
  return summarizeScreenTimeCollection(await readScreenTimeTotals());
}
