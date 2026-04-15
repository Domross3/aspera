import { useState, useEffect, useCallback } from "react";
import { AppSettings } from "../types";
import { getSettings, saveSettings } from "../storage/storage";
import { DEMO_API_KEY } from "../constants/config";

export function useSettings() {
  const [settings, setSettings] = useState<AppSettings>({
    claudeApiKey: DEMO_API_KEY,
    onboardingComplete: false,
    moodNotificationsEnabled: false,
    hiddenLogSections: [],
    customMetrics: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSettings().then((s) => {
      // Use demo key as fallback if no key was saved
      if (!s.claudeApiKey) s.claudeApiKey = DEMO_API_KEY;
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
