import AsyncStorage from "@react-native-async-storage/async-storage";
import { DailyLog, STORAGE_KEYS } from "../types";
import { SearchDateRange } from "../types/search";

/**
 * Strip null and undefined values from the top level of an object.
 */
function stripEmpty(log: Record<string, unknown>): DailyLog {
  const cleaned: Record<string, unknown> = {};
  for (const key of Object.keys(log)) {
    if (log[key] !== null && log[key] !== undefined) {
      cleaned[key] = log[key];
    }
  }
  return cleaned as unknown as DailyLog;
}

/**
 * Retrieve DailyLogs from AsyncStorage filtered by date range.
 *
 * - Handles missing days gracefully (returns only what exists)
 * - Strips null/undefined fields to reduce payload size
 * - Returns results in chronological order
 * - Caps results to `maxDays` most recent entries (default 90)
 */
export async function getLogsForQuery(
  dateRange: SearchDateRange,
  maxDays: number = 90,
): Promise<DailyLog[]> {
  const allKeys = await AsyncStorage.getAllKeys();
  const logKeys = allKeys.filter((k) => k.startsWith(STORAGE_KEYS.LOGS_PREFIX));

  if (logKeys.length === 0) return [];

  // Extract dates from keys and filter by range
  const filtered = logKeys.filter((key) => {
    const date = key.slice(STORAGE_KEYS.LOGS_PREFIX.length);
    if (dateRange.from && date < dateRange.from) return false;
    if (dateRange.to && date > dateRange.to) return false;
    return true;
  });

  if (filtered.length === 0) return [];

  const pairs = await AsyncStorage.multiGet(filtered);

  const logs: DailyLog[] = [];
  for (const [, value] of pairs) {
    if (!value) continue;
    try {
      const parsed = JSON.parse(value);
      logs.push(stripEmpty(parsed));
    } catch {
      // Skip corrupted entries
    }
  }

  // Sort chronologically by date
  logs.sort((a, b) => a.date.localeCompare(b.date));

  // Cap to maxDays most recent, keeping chronological order
  if (logs.length > maxDays) {
    return logs.slice(logs.length - maxDays);
  }

  return logs;
}
