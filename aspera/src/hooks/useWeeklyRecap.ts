// useWeeklyRecap — wires the pure recap builder (lib/agent/weeklyRecap) to
// on-device data + the "last shown week" marker. The recap surfaces on Today
// only when it has real content and hasn't been seen this week; quiet weeks
// stay silent. On-device only, no network.

import { useCallback, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  getRecentLogs,
  getRecentMoodCheckIns,
  getRecentMoments,
  getSettings,
} from "../storage/storage";
import { STORAGE_KEYS } from "../types";
import {
  buildWeeklyRecap,
  shouldShowRecap,
} from "../lib/agent/weeklyRecap";
import type { WeeklyRecap } from "../lib/agent/recap";

const HISTORY_DAYS = 180;

export function useWeeklyRecap() {
  const [recap, setRecap] = useState<WeeklyRecap | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const [logs, moodCheckIns, moments, settings, lastShownWeek] =
        await Promise.all([
          getRecentLogs(HISTORY_DAYS),
          getRecentMoodCheckIns(HISTORY_DAYS),
          getRecentMoments(HISTORY_DAYS),
          getSettings(),
          AsyncStorage.getItem(STORAGE_KEYS.RECAP_LAST_SHOWN_WEEK),
        ]);
      if (cancelled) return;
      const r = buildWeeklyRecap({
        logs,
        moodCheckIns,
        moments,
        eventTypes: settings.eventTypes ?? [],
      });
      setRecap(r);
      setVisible(shouldShowRecap(r, lastShownWeek));
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Mark this week's recap as seen so it doesn't reappear on every open, and
  // hide the card now.
  const dismiss = useCallback(async () => {
    setVisible(false);
    if (recap) {
      await AsyncStorage.setItem(
        STORAGE_KEYS.RECAP_LAST_SHOWN_WEEK,
        recap.weekStart,
      );
    }
  }, [recap]);

  return { recap, visible, dismiss };
}
