import {
  BROWSING_DATA,
  CALENDAR_EVENTS,
  GOOGLE_TASKS,
  MOOD_DATA,
  SLEEP_DATA,
  SPOTIFY_TRACKS,
  WORKOUT_DATA,
  BrowsingDay,
  BrowsingSite,
  GoogleTask,
  SpotifyTrack,
} from "./mockData";
import {
  AttentionBucket,
  AttentionBucketStat,
  AttentionSummary,
  DailyIntegrationSummary,
  IntegrationConnection,
} from "../types";

const BUCKET_LABELS: Record<AttentionBucket, string> = {
  deep_work: "Deep Work",
  research: "Research",
  communication: "Communication",
  utility: "Utility",
  recovery: "Recovery",
  drift: "Drift",
};

const HOSTNAME_BUCKETS: Record<string, AttentionBucket> = {
  "github.com": "deep_work",
  "figma.com": "deep_work",
  "docs.expo.dev": "research",
  "stackoverflow.com": "research",
  "google.com": "utility",
  "youtube.com": "recovery",
  "reddit.com": "drift",
  "twitter.com": "communication",
};

function round(value: number): number {
  return Math.round(value * 10) / 10;
}

function msToMinutes(milliseconds: number): number {
  return Math.round(milliseconds / 60000);
}

function shareOf(total: number, minutes: number): number {
  if (total === 0) return 0;
  return round(minutes / total);
}

function bucketForSite(site: BrowsingSite): AttentionBucket {
  const explicit = HOSTNAME_BUCKETS[site.hostname];
  if (explicit) return explicit;
  if (site.category === "productive") return "deep_work";
  if (site.category === "neutral") return "utility";
  return "drift";
}

export function inferMusicGenre(track: SpotifyTrack): string {
  const artist = track.artist.toLowerCase();
  const name = track.name.toLowerCase();
  if (
    artist.includes("nirvana") ||
    artist.includes("alice in chains") ||
    artist.includes("soundgarden") ||
    artist.includes("red hot chili peppers")
  ) {
    return "rock";
  }
  if (artist.includes("satie")) return "classical";
  if (artist.includes("chilledcow") || name.includes("lofi")) return "lofi";
  return "ambient";
}

export function buildAttentionSummary(day: BrowsingDay): AttentionSummary {
  const totalMinutes = msToMinutes(
    day.totals.productive + day.totals.neutral + day.totals.distracting,
  );
  const buckets = new Map<AttentionBucket, number>();

  for (const site of day.sites) {
    const bucket = bucketForSite(site);
    buckets.set(bucket, (buckets.get(bucket) ?? 0) + msToMinutes(site.time));
  }

  const byBucket: AttentionBucketStat[] = Array.from(buckets.entries())
    .map(([bucket, minutes]) => ({
      bucket,
      label: BUCKET_LABELS[bucket as AttentionBucket],
      minutes,
      share: shareOf(totalMinutes, minutes),
    }))
    .sort((left, right) => right.minutes - left.minutes);

  return {
    date: day.date,
    totalMinutes,
    productiveMinutes: msToMinutes(day.totals.productive),
    neutralMinutes: msToMinutes(day.totals.neutral),
    distractingMinutes: msToMinutes(day.totals.distracting),
    focusScore: day.focusScore,
    byBucket,
    topSources: [...day.sites]
      .sort((left, right) => right.time - left.time)
      .slice(0, 3)
      .map((site) => site.hostname),
  };
}

export function getAttentionSummaries(): AttentionSummary[] {
  return [...BROWSING_DATA]
    .sort((left, right) => left.date.localeCompare(right.date))
    .map(buildAttentionSummary);
}

function getTaskLoadLabel(tasks: GoogleTask[]): DailyIntegrationSummary["taskLoad"] {
  if (tasks.length === 0) return "None";
  const uniqueLoads = Array.from(new Set(tasks.map((task) => task.cognitive_load)));
  if (uniqueLoads.length > 1) return "Mixed";
  return uniqueLoads[0];
}

function uniqueDates(): string[] {
  return Array.from(new Set([
    ...SLEEP_DATA.map((entry) => entry.date),
    ...WORKOUT_DATA.map((entry) => entry.date),
    ...MOOD_DATA.map((entry) => entry.date),
    ...BROWSING_DATA.map((entry) => entry.date),
    ...SPOTIFY_TRACKS.map((track) => track.played_at.split("T")[0]),
    ...CALENDAR_EVENTS.map((event) => event.start.split("T")[0]),
    ...GOOGLE_TASKS.map((task) => task.due),
    ...GOOGLE_TASKS.flatMap((task) =>
      task.completed_at ? [task.completed_at.split("T")[0]] : [],
    ),
  ])).sort((left, right) => left.localeCompare(right));
}

export function getDailyIntegrationSummaries(): DailyIntegrationSummary[] {
  const attentionByDate = new Map(
    getAttentionSummaries().map((summary) => [summary.date, summary]),
  );

  return uniqueDates().map((date) => {
    const sleep = SLEEP_DATA.find((entry) => entry.date === date);
    const workouts = WORKOUT_DATA.filter((entry) => entry.date === date);
    const calendarEvents = CALENDAR_EVENTS.filter((event) =>
      event.start.startsWith(date),
    );
    const completedTasks = GOOGLE_TASKS.filter((task) =>
      task.completed_at?.startsWith(date),
    );
    const taskScope = GOOGLE_TASKS.filter(
      (task) => task.due === date || task.completed_at?.startsWith(date),
    );
    const mood = MOOD_DATA.find((entry) => entry.date === date);
    const musicGenres = Array.from(new Set(
      SPOTIFY_TRACKS.filter((track) => track.played_at.startsWith(date)).map(inferMusicGenre)
    ));

    return {
      date,
      attention: attentionByDate.get(date),
      sleepHours: sleep?.hours_slept,
      sleepQuality: sleep?.sleep_quality,
      workoutMinutes:
        workouts.reduce((sum, workout) => sum + workout.duration_minutes, 0) ||
        undefined,
      workoutIntensity: workouts.length > 0 ? workouts[0].intensity : undefined,
      musicGenres: musicGenres.length > 0 ? musicGenres : undefined,
      calendarEvents: calendarEvents.length || undefined,
      calendarHighDemandBlocks:
        calendarEvents.filter((event) => event.cognitive_demand === "High").length ||
        undefined,
      completedTasks: completedTasks.length || undefined,
      taskLoad: getTaskLoadLabel(taskScope),
      moodAverage: mood ? round(mood.mood_score / 2) : undefined,
      energyAverage: mood ? round(mood.energy_score / 2) : undefined,
    };
  });
}

export function getLatestIntegrationSummary(): DailyIntegrationSummary | null {
  const summaries = getDailyIntegrationSummaries();
  return summaries.length > 0 ? summaries[summaries.length - 1] : null;
}

export function getDefaultIntegrationConnections(now = Date.now()): IntegrationConnection[] {
  return [
    {
      id: "claude",
      name: "Claude",
      description: "Generates recommendations, weekly insights, and cross-source pattern analysis.",
      status: "connected",
      source: "cloud",
      platform: "cross-platform",
      lastSyncAt: now,
      highlights: ["Insights prompt includes normalized integration summaries"],
    },
    {
      id: "spotify",
      name: "Spotify",
      description: "Music listening context feeds genre-based focus and recovery patterns.",
      status: "mock",
      source: "mock",
      platform: "cross-platform",
      lastSyncAt: now,
      highlights: ["Genre inference is normalized for future cross-source insights"],
    },
    {
      id: "healthkit",
      name: "HealthKit",
      description: "Sleep and workouts shape readiness, recovery, and output patterns.",
      status: "mock",
      source: "mock",
      platform: "ios",
      lastSyncAt: now,
      highlights: ["Sleep hours and workout minutes are folded into daily summaries"],
    },
    {
      id: "google_calendar",
      name: "Google Calendar",
      description: "High-demand blocks help explain energy drain and attention fragmentation.",
      status: "mock",
      source: "mock",
      platform: "cross-platform",
      lastSyncAt: now,
      highlights: ["Calendar demand is normalized per day"],
    },
    {
      id: "google_tasks",
      name: "Google Tasks",
      description: "Task completion and cognitive load provide a stronger output baseline.",
      status: "mock",
      source: "mock",
      platform: "cross-platform",
      lastSyncAt: now,
      highlights: ["Completed tasks and task load are normalized per day"],
    },
    {
      id: "browsing",
      name: "Browsing Focus",
      description: "Browser activity is translated into attention buckets like deep work and drift.",
      status: "mock",
      source: "mock",
      platform: "cross-platform",
      lastSyncAt: now,
      highlights: ["Attention summaries now roll up productive, neutral, and distracting time"],
    },
    {
      id: "screen_time",
      name: "iOS Screen Time",
      description: "Planned native integration for a more holistic time-spent model.",
      status: "planned",
      source: "device",
      platform: "ios",
      nextStep: "Add a native iOS module using FamilyControls + DeviceActivity.",
      highlights: ["Will extend browsing-only attention data into full device-level time spent"],
    },
  ];
}
