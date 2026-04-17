export type CaffeineType =
  | "espresso"
  | "drip"
  | "matcha"
  | "none"
  | (string & {});
export type WorkoutType =
  | "none"
  | "run"
  | "lift"
  | "yoga"
  | "walk"
  | "hiit"
  | (string & {});
export type MusicGenre =
  | "none"
  | "lofi"
  | "classical"
  | "hiphop"
  | "edm"
  | "rock"
  | "ambient"
  | "jazz"
  | "podcast"
  | (string & {});
export type MealQuality = 1 | 2 | 3 | 4 | 5;

export interface DailyLog {
  id: string; // "YYYY-MM-DD"
  date: string;
  createdAt: number;
  caffeine: {
    type: CaffeineType;
    amount: number; // mg
  };
  workout: {
    type: WorkoutType;
    intensity: number; // 1–10 (0 if none)
  };
  music: MusicGenre[];
  nutrition: {
    mealQuality: MealQuality;
    hydration: number; // glasses 0–12
  };
  drinks: number; // alcoholic drinks consumed
  sleepHours: number; // time in bed (from HealthKit or manual)
  daylightMinutes: number; // time in daylight (from HealthKit or manual)
  customMetrics: { name: string; value: number }[];
  customMetricValues?: CustomMetricValue[];
  output: {
    tasksCompleted: number; // 0–20
    focusRating: number; // 1–10
    energyRating: number; // 1–10
  };
  tags: string[];
  bigRocks: string[]; // 1–3 most important tasks for the day
}

export interface Correlation {
  id: string;
  emoji: string;
  title: string;
  description: string;
  inputFactors: string[];
  outputMetric: "focus" | "energy" | "tasks";
  delta: number;
  confidence: "low" | "medium" | "high";
  isKeystone?: boolean;
}

export interface WeeklyTrend {
  date: string;
  dayLabel: string;
  focusRating: number;
  energyRating: number;
  tasksCompleted: number;
}

export interface InsightsResponse {
  summary: string;
  correlations: Correlation[];
  topRecommendation: string;
  weeklyTrends: WeeklyTrend[];
  generatedAt: number;
}

// ── Mood Check-ins ──────────────────────────────────────────────────────

export interface MoodCheckIn {
  id: string; // ISO timestamp
  timestamp: number;
  mood: number; // 1–5
  energy: number; // 1–5
  stress: number; // 1–5
  note?: string;
}

export const MOOD_EMOJIS: Record<number, string> = {
  1: "😞",
  2: "😕",
  3: "😐",
  4: "🙂",
  5: "😄",
};

export const ENERGY_EMOJIS: Record<number, string> = {
  1: "🪫",
  2: "😴",
  3: "⚡",
  4: "🔥",
  5: "🚀",
};

export const STRESS_EMOJIS: Record<number, string> = {
  1: "😌",
  2: "🧘",
  3: "😤",
  4: "😰",
  5: "🤯",
};

export interface AppSettings {
  onboardingComplete: boolean;
  moodNotificationsEnabled: boolean;
  hiddenLogSections: LogSectionId[];
  customMetrics: CustomMetricDef[];
  personality: "analytical" | "unserious" | "stoic";
}

// ── Log sections (defaults the user can hide) ───────────────────────────

export type LogSectionId =
  | "bigRocks"
  | "sleep"
  | "daylight"
  | "caffeine"
  | "workout"
  | "music"
  | "nutrition"
  | "drinks"
  | "output"
  | "tags";

export const LOG_SECTIONS: { id: LogSectionId; label: string }[] = [
  { id: "bigRocks", label: "Big Rocks" },
  { id: "sleep", label: "Sleep" },
  { id: "daylight", label: "Daylight" },
  { id: "caffeine", label: "Caffeine" },
  { id: "workout", label: "Workout" },
  { id: "music", label: "Music" },
  { id: "nutrition", label: "Nutrition" },
  { id: "drinks", label: "Alcohol" },
  { id: "output", label: "Performance Output" },
  { id: "tags", label: "Tags" },
];

// ── Custom Metrics ──────────────────────────────────────────────────────

export type CustomMetricKind = "scale" | "chips" | "counter" | "toggle";

export interface CustomMetricScaleConfig {
  min: number;
  max: number;
}

export interface CustomMetricChipsConfig {
  options: string[];
  multi: boolean;
}

export interface CustomMetricCounterConfig {
  step: number;
  min?: number;
  max?: number;
  unit?: string;
}

export interface CustomMetricDef {
  id: string;
  name: string;
  kind: CustomMetricKind;
  createdAt: number;
  scale?: CustomMetricScaleConfig;
  chips?: CustomMetricChipsConfig;
  counter?: CustomMetricCounterConfig;
}

export type CustomMetricValue =
  | { id: string; kind: "scale"; value: number }
  | { id: string; kind: "chips"; selected: string[] }
  | { id: string; kind: "counter"; value: number }
  | { id: string; kind: "toggle"; value: boolean };

// ── Integrations ───────────────────────────────────────────────────────

export type IntegrationId =
  | "claude"
  | "spotify"
  | "healthkit"
  | "google_calendar"
  | "google_tasks"
  | "browsing"
  | "screen_time";

export type IntegrationStatus =
  | "connected"
  | "mock"
  | "available"
  | "planned"
  | "disconnected";
export type IntegrationSource = "cloud" | "device" | "manual" | "mock";
export type IntegrationPlatform = "cross-platform" | "ios";

export interface IntegrationConnection {
  id: IntegrationId;
  name: string;
  description: string;
  status: IntegrationStatus;
  source: IntegrationSource;
  platform: IntegrationPlatform;
  lastSyncAt?: number;
  nextStep?: string;
  highlights?: string[];
}

export type AttentionBucket =
  | "deep_work"
  | "research"
  | "communication"
  | "utility"
  | "recovery"
  | "drift";

export interface AttentionBucketStat {
  bucket: AttentionBucket;
  label: string;
  minutes: number;
  share: number;
}

export interface AttentionSummary {
  date: string;
  totalMinutes: number;
  productiveMinutes: number;
  neutralMinutes: number;
  distractingMinutes: number;
  focusScore: number;
  byBucket: AttentionBucketStat[];
  topSources: string[];
}

export interface DailyIntegrationSummary {
  date: string;
  attention?: AttentionSummary;
  sleepHours?: number;
  sleepQuality?: number;
  workoutMinutes?: number;
  workoutIntensity?: string;
  musicGenres?: string[];
  calendarEvents?: number;
  calendarHighDemandBlocks?: number;
  completedTasks?: number;
  taskLoad?: "Low" | "Medium" | "High" | "Mixed" | "None";
  moodAverage?: number;
  energyAverage?: number;
}

export const STORAGE_KEYS = {
  LOGS_PREFIX: "aspera_log_",
  SETTINGS: "aspera_settings",
  INSIGHTS_CACHE: "aspera_insights_cache",
  TODAY_REC_PREFIX: "aspera_today_rec_",
  MOOD_PREFIX: "aspera_mood_",
  RESERVES: "aspera_emergency_reserves",
  INTEGRATION_CONNECTIONS: "aspera_integration_connections",
  INTEGRATION_SUMMARIES: "aspera_integration_summaries",
} as const;

// ── Emergency Reserves ──────────────────────────────────────────────────

export interface ReservesState {
  weekStartDate: string;
  reservesUsed: number;
  reserveDates: string[];
}

export const MAX_RESERVES_PER_WEEK = 2;
