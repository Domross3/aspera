"use client";
import { useEffect, useState } from "react";
import { GradientCard } from "../ui/GradientCard";

interface BrowsingData {
  date: string;
  focusScore: number;
  totals: { productive: number; neutral: number; distracting: number };
  sites: Record<string, { time: number; category: string; visits: number; hostname: string }>;
  bigRock?: { task: string; isDeepWork: boolean };
}

export function BrowsingFocus() {
  const [data, setData] = useState<BrowsingData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/browsing")
      .then((r) => r.json())
      .then((d: { latest: BrowsingData | null }) => {
        setData(d.latest);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <GradientCard>
        <div className="h-16 flex items-center justify-center">
          <span className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        </div>
      </GradientCard>
    );
  }

  if (!data) {
    return (
      <GradientCard>
        <div className="text-xs font-bold uppercase tracking-widest text-text-muted mb-2">Browsing Focus</div>
        <p className="text-sm text-text-secondary">
          Install the Chrome extension to see real-time browsing focus data.
        </p>
      </GradientCard>
    );
  }

  const totalMs = data.totals.productive + data.totals.neutral + data.totals.distracting;
  const toMins = (ms: number) => Math.round(ms / 60000);

  return (
    <GradientCard>
      <div className="text-xs font-bold uppercase tracking-widest text-text-muted mb-3">Browsing Focus</div>
      <div className="flex items-center gap-4 mb-3">
        <div className="text-3xl font-black text-accent">{data.focusScore}</div>
        <div>
          <div className="text-sm font-semibold text-text">Focus Score</div>
          <div className="text-xs text-text-secondary">{toMins(totalMs)} min tracked</div>
        </div>
      </div>
      <div className="flex gap-2">
        <div className="flex-1 bg-success/10 rounded px-2 py-1.5">
          <div className="text-xs text-text-muted">Productive</div>
          <div className="text-sm font-bold text-success">{toMins(data.totals.productive)}m</div>
        </div>
        <div className="flex-1 bg-warning/10 rounded px-2 py-1.5">
          <div className="text-xs text-text-muted">Neutral</div>
          <div className="text-sm font-bold text-warning">{toMins(data.totals.neutral)}m</div>
        </div>
        <div className="flex-1 bg-danger/10 rounded px-2 py-1.5">
          <div className="text-xs text-text-muted">Distracting</div>
          <div className="text-sm font-bold text-danger">{toMins(data.totals.distracting)}m</div>
        </div>
      </div>
    </GradientCard>
  );
}
