"use client";
import { useState, FormEvent } from "react";
import { useLogs } from "@/hooks/useLogs";
import { Button } from "@/components/ui/Button";
import { GradientCard } from "@/components/ui/GradientCard";
import { Badge } from "@/components/ui/Badge";
import type { SearchResponse, SearchResult } from "@/types/search";

const EXAMPLE_QUERIES = [
  "What improves my focus?",
  "Best sleep nights",
  "When do I have the most energy?",
  "Days I completed the most tasks",
  "How does caffeine affect my performance?",
  "What hurts my productivity?",
];

function ResultCard({ result }: { result: SearchResult }) {
  const { log, relevanceScore, matchReason, highlightedFields } = result;
  const date = new Date(`${log.date}T12:00:00`).toLocaleDateString("en-US", {
    weekday: "short", month: "short", day: "numeric",
  });

  const scoreColor = relevanceScore >= 80 ? "success" : relevanceScore >= 60 ? "warning" : "default";

  return (
    <GradientCard>
      <div className="flex items-start justify-between gap-3 mb-2">
        <div>
          <div className="text-sm font-semibold text-text">{date}</div>
          <div className="text-xs text-text-secondary mt-0.5">{matchReason}</div>
        </div>
        <Badge variant={scoreColor}>{relevanceScore}% match</Badge>
      </div>
      <div className="grid grid-cols-3 gap-2 mb-3">
        <div className="bg-background/50 rounded px-2 py-1.5 text-center">
          <div className="text-xs text-text-muted">Focus</div>
          <div className="text-sm font-bold text-accent">{log.output.focusRating}</div>
        </div>
        <div className="bg-background/50 rounded px-2 py-1.5 text-center">
          <div className="text-xs text-text-muted">Energy</div>
          <div className="text-sm font-bold text-accent-alt">{log.output.energyRating}</div>
        </div>
        <div className="bg-background/50 rounded px-2 py-1.5 text-center">
          <div className="text-xs text-text-muted">Tasks</div>
          <div className="text-sm font-bold text-success">{log.output.tasksCompleted}</div>
        </div>
      </div>
      <div className="flex flex-wrap gap-2 text-xs">
        {log.workout.type !== "none" && (
          <span className="px-2 py-0.5 rounded-pill bg-elevated border border-border text-text-secondary capitalize">
            💪 {log.workout.type}
          </span>
        )}
        {log.caffeine.type !== "none" && (
          <span className="px-2 py-0.5 rounded-pill bg-elevated border border-border text-text-secondary capitalize">
            ☕ {log.caffeine.type}
          </span>
        )}
        {log.sleepHours > 0 && (
          <span className="px-2 py-0.5 rounded-pill bg-elevated border border-border text-text-secondary">
            😴 {log.sleepHours}h
          </span>
        )}
        {log.tags.slice(0, 3).map((t) => (
          <span key={t} className={`px-2 py-0.5 rounded-pill border text-xs ${highlightedFields.includes("tags") ? "bg-accent/20 text-accent border-accent/30" : "bg-elevated border-border text-text-secondary"}`}>
            {t}
          </span>
        ))}
      </div>
    </GradientCard>
  );
}

export default function SearchPage() {
  const { recentLogs, loading: logsLoading } = useLogs();
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<SearchResponse | null>(null);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = async (q: string) => {
    if (!q.trim() || recentLogs.length === 0) return;
    setSearching(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q, logs: recentLogs }),
      });
      const data = await res.json() as SearchResponse & { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Search failed");
      setResult(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Search failed");
    } finally {
      setSearching(false);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    search(query);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-24 md:pb-6 space-y-5">
      <div>
        <h1 className="text-xl font-bold text-text">Search Your Data</h1>
        <p className="text-sm text-text-secondary">Ask anything about your patterns in natural language.</p>
      </div>

      {/* Search form */}
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="flex gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="What improves my focus?"
            className="flex-1 bg-surface border border-border rounded-lg px-4 py-3 text-sm text-text placeholder-text-muted focus:outline-none focus:border-accent transition-colors"
          />
          <Button type="submit" loading={searching} disabled={!query.trim() || logsLoading}>
            Search
          </Button>
        </div>
      </form>

      {/* Example queries */}
      {!result && !searching && (
        <div className="space-y-2">
          <div className="text-xs font-bold uppercase tracking-widest text-text-muted">Try asking…</div>
          <div className="flex flex-wrap gap-2">
            {EXAMPLE_QUERIES.map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => { setQuery(q); search(q); }}
                className="px-3 py-1.5 rounded-pill bg-elevated border border-border text-sm text-text-secondary hover:border-accent hover:text-text transition-colors"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Loading */}
      {searching && (
        <div className="flex items-center gap-3 text-sm text-text-secondary py-8 justify-center">
          <span className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          Analyzing {recentLogs.length} days of data…
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="p-4 bg-danger/10 border border-danger/30 rounded-lg text-sm text-danger">
          {error}
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="space-y-4">
          {/* Summary */}
          <GradientCard glowAccent>
            <div className="text-xs font-bold uppercase tracking-widest text-accent mb-2">Answer</div>
            <p className="text-sm text-text leading-relaxed">{result.summary}</p>
          </GradientCard>

          {/* Result cards */}
          {result.results.length > 0 && (
            <div className="space-y-3">
              <div className="text-xs font-bold uppercase tracking-widest text-text-muted">
                Matching Days ({result.results.length})
              </div>
              {result.results.map((r) => (
                <ResultCard key={r.log.id} result={r} />
              ))}
            </div>
          )}

          {result.results.length === 0 && (
            <p className="text-sm text-text-secondary text-center py-4">
              No specific days matched this query — but the summary above still answers your question.
            </p>
          )}

          <button
            type="button"
            onClick={() => { setResult(null); setQuery(""); }}
            className="text-xs text-text-muted hover:text-accent transition-colors"
          >
            ← New search
          </button>
        </div>
      )}

      {logsLoading && (
        <div className="text-sm text-text-muted text-center py-4">Loading your logs…</div>
      )}

      {!logsLoading && recentLogs.length === 0 && (
        <div className="text-sm text-text-secondary text-center py-8">
          No logs yet. Head to <span className="text-accent">Log</span> to record some days first.
        </div>
      )}
    </div>
  );
}
