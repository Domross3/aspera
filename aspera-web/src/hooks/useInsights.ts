"use client";
import { useState, useCallback } from "react";
import { InsightsResponse } from "../types";
import { getInsights, saveInsights } from "../lib/storage";
import { DailyLog } from "../types";

export type CoachPersonality = "analytical" | "unserious" | "stoic";

export function useInsights() {
  const [insights, setInsights] = useState<InsightsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadCached = useCallback(async () => {
    const cached = await getInsights();
    if (cached) setInsights(cached);
  }, []);

  const generate = useCallback(
    async (logs: DailyLog[], personality: CoachPersonality = "analytical") => {
      if (logs.length === 0) {
        setError("Log at least one day of data first.");
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/insights", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ logs, personality }),
        });
        if (!res.ok) {
          const data = (await res.json()) as { error?: string };
          throw new Error(data.error ?? `Server error ${res.status}`);
        }
        const result = (await res.json()) as InsightsResponse;
        setInsights(result);
        await saveInsights(result);
      } catch (e: unknown) {
        setError(
          e instanceof Error
            ? e.message
            : "Failed to generate insights. Try again.",
        );
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  return { insights, loading, error, loadCached, generate };
}
