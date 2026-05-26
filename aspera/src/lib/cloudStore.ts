// Cloud-backed storage layer (Phase B-2).
//
// Wraps Supabase queries for daily_logs and mood_entries so consumers
// (useLogs, mood-related code) don't have to know about RLS, column names,
// or .from("...").select() boilerplate. AsyncStorage remains the fast
// offline cache — callers should write through to both.
//
// Auth: every query relies on the active Supabase session; RLS scopes
// reads/writes to auth.uid() = user_id on the server. We still pass userId
// explicitly to insert/upsert paths because RLS WITH CHECK clauses require
// the row's user_id column to match auth.uid() — Supabase doesn't auto-fill it.

import { supabase } from "./supabase";
import type {
  ComparisonResult,
  DailyLog,
  Experiment,
  ExperimentStatus,
  Moment,
  MoodCheckIn,
  OutcomeMetric,
  Restriction,
  RestrictionSpec,
} from "../types";
import { migrateDailyLog } from "../storage/migrations";

// ─── Daily Logs ────────────────────────────────────────────────────────────

export async function fetchTodayLog(
  userId: string,
  date: string,
): Promise<DailyLog | null> {
  const { data, error } = await supabase
    .from("daily_logs")
    .select("data")
    .eq("user_id", userId)
    .eq("date", date)
    .maybeSingle();
  if (error) throw error;
  const raw = (data?.data as DailyLog | undefined) ?? null;
  // Cloud rows can pre-date the Phase 2 schema. The read-time migration
  // is cheap (pure function) and is what lets the rest of the app assume
  // every DailyLog it sees has the new `eventEntries` shape populated.
  return raw ? migrateDailyLog(raw) : null;
}

export async function fetchRecentLogs(
  userId: string,
  limit = 7,
): Promise<DailyLog[]> {
  const { data, error } = await supabase
    .from("daily_logs")
    .select("data")
    .eq("user_id", userId)
    .order("date", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []).map((row) => migrateDailyLog(row.data as DailyLog));
}

export async function upsertDailyLog(
  userId: string,
  log: DailyLog,
): Promise<void> {
  // The whole DailyLog object goes into the `data` JSONB column so the
  // mobile-side types/storage shape stays the source of truth — no need to
  // normalize columns when the model evolves.
  const { error } = await supabase.from("daily_logs").upsert(
    {
      user_id: userId,
      date: log.date,
      data: log as unknown as Record<string, unknown>,
    },
    { onConflict: "user_id,date" },
  );
  if (error) throw error;
}

// ─── Mood Check-ins ───────────────────────────────────────────────────────

interface MoodEntryRow {
  id: string;
  timestamp: string;
  mood: number;
  energy: number;
  stress: number;
  note: string | null;
  source: string | null;
}

function rowToMoodCheckIn(row: MoodEntryRow): MoodCheckIn {
  return {
    id: row.id,
    timestamp: new Date(row.timestamp).getTime(),
    mood: Number(row.mood),
    energy: Number(row.energy),
    stress: Number(row.stress),
    note: row.note ?? undefined,
    source:
      row.source === "quick" || row.source === "full"
        ? row.source
        : undefined,
  };
}

export async function fetchRecentMoodCheckIns(
  userId: string,
  limit = 50,
): Promise<MoodCheckIn[]> {
  const { data, error } = await supabase
    .from("mood_entries")
    .select("id, timestamp, mood, energy, stress, note, source")
    .eq("user_id", userId)
    .order("timestamp", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []).map((row) => rowToMoodCheckIn(row as MoodEntryRow));
}

export async function insertMoodCheckIn(
  userId: string,
  checkIn: MoodCheckIn,
): Promise<void> {
  const { error } = await supabase.from("mood_entries").insert({
    user_id: userId,
    timestamp: new Date(checkIn.timestamp).toISOString(),
    mood: checkIn.mood,
    energy: checkIn.energy,
    stress: checkIn.stress,
    note: checkIn.note ?? null,
    source: checkIn.source ?? null,
  });
  if (error) throw error;
}

// ─── Moments ──────────────────────────────────────────────────────────────

interface MomentRow {
  id: string;
  timestamp: string;
  label: string;
  duration_min: number | null;
  note: string | null;
}

function rowToMoment(row: MomentRow): Moment {
  return {
    id: row.id,
    timestamp: new Date(row.timestamp).getTime(),
    label: row.label,
    duration: row.duration_min ?? undefined,
    note: row.note ?? undefined,
  };
}

export async function fetchRecentMoments(
  userId: string,
  limit = 100,
): Promise<Moment[]> {
  const { data, error } = await supabase
    .from("moments")
    .select("id, timestamp, label, duration_min, note")
    .eq("user_id", userId)
    .order("timestamp", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []).map((row) => rowToMoment(row as MomentRow));
}

export async function insertMoment(
  userId: string,
  moment: Moment,
): Promise<void> {
  const { error } = await supabase.from("moments").insert({
    user_id: userId,
    timestamp: new Date(moment.timestamp).toISOString(),
    label: moment.label,
    duration_min: moment.duration ?? null,
    note: moment.note ?? null,
  });
  if (error) throw error;
}

export async function deleteMoment(
  userId: string,
  momentId: string,
): Promise<void> {
  const { error } = await supabase
    .from("moments")
    .delete()
    .eq("user_id", userId)
    .eq("id", momentId);
  if (error) throw error;
}

// ─── Restrictions (Phase 8) ───────────────────────────────────────────────

interface RestrictionRow {
  id: string;
  name: string | null;
  kind: "time_window" | "daily_limit";
  categories: string[];
  selected_app_count: number | null;
  selected_category_count: number | null;
  window_start: string | null;
  window_end: string | null;
  daily_limit_min: number | null;
  weekdays: number[];
  active: boolean;
  created_at: string;
  updated_at: string;
}

function rowToRestriction(row: RestrictionRow): Restriction {
  const spec: RestrictionSpec =
    row.kind === "time_window"
      ? {
          kind: "time_window",
          windowStart: row.window_start ?? "00:00",
          windowEnd: row.window_end ?? "00:00",
        }
      : {
          kind: "daily_limit",
          dailyLimitMin: row.daily_limit_min ?? 0,
        };
  return {
    id: row.id,
    name: row.name ?? "Restriction",
    categories: row.categories,
    selectedAppCount: row.selected_app_count ?? 0,
    selectedCategoryCount: row.selected_category_count ?? 0,
    weekdays: row.weekdays,
    active: row.active,
    spec,
    createdAt: new Date(row.created_at).getTime(),
    updatedAt: new Date(row.updated_at).getTime(),
  };
}

export async function fetchRestrictions(
  userId: string,
): Promise<Restriction[]> {
  const { data, error } = await supabase
    .from("restrictions")
    .select(
      "id, name, kind, categories, selected_app_count, selected_category_count, window_start, window_end, daily_limit_min, weekdays, active, created_at, updated_at",
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []).map((row) => rowToRestriction(row as RestrictionRow));
}

export async function upsertRestriction(
  userId: string,
  r: Restriction,
): Promise<void> {
  // Flatten the discriminated `spec` union into the columnar shape the
  // `restrictions` table uses. The CHECK constraint on the table enforces
  // that the right per-kind columns are populated.
  const { error } = await supabase.from("restrictions").upsert(
    {
      id: r.id,
      user_id: userId,
      name: r.name,
      kind: r.spec.kind,
      categories: r.categories,
      selected_app_count: r.selectedAppCount,
      selected_category_count: r.selectedCategoryCount,
      window_start:
        r.spec.kind === "time_window" ? r.spec.windowStart : null,
      window_end: r.spec.kind === "time_window" ? r.spec.windowEnd : null,
      daily_limit_min:
        r.spec.kind === "daily_limit" ? r.spec.dailyLimitMin : null,
      weekdays: r.weekdays,
      active: r.active,
    },
    { onConflict: "id" },
  );
  if (error) throw error;
}

export async function deleteRestriction(
  userId: string,
  id: string,
): Promise<void> {
  const { error } = await supabase
    .from("restrictions")
    .delete()
    .eq("user_id", userId)
    .eq("id", id);
  if (error) throw error;
}

// ─── Experiments (Phase 8) ────────────────────────────────────────────────

interface ExperimentRow {
  id: string;
  name: string;
  hypothesis: string | null;
  restriction_refs: string[];
  outcome_metric: OutcomeMetric;
  duration_days: number;
  baseline_window_days: number;
  started_at: string | null;
  ends_at: string | null;
  status: ExperimentStatus;
  result_payload: ComparisonResult | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

function rowToExperiment(row: ExperimentRow): Experiment {
  return {
    id: row.id,
    name: row.name,
    hypothesis: row.hypothesis ?? undefined,
    restrictionRefs: row.restriction_refs,
    outcomeMetric: row.outcome_metric,
    durationDays: row.duration_days,
    baselineWindowDays: row.baseline_window_days,
    startedAt: row.started_at
      ? new Date(row.started_at).getTime()
      : undefined,
    endsAt: row.ends_at ? new Date(row.ends_at).getTime() : undefined,
    status: row.status,
    resultPayload: row.result_payload ?? undefined,
    notes: row.notes ?? undefined,
    createdAt: new Date(row.created_at).getTime(),
    updatedAt: new Date(row.updated_at).getTime(),
  };
}

export async function fetchExperiments(
  userId: string,
): Promise<Experiment[]> {
  const { data, error } = await supabase
    .from("experiments")
    .select(
      "id, name, hypothesis, restriction_refs, outcome_metric, duration_days, baseline_window_days, started_at, ends_at, status, result_payload, notes, created_at, updated_at",
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((row) => rowToExperiment(row as ExperimentRow));
}

export async function upsertExperiment(
  userId: string,
  e: Experiment,
): Promise<void> {
  const { error } = await supabase.from("experiments").upsert(
    {
      id: e.id,
      user_id: userId,
      name: e.name,
      hypothesis: e.hypothesis ?? null,
      restriction_refs: e.restrictionRefs,
      outcome_metric: e.outcomeMetric,
      duration_days: e.durationDays,
      baseline_window_days: e.baselineWindowDays,
      started_at: e.startedAt ? new Date(e.startedAt).toISOString() : null,
      ends_at: e.endsAt ? new Date(e.endsAt).toISOString() : null,
      status: e.status,
      result_payload: e.resultPayload ?? null,
      notes: e.notes ?? null,
    },
    { onConflict: "id" },
  );
  if (error) throw error;
}

export async function deleteExperiment(
  userId: string,
  id: string,
): Promise<void> {
  const { error } = await supabase
    .from("experiments")
    .delete()
    .eq("user_id", userId)
    .eq("id", id);
  if (error) throw error;
}

// ─── Bulk operations ──────────────────────────────────────────────────────

/**
 * Wipe ALL of a user's logs + mood entries + moments + restrictions +
 * experiments on the server. Used by the Settings "Clear All Data" button
 * when a user wants a true clean slate. Service role isn't required — RLS
 * lets the user delete their own rows.
 */
export async function wipeUserData(userId: string): Promise<void> {
  await Promise.all([
    supabase.from("daily_logs").delete().eq("user_id", userId),
    supabase.from("mood_entries").delete().eq("user_id", userId),
    supabase.from("moments").delete().eq("user_id", userId),
    supabase.from("restrictions").delete().eq("user_id", userId),
    supabase.from("experiments").delete().eq("user_id", userId),
  ]);
}
