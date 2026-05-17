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
import type { DailyLog, Moment, MoodCheckIn } from "../types";
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

// ─── Bulk operations ──────────────────────────────────────────────────────

/**
 * Wipe ALL of a user's logs + mood entries + moments on the server. Used
 * by the Settings "Clear All Data" button when a user wants a true clean
 * slate. Service role isn't required — RLS lets the user delete their
 * own rows.
 */
export async function wipeUserData(userId: string): Promise<void> {
  await Promise.all([
    supabase.from("daily_logs").delete().eq("user_id", userId),
    supabase.from("mood_entries").delete().eq("user_id", userId),
    supabase.from("moments").delete().eq("user_id", userId),
  ]);
}
