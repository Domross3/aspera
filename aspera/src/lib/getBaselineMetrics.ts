import { getRecentLogs } from "../storage/storage";
import { DailyLog, CaffeineType } from "../types";
import { FirebaseBrowsingDay } from "./firebase";

const FIREBASE_URL = "https://aspera-bridge-default-rtdb.firebaseio.com";
const BASELINE_DAYS = 14;

// ── Output type ───────────────────────────────────────────────────────────

export interface BaselineMetrics {
  daysIncluded: number;
  period: { start: string; end: string };
  caffeine: {
    avgDailyMg: number;
    mostCommonType: CaffeineType;
    typeBreakdown: Record<string, number>; // type → count of days
  };
  sleep: {
    avgHours: number;
    minHours: number;
    maxHours: number;
  };
  focusScore: {
    avg: number; // 0–100 from Chrome extension
    min: number;
    max: number;
    daysWithData: number;
  };
  selfReportedFocus: {
    avg: number; // 1–10 from daily log
    avg10: number; // same value kept for clarity
  };
  energy: {
    avg: number; // 1–10
  };
  tasks: {
    avgCompleted: number;
  };
  nutrition: {
    avgMealQuality: number; // 1–5
    avgHydration: number; // glasses
  };
  drinks: {
    avgPerDay: number;
    daysWithAlcohol: number;
  };
}

// ── Helpers ───────────────────────────────────────────────────────────────

function dateKey(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().slice(0, 10);
}

function avg(nums: number[]): number {
  if (nums.length === 0) return 0;
  return (
    Math.round((nums.reduce((a, b) => a + b, 0) / nums.length) * 100) / 100
  );
}

function mode(items: string[]): string {
  const counts: Record<string, number> = {};
  for (const item of items) counts[item] = (counts[item] || 0) + 1;
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "none";
}

// ── Firebase fetch for N days ─────────────────────────────────────────────

async function fetchBrowsingDays(days: number): Promise<FirebaseBrowsingDay[]> {
  const results: FirebaseBrowsingDay[] = [];

  for (let i = 0; i < days; i++) {
    const key = dateKey(i);
    try {
      const res = await fetch(`${FIREBASE_URL}/browsing/${key}.json`);
      if (res.ok) {
        const data = await res.json();
        if (data && data.sites) {
          results.push({ ...data, date: data.date ?? key });
        }
      }
    } catch {
      // Firebase unreachable for this date — skip
    }
  }

  return results;
}

// ── Main function ─────────────────────────────────────────────────────────

export async function getBaselineMetrics(): Promise<BaselineMetrics> {
  const [logs, browsingDays] = await Promise.all([
    getRecentLogs(BASELINE_DAYS),
    fetchBrowsingDays(BASELINE_DAYS),
  ]);

  // Index browsing days by date for fast lookup
  const browsingByDate = new Map<string, FirebaseBrowsingDay>(
    browsingDays.map((d) => [d.date, d]),
  );

  // ── Caffeine ──
  const caffeineAmounts = logs.map((l) => l.caffeine.amount);
  const caffeineTypes = logs.map((l) => l.caffeine.type);
  const typeBreakdown: Record<string, number> = {};
  for (const t of caffeineTypes) typeBreakdown[t] = (typeBreakdown[t] || 0) + 1;

  // ── Sleep ──
  const sleepValues = logs.map((l) => l.sleepHours);

  // ── Focus scores from Chrome extension ──
  const focusScores = browsingDays.map((d) => d.focusScore);

  // ── Self-reported outputs ──
  const focusRatings = logs.map((l) => l.output.focusRating);
  const energyRatings = logs.map((l) => l.output.energyRating);
  const taskCounts = logs.map((l) => l.output.tasksCompleted);

  // ── Nutrition ──
  const mealQualities = logs.map((l) => l.nutrition.mealQuality);
  const hydrationValues = logs.map((l) => l.nutrition.hydration);

  // ── Drinks ──
  const drinkValues = logs.map((l) => l.drinks);

  return {
    daysIncluded: logs.length,
    period: {
      start: dateKey(BASELINE_DAYS - 1),
      end: dateKey(0),
    },
    caffeine: {
      avgDailyMg: avg(caffeineAmounts),
      mostCommonType: mode(caffeineTypes) as CaffeineType,
      typeBreakdown,
    },
    sleep: {
      avgHours: avg(sleepValues),
      minHours: sleepValues.length ? Math.min(...sleepValues) : 0,
      maxHours: sleepValues.length ? Math.max(...sleepValues) : 0,
    },
    focusScore: {
      avg: avg(focusScores),
      min: focusScores.length ? Math.min(...focusScores) : 0,
      max: focusScores.length ? Math.max(...focusScores) : 0,
      daysWithData: focusScores.length,
    },
    selfReportedFocus: {
      avg: avg(focusRatings),
      avg10: avg(focusRatings),
    },
    energy: {
      avg: avg(energyRatings),
    },
    tasks: {
      avgCompleted: avg(taskCounts),
    },
    nutrition: {
      avgMealQuality: avg(mealQualities),
      avgHydration: avg(hydrationValues),
    },
    drinks: {
      avgPerDay: avg(drinkValues),
      daysWithAlcohol: drinkValues.filter((d) => d > 0).length,
    },
  };
}
