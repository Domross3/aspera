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
 * useLogs — Phase B-2 cloud-backed data layer, backed by a MODULE-LEVEL SHARED
 * STORE (mirrors useSettings). Every component that calls useLogs() reads and
 * writes the same in-memory state and is notified on change — so a focus saved
 * on the Today tab shows up immediately on the Log tab (and vice-versa). The
 * previous per-component useState meant each tab held its own copy and a save
 * in one never reached the other until a remount.
 *
 * Reads: try Supabase first, fall back to AsyncStorage cache on failure.
 * Writes: optimistic local write → shared-state update + emit → background
 * cloud sync. Auth gates cloud calls; local cache renders when no session.
 */

// ── Shared store ──────────────────────────────────────────────────────────
interface LogsState {
  todayLog: DailyLog | null;
  recentLogs: DailyLog[];
  loading: boolean;
}

let store: LogsState = { todayLog: null, recentLogs: [], loading: true };
const listeners = new Set<() => void>();

function setStore(patch: Partial<LogsState>) {
  store = { ...store, ...patch };
  for (const l of listeners) l();
}

// ── Reload / save (operate on the shared store) ───────────────────────────
async function reloadLogs(session: ReturnType<typeof useAuth>["session"]) {
  const today = todayId();

  if (!session) {
    // No session yet — surface the local cache while the auth gate sorts
    // itself out. Avoids a flash of empty UI on cold start.
    const [cachedToday, cachedRecent] = await Promise.all([
      getLog(today),
      getRecentLogs(7),
    ]);
    setStore({
      todayLog: cachedToday,
      recentLogs: cachedRecent,
      loading: false,
    });
    return;
  }

  const userId = session.user.id;
  try {
    const [cloudToday, cloudRecent] = await Promise.all([
      fetchTodayLog(userId, today),
      fetchRecentLogs(userId, 7),
    ]);
    setStore({
      todayLog: cloudToday,
      recentLogs: cloudRecent,
      loading: false,
    });
    // Warm the offline cache.
    if (cloudToday) await saveLog(cloudToday);
    await Promise.all(cloudRecent.map((l) => saveLog(l)));
  } catch (err) {
    console.warn("[useLogs] cloud fetch failed, falling back to cache", err);
    const [cachedToday, cachedRecent] = await Promise.all([
      getLog(today),
      getRecentLogs(7),
    ]);
    setStore({
      todayLog: cachedToday,
      recentLogs: cachedRecent,
      loading: false,
    });
  }
}

async function saveLogToStore(
  log: DailyLog,
  session: ReturnType<typeof useAuth>["session"],
) {
  // Optimistic local write — UI updates immediately for ALL subscribers.
  // saveLog keys by log.id (= date), so this works the same for today's
  // draft and for backfilled past-day logs.
  await saveLog(log);
  const isToday = log.id === todayId();
  const without = store.recentLogs.filter((l) => l.id !== log.id);
  setStore({
    todayLog: isToday ? log : store.todayLog,
    recentLogs: [log, ...without].slice(0, 7),
  });

  // Background sync. Errors don't roll back local state — the next reload
  // reconciles (or also fails, leaving the cached value visible).
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
}

export function useLogs() {
  const { session } = useAuth();
  // Local mirror of the shared store so a change re-renders this component.
  const [snapshot, setSnapshot] = useState<LogsState>(store);

  useEffect(() => {
    const sync = () => setSnapshot(store);
    listeners.add(sync);
    sync(); // adopt the latest in case it changed before subscribing
    return () => {
      listeners.delete(sync);
    };
  }, []);

  const reload = useCallback(async () => {
    await reloadLogs(session);
  }, [session]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const save = useCallback(
    async (log: DailyLog) => {
      await saveLogToStore(log, session);
    },
    [session],
  );

  // Resolve the log for an arbitrary date — used by the Log tab when the user
  // selects a past day in the WeekStrip. Tries today's draft, then the
  // in-memory recent cache, then cloud, then local AsyncStorage. Returns null
  // if nothing was ever saved for that date.
  const getLogFor = useCallback(
    async (date: string): Promise<DailyLog | null> => {
      if (date === todayId()) return store.todayLog;
      const cached = store.recentLogs.find((l) => l.id === date);
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
    [session],
  );

  return {
    todayLog: snapshot.todayLog,
    recentLogs: snapshot.recentLogs,
    loading: snapshot.loading,
    save,
    reload,
    getLogFor,
  };
}
