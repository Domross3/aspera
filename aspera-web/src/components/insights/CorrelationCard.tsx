"use client";
import { Correlation } from "../../types";
import { Badge } from "../ui/Badge";

interface CorrelationCardProps {
  correlation: Correlation;
}

const CONFIDENCE_BADGE: Record<string, "success" | "warning" | "default"> = {
  high: "success",
  medium: "warning",
  low: "default",
};

const METRIC_LABELS = { focus: "Focus", energy: "Energy", tasks: "Tasks" };

export function CorrelationCard({ correlation }: CorrelationCardProps) {
  const { emoji, title, description, delta, confidence, outputMetric, inputFactors, isKeystone } = correlation;

  return (
    <div className={`relative bg-gradient-to-br from-elevated to-surface border rounded-lg p-4 shadow-card transition-all ${isKeystone ? "border-accent/50 shadow-glow-sm" : "border-border"}`}>
      {isKeystone && (
        <div className="absolute -top-2.5 left-4">
          <span className="bg-accent text-white text-xs font-bold px-2 py-0.5 rounded-pill">
            ✨ Keystone Habit
          </span>
        </div>
      )}
      <div className="flex items-start gap-3 mt-1">
        <span className="text-2xl flex-shrink-0">{emoji}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h3 className="text-sm font-semibold text-text">{title}</h3>
            <Badge variant={CONFIDENCE_BADGE[confidence]}>{confidence}</Badge>
          </div>
          <p className="text-sm text-text-secondary mb-3">{description}</p>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-text-muted">→</span>
              <span className="text-xs font-medium text-success">
                +{delta.toFixed(1)} {METRIC_LABELS[outputMetric]}
              </span>
            </div>
            <div className="flex gap-1.5 flex-wrap">
              {inputFactors.slice(0, 3).map((f) => (
                <span key={f} className="text-xs px-2 py-0.5 bg-elevated rounded-pill text-text-muted border border-border">
                  {f}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
