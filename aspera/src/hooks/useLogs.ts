import { useCallback, useEffect, useState } from "react";
import { DailyLog } from "../types";
import { getLog, getRecentLogs, saveLog } from "../storage/storage";
import {
  fetchRecentLogs,
  fetchTodayLog,
  upsertDailyLog,
} from "../lib/cloudStore";
import { useAuth } from "./useAuth";
import { asperaDayId } from "../lib/day";

// Canonical local 4am-cutoff day id (see src/lib/day.ts). Was previously a
// UTC `toISOString().split("T")[0]`, which rolled the day over before local
// midnight and could produce duplicate ids for one wall-clock day.
function todayId(): string {
  return asperaDayId();
}

/**
 * useLogs — Phase B-2 cloud-backed data layer.
 *
 * Reads: try Supabase first (single source of truth), fall back to
 * AsyncStorage cache on network failure. Successful cloud reads warm the
 * cache so offline launches show the last-known state.
 *
 * Writes: optimistic local write → state update → background sync to cloud.
 * If the sync fails, the cache still has the value and the next successful
 * reload will reconcile.
 *
 * Auth: requires a Supabase session. When no session is present (e.g. before
 * the auth gate redirects to /sign-in), we render the local cache so we
 * never flash empty UI — but writes are blocked since RLS would reject them
 * server-side anyway.
 */
export function useLogs() {
  const { session } = useAuth();
  const [todayLog, setTodayLog] = useState<DailyLog | null>(null);
  const [recentLogs, setRecentLogs] = useState<DailyLog[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    // Mock-seed removed — the user wants the real state of their data
    // so they can see exactly what's captured vs. what still needs work.
    const today = todayId();

    if (!session) {
      // No session yet — surface the local cache while the auth gate sorts
      // itself out. Avoids a flash of empty UI on cold start.
      const [cachedToday, cachedRecent] = await Promise.all([
        getLog(today),
        getRecentLogs(7),
      ]);
      setTodayLog(cachedToday);
      setRecentLogs(cachedRecent);
      setLoading(false);
      return;
    }

    const userId = session.user.id;
    try {
      const [cloudToday, cloudRecent] = await Promise.all([
        fetchTodayLog(userId, today),
        fetchRecentLogs(userId, 7),
      ]);
      setTodayLog(cloudToday);
      setRecentLogs(cloudRecent);
      // Warm the offline cache.
      if (cloudToday) await saveLog(cloudToday);
      await Promise.all(cloudRecent.map((l) => saveLog(l)));
    } catch (err) {
      console.warn("[useLogs] cloud fetch failed, falling back to cache", err);
      const [cachedToday, cachedRecent] = await Promise.all([
        getLog(today),
        getRecentLogs(7),
      ]);
      setTodayLog(cachedToday);
      setRecentLogs(cachedRecent);
    }
    setLoading(false);
  }, [session]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const save = useCallback(
    async (log: DailyLog) => {
      // Optimistic local write — UI updates immediately. saveLog keys by
      // log.id (= date), so this works the same for today's draft and for
      // backfilled past-day logs.
      await saveLog(log);
      const isToday = log.id === todayId();
      if (isToday) setTodayLog(log);
      setRecentLogs((prev) => {
        const without = prev.filter((l) => l.id !== log.id);
        return [log, ...without].slice(0, 7);
      });

      // Background sync. Errors don't roll back the local state — the next
      // reload either succeeds (and overwrites with truth) or also fails
      // (in which case the user keeps seeing their cached value).
      if (session) {
        try {
          await upsertDailyLog(session.user.id, log);
        } catch (err) {
          console.warn(
            "[useLogs] cloud save failed; cached locally, retry on next reload",
            err,
          );
        }
      }
    },
    [session],
  );

  // Resolve the log for an arbitrary date — used by the Log tab when the
  // user selects a past day in the WeekStrip. Tries today's draft, then
  // the in-memory recent cache, then cloud, then local AsyncStorage.
  // Returns null if nothing was ever saved for that date.
  const getLogFor = useCallback(
    async (date: string): Promise<DailyLog | null> => {
      if (date === todayId()) return todayLog;
      const cached = recentLogs.find((l) => l.id === date);
      if (cached) return cached;
      if (session) {
        try {
          return await fetchTodayLog(session.user.id, date);
        } catch {
          // Fall through to local cache.
        }
      }
      return await getLog(date);
    },
    [session, todayLog, recentLogs],
  );

  return {
    todayLog,
    recentLogs,
    loading,
    save,
    reload,
    getLogFor,
  };
}
