"use client";
import { MealQuality } from "../../types";
import { RatingSlider } from "./RatingSlider";

interface NutritionInputProps {
  mealQuality: MealQuality;
  hydration: number;
  onChange: (mealQuality: MealQuality, hydration: number) => void;
}

const MEAL_LABELS: Record<number, string> = {
  1: "Poor", 2: "Fair", 3: "Okay", 4: "Good", 5: "Excellent",
};

export function NutritionInput({ mealQuality, hydration, onChange }: NutritionInputProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <RatingSlider
          label={`Meal quality — ${MEAL_LABELS[mealQuality] ?? ""}`}
          value={mealQuality}
          onChange={(v) => onChange(v as MealQuality, hydration)}
          min={1}
          max={5}
          emoji="🥗"
        />
      </div>
      <RatingSlider
        label="Hydration (glasses)"
        value={hydration}
        onChange={(v) => onChange(mealQuality, v)}
        min={0}
        max={12}
        step={1}
        emoji="💧"
      />
    </div>
  );
}
