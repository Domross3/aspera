import { useState, useEffect, useCallback } from "react";
import { DailyLog, ReservesState, MAX_RESERVES_PER_WEEK } from "../types";
import {
  getLog,
  getRecentLogs,
  saveLog,
  seedMockDataIfEmpty,
  getReserves,
  useReserve,
} from "../storage/storage";

function todayId(): string {
  return new Date().toISOString().split("T")[0];
}

export function useLogs() {
  const [todayLog, setTodayLog] = useState<DailyLog | null>(null);
  const [recentLogs, setRecentLogs] = useState<DailyLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [reserves, setReserves] = useState<ReservesState>({
    weekStartDate: "",
    reservesUsed: 0,
    reserveDates: [],
  });

  const reload = useCallback(async () => {
    await seedMockDataIfEmpty();
    const [today, recent, res] = await Promise.all([
      getLog(todayId()),
      getRecentLogs(7),
      getReserves(),
    ]);
    setTodayLog(today);
    setRecentLogs(recent);
    setReserves(res);
    setLoading(false);
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const save = useCallback(async (log: DailyLog) => {
    await saveLog(log);
    setTodayLog(log);
    setRecentLogs((prev) => {
      const without = prev.filter((l) => l.id !== log.id);
      return [log, ...without].slice(0, 7);
    });
  }, []);

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
