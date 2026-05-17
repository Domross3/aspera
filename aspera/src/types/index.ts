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
  /** @deprecated Use eventEntries. Retained one release for rollback safety. */
  customMetrics: { name: string; value: number }[];
  /** @deprecated Use eventEntries. Migrated on read by `migrateDailyLog`. */
  customMetricValues?: CustomMetricValue[];
  // EventTypeDef entries for the day. Includes both single-cardinality types
  // (0 or 1 entry per typeId) and recurrent (N entries per typeId, each
  // with its own timestamp). Phase 3 UI replaces customMetricValues here.
  eventEntries?: EventEntry[];
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

// AppSettings.schemaVersion bumps each time the on-disk shape changes
// in a way the migration helpers need to handle. `undefined` or `< 2`
// triggers `migrateAppSettings` on read. Always bump AFTER migrations
// stabilize on a release, not in the same release as the new shape.
export const APP_SETTINGS_SCHEMA_VERSION = 2;

export interface AppSettings {
  // claudeApiKey removed: Claude calls go through aspera-web's
  // /api/mobile/claude proxy. Mobile only ships a bearer secret via
  // EXPO_PUBLIC_MOBILE_API_SECRET, baked at build time.
  schemaVersion?: number; // see APP_SETTINGS_SCHEMA_VERSION
  onboardingComplete: boolean;
  moodNotificationsEnabled: boolean;
  hiddenLogSections: LogSectionId[];
  /** @deprecated Use eventTypes. Migrated on read by `migrateAppSettings`. */
  customMetrics: CustomMetricDef[];
  // Phase 2 schema — user-defined event types (multi-field schemas).
  eventTypes?: EventTypeDef[];
  // Ordered list of section identifiers as they appear in the Log tab.
  // Strings that are LogSectionId render the corresponding system section;
  // strings that are an EventTypeDef.id render that user-defined type.
  // Empty / undefined → derive a default order in the renderer.
  logSectionOrder?: (LogSectionId | string)[];
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

// ── Event Types (Phase 2 schema) ────────────────────────────────────────
// User-defined, multi-field schemas. Each EventTypeDef is a small "form"
// the user composes: a name, a cardinality (single = at most one entry
// per day; recurrent = many timestamped entries per day), and a list of
// typed fields. Entries land on DailyLog.eventEntries.
//
// This replaces the legacy single-field CustomMetricDef system below.
// AppSettings.eventTypes is the canonical store for definitions; the
// legacy AppSettings.customMetrics + DailyLog.customMetricValues remain
// for one release as a rollback safety net while the migration bakes in.

export type FieldKind =
  | "toggle"
  | "scale"
  | "chips"
  | "counter"
  | "text"
  | "duration";

export interface FieldConfig {
  // scale
  min?: number;
  max?: number;
  // chips
  options?: string[];
  multi?: boolean;
  // counter / duration
  step?: number;
  unit?: string;
  // text
  multiline?: boolean;
}

export interface FieldDef {
  id: string;       // stable within the EventTypeDef; deterministic for migrated types
  name: string;
  kind: FieldKind;
  required: boolean;
  config?: FieldConfig;
}

export interface EventTypeDef {
  id: string;       // stable uuid (preserved across migration from CustomMetricDef.id)
  name: string;
  emoji?: string;
  cardinality: "single" | "recurrent";
  fields: FieldDef[];
  createdAt: number;
}

// One entry of an EventTypeDef. `timestamp` is required when the type's
// cardinality is "recurrent" (each occurrence has a moment-of-day); it's
// omitted for "single" types since the data point is per-day, not per-event.
export interface EventEntry {
  id: string;
  typeId: string;
  date: string;                          // "YYYY-MM-DD"
  timestamp?: number;                    // ms epoch, required when type is recurrent
  fieldValues: Record<string, unknown>;  // keyed by FieldDef.id
  createdAt: number;
}

// ── Custom Metrics (legacy — superseded by EventTypeDef above) ──────────
// Definitions live in AppSettings.customMetrics; values live on
// DailyLog.customMetricValues. Kept for one release as a fallback so a
// rollback to the pre-Phase-2 build can still read user data. Phase 3 UI
// renders EventTypeDef-based sections exclusively.

/** @deprecated Use FieldKind on EventTypeDef.fields[] instead. */
export type CustomMetricKind = "scale" | "chips" | "counter" | "toggle";

/** @deprecated Use FieldConfig.{min,max} on a scale-kind FieldDef. */
export interface CustomMetricScaleConfig {
  min: number; // inclusive
  max: number; // inclusive
}

/** @deprecated Use FieldConfig.{options,multi} on a chips-kind FieldDef. */
export interface CustomMetricChipsConfig {
  options: string[];
  multi: boolean; // allow multi-select
}

/** @deprecated Use FieldConfig.{step,min,max,unit} on a counter-kind FieldDef. */
export interface CustomMetricCounterConfig {
  step: number; // e.g. 1, 15, 0.5
  min?: number; // inclusive (default 0)
  max?: number; // inclusive (default unbounded)
  unit?: string; // e.g. "mg", "min"
}

/** @deprecated Use EventTypeDef instead. Migrated on read by `migrateAppSettings`. */
export interface CustomMetricDef {
  id: string; // stable uuid
  name: string; // user-facing label
  kind: CustomMetricKind;
  createdAt: number;
  scale?: CustomMetricScaleConfig;
  chips?: CustomMetricChipsConfig;
  counter?: CustomMetricCounterConfig;
}

/** @deprecated Use EventEntry instead. Migrated on read by `migrateDailyLog`. */
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
