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
  customMetrics: { name: string; value: number }[]; // legacy shape — retained for backward compatibility, new code should use customMetricValues
  customMetricValues?: CustomMetricValue[]; // per-log values keyed by CustomMetricDef.id
  output: {
    tasksCompleted: number; // 0–20
    focusRating: number; // 1–10
    energyRating: number; // 1–10
  };
  tags: string[];
  bigRocks: string[]; // 1–3 most important tasks for the day
  // Evening reflection — captured at end of day when wrapping up
  bigRockOutcomes?: BigRockOutcome[]; // parallel array to bigRocks (same length)
  reflectionNote?: string; // one-line free text for tomorrow's briefing context
}

export type BigRockOutcome = "done" | "partial" | "missed";

export interface Correlation {
  id: string;
  emoji: string;
  title: string;
  description: string;
  inputFactors: string[];
  outputMetric: "focus" | "energy" | "tasks";
  delta: number;
  confidence: "low" | "medium" | "high";
  isKeystone?: boolean; // true if this habit triggers positive cascading effects
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
  stress: number; // 1–5 (defaults to 3/neutral when source = "quick")
  note?: string;
  source?: "quick" | "full"; // quick = notification-triggered capture, full = manual Mood tab entry
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

export interface NotificationSettings {
  morningEnabled: boolean;
  morningTime: string; // "HH:MM" local (display only — cron is server-side)
  eveningEnabled: boolean;
  eveningTime: string;
  // Wake / sleep times define the user's waking window. They double as the
  // bounds for random quick-mood notification scheduling — one mental model
  // instead of two. (Legacy fields `quickMoodWindowStart` / `quickMoodWindowEnd`
  // were removed in favor of these; `getSettings` migrates older saved
  // settings on read.)
  wakeTime: string; // "HH:MM" local, default "07:00"
  sleepTime: string; // "HH:MM" local, default "22:00"
  quickMoodEnabled: boolean;
  quickMoodFrequency: number; // notifications per day (default 3)
  // Somatic Interceptor — the breathe → "What are you feeling?" → reframe
  // modal triggered by the 5-minute idle timer on the Today tab. Default on;
  // user can switch it off entirely from Settings.
  somaticInterceptorEnabled: boolean;
}

export interface AppSettings {
  // claudeApiKey removed: Claude calls go through aspera-web's
  // /api/mobile/claude proxy. Mobile only ships a bearer secret via
  // EXPO_PUBLIC_MOBILE_API_SECRET, baked at build time.
  onboardingComplete: boolean;
  moodNotificationsEnabled: boolean;
  hiddenLogSections: LogSectionId[];
  customMetrics: CustomMetricDef[];
  notificationSettings: NotificationSettings;
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
// Definitions live in AppSettings (persist across days). Values live in
// DailyLog.customMetricValues (per-log, keyed by def id).

export type CustomMetricKind = "scale" | "chips" | "counter" | "toggle";

export interface CustomMetricScaleConfig {
  min: number; // inclusive
  max: number; // inclusive
}

export interface CustomMetricChipsConfig {
  options: string[];
  multi: boolean; // allow multi-select
}

export interface CustomMetricCounterConfig {
  step: number; // e.g. 1, 15, 0.5
  min?: number; // inclusive (default 0)
  max?: number; // inclusive (default unbounded)
  unit?: string; // e.g. "mg", "min"
}

export interface CustomMetricDef {
  id: string; // stable uuid
  name: string; // user-facing label
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
  weekStartDate: string; // ISO date of Monday that starts the current tracking week
  reservesUsed: number; // 0–2: how many reserves spent this week
  reserveDates: string[]; // dates when reserves were consumed
}

export const MAX_RESERVES_PER_WEEK = 2;
