"use client";
import { useState } from "react";
import { DailyLog } from "../../types";
import { Button } from "../ui/Button";

interface RecommendationBannerProps {
  todayLog: DailyLog | null;
  recentLogs: DailyLog[];
}

export function RecommendationBanner({ todayLog, recentLogs }: RecommendationBannerProps) {
  const [rec, setRec] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ logs: recentLogs, personality: "analytical", mode: "recommendation" }),
      });
      const data = await res.json() as { topRecommendation?: string; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Failed");
      setRec(data.topRecommendation ?? null);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to get recommendation");
    } finally {
      setLoading(false);
    }
  };

  if (!rec && !loading) {
    return (
      <div className="bg-gradient-to-br from-accent/10 to-accent/5 border border-accent/20 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold text-text">Today's Recommendation</div>
            <div className="text-xs text-text-secondary mt-0.5">
              {todayLog ? "Based on your data patterns" : "Log today first for a personalized tip"}
            </div>
          </div>
          <Button size="sm" onClick={generate} disabled={recentLogs.length === 0}>
            Generate
          </Button>
        </div>
        {error && <p className="text-xs text-danger mt-2">{error}</p>}
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-accent/10 to-accent/5 border border-accent/20 rounded-lg p-4">
      <div className="text-xs font-bold uppercase tracking-widest text-accent mb-2">Today's Recommendation</div>
      {loading ? (
        <div className="flex items-center gap-2 text-sm text-text-secondary">
          <span className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          Analyzing your data…
        </div>
      ) : (
        <p className="text-sm text-text leading-relaxed">{rec}</p>
      )}
      <button
        type="button"
        onClick={() => { setRec(null); setError(null); }}
        className="text-xs text-text-muted hover:text-accent mt-2 transition-colors"
      >
        Refresh
      </button>
    </div>
  );
}
