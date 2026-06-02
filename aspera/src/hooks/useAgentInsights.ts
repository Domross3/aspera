// useAgentInsights — loads the user's own history and runs the confidence-gated
// agent over it (Engine A same-day + Engine C next-day). Entirely on-device, no
// network/AI call. Findings are hypotheses, surfaced only when glaring.

import { useCallback, useState } from "react";
import {
  getRecentLogs,
  getRecentMoodCheckIns,
  getRecentMoments,
  getSettings,
} from "../storage/storage";
import { computeAgentFindings } from "../lib/agent/insights";
import type { SweepFinding } from "../lib/agent/runSweep";
import { readScreenTimeTotals } from "../lib/screenTime/bridge";
import { readActiveRestrictionDates } from "../lib/screenTime/restrictionLog";

// Look back ~6 months — enough history for the sweep without scanning forever.
const HISTORY_DAYS = 180;

export function useAgentInsights() {
  const [findings, setFindings] = useState<SweepFinding[]>([]);
  const [loading, setLoading] = useState(false);
  const [analyzed, setAnalyzed] = useState(false);

  const analyze = useCallback(async () => {
    setLoading(true);
    try {
      const [logs, moodCheckIns, moments, settings, screenTime, restrictionActiveDates] =
        await Promise.all([
          getRecentLogs(HISTORY_DAYS),
          getRecentMoodCheckIns(HISTORY_DAYS),
          getRecentMoments(HISTORY_DAYS),
          getSettings(),
          readScreenTimeTotals().catch(() => []),
          readActiveRestrictionDates().catch(() => []),
        ]);
      setFindings(
        computeAgentFindings({
          logs,
          moodCheckIns,
          moments,
          eventTypes: settings.eventTypes ?? [],
          screenTime,
          restrictionActiveDates,
        }),
      );
    } finally {
      setLoading(false);
      setAnalyzed(true);
    }
  }, []);

  return { findings, loading, analyzed, analyze };
}
