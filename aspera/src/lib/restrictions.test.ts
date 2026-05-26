import type { Restriction } from "../types";
import {
  createDefaultRestriction,
  formatRestrictionMode,
  formatRestrictionSchedule,
  formatSelectionSummary,
  formatWeekdays,
  generateRestrictionId,
  isRestrictionDraftValid,
  isRestrictionIdShape,
  normalizeRestrictionForSave,
  validateRestrictionDraft,
} from "./restrictions";

describe("restrictions helpers", () => {
  it("creates a valid default time-window draft", () => {
    const draft = createDefaultRestriction("time_window", 1000);

    expect(isRestrictionIdShape(draft.id)).toBe(true);
    expect(draft.active).toBe(false);
    expect(draft.createdAt).toBe(1000);
    expect(draft.updatedAt).toBe(1000);
    expect(draft.spec).toEqual({
      kind: "time_window",
      windowStart: "21:00",
      windowEnd: "23:00",
    });
    expect(draft.weekdays).toEqual([0, 1, 2, 3, 4, 5, 6]);
    expect(isRestrictionDraftValid(draft)).toBe(true);
  });

  it("creates a valid default daily-limit draft", () => {
    const draft = createDefaultRestriction("daily_limit", 2000);

    expect(isRestrictionIdShape(draft.id)).toBe(true);
    expect(draft.active).toBe(false);
    expect(draft.createdAt).toBe(2000);
    expect(draft.updatedAt).toBe(2000);
    expect(draft.spec).toEqual({
      kind: "daily_limit",
      dailyLimitMin: 30,
    });
    expect(isRestrictionDraftValid(draft)).toBe(true);
  });

  it("generates ids matching the Supabase uuid shape", () => {
    expect(isRestrictionIdShape(generateRestrictionId())).toBe(true);
  });

  it("trims names and normalizes empty weekdays to all days", () => {
    const draft: Restriction = {
      ...createDefaultRestriction("daily_limit", 1000),
      name: "  Social guardrail  ",
      weekdays: [],
      selectedAppCount: -2,
      selectedCategoryCount: 1.8,
    };

    const normalized = normalizeRestrictionForSave(draft, 3000);

    expect(normalized.name).toBe("Social guardrail");
    expect(normalized.weekdays).toEqual([0, 1, 2, 3, 4, 5, 6]);
    expect(normalized.selectedAppCount).toBe(0);
    expect(normalized.selectedCategoryCount).toBe(2);
    expect(normalized.updatedAt).toBe(3000);
  });

  it("rejects invalid drafts", () => {
    const blankName = {
      ...createDefaultRestriction("time_window"),
      name: "   ",
    };
    expect(validateRestrictionDraft(blankName)).toContain("Name is required.");

    const equalWindow = {
      ...createDefaultRestriction("time_window"),
      spec: {
        kind: "time_window" as const,
        windowStart: "09:00",
        windowEnd: "09:00",
      },
    };
    expect(validateRestrictionDraft(equalWindow)).toContain(
      "Start and end times must differ.",
    );

    const invalidWeekday = {
      ...createDefaultRestriction("time_window"),
      weekdays: [1, 8],
    };
    expect(validateRestrictionDraft(invalidWeekday)).toContain(
      "Weekdays must be between 0 and 6.",
    );

    const invalidCap = {
      ...createDefaultRestriction("daily_limit"),
      spec: {
        kind: "daily_limit" as const,
        dailyLimitMin: 0,
      },
    };
    expect(validateRestrictionDraft(invalidCap)).toContain(
      "Daily caps must be greater than 0.",
    );
  });

  it("formats weekday, mode, schedule, and selection summaries", () => {
    const timeWindow = createDefaultRestriction("time_window");
    const dailyCap = {
      ...createDefaultRestriction("daily_limit"),
      spec: { kind: "daily_limit" as const, dailyLimitMin: 45 },
      selectedAppCount: 2,
      selectedCategoryCount: 1,
    };

    expect(formatWeekdays([0, 1, 2, 3, 4, 5, 6])).toBe("Every day");
    expect(formatWeekdays([])).toBe("Every day");
    expect(formatWeekdays([1, 2, 3, 4, 5])).toBe("Weekdays");
    expect(formatWeekdays([0, 6])).toBe("Weekends");
    expect(formatWeekdays([1, 3, 5])).toBe("Mon, Wed, Fri");
    expect(formatRestrictionMode(timeWindow)).toBe("Time Window");
    expect(formatRestrictionMode(dailyCap)).toBe("Daily Cap");
    expect(formatRestrictionSchedule(timeWindow)).toBe("21:00-23:00");
    expect(formatRestrictionSchedule(dailyCap)).toBe("45 min/app");
    expect(formatSelectionSummary(timeWindow)).toBe("0 apps selected");
    expect(formatSelectionSummary(dailyCap)).toBe(
      "2 apps, 1 category selected",
    );
  });
});
