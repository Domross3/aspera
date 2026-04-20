"use client";

interface DrinksInputProps {
  value: number;
  onChange: (v: number) => void;
}

export function DrinksInput({ value, onChange }: DrinksInputProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm text-text-secondary">🍷 Alcoholic drinks</span>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => onChange(Math.max(0, value - 1))}
            className="w-8 h-8 rounded-full bg-elevated border border-border text-text-secondary hover:border-accent hover:text-accent transition-colors flex items-center justify-center text-lg"
          >
            −
          </button>
          <span
            className={`text-xl font-bold w-6 text-center ${value > 2 ? "text-warning" : value > 0 ? "text-text" : "text-text-muted"}`}
          >
            {value}
          </span>
          <button
            type="button"
            onClick={() => onChange(Math.min(12, value + 1))}
            className="w-8 h-8 rounded-full bg-elevated border border-border text-text-secondary hover:border-accent hover:text-accent transition-colors flex items-center justify-center text-lg"
          >
            +
          </button>
        </div>
      </div>
    </div>
  );
}
