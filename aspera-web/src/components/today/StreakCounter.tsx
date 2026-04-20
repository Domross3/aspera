"use client";

interface StreakCounterProps {
  streak: number;
  reservesRemaining: number;
}

export function StreakCounter({
  streak,
  reservesRemaining,
}: StreakCounterProps) {
  return (
    <div className="bg-gradient-to-br from-accent/20 to-accent/5 border border-accent/30 rounded-lg p-4 text-center">
      <div className="text-5xl font-black text-accent">{streak}</div>
      <div className="text-sm font-semibold text-text mt-1">day streak</div>
      {reservesRemaining > 0 && (
        <div className="mt-2 text-xs text-text-secondary">
          {reservesRemaining} reserve{reservesRemaining !== 1 ? "s" : ""}{" "}
          remaining
        </div>
      )}
    </div>
  );
}
