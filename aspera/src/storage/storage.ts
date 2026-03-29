import AsyncStorage from '@react-native-async-storage/async-storage';
import { DailyLog, AppSettings, InsightsResponse, STORAGE_KEYS } from '../types';

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
  const defaults: AppSettings = { claudeApiKey: '', onboardingComplete: false };
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

// ─── Today Recommendation ──────────────────────────────────────────────────

export async function saveTodayRec(date: string, rec: string): Promise<void> {
  await AsyncStorage.setItem(`${STORAGE_KEYS.TODAY_REC_PREFIX}${date}`, rec);
}

export async function getTodayRec(date: string): Promise<string | null> {
  return AsyncStorage.getItem(`${STORAGE_KEYS.TODAY_REC_PREFIX}${date}`);
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
    },
    {
      id: dateString(5), date: dateString(5), createdAt: Date.now() - 5 * 86400000,
      caffeine: { type: 'drip', amount: 100 },
      workout: { type: 'none', intensity: 0 },
      music: ['none'],
      nutrition: { mealQuality: 2, hydration: 4 },
      output: { tasksCompleted: 4, focusRating: 5, energyRating: 4 },
      tags: ['Alcohol', 'Poor Sleep'],
    },
    {
      id: dateString(4), date: dateString(4), createdAt: Date.now() - 4 * 86400000,
      caffeine: { type: 'matcha', amount: 70 },
      workout: { type: 'yoga', intensity: 5 },
      music: ['ambient', 'classical'],
      nutrition: { mealQuality: 5, hydration: 10 },
      output: { tasksCompleted: 7, focusRating: 7, energyRating: 7 },
      tags: ['Meditation', 'Journaling', 'No Phone AM'],
    },
    {
      id: dateString(3), date: dateString(3), createdAt: Date.now() - 3 * 86400000,
      caffeine: { type: 'espresso', amount: 300 },
      workout: { type: 'run', intensity: 7 },
      music: ['hiphop'],
      nutrition: { mealQuality: 3, hydration: 6 },
      output: { tasksCompleted: 11, focusRating: 9, energyRating: 8 },
      tags: ['Sunlight', 'Cold Shower'],
    },
    {
      id: dateString(2), date: dateString(2), createdAt: Date.now() - 2 * 86400000,
      caffeine: { type: 'none', amount: 0 },
      workout: { type: 'walk', intensity: 3 },
      music: ['podcast'],
      nutrition: { mealQuality: 3, hydration: 7 },
      output: { tasksCompleted: 5, focusRating: 5, energyRating: 5 },
      tags: ['Social'],
    },
    {
      id: dateString(1), date: dateString(1), createdAt: Date.now() - 86400000,
      caffeine: { type: 'espresso', amount: 150 },
      workout: { type: 'hiit', intensity: 9 },
      music: ['edm'],
      nutrition: { mealQuality: 4, hydration: 9 },
      output: { tasksCompleted: 12, focusRating: 9, energyRating: 10 },
      tags: ['Cold Shower', 'Sunlight', 'No Phone AM'],
    },
    {
      id: dateString(0), date: dateString(0), createdAt: Date.now(),
      caffeine: { type: 'espresso', amount: 150 },
      workout: { type: 'run', intensity: 7 },
      music: ['lofi', 'ambient'],
      nutrition: { mealQuality: 4, hydration: 7 },
      output: { tasksCompleted: 8, focusRating: 8, energyRating: 7 },
      tags: ['Sunlight', 'No Phone AM', 'Meditation'],
    },
  ];

  for (const log of mockLogs) {
    await saveLog(log);
  }
}
