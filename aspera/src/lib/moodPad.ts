import type { MoodCheckIn } from "../types";

export interface MoodPadPoint {
  x: number;
  y: number;
}

export function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0.5;
  return Math.min(1, Math.max(0, value));
}

export function aspMoodWord(x: number, y: number): string {
  const px = clamp01(x) - 0.5;
  const py = clamp01(y) - 0.5;
  if (Math.hypot(px, py) < 0.16) return "Steady";

  const pleasant = px >= 0;
  const high = py >= 0;
  if (pleasant && high) return Math.abs(py) > 0.32 ? "Alive" : "Bright";
  if (pleasant && !high) return Math.abs(py) > 0.32 ? "Calm" : "At ease";
  if (!pleasant && high) return Math.abs(py) > 0.32 ? "Restless" : "Tense";
  return Math.abs(py) > 0.32 ? "Heavy" : "Low";
}

export function moodPadPointToScale(value: number): number {
  return Math.round(1 + clamp01(value) * 4);
}

export function moodPadPointToCheckIn(
  point: MoodPadPoint,
  now = Date.now(),
): MoodCheckIn {
  return {
    id: new Date(now).toISOString(),
    timestamp: now,
    mood: moodPadPointToScale(point.x),
    energy: moodPadPointToScale(point.y),
    stress: 3,
    source: "full",
  };
}
