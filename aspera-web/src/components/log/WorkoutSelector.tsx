"use client";
import { WorkoutType } from "../../types";
import { ChipGroup } from "../ui/ChipGroup";
import { RatingSlider } from "./RatingSlider";

const WORKOUT_OPTIONS: WorkoutType[] = [
  "none",
  "run",
  "lift",
  "yoga",
  "walk",
  "hiit",
];

interface WorkoutSelectorProps {
  type: WorkoutType;
  intensity: number;
  onChange: (type: WorkoutType, intensity: number) => void;
}

export function WorkoutSelector({
  type,
  intensity,
  onChange,
}: WorkoutSelectorProps) {
  return (
    <div className="space-y-4">
      <ChipGroup
        options={WORKOUT_OPTIONS}
        selected={[type]}
        onChange={(selected) =>
          onChange(
            (selected[0] ?? "none") as WorkoutType,
            type === "none" ? 0 : intensity,
          )
        }
        multi={false}
      />
      {type !== "none" && (
        <RatingSlider
          label="Intensity"
          value={intensity}
          onChange={(v) => onChange(type, v)}
          min={1}
          max={10}
          emoji="💪"
        />
      )}
    </div>
  );
}
