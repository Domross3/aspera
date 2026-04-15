import type { DailyLog, MoodCheckIn, CustomMetricValue } from "./index";

// ── Search Query ───────────────────────────────────────────────────────

export interface SearchDateRange {
  from?: string; // ISO date, e.g. "2026-01-01"
  to?: string; // ISO date, e.g. "2026-04-13"
}

export interface SearchFilters {
  tags?: string[]; // only include days with at least one of these tags
  workoutTypes?: string[]; // filter to days with specific workout types
  minSleepHours?: number;
  maxSleepHours?: number;
  minFocusRating?: number;
  minEnergyRating?: number;
}

export interface SearchQuery {
  query: string; // natural language input, e.g. "Do I focus better after yoga?"
  dateRange?: SearchDateRange;
  filters?: SearchFilters;
}

// ── Supporting Data ────────────────────────────────────────────────────

/** A single day's data referenced in the answer, trimmed to relevant fields. */
export interface SupportingDataPoint {
  date: string; // "YYYY-MM-DD"
  /** The fields from DailyLog that are relevant to the query. */
  relevantFields: Partial<
    Pick<
      DailyLog,
      | "caffeine"
      | "workout"
      | "music"
      | "nutrition"
      | "drinks"
      | "sleepHours"
      | "daylightMinutes"
      | "output"
      | "tags"
      | "bigRocks"
      | "customMetricValues"
    >
  >;
  /** Mood check-ins for this day, if relevant. */
  moodCheckIns?: Pick<MoodCheckIn, "mood" | "energy" | "stress" | "note">[];
}

// ── Search Response ────────────────────────────────────────────────────

export type ConfidenceLevel = "low" | "medium" | "high";

export interface Confound {
  factor: string; // e.g. "Weekend days were overrepresented"
  impact: "minor" | "moderate" | "major";
  /** Optional 1–2 sentence explanation citing the specific data. */
  explanation?: string;
}

export interface SearchResponse {
  answer: string; // natural language answer to the user's question
  confidence: ConfidenceLevel;
  sampleSize: number; // number of days analyzed
  supportingDataPoints: SupportingDataPoint[];
  confounds: Confound[];
  followUpQuestions: string[]; // suggested follow-up queries
}
