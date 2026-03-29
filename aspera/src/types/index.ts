export type CaffeineType = 'espresso' | 'drip' | 'matcha' | 'none';
export type WorkoutType = 'none' | 'run' | 'lift' | 'yoga' | 'walk' | 'hiit';
export type MusicGenre =
  | 'none'
  | 'lofi'
  | 'classical'
  | 'hiphop'
  | 'edm'
  | 'rock'
  | 'ambient'
  | 'jazz'
  | 'podcast';
export type MealQuality = 1 | 2 | 3 | 4 | 5;

export interface DailyLog {
  id: string;        // "YYYY-MM-DD"
  date: string;
  createdAt: number;
  caffeine: {
    type: CaffeineType;
    amount: number;  // mg
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
  output: {
    tasksCompleted: number; // 0–20
    focusRating: number;    // 1–10
    energyRating: number;   // 1–10
  };
  tags: string[];
}

export interface Correlation {
  id: string;
  emoji: string;
  title: string;
  description: string;
  inputFactors: string[];
  outputMetric: 'focus' | 'energy' | 'tasks';
  delta: number;
  confidence: 'low' | 'medium' | 'high';
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

export interface AppSettings {
  claudeApiKey: string;
  onboardingComplete: boolean;
}

export const STORAGE_KEYS = {
  LOGS_PREFIX: 'aspera_log_',
  SETTINGS: 'aspera_settings',
  INSIGHTS_CACHE: 'aspera_insights_cache',
  TODAY_REC_PREFIX: 'aspera_today_rec_',
} as const;
