import {
  SCREEN_TIME_CATEGORIES,
} from "./constants";
import { SCREEN_TIME_CATEGORY_LABELS } from "./categories";
import {
  formatMinutesLabel,
  SCREEN_TIME_WARMUP_DAYS,
  summarizeScreenTimeCollection,
} from "./storage";
import type { ScreenTimeDayTotals } from "./types";

export function formatScreenTimeBlock(
  totals: ScreenTimeDayTotals[] = [],
): string {
  const summary = summarizeScreenTimeCollection(totals);
  if (!summary.hasWarmup) return "";

  const recent = [...totals]
    .filter((day) => day.totalMinutes > 0)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-SCREEN_TIME_WARMUP_DAYS);

  if (recent.length < SCREEN_TIME_WARMUP_DAYS) return "";

  const lines = recent.map((day) => {
    const categoryParts = SCREEN_TIME_CATEGORIES.map((category) => {
      const minutes = day.byCategory[category] ?? 0;
      return minutes > 0
        ? `${SCREEN_TIME_CATEGORY_LABELS[category]} ${formatMinutesLabel(minutes)}`
        : null;
    }).filter(Boolean);
    return `${day.date} - total ${formatMinutesLabel(day.totalMinutes)}${
      categoryParts.length > 0 ? ` (${categoryParts.join(", ")})` : ""
    }`;
  });

  return `\nSCREEN_TIME (native iOS aggregates, last ${SCREEN_TIME_WARMUP_DAYS} synced days):\n${lines.join("\n")}\n`;
}
