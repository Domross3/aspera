"use client";
import { CaffeineType } from "../../types";
import { ChipGroup } from "../ui/ChipGroup";
import { RatingSlider } from "./RatingSlider";

const CAFFEINE_OPTIONS: CaffeineType[] = ["none", "espresso", "drip", "matcha"];
const CAFFEINE_MG: Record<string, number> = {
  none: 0,
  espresso: 150,
  drip: 100,
  matcha: 70,
};

interface CaffeinePickerProps {
  type: CaffeineType;
  amount: number;
  onChange: (type: CaffeineType, amount: number) => void;
}

export function CaffeinePicker({
  type,
  amount,
  onChange,
}: CaffeinePickerProps) {
  const handleTypeChange = (selected: string[]) => {
    const newType = (selected[0] ?? "none") as CaffeineType;
    const defaultMg = CAFFEINE_MG[newType] ?? 0;
    onChange(newType, defaultMg);
  };

  return (
    <div className="space-y-4">
      <ChipGroup
        options={CAFFEINE_OPTIONS}
        selected={[type]}
        onChange={handleTypeChange}
        multi={false}
      />
      {type !== "none" && (
        <RatingSlider
          label="Caffeine (mg)"
          value={amount}
          onChange={(v) => onChange(type, v)}
          min={0}
          max={400}
          step={25}
          emoji="☕"
        />
      )}
    </div>
  );
}
