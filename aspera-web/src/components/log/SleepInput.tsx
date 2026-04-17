"use client";
import { RatingSlider } from "./RatingSlider";

interface SleepInputProps {
  value: number;
  onChange: (v: number) => void;
}

export function SleepInput({ value, onChange }: SleepInputProps) {
  return (
    <div className="space-y-3">
      <RatingSlider
        label="Hours of sleep"
        value={value}
        onChange={onChange}
        min={0}
        max={12}
        step={0.5}
        emoji="😴"
      />
      <p className="text-xs text-text-muted">
        {value >= 8 ? "Great! Well rested." : value >= 6 ? "Decent, but aim for 7–9h" : value > 0 ? "Low — may impact performance" : ""}
      </p>
    </div>
  );
}
