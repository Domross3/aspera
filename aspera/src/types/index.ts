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
  // Subjective sleep quality 1–5, captured in the morning check-in. Distinct
  // from any duration-derived proxy — this is how rested the user *felt*.
  sleepQuality?: number;
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
    focusRating: number; // 1–5
    energyRating: number; // 1–5
  };
  // True once the user has explicitly rated the day's output (saved from the
  // Log tab's Performance Output). Logs auto-created as a side effect — e.g.
  // setting a Big Rock or tapping a Today quick-log tile — set this `false`
  // so their default 5/5/0 values don't masquerade as real ratings in the
  // trend, weekly average, or Peak Day. `undefined` (legacy rows) is treated
  // as rated, so existing real data is never hidden.
  outputRated?: boolean;
  tags: string[];
  bigRocks: string[]; // 1–3 focuses for the day (UI: "Today's Focus")
  // Evening reflection — captured at end of day when wrapping up.
  reflectionNote?: string; // one-line free text for tomorrow's briefing context
  // Eudaimonic depth track — occasional, never daily. A single 3-way tap per
  // evening across meaning/connection/growth (see lib/depthPrompts). Distinct
  // from the hedonic state track (mood/energy); not optimized, lightly trended.
  depth?: DepthRatings;
}

// Relevance-not-completion: we deliberately do NOT track per-focus done/partial/
// missed. (The legacy `bigRockOutcomes` field was removed in the Log redesign;
// old logs may still carry it on disk — it is ignored.)

export type DepthValue = "yes" | "somewhat" | "no";
export type DepthPillar = "meaning" | "connection" | "growth";
export type DepthRatings = Partial<Record<DepthPillar, DepthValue>>;

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

// ── Moments ─────────────────────────────────────────────────────────────
// Free-form timestamped events that don't fit the structured daily log.
// Example: "fell asleep outside" (60 min). Lives on the Mood tab's
// timeline (interleaved with MoodCheckIn) — see Phase 5 design. Schema
// is intentionally minimal; if a label repeats, the user is nudged to
// promote it to a recurrent EventTypeDef in the daily log.

export interface Moment {
  id: string; // ISO timestamp
  timestamp: number; // ms epoch
  label: string;
  duration?: number; // minutes, optional
  note?: string;
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

// ── Restrictions + Experiments (Phase 8) ────────────────────────────────
// On-device app restrictions enforced via Apple's Family Controls +
// ManagedSettings frameworks. The actual enforcement target is the opaque
// FamilyActivitySelection stored device-local in the App Group; Supabase never
// sees app names or tokens. `categories` is only a coarse optional summary for
// analytics/experiments, not the source of truth for shielding.
//
// Restriction `kind`s in v1:
//   - "time_window" → shield selected apps/categories between windowStart/end
//   - "daily_limit" → shield each selected app after dailyLimitMin/day
//   - "delay" → manual Aspera pause; true in-shield delay needs a
//     ManagedSettingsUI Shield Action extension
// The native bridge in `src/lib/screenTime/` applies the shield; these types are
// metadata persisted in Supabase `restrictions` and `experiments` tables.

export type RestrictionSpec =
  | {
      kind: "time_window";
      windowStart: string /* "HH:MM" */;
      windowEnd: string;
    }
  | { kind: "daily_limit"; dailyLimitMin: number }
  // Gratification delay: a manual Aspera pause of `delaySeconds` (10–60).
  // Do not implement this by directly applying a ManagedSettings shield; the
  // default Apple shield cannot host our pause UI and becomes a hard lockout.
  | { kind: "delay"; delaySeconds: number };

export interface Restriction {
  id: string;
  name: string;
  // Coarse summary tags using Aspera's locked 5-category taxonomy ("social" /
  // "entertainment" / "productivity" / "communication" / "other"). This is
  // optional metadata; the device-local FamilyActivitySelection is what native
  // enforcement actually uses.
  categories: string[];
  selectedAppCount: number;
  selectedCategoryCount: number;
  weekdays: number[]; // 0=Sun … 6=Sat. [0..6] = every day.
  active: boolean;
  spec: RestrictionSpec;
  createdAt: number; // ms epoch
  updatedAt: number; // ms epoch
}

// What outcome variable an experiment compares across baseline + intervention.
export type OutcomeMetric =
  | {
      kind: "daily_log_field";
      field: "focusRating" | "energyRating" | "tasksCompleted" | "sleepHours";
    }
  | { kind: "event_type_field"; eventTypeId: string; fieldId: string }
  | { kind: "mood_avg" }
  | { kind: "screen_time_total" }
  | { kind: "screen_time_category"; category: string };

// Result of running `compareDays()` (Phase 8 sub-phase 8e). Written to
// `experiments.result_payload` on completion and surfaced in the readout
// card with the standardized confidence layout.
export interface ComparisonResult {
  effect: number; // signed effect size (treatment minus control mean)
  range: { low: number; high: number }; // 10th–90th percentile of bootstrap
  confidenceLabel: "low" | "moderate" | "high" | "strong";
  probabilityPositive: number; // 0–1, fraction of bootstrap resamples > 0
  sampleSize: number; // intervention-period day count
  computedAt: number; // ms epoch
}

export type ExperimentStatus =
  | "planning"
  | "active"
  | "completed"
  | "cancelled";

export interface Experiment {
  id: string;
  name: string;
  hypothesis?: string;
  // `restrictions.id` values. NOT a Restriction[] — restrictions may be
  // soft-deleted (active=false) without breaking the experiment's
  // historical record. The lifecycle hook resolves these to live
  // Restriction objects when rendering.
  restrictionRefs: string[];
  outcomeMetric: OutcomeMetric;
  durationDays: number; // 7 / 14 / 30 per design
  baselineWindowDays: number; // typically matches durationDays
  startedAt?: number;
  endsAt?: number;
  status: ExperimentStatus;
  resultPayload?: ComparisonResult;
  notes?: string;
  createdAt: number;
  updatedAt: number;
}

// ── User Reminders (Phase 6) ────────────────────────────────────────────
// User-defined habit notifications. Either fire at fixed times of day
// (with an optional weekday filter) or randomly within a chosen window.
// Each reminder can optionally be linked to an EventTypeDef — tapping the
// notification deep-links into the Log tab focused on that section.

export type ReminderSchedule =
  | { kind: "fixed"; times: string[] /* "HH:MM" */ }
  | {
      kind: "random";
      count: number; // 1–5 per active day
      windowStart: string; // "HH:MM"
      windowEnd: string; // "HH:MM"
    };

export interface UserReminder {
  id: string;
  label: string; // becomes the notification title
  schedule: ReminderSchedule;
  weekdays: number[]; // 0=Sun … 6=Sat, default [0..6]
  linkedEventTypeId?: string;
  enabled: boolean;
  createdAt: number;
}

export interface CheatPolicy {
  weeklyCap: number;
  pendingCap?: number;
  pendingCapEffectiveWeek?: string; // ISO Monday (YYYY-MM-DD)
  weekStart: string; // current week anchor (YYYY-MM-DD Monday)
  spentThisWeek: number;
}

// AppSettings.schemaVersion bumps each time the on-disk shape changes in a way
// the migration helpers need to handle. `undefined` or `< 3` triggers
// `migrateAppSettings` on read.
export const APP_SETTINGS_SCHEMA_VERSION = 3;

export interface AppSettings {
  // claudeApiKey removed: Claude calls go through aspera-web's
  // /api/mobile/claude proxy. Mobile only ships a bearer secret via
  // EXPO_PUBLIC_MOBILE_API_SECRET, baked at build time.
  schemaVersion?: number; // see APP_SETTINGS_SCHEMA_VERSION
  onboardingComplete: boolean;
  moodNotificationsEnabled: boolean;
  // Section identifiers to hide in the Log tab. Strings here are either a
  // known LogSectionId (built-in section) or an EventTypeDef.id (user-
  // defined type) — the renderer dispatches on which.
  hiddenLogSections: (LogSectionId | string)[];
  // Individual fields within multi-field system sections that the user has
  // hidden. Keys are dotted paths like "output.tasksCompleted". Lets the
  // user drop, e.g., Tasks Completed from Performance Output without hiding
  // the whole section or rebuilding anything.
  hiddenSystemFields?: string[];
  /** @deprecated Use eventTypes. Migrated on read by `migrateAppSettings`. */
  customMetrics: CustomMetricDef[];
  // Phase 2 schema — user-defined event types (multi-field schemas).
  eventTypes?: EventTypeDef[];
  // Ordered list of section identifiers as they appear in the Log tab.
  // Strings that are LogSectionId render the corresponding system section;
  // strings that are an EventTypeDef.id render that user-defined type.
  // Empty / undefined → derive a default order in the renderer.
  logSectionOrder?: (LogSectionId | string)[];
  // Phase 6: user-defined habit reminders (local notifications).
  userReminders?: UserReminder[];
  // Phase 7: normalized labels the user has explicitly dismissed from
  // the moment → event-type promotion nudge. Lowercased + trimmed.
  dismissedPromotions?: string[];
  // Phase 8: global weekly budget for commitment-code bypasses. Local-only in
  // v1; Supabase stores restriction metadata but not cheat budget state.
  cheatPolicy?: CheatPolicy;
  notificationSettings: NotificationSettings;
}

// ── Log sections (defaults the user can hide) ───────────────────────────

export type LogSectionId =
  | "eveningReflection"
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
  { id: "eveningReflection", label: "Evening Reflection" },
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

// Canonical default order — used when `AppSettings.logSectionOrder` is
// empty (fresh user) or when new system sections are added across
// releases and the saved order doesn't know about them yet.
export const DEFAULT_LOG_SECTION_ORDER: LogSectionId[] = LOG_SECTIONS.map(
  (s) => s.id,
);

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
  id: string; // stable within the EventTypeDef; deterministic for migrated types
  name: string;
  kind: FieldKind;
  required: boolean;
  config?: FieldConfig;
}

export interface EventTypeDef {
  id: string; // stable uuid (preserved across migration from CustomMetricDef.id)
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
  date: string; // "YYYY-MM-DD"
  timestamp?: number; // ms epoch, required when type is recurrent
  fieldValues: Record<string, unknown>; // keyed by FieldDef.id
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
  MOMENT_PREFIX: "aspera_moment_",
  RESERVES: "aspera_emergency_reserves",
  INTEGRATION_CONNECTIONS: "aspera_integration_connections",
  INTEGRATION_SUMMARIES: "aspera_integration_summaries",
  // weekStart (YYYY-MM-DD) of the most recent weekly recap the user has seen
  // on the Today surface — so a non-quiet recap shows once per week, not on
  // every open.
  RECAP_LAST_SHOWN_WEEK: "aspera_recap_last_shown_week",
} as const;

// ── Emergency Reserves ──────────────────────────────────────────────────

export interface ReservesState {
  weekStartDate: string; // ISO date of Monday that starts the current tracking week
  reservesUsed: number; // 0–2: how many reserves spent this week
  reserveDates: string[]; // dates when reserves were consumed
}

export const MAX_RESERVES_PER_WEEK = 2;
