// localStorage adapter — same function signatures as mobile storage.ts
// All functions are async for interface compatibility.
// SSR-safe: every localStorage access is guarded by typeof window check.

import {
  DailyLog,
  AppSettings,
  InsightsResponse,
  MoodCheckIn,
  ReservesState,
  STORAGE_KEYS,
  MAX_RESERVES_PER_WEEK,
  IntegrationConnection,
  DailyIntegrationSummary,
} from "../types";
import {
  getDefaultIntegrationConnections,
  getDailyIntegrationSummaries,
} from "./integrations";
import { localDateStr, localDateOffset } from "./dateUtils";

function ls(): Storage | null {
  if (typeof window === "undefined") return null;
  return window.localStorage;
}

function getItem(key: string): string | null {
  return ls()?.getItem(key) ?? null;
}

function setItem(key: string, value: string): void {
  ls()?.setItem(key, value);
}

function removeItem(key: string): void {
  ls()?.removeItem(key);
}

function getAllKeys(): string[] {
  const store = ls();
  if (!store) return [];
  return Object.keys(store);
}

// ─── Daily Logs ────────────────────────────────────────────────────────────

export async function saveLog(log: DailyLog): Promise<void> {
  const key = `${STORAGE_KEYS.LOGS_PREFIX}${log.id}`;
  setItem(key, JSON.stringify(log));
}

export async function getLog(date: string): Promise<DailyLog | null> {
  const key = `${STORAGE_KEYS.LOGS_PREFIX}${date}`;
  const raw = getItem(key);
  return raw ? (JSON.parse(raw) as DailyLog) : null;
}

export async function getRecentLogs(days = 7): Promise<DailyLog[]> {
  const logKeys = getAllKeys()
    .filter((k) => k.startsWith(STORAGE_KEYS.LOGS_PREFIX))
    .sort()
    .reverse()
    .slice(0, days);

  if (logKeys.length === 0) return [];
  return logKeys
    .map((k) => {
      const raw = getItem(k);
      return raw ? (JSON.parse(raw) as DailyLog) : null;
    })
    .filter(Boolean) as DailyLog[];
}

export async function clearAllLogs(): Promise<void> {
  const logKeys = getAllKeys().filter((k) =>
    k.startsWith(STORAGE_KEYS.LOGS_PREFIX),
  );
  logKeys.forEach(removeItem);
}

// ─── Settings ──────────────────────────────────────────────────────────────

export async function saveSettings(settings: AppSettings): Promise<void> {
  setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
}

export async function getSettings(): Promise<AppSettings> {
  const raw = getItem(STORAGE_KEYS.SETTINGS);
  const defaults: AppSettings = {
    onboardingComplete: false,
    moodNotificationsEnabled: false,
    hiddenLogSections: [],
    customMetrics: [],
    personality: "analytical",
  };
  return raw
    ? { ...defaults, ...(JSON.parse(raw) as Partial<AppSettings>) }
    : defaults;
}

// ─── Insights Cache ────────────────────────────────────────────────────────

export async function saveInsights(insights: InsightsResponse): Promise<void> {
  setItem(STORAGE_KEYS.INSIGHTS_CACHE, JSON.stringify(insights));
}

export async function getInsights(): Promise<InsightsResponse | null> {
  const raw = getItem(STORAGE_KEYS.INSIGHTS_CACHE);
  return raw ? (JSON.parse(raw) as InsightsResponse) : null;
}

export async function clearInsights(): Promise<void> {
  removeItem(STORAGE_KEYS.INSIGHTS_CACHE);
}

// ─── Integrations ─────────────────────────────────────────────────────────

function mergeIntegrationConnections(
  saved: IntegrationConnection[],
  defaults: IntegrationConnection[],
): IntegrationConnection[] {
  const savedById = new Map(saved.map((c) => [c.id, c]));
  return defaults.map((c) => {
    const existing = savedById.get(c.id);
    return existing
      ? { ...c, ...existing, highlights: existing.highlights ?? c.highlights }
      : c;
  });
}

export async function saveIntegrationConnections(
  connections: IntegrationConnection[],
): Promise<void> {
  setItem(STORAGE_KEYS.INTEGRATION_CONNECTIONS, JSON.stringify(connections));
}

export async function getIntegrationConnections(): Promise<
  IntegrationConnection[]
> {
  const defaults = getDefaultIntegrationConnections();
  const raw = getItem(STORAGE_KEYS.INTEGRATION_CONNECTIONS);
  if (!raw) return defaults;
  return mergeIntegrationConnections(
    JSON.parse(raw) as IntegrationConnection[],
    defaults,
  );
}

export async function saveIntegrationSummaries(
  summaries: DailyIntegrationSummary[],
): Promise<void> {
  setItem(STORAGE_KEYS.INTEGRATION_SUMMARIES, JSON.stringify(summaries));
}

export async function getIntegrationSummaries(): Promise<
  DailyIntegrationSummary[]
> {
  const raw = getItem(STORAGE_KEYS.INTEGRATION_SUMMARIES);
  return raw
    ? (JSON.parse(raw) as DailyIntegrationSummary[])
    : getDailyIntegrationSummaries();
}

export async function clearIntegrationData(): Promise<void> {
  removeItem(STORAGE_KEYS.INTEGRATION_CONNECTIONS);
  removeItem(STORAGE_KEYS.INTEGRATION_SUMMARIES);
}

// ─── Today Recommendation ──────────────────────────────────────────────────

export async function saveTodayRec(date: string, rec: string): Promise<void> {
  setItem(`${STORAGE_KEYS.TODAY_REC_PREFIX}${date}`, rec);
}

export async function getTodayRec(date: string): Promise<string | null> {
  return getItem(`${STORAGE_KEYS.TODAY_REC_PREFIX}${date}`);
}

// ─── Mood Check-ins ───────────────────────────────────────────────────────

export async function saveMoodCheckIn(checkIn: MoodCheckIn): Promise<void> {
  const date = localDateStr(new Date(checkIn.timestamp));
  const key = `${STORAGE_KEYS.MOOD_PREFIX}${date}`;
  const existing = await getMoodCheckIns(date);
  existing.push(checkIn);
  setItem(key, JSON.stringify(existing));
}

export async function getMoodCheckIns(date: string): Promise<MoodCheckIn[]> {
  const key = `${STORAGE_KEYS.MOOD_PREFIX}${date}`;
  const raw = getItem(key);
  return raw ? (JSON.parse(raw) as MoodCheckIn[]) : [];
}

export async function getRecentMoodCheckIns(days = 7): Promise<MoodCheckIn[]> {
  const moodKeys = getAllKeys()
    .filter((k) => k.startsWith(STORAGE_KEYS.MOOD_PREFIX))
    .sort()
    .reverse()
    .slice(0, days);
  if (moodKeys.length === 0) return [];
  const all: MoodCheckIn[] = [];
  for (const k of moodKeys) {
    const raw = getItem(k);
    if (raw) all.push(...(JSON.parse(raw) as MoodCheckIn[]));
  }
  return all.sort((a, b) => a.timestamp - b.timestamp);
}

// ─── Emergency Reserves ───────────────────────────────────────────────────

function getWeekStart(): string {
  const now = new Date();
  const day = now.getDay();
  const diff = day === 0 ? 6 : day - 1;
  const monday = new Date(now);
  monday.setDate(now.getDate() - diff);
  return localDateStr(monday);
}

export async function getReserves(): Promise<ReservesState> {
  const raw = getItem(STORAGE_KEYS.RESERVES);
  const weekStart = getWeekStart();
  if (raw) {
    const state: ReservesState = JSON.parse(raw);
    if (state.weekStartDate !== weekStart) {
      const fresh: ReservesState = {
        weekStartDate: weekStart,
        reservesUsed: 0,
        reserveDates: [],
      };
      setItem(STORAGE_KEYS.RESERVES, JSON.stringify(fresh));
      return fresh;
    }
    return state;
  }
  const fresh: ReservesState = {
    weekStartDate: weekStart,
    reservesUsed: 0,
    reserveDates: [],
  };
  setItem(STORAGE_KEYS.RESERVES, JSON.stringify(fresh));
  return fresh;
}

export async function useReserve(date: string): Promise<ReservesState> {
  const state = await getReserves();
  if (state.reservesUsed >= MAX_RESERVES_PER_WEEK) return state;
  state.reservesUsed += 1;
  state.reserveDates.push(date);
  setItem(STORAGE_KEYS.RESERVES, JSON.stringify(state));
  return state;
}

// ─── Mock Seed Data ────────────────────────────────────────────────────────

function dateString(daysAgo: number): string {
  return localDateOffset(daysAgo);
}

export async function seedMockDataIfEmpty(): Promise<void> {
  // Only seed when there is no data at all — never clear or overwrite real logs.
  const existing = await getRecentLogs(1);
  if (existing.length > 0) return;

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

  await seedMockMoodData();
}

export async function seedMockMoodData(): Promise<void> {
  const allMood = await getRecentMoodCheckIns(7);
  const uniqueDates = new Set(
    allMood.map((c) => new Date(c.timestamp).toISOString().split("T")[0]),
  );
  if (uniqueDates.size >= 3) return;

  const moodPatterns: Array<
    {
      mood: number;
      energy: number;
      stress: number;
      hour: number;
      note?: string;
    }[]
  > = [
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
    [
      { mood: 3, energy: 3, stress: 2, hour: 8 },
      { mood: 3, energy: 2, stress: 3, hour: 14, note: "Sluggish, no workout" },
      { mood: 4, energy: 3, stress: 2, hour: 19, note: "Social plans helped" },
    ],
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
    const dateStr = localDateStr(d);

    for (const entry of pattern) {
      // Parse as local midnight by using the YYYY-MM-DD format directly
      const [y, mo, day] = dateStr.split("-").map(Number);
      const ts = new Date(y, mo - 1, day);
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
