import { useState, useCallback } from "react";
import { InsightsResponse } from "../types";
import { generateInsights } from "../api/claude";
import { getInsights, saveInsights } from "../storage/storage";
import { DailyLog } from "../types";

export function useInsights() {
  const [insights, setInsights] = useState<InsightsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadCached = useCallback(async () => {
    const cached = await getInsights();
    if (cached) setInsights(cached);
  }, []);

  const generate = useCallback(async (logs: DailyLog[]) => {
    if (logs.length === 0) {
      setError("Log at least one day of data first.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await generateInsights(logs);
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
  }, []);

  return { insights, loading, error, loadCached, generate };
}
