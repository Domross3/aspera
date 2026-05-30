// Daily log of which app restrictions were active, persisted to AsyncStorage.
//
// Used by Engine A to build the "restriction-active" lever: on which days was
// at least one app limit turned on? The data is observational (the user chose
// when to enable limits), so any sweep finding is hypothesis-generating only.
// See the comment in candidates.ts for the planned n-of-1 follow-up.

import AsyncStorage from "@react-native-async-storage/async-storage";
import { localDateKey } from "../agent/aggregate";

const STORAGE_KEY = "aspera:restrictionDailyLog";
const MAX_ENTRIES = 90;

interface RestrictionLogEntry {
  date: string;
  activeRestrictionIds: string[];
}

async function readLog(): Promise<RestrictionLogEntry[]> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as RestrictionLogEntry[];
  } catch {
    return [];
  }
}

/**
 * Upsert today's active restriction IDs. Same-day entries are replaced (one
 * entry per calendar day). The log is capped to the last ~90 entries so it
 * never grows unbounded.
 */
export async function logActiveRestrictions(
  activeRestrictionIds: string[],
  now = Date.now(),
): Promise<void> {
  const date = localDateKey(now);
  const existing = await readLog();

  // Replace any same-day entry, then append today's.
  const deduped = existing.filter((e) => e.date !== date);
  deduped.push({ date, activeRestrictionIds });

  // Keep the most recent MAX_ENTRIES entries (sorted chronologically).
  const trimmed = deduped
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-MAX_ENTRIES);

  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
}

/**
 * Return the YYYY-MM-DD dates on which at least one restriction was active.
 * These are passed into Engine A as the "restriction-active" lever's treatment
 * dates.
 */
export async function readActiveRestrictionDates(): Promise<string[]> {
  const log = await readLog();
  return log
    .filter((e) => e.activeRestrictionIds.length > 0)
    .map((e) => e.date);
}
