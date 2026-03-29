import { useState, useEffect, useCallback } from 'react';
import { DailyLog } from '../types';
import { getLog, getRecentLogs, saveLog, seedMockDataIfEmpty } from '../storage/storage';

function todayId(): string {
  return new Date().toISOString().split('T')[0];
}

export function useLogs() {
  const [todayLog, setTodayLog] = useState<DailyLog | null>(null);
  const [recentLogs, setRecentLogs] = useState<DailyLog[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    await seedMockDataIfEmpty();
    const [today, recent] = await Promise.all([
      getLog(todayId()),
      getRecentLogs(7),
    ]);
    setTodayLog(today);
    setRecentLogs(recent);
    setLoading(false);
  }, []);

  useEffect(() => { reload(); }, [reload]);

  const save = useCallback(async (log: DailyLog) => {
    await saveLog(log);
    setTodayLog(log);
    setRecentLogs(prev => {
      const without = prev.filter(l => l.id !== log.id);
      return [log, ...without].slice(0, 7);
    });
  }, []);

  const streak = (() => {
    let count = 0;
    const today = todayId();
    const all = todayLog
      ? [todayLog, ...recentLogs.filter(l => l.id !== today)]
      : recentLogs;
    const sorted = [...all].sort((a, b) => b.id.localeCompare(a.id));
    for (let i = 0; i < sorted.length; i++) {
      const expected = new Date();
      expected.setDate(expected.getDate() - i);
      const expectedId = expected.toISOString().split('T')[0];
      if (sorted[i]?.id === expectedId) count++;
      else break;
    }
    return count;
  })();

  return { todayLog, recentLogs, loading, save, reload, streak };
}
