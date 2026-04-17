"use client";
import { useEffect, useState } from "react";
import { useLogs } from "@/hooks/useLogs";
import { useInsights, CoachPersonality } from "@/hooks/useInsights";
import { GradientCard } from "@/components/ui/GradientCard";
import { Button } from "@/components/ui/Button";
import { CorrelationCard } from "@/components/insights/CorrelationCard";
import { TrendBarsSection } from "@/components/insights/TrendBarsSection";

const PERSONALITIES: { id: CoachPersonality; label: string; emoji: string; desc: string }[] = [
  { id: "analytical", label: "Analytical", emoji: "📊", desc: "Data-driven, precise" },
  { id: "unserious", label: "Unserious", emoji: "😏", desc: "Witty, casual nudges" },
  { id: "stoic", label: "Stoic", emoji: "🗿", desc: "Terse, carved-in-stone" },
];

export default function InsightsPage() {
  const { recentLogs, loading: logsLoading } = useLogs();
  const { insights, loading, error, loadCached, generate } = useInsights();
  const [personality, setPersonality] = useState<CoachPersonality>("analytical");

  useEffect(() => {
    loadCached();
  }, [loadCached]);

  if (logsLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <span className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-24 md:pb-6 space-y-5">
      <div>
        <h1 className="text-xl font-bold text-text">AI Insights</h1>
        <p className="text-sm text-text-secondary">Pattern analysis across your {recentLogs.length} recent logs.</p>
      </div>

      {/* Personality selector */}
      <GradientCard>
        <div className="text-xs font-bold uppercase tracking-widest text-text-muted mb-3">Coach Style</div>
        <div className="grid grid-cols-3 gap-2">
          {PERSONALITIES.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setPersonality(p.id)}
              className={`p-3 rounded-lg border text-center transition-all ${
                personality === p.id
                  ? "border-accent bg-accent/10 text-accent"
                  : "border-border bg-elevated text-text-secondary hover:border-border-accent hover:text-text"
              }`}
            >
              <div className="text-xl mb-1">{p.emoji}</div>
              <div className="text-xs font-semibold">{p.label}</div>
              <div className="text-xs text-text-muted mt-0.5">{p.desc}</div>
            </button>
          ))}
        </div>
      </GradientCard>

      {/* Generate button */}
      <Button
        variant="primary"
        size="lg"
        className="w-full"
        loading={loading}
        onClick={() => generate(recentLogs, personality)}
        disabled={recentLogs.length === 0}
      >
        {insights ? "Regenerate Insights" : "Generate Insights"}
      </Button>

      {error && (
        <div className="p-4 bg-danger/10 border border-danger/30 rounded-lg text-sm text-danger">{error}</div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="text-center py-8 space-y-2">
          <div className="w-10 h-10 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-text-secondary">Analyzing patterns with Claude…</p>
        </div>
      )}

      {/* Results */}
      {insights && !loading && (
        <div className="space-y-4">
          {/* Summary */}
          <GradientCard glowAccent>
            <div className="text-xs font-bold uppercase tracking-widest text-accent mb-2">Summary</div>
            <p className="text-sm text-text leading-relaxed">{insights.summary}</p>
          </GradientCard>

          {/* Top recommendation */}
          <div className="bg-gradient-to-r from-accent/15 to-accent-alt/10 border border-accent/20 rounded-lg p-4">
            <div className="text-xs font-bold uppercase tracking-widest text-accent mb-1">Top Recommendation</div>
            <p className="text-sm text-text">{insights.topRecommendation}</p>
          </div>

          {/* Keystone habit first */}
          {insights.correlations.filter((c) => c.isKeystone).map((c) => (
            <CorrelationCard key={c.id} correlation={c} />
          ))}

          {/* Other correlations */}
          <div className="space-y-3">
            {insights.correlations.filter((c) => !c.isKeystone).map((c) => (
              <CorrelationCard key={c.id} correlation={c} />
            ))}
          </div>

          {/* Weekly trends chart */}
          {insights.weeklyTrends.length > 0 && (
            <GradientCard>
              <TrendBarsSection trends={insights.weeklyTrends} />
            </GradientCard>
          )}

          <div className="text-xs text-text-muted text-center">
            Generated {new Date(insights.generatedAt).toLocaleString()}
          </div>
        </div>
      )}

      {!insights && !loading && recentLogs.length > 0 && (
        <GradientCard>
          <div className="text-center py-6 text-sm text-text-secondary">
            Click "Generate Insights" to analyze your {recentLogs.length} days of data.
          </div>
        </GradientCard>
      )}

      {recentLogs.length === 0 && (
        <GradientCard>
          <div className="text-center py-6 text-sm text-text-secondary">
            Log at least one day to generate insights.
          </div>
        </GradientCard>
      )}
    </div>
  );
}
