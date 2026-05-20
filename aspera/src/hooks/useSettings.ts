import { useState, useEffect, useCallback } from "react";
import { AppSettings } from "../types";
import { getSettings, saveSettings } from "../storage/storage";

const DEFAULT_SETTINGS: AppSettings = {
  onboardingComplete: false,
  moodNotificationsEnabled: false,
  hiddenLogSections: [],
  customMetrics: [],
  notificationSettings: {
    morningEnabled: true,
    morningTime: "08:00",
    eveningEnabled: true,
    eveningTime: "21:00",
    wakeTime: "07:00",
    sleepTime: "22:00",
    quickMoodEnabled: false,
    quickMoodFrequency: 3,
    somaticInterceptorEnabled: true,
  },
};

const listeners = new Set<() => void>();
let settingsCache = DEFAULT_SETTINGS;
let loaded = false;
let loadPromise: Promise<void> | null = null;

function emitSettingsChange() {
  for (const listener of listeners) {
    listener();
  }
}

function loadSettingsOnce(): Promise<void> {
  if (loaded) return Promise.resolve();
  if (!loadPromise) {
    loadPromise = getSettings().then((settings) => {
      settingsCache = settings;
      loaded = true;
      emitSettingsChange();
    });
  }
  return loadPromise;
}

export function useSettings() {
  const [settings, setSettings] = useState<AppSettings>(settingsCache);
  const [loading, setLoading] = useState(!loaded);

  useEffect(() => {
    const syncFromCache = () => {
      setSettings(settingsCache);
      setLoading(!loaded);
    };

    listeners.add(syncFromCache);
    void loadSettingsOnce().finally(syncFromCache);
    return () => {
      listeners.delete(syncFromCache);
    };
  }, []);

  const update = useCallback(
    async (patch: Partial<AppSettings>) => {
      const next = { ...settingsCache, ...patch };
      settingsCache = next;
      loaded = true;
      emitSettingsChange();
      await saveSettings(next);
    },
    [],
  );

  return { settings, loading, update };
}
