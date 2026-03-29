// Rich mock data simulating real API integrations.
// In production these would come from Spotify, HealthKit, Google APIs.

export interface SpotifyTrack {
  name: string;
  artist: string;
  album: string;
  played_at: string;
}

export interface SleepEntry {
  date: string;
  hours_slept: number;
  sleep_quality: number; // 1–10
}

export interface WorkoutEntry {
  date: string;
  type: string;
  duration_minutes: number;
  intensity: 'Low' | 'Medium' | 'High' | 'Grueling';
}

export interface CalendarEvent {
  summary: string;
  start: string;
  end: string;
  cognitive_demand: 'Low' | 'Medium' | 'High';
}

export interface MoodEntry {
  date: string;
  mood_score: number;
  anxiety_score: number;
  energy_score: number;
}

export interface GoogleTask {
  id: string;
  title: string;
  due: string;
  completed: boolean;
  completed_at: string | null;
  cognitive_load: 'Low' | 'Medium' | 'High';
}

function dateStr(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().split('T')[0];
}

function isoTime(daysAgo: number, hour: number, min = 0): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(hour, min, 0, 0);
  return d.toISOString();
}

// ── Spotify Recently Played ────────────────────────────────────────────

export const SPOTIFY_TRACKS: SpotifyTrack[] = [
  { name: 'Under the Bridge',     artist: 'Red Hot Chili Peppers', album: 'Blood Sugar Sex Magik', played_at: isoTime(0, 9, 15) },
  { name: 'Would?',               artist: 'Alice in Chains',       album: 'Dirt',                  played_at: isoTime(0, 9, 30) },
  { name: 'Heart-Shaped Box',     artist: 'Nirvana',               album: 'In Utero',              played_at: isoTime(0, 10, 0) },
  { name: 'Lofi Study Beats',     artist: 'ChilledCow',            album: 'Lofi Hip Hop Radio',    played_at: isoTime(0, 14, 0) },
  { name: 'Rooster',              artist: 'Alice in Chains',        album: 'Dirt',                  played_at: isoTime(1, 8, 30) },
  { name: 'Scar Tissue',          artist: 'Red Hot Chili Peppers', album: 'Californication',       played_at: isoTime(1, 9, 0) },
  { name: 'Come As You Are',      artist: 'Nirvana',               album: 'Nevermind',             played_at: isoTime(1, 10, 0) },
  { name: 'Gymnopedie No.1',      artist: 'Erik Satie',            album: 'Classical Essentials',  played_at: isoTime(2, 11, 0) },
  { name: 'Black Hole Sun',       artist: 'Soundgarden',           album: 'Superunknown',          played_at: isoTime(2, 14, 30) },
  { name: 'Man in the Box',       artist: 'Alice in Chains',       album: 'Facelift',              played_at: isoTime(3, 9, 0) },
];

// ── HealthKit Sleep ────────────────────────────────────────────────────

export const SLEEP_DATA: SleepEntry[] = [
  { date: dateStr(6), hours_slept: 7.2, sleep_quality: 7 },
  { date: dateStr(5), hours_slept: 5.5, sleep_quality: 4 },
  { date: dateStr(4), hours_slept: 8.0, sleep_quality: 9 },
  { date: dateStr(3), hours_slept: 6.8, sleep_quality: 6 },
  { date: dateStr(2), hours_slept: 7.5, sleep_quality: 8 },
  { date: dateStr(1), hours_slept: 6.0, sleep_quality: 5 },
  { date: dateStr(0), hours_slept: 7.8, sleep_quality: 8 },
];

// ── HealthKit Time in Daylight ─────────────────────────────────────────

export interface DaylightEntry {
  date: string;
  minutes: number;  // minutes of outdoor UV exposure
}

export const DAYLIGHT_DATA: DaylightEntry[] = [
  { date: dateStr(6), minutes: 65 },
  { date: dateStr(5), minutes: 12 },
  { date: dateStr(4), minutes: 45 },
  { date: dateStr(3), minutes: 80 },
  { date: dateStr(2), minutes: 30 },
  { date: dateStr(1), minutes: 55 },
  { date: dateStr(0), minutes: 48 },
];

// ── HealthKit Workouts ─────────────────────────────────────────────────

export const WORKOUT_DATA: WorkoutEntry[] = [
  { date: dateStr(6), type: 'Weight Training',  duration_minutes: 55, intensity: 'High' },
  { date: dateStr(5), type: 'Trail Run',         duration_minutes: 40, intensity: 'Medium' },
  { date: dateStr(4), type: 'Soccer Match',      duration_minutes: 90, intensity: 'Grueling' },
  { date: dateStr(3), type: 'Weight Training',  duration_minutes: 60, intensity: 'High' },
  { date: dateStr(1), type: 'Trail Run',         duration_minutes: 35, intensity: 'Medium' },
  { date: dateStr(0), type: 'Weight Training',  duration_minutes: 50, intensity: 'High' },
];

// ── Google Calendar (today) ────────────────────────────────────────────

export const CALENDAR_EVENTS: CalendarEvent[] = [
  { summary: 'Team Standup',         start: isoTime(0, 9, 0),  end: isoTime(0, 9, 30), cognitive_demand: 'Low' },
  { summary: 'Deep Work: Hackathon', start: isoTime(0, 10, 0), end: isoTime(0, 13, 0), cognitive_demand: 'High' },
  { summary: 'Lunch Break',          start: isoTime(0, 13, 0), end: isoTime(0, 14, 0), cognitive_demand: 'Low' },
  { summary: 'Project Review',       start: isoTime(0, 15, 0), end: isoTime(0, 16, 0), cognitive_demand: 'Medium' },
];

// ── Google Tasks ───────────────────────────────────────────────────────

export const GOOGLE_TASKS: GoogleTask[] = [
  { id: '1', title: 'Finish hackathon MVP',       due: dateStr(0), completed: false, completed_at: null,                 cognitive_load: 'High' },
  { id: '2', title: 'Review pull request #47',    due: dateStr(0), completed: true,  completed_at: isoTime(0, 11, 30),  cognitive_load: 'Medium' },
  { id: '3', title: 'Meal prep for the week',     due: dateStr(0), completed: false, completed_at: null,                 cognitive_load: 'Low' },
  { id: '4', title: 'Read Ch.4 of Algorithms',    due: dateStr(1), completed: true,  completed_at: isoTime(1, 20, 0),   cognitive_load: 'High' },
  { id: '5', title: 'Schedule dentist appointment', due: dateStr(2), completed: true,  completed_at: isoTime(2, 10, 0), cognitive_load: 'Low' },
];

// ── State of Mind (7 days) ─────────────────────────────────────────────

export const MOOD_DATA: MoodEntry[] = [
  { date: dateStr(6), mood_score: 8, anxiety_score: 3, energy_score: 9 },
  { date: dateStr(5), mood_score: 5, anxiety_score: 6, energy_score: 4 },
  { date: dateStr(4), mood_score: 7, anxiety_score: 4, energy_score: 7 },
  { date: dateStr(3), mood_score: 9, anxiety_score: 2, energy_score: 8 },
  { date: dateStr(2), mood_score: 6, anxiety_score: 5, energy_score: 6 },
  { date: dateStr(1), mood_score: 7, anxiety_score: 3, energy_score: 7 },
  { date: dateStr(0), mood_score: 8, anxiety_score: 2, energy_score: 8 },
];

// ── Browsing Activity (mirrors Chrome extension data) ─────────────────

export interface BrowsingSite {
  hostname: string;
  time: number; // milliseconds
  category: 'productive' | 'neutral' | 'distracting';
  visits: number;
}

export interface BrowsingDay {
  date: string;
  sites: BrowsingSite[];
  totals: { productive: number; neutral: number; distracting: number };
  focusScore: number; // 0–100
}

export const BROWSING_DATA: BrowsingDay[] = [
  {
    date: dateStr(0),
    focusScore: 78,
    totals: { productive: 14400000, neutral: 3600000, distracting: 1800000 },
    sites: [
      { hostname: 'github.com',        time: 7200000,  category: 'productive',  visits: 12 },
      { hostname: 'stackoverflow.com',  time: 3600000,  category: 'productive',  visits: 8 },
      { hostname: 'docs.expo.dev',      time: 3600000,  category: 'productive',  visits: 5 },
      { hostname: 'reddit.com',         time: 1200000,  category: 'distracting', visits: 4 },
      { hostname: 'youtube.com',        time: 600000,   category: 'distracting', visits: 2 },
      { hostname: 'google.com',         time: 3600000,  category: 'neutral',     visits: 15 },
    ],
  },
  {
    date: dateStr(1),
    focusScore: 62,
    totals: { productive: 10800000, neutral: 5400000, distracting: 3600000 },
    sites: [
      { hostname: 'github.com',    time: 5400000, category: 'productive',  visits: 9 },
      { hostname: 'figma.com',     time: 5400000, category: 'productive',  visits: 3 },
      { hostname: 'twitter.com',   time: 2400000, category: 'distracting', visits: 7 },
      { hostname: 'reddit.com',    time: 1200000, category: 'distracting', visits: 5 },
      { hostname: 'google.com',    time: 5400000, category: 'neutral',     visits: 18 },
    ],
  },
];

// ── iOS Screen Time ───────────────────────────────────────────────────

export interface ScreenTimeApp {
  name: string;
  category: 'social' | 'productivity' | 'entertainment' | 'health' | 'education' | 'other';
  minutes: number;
  icon: string; // emoji
}

export interface ScreenTimeDay {
  date: string;
  totalMinutes: number;
  pickups: number;
  firstPickup: string;       // e.g. "7:12 AM"
  longestSession: number;    // minutes
  byCategory: { category: string; minutes: number; color: string }[];
  topApps: ScreenTimeApp[];
}

export const SCREEN_TIME_DATA: ScreenTimeDay[] = [
  {
    date: dateStr(0),
    totalMinutes: 312,
    pickups: 47,
    firstPickup: '7:12 AM',
    longestSession: 84,
    byCategory: [
      { category: 'Productivity', minutes: 156, color: '#34D399' },
      { category: 'Social',       minutes: 62,  color: '#F87171' },
      { category: 'Entertainment', minutes: 38, color: '#FBBF24' },
      { category: 'Education',    minutes: 32,  color: '#6C63FF' },
      { category: 'Other',        minutes: 24,  color: '#4A5568' },
    ],
    topApps: [
      { name: 'VS Code',    category: 'productivity',  minutes: 84, icon: '💻' },
      { name: 'Slack',       category: 'productivity',  minutes: 42, icon: '💬' },
      { name: 'Instagram',   category: 'social',        minutes: 34, icon: '📷' },
      { name: 'YouTube',     category: 'entertainment', minutes: 28, icon: '▶️' },
      { name: 'X (Twitter)', category: 'social',        minutes: 22, icon: '🐦' },
      { name: 'Safari',      category: 'other',         minutes: 18, icon: '🧭' },
      { name: 'Notes',       category: 'productivity',  minutes: 16, icon: '📝' },
      { name: 'Podcast',     category: 'education',     minutes: 15, icon: '🎙️' },
    ],
  },
  {
    date: dateStr(1),
    totalMinutes: 387,
    pickups: 63,
    firstPickup: '6:48 AM',
    longestSession: 45,
    byCategory: [
      { category: 'Productivity', minutes: 112, color: '#34D399' },
      { category: 'Social',       minutes: 118, color: '#F87171' },
      { category: 'Entertainment', minutes: 72, color: '#FBBF24' },
      { category: 'Education',    minutes: 44,  color: '#6C63FF' },
      { category: 'Other',        minutes: 41,  color: '#4A5568' },
    ],
    topApps: [
      { name: 'Instagram',   category: 'social',        minutes: 58, icon: '📷' },
      { name: 'VS Code',    category: 'productivity',  minutes: 45, icon: '💻' },
      { name: 'YouTube',     category: 'entertainment', minutes: 42, icon: '▶️' },
      { name: 'X (Twitter)', category: 'social',        minutes: 38, icon: '🐦' },
      { name: 'Slack',       category: 'productivity',  minutes: 34, icon: '💬' },
    ],
  },
];

// ── Cohort Telemetry (anonymized, fake "social proof" nudges) ─────────

export interface CohortTelemetry {
  missedBigRockCount: number;     // "3,247 other users also missed a Big Rock today"
  similarFocusPercentile: number; // "You're in the 62nd percentile for focus this week"
  commonStruggle: string;         // "43% of users with your sleep pattern also report low energy"
  streakContext: string;          // "2,891 users also have a 4-day streak right now"
}

export function generateCohortTelemetry(userState: {
  missedBigRock: boolean;
  avgFocus: number;
  avgSleep: number;
  streak: number;
  avgEnergy: number;
}): CohortTelemetry {
  const { missedBigRock, avgFocus, avgSleep, streak, avgEnergy } = userState;

  // Missed Big Rock count
  const missedBigRockCount = missedBigRock
    ? Math.floor(Math.random() * 500) + 3000
    : 0;

  // Focus percentile based on avgFocus (1-10 scale)
  let similarFocusPercentile: number;
  if (avgFocus < 5) {
    similarFocusPercentile = Math.floor(Math.random() * 21) + 30; // 30-50
  } else if (avgFocus <= 7) {
    similarFocusPercentile = Math.floor(Math.random() * 26) + 50; // 50-75
  } else {
    similarFocusPercentile = Math.floor(Math.random() * 21) + 75; // 75-95
  }

  // Common struggle string
  let commonStruggle: string;
  if (avgSleep < 7) {
    commonStruggle = `${Math.floor(Math.random() * 15) + 38}% of users with your sleep pattern also report low energy`;
  } else if (avgEnergy < 5) {
    commonStruggle = `${Math.floor(Math.random() * 15) + 38}% of users with your energy level also report difficulty focusing`;
  } else {
    commonStruggle = `Most users with your profile report feeling strong and focused — you're on track`;
  }

  // Streak context
  const streakContext = `${Math.floor(Math.random() * 800) + 2000} users also have a ${streak}-day streak right now`;

  return {
    missedBigRockCount,
    similarFocusPercentile,
    commonStruggle,
    streakContext,
  };
}

// ── Assembled Context ──────────────────────────────────────────────────

export interface MockContext {
  spotify: SpotifyTrack[];
  sleep: SleepEntry[];
  daylight: DaylightEntry[];
  workouts: WorkoutEntry[];
  calendar: CalendarEvent[];
  tasks: GoogleTask[];
  mood: MoodEntry[];
  browsing: BrowsingDay[];
  screenTime: ScreenTimeDay[];
}

export function getMockContext(): MockContext {
  return {
    spotify: SPOTIFY_TRACKS,
    sleep: SLEEP_DATA,
    daylight: DAYLIGHT_DATA,
    workouts: WORKOUT_DATA,
    calendar: CALENDAR_EVENTS,
    tasks: GOOGLE_TASKS,
    mood: MOOD_DATA,
    browsing: BROWSING_DATA,
    screenTime: SCREEN_TIME_DATA,
  };
}
