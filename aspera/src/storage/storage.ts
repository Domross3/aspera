import AsyncStorage from '@react-native-async-storage/async-storage';
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
} from '../types';
import { getDefaultIntegrationConnections, getDailyIntegrationSummaries } from '../lib/integrations';

// ─── Daily Logs ────────────────────────────────────────────────────────────

export async function saveLog(log: DailyLog): Promise<void> {
  const key = `${STORAGE_KEYS.LOGS_PREFIX}${log.id}`;
  await AsyncStorage.setItem(key, JSON.stringify(log));
}

export async function getLog(date: string): Promise<DailyLog | null> {
  const key = `${STORAGE_KEYS.LOGS_PREFIX}${date}`;
  const raw = await AsyncStorage.getItem(key);
  return raw ? JSON.parse(raw) : null;
}

export async function getRecentLogs(days = 7): Promise<DailyLog[]> {
  const allKeys = await AsyncStorage.getAllKeys();
  const logKeys = allKeys
    .filter(k => k.startsWith(STORAGE_KEYS.LOGS_PREFIX))
    .sort()
    .reverse()
    .slice(0, days);

  if (logKeys.length === 0) return [];
  const pairs = await AsyncStorage.multiGet(logKeys);
  return pairs
    .map(([, v]) => (v ? JSON.parse(v) as DailyLog : null))
    .filter(Boolean) as DailyLog[];
}

export async function clearAllLogs(): Promise<void> {
  const allKeys = await AsyncStorage.getAllKeys();
  const logKeys = allKeys.filter(k => k.startsWith(STORAGE_KEYS.LOGS_PREFIX));
  await AsyncStorage.multiRemove(logKeys);
}

// ─── Settings ──────────────────────────────────────────────────────────────

export async function saveSettings(settings: AppSettings): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
}

export async function getSettings(): Promise<AppSettings> {
  const raw = await AsyncStorage.getItem(STORAGE_KEYS.SETTINGS);
  const defaults: AppSettings = { claudeApiKey: '', onboardingComplete: false, moodNotificationsEnabled: false };
  return raw ? { ...defaults, ...JSON.parse(raw) } : defaults;
}

// ─── Insights Cache ────────────────────────────────────────────────────────

export async function saveInsights(insights: InsightsResponse): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEYS.INSIGHTS_CACHE, JSON.stringify(insights));
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
  defaults: IntegrationConnection[]
): IntegrationConnection[] {
  const savedById = new Map(saved.map(connection => [connection.id, connection]));

  return defaults.map(connection => {
    const existing = savedById.get(connection.id);
    return existing
      ? { ...connection, ...existing, highlights: existing.highlights ?? connection.highlights }
      : connection;
  });
}

export async function saveIntegrationConnections(connections: IntegrationConnection[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEYS.INTEGRATION_CONNECTIONS, JSON.stringify(connections));
}

export async function getIntegrationConnections(): Promise<IntegrationConnection[]> {
  const defaults = getDefaultIntegrationConnections();
  const raw = await AsyncStorage.getItem(STORAGE_KEYS.INTEGRATION_CONNECTIONS);
  if (!raw) return defaults;

  return mergeIntegrationConnections(JSON.parse(raw) as IntegrationConnection[], defaults);
}

export async function saveIntegrationSummaries(summaries: DailyIntegrationSummary[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEYS.INTEGRATION_SUMMARIES, JSON.stringify(summaries));
}

export async function getIntegrationSummaries(): Promise<DailyIntegrationSummary[]> {
  const raw = await AsyncStorage.getItem(STORAGE_KEYS.INTEGRATION_SUMMARIES);
  return raw ? JSON.parse(raw) : getDailyIntegrationSummaries();
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
  const date = new Date(checkIn.timestamp).toISOString().split('T')[0];
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

export async function getRecentMoodCheckIns(days = 7): Promise<MoodCheckIn[]> {
  const allKeys = await AsyncStorage.getAllKeys();
  const moodKeys = allKeys
    .filter(k => k.startsWith(STORAGE_KEYS.MOOD_PREFIX))
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

// ─── Emergency Reserves ───────────────────────────────────────────────────

function getWeekStart(): string {
  const now = new Date();
  const day = now.getDay(); // 0=Sun, 1=Mon...
  const diff = day === 0 ? 6 : day - 1; // shift so Monday=0
  const monday = new Date(now);
  monday.setDate(now.getDate() - diff);
  return monday.toISOString().split('T')[0];
}

export async function getReserves(): Promise<ReservesState> {
  const raw = await AsyncStorage.getItem(STORAGE_KEYS.RESERVES);
  const weekStart = getWeekStart();
  if (raw) {
    const state: ReservesState = JSON.parse(raw);
    // Reset if we're in a new week
    if (state.weekStartDate !== weekStart) {
      const fresh: ReservesState = { weekStartDate: weekStart, reservesUsed: 0, reserveDates: [] };
      await AsyncStorage.setItem(STORAGE_KEYS.RESERVES, JSON.stringify(fresh));
      return fresh;
    }
    return state;
  }
  const fresh: ReservesState = { weekStartDate: weekStart, reservesUsed: 0, reserveDates: [] };
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
  return d.toISOString().split('T')[0];
}

export async function seedMockDataIfEmpty(): Promise<void> {
  // Reseed if no logs exist OR if today's entry is missing (stale seed data)
  const todayKey = `${STORAGE_KEYS.LOGS_PREFIX}${new Date().toISOString().split('T')[0]}`;
  const hasToday = await AsyncStorage.getItem(todayKey);
  const existing = await getRecentLogs(1);
  if (existing.length > 0 && hasToday) return;
  // Clear stale seed data before reseeding
  if (existing.length > 0 && !hasToday) await clearAllLogs();

  const mockLogs: DailyLog[] = [
    {
      id: dateString(6), date: dateString(6), createdAt: Date.now() - 6 * 86400000,
      caffeine: { type: 'espresso', amount: 150 },
      workout: { type: 'lift', intensity: 8 },
      music: ['lofi'],
      nutrition: { mealQuality: 4, hydration: 8 },
      output: { tasksCompleted: 9, focusRating: 8, energyRating: 9 },
      tags: ['Cold Shower', 'Sunlight'],
      bigRocks: ['Finish project proposal', 'Review teammate PRs'],
    },
    {
      id: dateString(5), date: dateString(5), createdAt: Date.now() - 5 * 86400000,
      caffeine: { type: 'drip', amount: 100 },
      workout: { type: 'none', intensity: 0 },
      music: ['none'],
      nutrition: { mealQuality: 2, hydration: 4 },
      output: { tasksCompleted: 4, focusRating: 5, energyRating: 4 },
      tags: ['Alcohol', 'Poor Sleep'],
      bigRocks: [],
    },
    {
      id: dateString(4), date: dateString(4), createdAt: Date.now() - 4 * 86400000,
      caffeine: { type: 'matcha', amount: 70 },
      workout: { type: 'yoga', intensity: 5 },
      music: ['ambient', 'classical'],
      nutrition: { mealQuality: 5, hydration: 10 },
      output: { tasksCompleted: 7, focusRating: 7, energyRating: 7 },
      tags: ['Meditation', 'Journaling', 'No Phone AM'],
      bigRocks: ['Deep reading session', 'Meal prep'],
    },
    {
      id: dateString(3), date: dateString(3), createdAt: Date.now() - 3 * 86400000,
      caffeine: { type: 'espresso', amount: 300 },
      workout: { type: 'run', intensity: 7 },
      music: ['hiphop'],
      nutrition: { mealQuality: 3, hydration: 6 },
      output: { tasksCompleted: 11, focusRating: 9, energyRating: 8 },
      tags: ['Sunlight', 'Cold Shower'],
      bigRocks: ['Ship feature branch', 'Write unit tests', 'Call advisor'],
    },
    {
      id: dateString(2), date: dateString(2), createdAt: Date.now() - 2 * 86400000,
      caffeine: { type: 'none', amount: 0 },
      workout: { type: 'walk', intensity: 3 },
      music: ['podcast'],
      nutrition: { mealQuality: 3, hydration: 7 },
      output: { tasksCompleted: 5, focusRating: 5, energyRating: 5 },
      tags: ['Social'],
      bigRocks: [],
    },
    {
      id: dateString(1), date: dateString(1), createdAt: Date.now() - 86400000,
      caffeine: { type: 'espresso', amount: 150 },
      workout: { type: 'hiit', intensity: 9 },
      music: ['edm'],
      nutrition: { mealQuality: 4, hydration: 9 },
      output: { tasksCompleted: 12, focusRating: 9, energyRating: 10 },
      tags: ['Cold Shower', 'Sunlight', 'No Phone AM'],
      bigRocks: ['Hackathon sprint', 'Integrate Claude API'],
    },
    {
      id: dateString(0), date: dateString(0), createdAt: Date.now(),
      caffeine: { type: 'espresso', amount: 150 },
      workout: { type: 'run', intensity: 7 },
      music: ['lofi', 'ambient'],
      nutrition: { mealQuality: 4, hydration: 7 },
      output: { tasksCompleted: 8, focusRating: 8, energyRating: 7 },
      tags: ['Sunlight', 'No Phone AM', 'Meditation'],
      bigRocks: ['Finish hackathon MVP', 'Polish UI'],
    },
  ];

  for (const log of mockLogs) {
    await saveLog(log);
  }
}
