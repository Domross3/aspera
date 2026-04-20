"use client";
import { WeeklyTrend } from "../../types";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

interface TrendBarsSectionProps {
  trends: WeeklyTrend[];
}

export function TrendBarsSection({ trends }: TrendBarsSectionProps) {
  const data = trends.map((t) => ({
    day: t.dayLabel,
    Focus: t.focusRating,
    Energy: t.energyRating,
    Tasks: Math.round(t.tasksCompleted / 2), // scale down for comparison
  }));

  return (
    <div className="space-y-2">
      <h3 className="text-xs font-bold uppercase tracking-widest text-text-muted">
        Weekly Trends
      </h3>
      <div className="h-40">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} barGap={2} barSize={8}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(255,255,255,0.05)"
            />
            <XAxis
              dataKey="day"
              tick={{ fill: "#9BA8C4", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: "#9BA8C4", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              domain={[0, 10]}
            />
            <Tooltip
              contentStyle={{
                background: "#1C2535",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: "8px",
                fontSize: "12px",
              }}
              labelStyle={{ color: "#F0F4FF" }}
              itemStyle={{ color: "#9BA8C4" }}
            />
            <Bar dataKey="Focus" fill="#6C63FF" radius={[2, 2, 0, 0]} />
            <Bar dataKey="Energy" fill="#00D4FF" radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
