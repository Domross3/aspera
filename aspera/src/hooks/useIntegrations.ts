import { useCallback, useEffect, useState } from "react";
import { DailyIntegrationSummary, IntegrationConnection } from "../types";
import {
  getIntegrationConnections,
  getIntegrationSummaries,
  saveIntegrationConnections,
  saveIntegrationSummaries,
} from "../storage/storage";
import { getDefaultIntegrationConnections } from "../lib/integrations";

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

  // Previously synthesized a week of integration summaries from mock
  // data — removed so the UI reflects only real integration writes.
  // Kept as a no-op so existing callers still type-check; consider
  // removing the entire callsite once real integrations land.
  const refreshFromMocks = useCallback(async () => {
    const nextConnections = getDefaultIntegrationConnections();
    setConnections(nextConnections);
    setSummaries([]);
    await Promise.all([
      saveIntegrationConnections(nextConnections),
      saveIntegrationSummaries([]),
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
