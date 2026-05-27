import type { Restriction, RestrictionSpec } from "../types";
import type { NativeRestrictionConfig } from "../../modules/screen-time/src/types";

export const ALL_WEEKDAYS = [0, 1, 2, 3, 4, 5, 6] as const;
export const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
export const WEEKDAY_CHIP_LABELS = ["S", "M", "T", "W", "T", "F", "S"];

export type RestrictionKind = RestrictionSpec["kind"];

const DEFAULT_TIME_WINDOW = {
  windowStart: "21:00",
  windowEnd: "23:00",
};
const DEFAULT_DAILY_LIMIT_MIN = 30;

const UUID_V4_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const HHMM_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

function cryptoRandomUUID(): string | null {
  const maybeCrypto = (
    globalThis as typeof globalThis & {
      crypto?: { randomUUID?: () => string };
    }
  ).crypto;
  if (typeof maybeCrypto?.randomUUID !== "function") return null;
  const id = maybeCrypto.randomUUID().toLowerCase();
  return UUID_V4_RE.test(id) ? id : null;
}

export function generateRestrictionId(): string {
  const nativeId = cryptoRandomUUID();
  if (nativeId) return nativeId;

  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = Math.floor(Math.random() * 16);
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function isRestrictionIdShape(id: string): boolean {
  return UUID_V4_RE.test(id);
}

export function createDefaultRestriction(
  kind: RestrictionKind = "time_window",
  now = Date.now(),
): Restriction {
  return {
    id: generateRestrictionId(),
    name: "New limit",
    categories: [],
    selectedAppCount: 0,
    selectedCategoryCount: 0,
    weekdays: [...ALL_WEEKDAYS],
    active: false,
    spec:
      kind === "time_window"
        ? {
            kind,
            windowStart: DEFAULT_TIME_WINDOW.windowStart,
            windowEnd: DEFAULT_TIME_WINDOW.windowEnd,
          }
        : {
            kind,
            dailyLimitMin: DEFAULT_DAILY_LIMIT_MIN,
          },
    createdAt: now,
    updatedAt: now,
  };
}

export function restrictionWithKind(
  restriction: Restriction,
  kind: RestrictionKind,
): Restriction {
  if (restriction.spec.kind === kind) return restriction;
  return {
    ...restriction,
    spec:
      kind === "time_window"
        ? {
            kind,
            windowStart: DEFAULT_TIME_WINDOW.windowStart,
            windowEnd: DEFAULT_TIME_WINDOW.windowEnd,
          }
        : {
            kind,
            dailyLimitMin: DEFAULT_DAILY_LIMIT_MIN,
          },
  };
}

function normalizeWeekdays(weekdays: number[]): number[] {
  const uniqueValid = Array.from(
    new Set(
      weekdays.filter((day) => Number.isInteger(day) && day >= 0 && day <= 6),
    ),
  ).sort((a, b) => a - b);
  return uniqueValid.length > 0 ? uniqueValid : [...ALL_WEEKDAYS];
}

export function normalizeRestrictionForSave(
  restriction: Restriction,
  now = Date.now(),
): Restriction {
  return {
    ...restriction,
    name: restriction.name.trim(),
    categories: restriction.categories ?? [],
    selectedAppCount: Math.max(
      0,
      Math.round(restriction.selectedAppCount ?? 0),
    ),
    selectedCategoryCount: Math.max(
      0,
      Math.round(restriction.selectedCategoryCount ?? 0),
    ),
    weekdays: normalizeWeekdays(restriction.weekdays ?? []),
    spec:
      restriction.spec.kind === "time_window"
        ? {
            kind: "time_window",
            windowStart: restriction.spec.windowStart,
            windowEnd: restriction.spec.windowEnd,
          }
        : {
            kind: "daily_limit",
            dailyLimitMin: Math.round(restriction.spec.dailyLimitMin),
          },
    updatedAt: now,
  };
}

export function validateRestrictionDraft(restriction: Restriction): string[] {
  const errors: string[] = [];
  const selectedAppCount = Math.max(0, restriction.selectedAppCount ?? 0);
  const selectedCategoryCount = Math.max(
    0,
    restriction.selectedCategoryCount ?? 0,
  );

  if (restriction.name.trim().length === 0) {
    errors.push("Name is required.");
  }

  const hasInvalidWeekday = restriction.weekdays.some(
    (day) => !Number.isInteger(day) || day < 0 || day > 6,
  );
  if (hasInvalidWeekday) {
    errors.push("Weekdays must be between 0 and 6.");
  }

  if (restriction.spec.kind === "time_window") {
    if (
      !HHMM_RE.test(restriction.spec.windowStart) ||
      !HHMM_RE.test(restriction.spec.windowEnd)
    ) {
      errors.push("Time windows must use HH:MM.");
    }
    if (restriction.spec.windowStart === restriction.spec.windowEnd) {
      errors.push("Start and end times must differ.");
    }
    if (restriction.active && selectedAppCount + selectedCategoryCount === 0) {
      errors.push("Choose at least one app or category before activating.");
    }
  } else if (
    !Number.isFinite(restriction.spec.dailyLimitMin) ||
    restriction.spec.dailyLimitMin <= 0
  ) {
    errors.push("Daily caps must be greater than 0.");
  } else if (restriction.active && selectedAppCount === 0) {
    errors.push("Choose at least one app before activating a daily cap.");
  }

  return errors;
}

export function isRestrictionDraftValid(restriction: Restriction): boolean {
  return validateRestrictionDraft(restriction).length === 0;
}

export function formatRestrictionMode(restriction: Restriction): string {
  return restriction.spec.kind === "time_window" ? "Time Window" : "Daily Cap";
}

export function formatWeekdays(weekdays: number[]): string {
  const normalized = normalizeWeekdays(weekdays);
  if (normalized.length === 7) return "Every day";
  if (normalized.join(",") === "1,2,3,4,5") return "Weekdays";
  if (normalized.join(",") === "0,6") return "Weekends";
  return normalized.map((day) => WEEKDAY_LABELS[day]).join(", ");
}

export function formatRestrictionSchedule(restriction: Restriction): string {
  if (restriction.spec.kind === "daily_limit") {
    return `${restriction.spec.dailyLimitMin} min/app`;
  }
  return `${restriction.spec.windowStart}-${restriction.spec.windowEnd}`;
}

function pluralize(count: number, singular: string): string {
  return `${count} ${singular}${count === 1 ? "" : "s"}`;
}

export function formatSelectionSummary(restriction: Restriction): string {
  const appCount = Math.max(0, restriction.selectedAppCount ?? 0);
  const categoryCount = Math.max(0, restriction.selectedCategoryCount ?? 0);

  if (appCount === 0 && categoryCount === 0) return "0 apps selected";
  const parts = [pluralize(appCount, "app")];
  if (categoryCount > 0) parts.push(pluralize(categoryCount, "category"));
  return `${parts.join(", ")} selected`;
}

export function toNativeRestrictionConfig(
  restriction: Restriction,
): NativeRestrictionConfig {
  const normalized = normalizeRestrictionForSave(
    restriction,
    restriction.updatedAt,
  );
  const base = {
    id: normalized.id,
    active: normalized.active,
    mode: normalized.spec.kind,
    weekdays: normalized.weekdays,
    selectedAppCount: normalized.selectedAppCount,
    selectedCategoryCount: normalized.selectedCategoryCount,
    updatedAt: normalized.updatedAt,
  };

  if (normalized.spec.kind === "time_window") {
    return {
      ...base,
      mode: "time_window",
      windowStart: normalized.spec.windowStart,
      windowEnd: normalized.spec.windowEnd,
    };
  }

  return {
    ...base,
    mode: "daily_limit",
    dailyLimitMin: normalized.spec.dailyLimitMin,
  };
}
