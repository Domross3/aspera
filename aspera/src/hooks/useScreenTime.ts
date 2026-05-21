// useScreenTime — exposes Family Controls authorization state to the Tech
// tab. Phase 8 · 8a covers auth; 8b extends this with per-category totals +
// warmup count once the report-extension spike proves out.
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

export function useScreenTime() {
  const [authStatus, setAuthStatus] = useState<ScreenTimeAuthStatus>(() =>
    getAuthorizationStatus(),
  );
  const [requesting, setRequesting] = useState(false);

  const refresh = useCallback(() => {
    setAuthStatus(getAuthorizationStatus());
  }, []);

  // Re-read on foreground — the user may have toggled authorization in iOS
  // Settings while the app was backgrounded.
  useEffect(() => {
    const sub = AppState.addEventListener("change", (next) => {
      if (next === "active") refresh();
    });
    return () => sub.remove();
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

  return {
    available: isScreenTimeAvailable(),
    authStatus,
    requesting,
    connect,
    refresh,
  };
}
