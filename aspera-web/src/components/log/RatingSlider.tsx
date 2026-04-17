"use client";

interface RatingSliderProps {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  emoji?: string;
  colorClass?: string;
}

export function RatingSlider({
  label,
  value,
  onChange,
  min = 1,
  max = 10,
  step = 1,
  emoji,
  colorClass = "accent",
}: RatingSliderProps) {
  const percent = ((value - min) / (max - min)) * 100;

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-sm text-text-secondary">
          {emoji && <span className="mr-1">{emoji}</span>}
          {label}
        </span>
        <span className={`text-lg font-bold text-${colorClass}`}>{value}</span>
      </div>
      <div className="relative">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full h-1.5 rounded-pill appearance-none cursor-pointer"
          style={{
            background: `linear-gradient(to right, #6C63FF ${percent}%, #1C2535 ${percent}%)`,
          }}
        />
      </div>
      <div className="flex justify-between text-xs text-text-muted">
        <span>{min}</span>
        <span>{max}</span>
      </div>
    </div>
  );
}
