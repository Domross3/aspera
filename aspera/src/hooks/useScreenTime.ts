// useScreenTime — exposes Family Controls authorization state to the Tech
// tab plus aggregate Screen Time totals once the user opens the native report.
//
// Safe on every binary: the underlying module degrades to "unavailable" when
// the native code isn't present (Android, Expo Go, or an OTA on an old
// 1.0.0 build), so this hook never throws.

import { useCallback, useEffect, useState } from "react";
import { AppState } from "react-native";
import {
  getAuthorizationStatus,
  requestAuthorization,
  isScreenTimeAvailable,
  type ScreenTimeAuthStatus,
} from "../../modules/screen-time/src";
import {
  readScreenTimeTotals,
  refreshScreenTimeTotals,
} from "../lib/screenTime/bridge";
import { summarizeScreenTimeCollection } from "../lib/screenTime/storage";
import type {
  ScreenTimeCollectionSummary,
  ScreenTimeDayTotals,
} from "../lib/screenTime/types";

export function useScreenTime() {
  const [authStatus, setAuthStatus] = useState<ScreenTimeAuthStatus>(() =>
    getAuthorizationStatus(),
  );
  const [requesting, setRequesting] = useState(false);
  const [loadingTotals, setLoadingTotals] = useState(false);
  const [totalsError, setTotalsError] = useState<string | null>(null);
  const [dailyTotals, setDailyTotals] = useState<ScreenTimeDayTotals[]>([]);

  const summary: ScreenTimeCollectionSummary =
    summarizeScreenTimeCollection(dailyTotals);

  const refresh = useCallback(() => {
    setAuthStatus(getAuthorizationStatus());
    void readScreenTimeTotals()
      .then((totals) => {
        setDailyTotals(totals);
        setTotalsError(null);
      })
      .catch((error: unknown) => {
        setTotalsError(
          error instanceof Error ? error.message : "Could not read totals.",
        );
      });
  }, []);

  // Re-read on foreground — the user may have toggled authorization in iOS
  // Settings while the app was backgrounded.
  useEffect(() => {
    const sub = AppState.addEventListener("change", (next) => {
      if (next === "active") refresh();
    });
    return () => sub.remove();
  }, [refresh]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const connect = useCallback(async () => {
    if (requesting) return;
    setRequesting(true);
    try {
      const next = await requestAuthorization();
      setAuthStatus(next);
    } catch {
      setAuthStatus(getAuthorizationStatus());
    } finally {
      setRequesting(false);
    }
  }, [requesting]);

  const refreshTotals = useCallback(async () => {
    if (loadingTotals) return;
    setLoadingTotals(true);
    setTotalsError(null);
    try {
      const totals = await refreshScreenTimeTotals();
      setDailyTotals(totals);
    } catch (error) {
      setTotalsError(
        error instanceof Error ? error.message : "Could not sync totals.",
      );
    } finally {
      setLoadingTotals(false);
    }
  }, [loadingTotals]);

  return {
    available: isScreenTimeAvailable(),
    authStatus,
    requesting,
    dailyTotals,
    daysCollected: summary.daysCollected,
    latestDay: summary.latestDay,
    hasWarmup: summary.hasWarmup,
    loadingTotals,
    totalsError,
    connect,
    refresh,
    refreshTotals,
  };
}
