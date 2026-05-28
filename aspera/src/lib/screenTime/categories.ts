import { COLORS } from "../../constants/theme";
import { SCREEN_TIME_CATEGORIES, type ScreenTimeCategory } from "./constants";

export const SCREEN_TIME_CATEGORY_LABELS: Record<ScreenTimeCategory, string> = {
  social: "Social",
  entertainment: "Entertainment",
  productivity: "Productivity",
  communication: "Communication",
  other: "Other",
};

export const SCREEN_TIME_CATEGORY_COLORS: Record<ScreenTimeCategory, string> = {
  social: COLORS.accent,
  entertainment: COLORS.warning,
  productivity: COLORS.success,
  communication: "#4EA8DE",
  other: COLORS.textMuted,
};

export function isScreenTimeCategory(value: string): value is ScreenTimeCategory {
  return (SCREEN_TIME_CATEGORIES as readonly string[]).includes(value);
}
