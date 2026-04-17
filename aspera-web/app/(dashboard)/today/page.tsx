"use client";
import { useLogs } from "@/hooks/useLogs";
import { StreakCounter } from "@/components/today/StreakCounter";
import { SummaryPill } from "@/components/today/SummaryPill";
import { RecommendationBanner } from "@/components/today/RecommendationBanner";
import { BrowsingFocus } from "@/components/today/BrowsingFocus";
import { GradientCard } from "@/components/ui/GradientCard";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

export default function TodayPage() {
  const { todayLog, recentLogs, loading, streak, reservesRemaining } = useLogs();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <span className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const log = todayLog;
  const trendData = [...recentLogs]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((l) => ({
      day: new Date(`${l.date}T12:00:00`).toLocaleDateString("en-US", { weekday: "short" }),
      Focus: l.output.focusRating,
      Energy: l.output.energyRating,
    }));

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-24 md:pb-6 space-y-4">
      <div>
        <h1 className="text-xl font-bold text-text">Today</h1>
        <p className="text-sm text-text-secondary">
          {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
        </p>
      </div>

      {/* Recommendation */}
      <RecommendationBanner todayLog={log} recentLogs={recentLogs} />

      {/* Stats row */}
      {log && (
        <div className="grid grid-cols-3 gap-3">
          <SummaryPill emoji="🎯" label="Focus" value={log.output.focusRating} unit="/10" colorClass="text-accent" />
          <SummaryPill emoji="⚡" label="Energy" value={log.output.energyRating} unit="/10" colorClass="text-accent-alt" />
          <SummaryPill emoji="✅" label="Tasks" value={log.output.tasksCompleted} colorClass="text-success" />
        </div>
      )}

      {/* Streak */}
      <StreakCounter streak={streak} reservesRemaining={reservesRemaining} />

      {/* Weekly trend */}
      {trendData.length > 1 && (
        <GradientCard>
          <div className="text-xs font-bold uppercase tracking-widest text-text-muted mb-3">7-Day Trend</div>
          <div className="h-36">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="day" tick={{ fill: "#9BA8C4", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 10]} tick={{ fill: "#9BA8C4", fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: "#1C2535", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "8px", fontSize: "12px" }}
                  labelStyle={{ color: "#F0F4FF" }}
                />
                <Line type="monotone" dataKey="Focus" stroke="#6C63FF" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="Energy" stroke="#00D4FF" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </GradientCard>
      )}

      {/* Browsing focus */}
      <BrowsingFocus />

      {/* Today's big rocks */}
      {log?.bigRocks && log.bigRocks.length > 0 && (
        <GradientCard>
          <div className="text-xs font-bold uppercase tracking-widest text-text-muted mb-3">Big Rocks Today</div>
          <div className="space-y-2">
            {log.bigRocks.map((rock, i) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                <span className="text-accent font-bold">{i + 1}.</span>
                <span className="text-text">{rock}</span>
              </div>
            ))}
          </div>
        </GradientCard>
      )}

      {/* Today's stats detail */}
      {log && (
        <GradientCard>
          <div className="text-xs font-bold uppercase tracking-widest text-text-muted mb-3">Today's Details</div>
          <div className="grid grid-cols-2 gap-y-2 text-sm">
            <div className="text-text-secondary">☀️ Daylight</div>
            <div className="text-text font-medium">{log.daylightMinutes} min</div>
            <div className="text-text-secondary">😴 Sleep</div>
            <div className="text-text font-medium">{log.sleepHours}h</div>
            <div className="text-text-secondary">☕ Caffeine</div>
            <div className="text-text font-medium capitalize">{log.caffeine.type}{log.caffeine.amount > 0 ? ` · ${log.caffeine.amount}mg` : ""}</div>
            <div className="text-text-secondary">💪 Workout</div>
            <div className="text-text font-medium capitalize">{log.workout.type}</div>
            {log.tags.length > 0 && (
              <>
                <div className="text-text-secondary">🏷️ Tags</div>
                <div className="text-text font-medium">{log.tags.join(", ")}</div>
              </>
            )}
          </div>
        </GradientCard>
      )}

      {!log && (
        <GradientCard>
          <p className="text-sm text-text-secondary text-center py-4">
            No log for today yet. Head to <span className="text-accent">Log</span> to record your day.
          </p>
        </GradientCard>
      )}
    </div>
  );
}
