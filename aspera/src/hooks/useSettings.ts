import { useState, useEffect, useCallback } from "react";
import { APP_SETTINGS_SCHEMA_VERSION, AppSettings } from "../types";
import { getSettings, saveSettings } from "../storage/storage";

function currentMondayString(): string {
  const now = new Date();
  const monday = new Date(now);
  const diff = monday.getDay() === 0 ? -6 : 1 - monday.getDay();
  monday.setDate(monday.getDate() + diff);
  monday.setHours(0, 0, 0, 0);
  const mm = String(monday.getMonth() + 1).padStart(2, "0");
  const dd = String(monday.getDate()).padStart(2, "0");
  return `${monday.getFullYear()}-${mm}-${dd}`;
}

const DEFAULT_SETTINGS: AppSettings = {
  schemaVersion: APP_SETTINGS_SCHEMA_VERSION,
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
  cheatPolicy: {
    weeklyCap: 1,
    weekStart: currentMondayString(),
    spentThisWeek: 0,
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

  const update = useCallback(async (patch: Partial<AppSettings>) => {
    const next = { ...settingsCache, ...patch };
    settingsCache = next;
    loaded = true;
    emitSettingsChange();
    await saveSettings(next);
  }, []);

  return { settings, loading, update };
}
