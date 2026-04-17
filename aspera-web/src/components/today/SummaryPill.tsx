"use client";

interface SummaryPillProps {
  emoji: string;
  label: string;
  value: string | number;
  unit?: string;
  colorClass?: string;
}

export function SummaryPill({ emoji, label, value, unit, colorClass = "text-text" }: SummaryPillProps) {
  return (
    <div className="bg-elevated border border-border rounded-lg p-3 flex flex-col gap-1">
      <div className="flex items-center gap-1.5">
        <span className="text-base">{emoji}</span>
        <span className="text-xs text-text-muted uppercase tracking-wide font-semibold">{label}</span>
      </div>
      <div className={`text-xl font-bold ${colorClass}`}>
        {value}
        {unit && <span className="text-sm font-normal text-text-muted ml-1">{unit}</span>}
      </div>
    </div>
  );
}
