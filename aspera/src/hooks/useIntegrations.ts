import { useCallback, useEffect, useState } from "react";
import { DailyIntegrationSummary, IntegrationConnection } from "../types";
import {
  getIntegrationConnections,
  getIntegrationSummaries,
  saveIntegrationConnections,
  saveIntegrationSummaries,
} from "../storage/storage";
import {
  getDefaultIntegrationConnections,
  getDailyIntegrationSummaries,
} from "../lib/integrations";

export function useIntegrations() {
  const [connections, setConnections] = useState<IntegrationConnection[]>(
    getDefaultIntegrationConnections(),
  );
  const [summaries, setSummaries] = useState<DailyIntegrationSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    const [storedConnections, storedSummaries] = await Promise.all([
      getIntegrationConnections(),
      getIntegrationSummaries(),
    ]);

    setConnections(storedConnections);
    setSummaries(storedSummaries);
    setLoading(false);
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const refreshFromMocks = useCallback(async () => {
    const nextConnections = getDefaultIntegrationConnections();
    const nextSummaries = getDailyIntegrationSummaries();

    setConnections(nextConnections);
    setSummaries(nextSummaries);

    await Promise.all([
      saveIntegrationConnections(nextConnections),
      saveIntegrationSummaries(nextSummaries),
    ]);
  }, []);

  const latestSummary =
    summaries.length > 0
      ? [...summaries].sort((left, right) =>
          left.date.localeCompare(right.date),
        )[summaries.length - 1]
      : null;
  const latestAttention = latestSummary?.attention ?? null;

  return {
    connections,
    summaries,
    latestSummary,
    latestAttention,
    loading,
    reload,
    refreshFromMocks,
  };
}
