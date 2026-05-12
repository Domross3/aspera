import { useCallback, useEffect, useState } from "react";
import { DailyLog, ReservesState, MAX_RESERVES_PER_WEEK } from "../types";
import {
  getLog,
  getRecentLogs,
  saveLog,
  seedMockDataIfEmpty,
  getReserves,
} from "../storage/storage";
import {
  fetchRecentLogs,
  fetchTodayLog,
  upsertDailyLog,
} from "../lib/cloudStore";
import { useAuth } from "./useAuth";

function todayId(): string {
  return new Date().toISOString().split("T")[0];
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
  const [reserves, setReserves] = useState<ReservesState>({
    weekStartDate: "",
    reservesUsed: 0,
    reserveDates: [],
  });

  const reload = useCallback(async () => {
    // Demo seed only runs in dev (Expo Go / dev client) when there's no
    // session — i.e. you're poking at the empty-state UI without signing in.
    // Production builds gate every screen behind the auth wall.
    if (__DEV__ && !session) {
      await seedMockDataIfEmpty();
    }

    const res = await getReserves();
    setReserves(res);

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
      // Optimistic local write — UI updates immediately.
      await saveLog(log);
      setTodayLog(log);
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

  // Reserve-aware streak computation
  // Instead of breaking on a missed day, we spend a reserve pass.
  const { streak, reservesUsedInStreak } = (() => {
    let count = 0;
    let reservesSpent = 0;
    const today = todayId();
    const all = todayLog
      ? [todayLog, ...recentLogs.filter((l) => l.id !== today)]
      : recentLogs;
    const logIds = new Set(all.map((l) => l.id));

    // Brand-new user / cleared data: no logs anywhere → streak is 0. The
    // reserve-spending fallback below would otherwise count today + yesterday
    // as covered-by-reserve days and produce a phantom streak.
    if (logIds.size === 0) {
      return { streak: 0, reservesUsedInStreak: 0 };
    }

    for (let i = 0; i < 14; i++) {
      const expected = new Date();
      expected.setDate(expected.getDate() - i);
      const expectedId = expected.toISOString().split("T")[0];

      if (logIds.has(expectedId)) {
        count++;
      } else if (reservesSpent < reserves.reservesUsed) {
        // A reserve was used for this gap — streak survives
        reservesSpent++;
        count++;
      } else if (reservesSpent < MAX_RESERVES_PER_WEEK) {
        // Auto-spend a reserve for today's gap (prospective)
        reservesSpent++;
        count++;
      } else {
        break; // No reserves left, streak breaks
      }
    }
    return { streak: count, reservesUsedInStreak: reservesSpent };
  })();

  const reservesRemaining = MAX_RESERVES_PER_WEEK - reserves.reservesUsed;

  return {
    todayLog,
    recentLogs,
    loading,
    save,
    reload,
    streak,
    reserves,
    reservesRemaining,
    reservesUsedInStreak,
  };
}
