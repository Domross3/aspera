"use client";
import { MoodCheckIn } from "../../types";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

interface TimeOfDayCurveProps {
  checkIns: MoodCheckIn[];
}

export function TimeOfDayCurve({ checkIns }: TimeOfDayCurveProps) {
  const data = checkIns
    .sort((a, b) => a.timestamp - b.timestamp)
    .map((c) => {
      const d = new Date(c.timestamp);
      return {
        time: `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`,
        mood: c.mood,
        energy: c.energy,
        stress: c.stress,
      };
    });

  if (data.length === 0) {
    return (
      <div className="h-32 flex items-center justify-center text-sm text-text-muted">
        No check-ins yet today
      </div>
    );
  }

  return (
    <div className="h-36">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="rgba(255,255,255,0.05)"
          />
          <XAxis
            dataKey="time"
            tick={{ fill: "#9BA8C4", fontSize: 10 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            domain={[1, 5]}
            tick={{ fill: "#9BA8C4", fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            ticks={[1, 2, 3, 4, 5]}
          />
          <Tooltip
            contentStyle={{
              background: "#1C2535",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "8px",
              fontSize: "12px",
            }}
            labelStyle={{ color: "#F0F4FF" }}
          />
          <Line
            type="monotone"
            dataKey="mood"
            stroke="#6C63FF"
            strokeWidth={2}
            dot={{ fill: "#6C63FF", r: 3 }}
            name="Mood"
          />
          <Line
            type="monotone"
            dataKey="energy"
            stroke="#00D4FF"
            strokeWidth={2}
            dot={{ fill: "#00D4FF", r: 3 }}
            name="Energy"
          />
          <Line
            type="monotone"
            dataKey="stress"
            stroke="#F87171"
            strokeWidth={2}
            dot={{ fill: "#F87171", r: 3 }}
            name="Stress"
            strokeDasharray="4 2"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
