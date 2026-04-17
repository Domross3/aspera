"use client";
import { RatingSlider } from "./RatingSlider";

interface DaylightInputProps {
  value: number;
  onChange: (v: number) => void;
}

export function DaylightInput({ value, onChange }: DaylightInputProps) {
  return (
    <RatingSlider
      label="Minutes of daylight"
      value={value}
      onChange={onChange}
      min={0}
      max={120}
      step={5}
      emoji="☀️"
    />
  );
}
