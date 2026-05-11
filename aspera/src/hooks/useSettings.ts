import { useState, useEffect, useCallback } from "react";
import { AppSettings } from "../types";
import { getSettings, saveSettings } from "../storage/storage";

export function useSettings() {
  const [settings, setSettings] = useState<AppSettings>({
    onboardingComplete: false,
    moodNotificationsEnabled: false,
    hiddenLogSections: [],
    customMetrics: [],
    notificationSettings: {
      morningEnabled: true,
      morningTime: "08:00",
      eveningEnabled: true,
      eveningTime: "21:00",
      quickMoodEnabled: false,
      quickMoodFrequency: 3,
      quickMoodWindowStart: "09:00",
      quickMoodWindowEnd: "21:00",
    },
  });
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
