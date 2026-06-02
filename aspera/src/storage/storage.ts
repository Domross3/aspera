import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  DailyLog,
  AppSettings,
  InsightsResponse,
  Moment,
  MoodCheckIn,
  ReservesState,
  STORAGE_KEYS,
  MAX_RESERVES_PER_WEEK,
  IntegrationConnection,
  DailyIntegrationSummary,
} from "../types";
import { getDefaultIntegrationConnections } from "../lib/integrations";
import { asperaDayIdForTs } from "../lib/day";
import {
  migrateAppSettings,
  migrateDailyLog,
  settingsNeedsMigration,
} from "./migrations";

// ─── Daily Logs ────────────────────────────────────────────────────────────

export async function saveLog(log: DailyLog): Promise<void> {
  const key = `${STORAGE_KEYS.LOGS_PREFIX}${log.id}`;
  await AsyncStorage.setItem(key, JSON.stringify(log));
}

export async function getLog(date: string): Promise<DailyLog | null> {
  const key = `${STORAGE_KEYS.LOGS_PREFIX}${date}`;
  const raw = await AsyncStorage.getItem(key);
  if (!raw) return null;
  try {
    return migrateDailyLog(JSON.parse(raw) as DailyLog);
  } catch {
    return null;
  }
}

export async function getRecentLogs(days = 7): Promise<DailyLog[]> {
  const allKeys = await AsyncStorage.getAllKeys();
  const logKeys = allKeys
    .filter((k) => k.startsWith(STORAGE_KEYS.LOGS_PREFIX))
    .sort()
    .reverse()
    .slice(0, days);

  if (logKeys.length === 0) return [];
  const pairs = await AsyncStorage.multiGet(logKeys);
  return pairs
    .map(([, v]) => {
      if (!v) return null;
      try {
        return migrateDailyLog(JSON.parse(v) as DailyLog);
      } catch {
        return null;
      }
    })
    .filter(Boolean) as DailyLog[];
}

export async function clearAllLogs(): Promise<void> {
  const allKeys = await AsyncStorage.getAllKeys();
  const logKeys = allKeys.filter((k) => k.startsWith(STORAGE_KEYS.LOGS_PREFIX));
  await AsyncStorage.multiRemove(logKeys);
}

// ─── Settings ──────────────────────────────────────────────────────────────

export async function saveSettings(settings: AppSettings): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
}

export async function getSettings(): Promise<AppSettings> {
  // All migration logic — legacy CustomMetricDef → EventTypeDef, legacy
  // quickMoodWindow* → wakeTime/sleepTime, missing defaults, etc. — lives
  // in `migrations.ts`. This function just deals with serialization and
  // the write-back-on-migration cache update.
  const raw = await AsyncStorage.getItem(STORAGE_KEYS.SETTINGS);
  if (!raw) {
    return migrateAppSettings({});
  }
  let stored: Partial<AppSettings>;
  try {
    stored = JSON.parse(raw) as Partial<AppSettings>;
  } catch {
    // Corrupt blob (extremely rare — only if AsyncStorage was tampered
    // with). Return a clean default rather than throwing on app open.
    return migrateAppSettings({});
  }
  const migrated = migrateAppSettings(stored);
  if (settingsNeedsMigration(stored)) {
    // Persist the migrated shape so subsequent reads skip the work.
    // Fire-and-forget — failure here just means next launch re-migrates.
    void AsyncStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(migrated));
  }
  return migrated;
}

// ─── Insights Cache ────────────────────────────────────────────────────────

export async function saveInsights(insights: InsightsResponse): Promise<void> {
  await AsyncStorage.setItem(
    STORAGE_KEYS.INSIGHTS_CACHE,
    JSON.stringify(insights),
  );
}

export async function getInsights(): Promise<InsightsResponse | null> {
  const raw = await AsyncStorage.getItem(STORAGE_KEYS.INSIGHTS_CACHE);
  return raw ? JSON.parse(raw) : null;
}

export async function clearInsights(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEYS.INSIGHTS_CACHE);
}

// ─── Integrations ─────────────────────────────────────────────────────────

function mergeIntegrationConnections(
  saved: IntegrationConnection[],
  defaults: IntegrationConnection[],
): IntegrationConnection[] {
  const savedById = new Map(
    saved.map((connection) => [connection.id, connection]),
  );

  return defaults.map((connection) => {
    const existing = savedById.get(connection.id);
    return existing
      ? {
          ...connection,
          ...existing,
          highlights: existing.highlights ?? connection.highlights,
        }
      : connection;
  });
}

export async function saveIntegrationConnections(
  connections: IntegrationConnection[],
): Promise<void> {
  await AsyncStorage.setItem(
    STORAGE_KEYS.INTEGRATION_CONNECTIONS,
    JSON.stringify(connections),
  );
}

export async function getIntegrationConnections(): Promise<
  IntegrationConnection[]
> {
  const defaults = getDefaultIntegrationConnections();
  const raw = await AsyncStorage.getItem(STORAGE_KEYS.INTEGRATION_CONNECTIONS);
  if (!raw) return defaults;

  return mergeIntegrationConnections(
    JSON.parse(raw) as IntegrationConnection[],
    defaults,
  );
}

export async function saveIntegrationSummaries(
  summaries: DailyIntegrationSummary[],
): Promise<void> {
  await AsyncStorage.setItem(
    STORAGE_KEYS.INTEGRATION_SUMMARIES,
    JSON.stringify(summaries),
  );
}

export async function getIntegrationSummaries(): Promise<
  DailyIntegrationSummary[]
> {
  // Mock-fallback removed — previously, an empty cache fell back to a
  // synthesized week of mock integration data. Now: empty cache → empty
  // array, so the UI reflects the real state ("no integration data yet")
  // until a real source writes summaries via saveIntegrationSummaries.
  const raw = await AsyncStorage.getItem(STORAGE_KEYS.INTEGRATION_SUMMARIES);
  return raw ? JSON.parse(raw) : [];
}

export async function clearIntegrationData(): Promise<void> {
  await AsyncStorage.multiRemove([
    STORAGE_KEYS.INTEGRATION_CONNECTIONS,
    STORAGE_KEYS.INTEGRATION_SUMMARIES,
  ]);
}

// ─── Today Recommendation ──────────────────────────────────────────────────

export async function saveTodayRec(date: string, rec: string): Promise<void> {
  await AsyncStorage.setItem(`${STORAGE_KEYS.TODAY_REC_PREFIX}${date}`, rec);
}

export async function getTodayRec(date: string): Promise<string | null> {
  return AsyncStorage.getItem(`${STORAGE_KEYS.TODAY_REC_PREFIX}${date}`);
}

// ─── Mood Check-ins ───────────────────────────────────────────────────────

export async function saveMoodCheckIn(checkIn: MoodCheckIn): Promise<void> {
  const date = asperaDayIdForTs(checkIn.timestamp);
  const key = `${STORAGE_KEYS.MOOD_PREFIX}${date}`;
  const existing = await getMoodCheckIns(date);
  existing.push(checkIn);
  await AsyncStorage.setItem(key, JSON.stringify(existing));
}

export async function getMoodCheckIns(date: string): Promise<MoodCheckIn[]> {
  const key = `${STORAGE_KEYS.MOOD_PREFIX}${date}`;
  const raw = await AsyncStorage.getItem(key);
  return raw ? JSON.parse(raw) : [];
}

export async function clearAllMoodCheckIns(): Promise<void> {
  const allKeys = await AsyncStorage.getAllKeys();
  const moodKeys = allKeys.filter((k) =>
    k.startsWith(STORAGE_KEYS.MOOD_PREFIX),
  );
  if (moodKeys.length > 0) await AsyncStorage.multiRemove(moodKeys);
}

export async function getRecentMoodCheckIns(days = 7): Promise<MoodCheckIn[]> {
  const allKeys = await AsyncStorage.getAllKeys();
  const moodKeys = allKeys
    .filter((k) => k.startsWith(STORAGE_KEYS.MOOD_PREFIX))
    .sort()
    .reverse()
    .slice(0, days);
  if (moodKeys.length === 0) return [];
  const pairs = await AsyncStorage.multiGet(moodKeys);
  const all: MoodCheckIn[] = [];
  for (const [, v] of pairs) {
    if (v) all.push(...JSON.parse(v));
  }
  return all.sort((a, b) => a.timestamp - b.timestamp);
}

// Overwrite the local cache with cloud-fetched mood check-ins. Groups by day
// and SETs each bucket (vs. saveMoodCheckIn which appends), so warming the
// cache from a cloud read is idempotent — repeated calls never duplicate.
// Days not present in the input are left untouched.
export async function replaceCachedMoodCheckIns(
  checkIns: MoodCheckIn[],
): Promise<void> {
  const byDay = new Map<string, MoodCheckIn[]>();
  for (const c of checkIns) {
    const date = asperaDayIdForTs(c.timestamp);
    const bucket = byDay.get(date) ?? [];
    bucket.push(c);
    byDay.set(date, bucket);
  }
  const entries: [string, string][] = [...byDay.entries()].map(
    ([date, list]) => [
      `${STORAGE_KEYS.MOOD_PREFIX}${date}`,
      JSON.stringify(list),
    ],
  );
  if (entries.length > 0) await AsyncStorage.multiSet(entries);
}

// ─── Moments ──────────────────────────────────────────────────────────────
// Free-form timestamped events that live on the Mood tab timeline. Storage
// shape mirrors mood check-ins exactly: one AsyncStorage key per day,
// keyed by `aspera_moment_<YYYY-MM-DD>`, value = JSON Moment[].

export async function saveMoment(moment: Moment): Promise<void> {
  const date = asperaDayIdForTs(moment.timestamp);
  const key = `${STORAGE_KEYS.MOMENT_PREFIX}${date}`;
  const existing = await getMoments(date);
  existing.push(moment);
  await AsyncStorage.setItem(key, JSON.stringify(existing));
}

export async function getMoments(date: string): Promise<Moment[]> {
  const key = `${STORAGE_KEYS.MOMENT_PREFIX}${date}`;
  const raw = await AsyncStorage.getItem(key);
  return raw ? JSON.parse(raw) : [];
}

export async function getRecentMoments(days = 14): Promise<Moment[]> {
  // Larger default window than mood check-ins because the promotion
  // nudge (Phase 7) operates on a 14-day rolling window. Callers that
  // only need a week's worth can slice the result.
  const allKeys = await AsyncStorage.getAllKeys();
  const momentKeys = allKeys
    .filter((k) => k.startsWith(STORAGE_KEYS.MOMENT_PREFIX))
    .sort()
    .reverse()
    .slice(0, days);
  if (momentKeys.length === 0) return [];
  const pairs = await AsyncStorage.multiGet(momentKeys);
  const all: Moment[] = [];
  for (const [, v] of pairs) {
    if (v) all.push(...JSON.parse(v));
  }
  return all.sort((a, b) => a.timestamp - b.timestamp);
}

// Idempotent cloud→cache warm for moments. Same overwrite-by-day approach
// as replaceCachedMoodCheckIns — no duplicates on repeated calls.
export async function replaceCachedMoments(moments: Moment[]): Promise<void> {
  const byDay = new Map<string, Moment[]>();
  for (const m of moments) {
    const date = asperaDayIdForTs(m.timestamp);
    const bucket = byDay.get(date) ?? [];
    bucket.push(m);
    byDay.set(date, bucket);
  }
  const entries: [string, string][] = [...byDay.entries()].map(
    ([date, list]) => [
      `${STORAGE_KEYS.MOMENT_PREFIX}${date}`,
      JSON.stringify(list),
    ],
  );
  if (entries.length > 0) await AsyncStorage.multiSet(entries);
}

export async function deleteMoment(id: string): Promise<void> {
  // Moment ids are ISO timestamps, so the date prefix is recoverable. We
  // scan all moment-day buckets and rewrite the one that contains it —
  // O(n) over days, n is small (max 14ish).
  const allKeys = await AsyncStorage.getAllKeys();
  const momentKeys = allKeys.filter((k) =>
    k.startsWith(STORAGE_KEYS.MOMENT_PREFIX),
  );
  for (const key of momentKeys) {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) continue;
    const list = JSON.parse(raw) as Moment[];
    const next = list.filter((m) => m.id !== id);
    if (next.length !== list.length) {
      await AsyncStorage.setItem(key, JSON.stringify(next));
      return;
    }
  }
}

export async function clearAllMoments(): Promise<void> {
  const allKeys = await AsyncStorage.getAllKeys();
  const momentKeys = allKeys.filter((k) =>
    k.startsWith(STORAGE_KEYS.MOMENT_PREFIX),
  );
  if (momentKeys.length > 0) await AsyncStorage.multiRemove(momentKeys);
}

// ─── Emergency Reserves ───────────────────────────────────────────────────

function getWeekStart(): string {
  const now = new Date();
  const day = now.getDay(); // 0=Sun, 1=Mon...
  const diff = day === 0 ? 6 : day - 1; // shift so Monday=0
  const monday = new Date(now);
  monday.setDate(now.getDate() - diff);
  return monday.toISOString().split("T")[0];
}

export async function getReserves(): Promise<ReservesState> {
  const raw = await AsyncStorage.getItem(STORAGE_KEYS.RESERVES);
  const weekStart = getWeekStart();
  if (raw) {
    const state: ReservesState = JSON.parse(raw);
    // Reset if we're in a new week
    if (state.weekStartDate !== weekStart) {
      const fresh: ReservesState = {
        weekStartDate: weekStart,
        reservesUsed: 0,
        reserveDates: [],
      };
      await AsyncStorage.setItem(STORAGE_KEYS.RESERVES, JSON.stringify(fresh));
      return fresh;
    }
    return state;
  }
  const fresh: ReservesState = {
    weekStartDate: weekStart,
    reservesUsed: 0,
    reserveDates: [],
  };
  await AsyncStorage.setItem(STORAGE_KEYS.RESERVES, JSON.stringify(fresh));
  return fresh;
}

export async function useReserve(date: string): Promise<ReservesState> {
  const state = await getReserves();
  if (state.reservesUsed >= MAX_RESERVES_PER_WEEK) return state;
  state.reservesUsed += 1;
  state.reserveDates.push(date);
  await AsyncStorage.setItem(STORAGE_KEYS.RESERVES, JSON.stringify(state));
  return state;
}

// ─── Mock Seed Data ────────────────────────────────────────────────────────

function dateString(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().split("T")[0];
}

export async function seedMockDataIfEmpty(): Promise<void> {
  // Reseed if no logs exist OR if today's entry is missing (stale seed data)
  const todayKey = `${STORAGE_KEYS.LOGS_PREFIX}${new Date().toISOString().split("T")[0]}`;
  const hasToday = await AsyncStorage.getItem(todayKey);
  const existing = await getRecentLogs(1);
  if (existing.length > 0 && hasToday) return;
  // Clear stale seed data before reseeding
  if (existing.length > 0 && !hasToday) await clearAllLogs();

  const mockLogs: DailyLog[] = [
    {
      id: dateString(6),
      date: dateString(6),
      createdAt: Date.now() - 6 * 86400000,
      caffeine: { type: "espresso", amount: 150 },
      workout: { type: "lift", intensity: 8 },
      music: ["lofi"],
      nutrition: { mealQuality: 4, hydration: 8 },
      output: { tasksCompleted: 9, focusRating: 8, energyRating: 9 },
      tags: ["Cold Shower", "Sunlight"],
      bigRocks: ["Finish project proposal", "Review teammate PRs"],
      drinks: 0,
      sleepHours: 7.2,
      daylightMinutes: 65,
      customMetrics: [],
    },
    {
      id: dateString(5),
      date: dateString(5),
      createdAt: Date.now() - 5 * 86400000,
      caffeine: { type: "drip", amount: 100 },
      workout: { type: "none", intensity: 0 },
      music: ["none"],
      nutrition: { mealQuality: 2, hydration: 4 },
      output: { tasksCompleted: 4, focusRating: 5, energyRating: 4 },
      tags: ["Alcohol", "Poor Sleep"],
      bigRocks: [],
      drinks: 4,
      sleepHours: 5.5,
      daylightMinutes: 12,
      customMetrics: [],
    },
    {
      id: dateString(4),
      date: dateString(4),
      createdAt: Date.now() - 4 * 86400000,
      caffeine: { type: "matcha", amount: 70 },
      workout: { type: "yoga", intensity: 5 },
      music: ["ambient", "classical"],
      nutrition: { mealQuality: 5, hydration: 10 },
      output: { tasksCompleted: 7, focusRating: 7, energyRating: 7 },
      tags: ["Meditation", "Journaling", "No Phone AM"],
      bigRocks: ["Deep reading session", "Meal prep"],
      drinks: 0,
      sleepHours: 8.0,
      daylightMinutes: 45,
      customMetrics: [],
    },
    {
      id: dateString(3),
      date: dateString(3),
      createdAt: Date.now() - 3 * 86400000,
      caffeine: { type: "espresso", amount: 300 },
      workout: { type: "run", intensity: 7 },
      music: ["hiphop"],
      nutrition: { mealQuality: 3, hydration: 6 },
      output: { tasksCompleted: 11, focusRating: 9, energyRating: 8 },
      tags: ["Sunlight", "Cold Shower"],
      bigRocks: ["Ship feature branch", "Write unit tests", "Call advisor"],
      drinks: 1,
      sleepHours: 6.8,
      daylightMinutes: 80,
      customMetrics: [],
    },
    {
      id: dateString(2),
      date: dateString(2),
      createdAt: Date.now() - 2 * 86400000,
      caffeine: { type: "none", amount: 0 },
      workout: { type: "walk", intensity: 3 },
      music: ["podcast"],
      nutrition: { mealQuality: 3, hydration: 7 },
      output: { tasksCompleted: 5, focusRating: 5, energyRating: 5 },
      tags: ["Social"],
      bigRocks: [],
      drinks: 2,
      sleepHours: 7.5,
      daylightMinutes: 30,
      customMetrics: [],
    },
    {
      id: dateString(1),
      date: dateString(1),
      createdAt: Date.now() - 86400000,
      caffeine: { type: "espresso", amount: 150 },
      workout: { type: "hiit", intensity: 9 },
      music: ["edm"],
      nutrition: { mealQuality: 4, hydration: 9 },
      output: { tasksCompleted: 12, focusRating: 9, energyRating: 10 },
      tags: ["Cold Shower", "Sunlight", "No Phone AM"],
      bigRocks: ["Hackathon sprint", "Integrate Claude API"],
      drinks: 0,
      sleepHours: 6.0,
      daylightMinutes: 55,
      customMetrics: [],
    },
    {
      id: dateString(0),
      date: dateString(0),
      createdAt: Date.now(),
      caffeine: { type: "espresso", amount: 150 },
      workout: { type: "run", intensity: 7 },
      music: ["lofi", "ambient"],
      nutrition: { mealQuality: 4, hydration: 7 },
      output: { tasksCompleted: 8, focusRating: 8, energyRating: 7 },
      tags: ["Sunlight", "No Phone AM", "Meditation"],
      bigRocks: ["Finish hackathon MVP", "Polish UI"],
      drinks: 0,
      sleepHours: 7.8,
      daylightMinutes: 48,
      customMetrics: [],
    },
  ];

  for (const log of mockLogs) {
    await saveLog(log);
  }

  // Seed mood check-ins (multiple per day over 7 days)
  await seedMockMoodData();
}

export async function seedMockMoodData(): Promise<void> {
  // Check if we already have multi-day mood data (not just today's captures)
  const allMood = await getRecentMoodCheckIns(7);
  const uniqueDates = new Set(
    allMood.map((c) => asperaDayIdForTs(c.timestamp)),
  );
  if (uniqueDates.size >= 3) return; // already have enough spread

  // Generate 2-4 check-ins per day for the past 7 days
  const moodPatterns: Array<
    {
      mood: number;
      energy: number;
      stress: number;
      hour: number;
      note?: string;
    }[]
  > = [
    // Day 6 — great day (lift + cold shower)
    [
      { mood: 3, energy: 2, stress: 2, hour: 7, note: "Groggy morning" },
      { mood: 4, energy: 4, stress: 1, hour: 10, note: "Post-workout high" },
      {
        mood: 5,
        energy: 5,
        stress: 1,
        hour: 14,
        note: "Deep focus session, crushed it",
      },
      { mood: 4, energy: 3, stress: 2, hour: 21 },
    ],
    // Day 5 — bad day (alcohol, poor sleep)
    [
      {
        mood: 2,
        energy: 1,
        stress: 3,
        hour: 9,
        note: "Hangover, regret the drinks",
      },
      { mood: 2, energy: 2, stress: 4, hour: 13, note: "Can't focus at all" },
      { mood: 3, energy: 2, stress: 3, hour: 18 },
    ],
    // Day 4 — recovery day (yoga, meditation)
    [
      { mood: 3, energy: 3, stress: 2, hour: 7 },
      {
        mood: 4,
        energy: 4,
        stress: 1,
        hour: 11,
        note: "Yoga really helped reset",
      },
      { mood: 4, energy: 3, stress: 2, hour: 15, note: "Productive afternoon" },
      {
        mood: 5,
        energy: 3,
        stress: 1,
        hour: 20,
        note: "Journaling before bed, feel great",
      },
    ],
    // Day 3 — high energy day (run + espresso)
    [
      {
        mood: 4,
        energy: 4,
        stress: 2,
        hour: 6,
        note: "Early run, feeling alive",
      },
      { mood: 5, energy: 5, stress: 1, hour: 10, note: "In the zone" },
      { mood: 4, energy: 3, stress: 3, hour: 16, note: "Afternoon crash hit" },
      { mood: 3, energy: 2, stress: 2, hour: 22 },
    ],
    // Day 2 — meh day
    [
      { mood: 3, energy: 3, stress: 2, hour: 8 },
      { mood: 3, energy: 2, stress: 3, hour: 14, note: "Sluggish, no workout" },
      { mood: 4, energy: 3, stress: 2, hour: 19, note: "Social plans helped" },
    ],
    // Day 1 — great day (HIIT)
    [
      { mood: 3, energy: 3, stress: 2, hour: 7 },
      {
        mood: 5,
        energy: 5,
        stress: 1,
        hour: 10,
        note: "HIIT crushed, endorphins flowing",
      },
      { mood: 4, energy: 4, stress: 1, hour: 14 },
      { mood: 4, energy: 3, stress: 2, hour: 20, note: "Good wind-down" },
    ],
    // Day 0 — today
    [
      {
        mood: 3,
        energy: 3,
        stress: 2,
        hour: 7,
        note: "Just woke up, decent sleep",
      },
      {
        mood: 4,
        energy: 4,
        stress: 1,
        hour: 10,
        note: "Morning run + espresso combo working",
      },
      { mood: 4, energy: 4, stress: 2, hour: 14, note: "Hackathon flow state" },
    ],
  ];

  for (let daysAgo = 6; daysAgo >= 0; daysAgo--) {
    const pattern = moodPatterns[6 - daysAgo];
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    const dateStr = d.toISOString().split("T")[0];

    for (const entry of pattern) {
      const ts = new Date(dateStr);
      ts.setHours(entry.hour, Math.floor(Math.random() * 45), 0, 0);

      const checkIn: MoodCheckIn = {
        id: ts.toISOString(),
        timestamp: ts.getTime(),
        mood: entry.mood,
        energy: entry.energy,
        stress: entry.stress,
        note: entry.note,
      };

      await saveMoodCheckIn(checkIn);
    }
  }
}
