"use client";
import { useState, useEffect, useCallback } from "react";
import { AppSettings } from "../types";
import { getSettings, saveSettings } from "../lib/storage";

const DEFAULT_SETTINGS: AppSettings = {
  onboardingComplete: false,
  moodNotificationsEnabled: false,
  hiddenLogSections: [],
  customMetrics: [],
  personality: "analytical",
};

export function useSettings() {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSettings().then((s) => {
      setSettings(s);
      setLoading(false);
    });
  }, []);

  const update = useCallback(
    async (patch: Partial<AppSettings>) => {
      const next = { ...settings, ...patch };
      setSettings(next);
      await saveSettings(next);
    },
    [settings],
  );

  return { settings, loading, update };
}
